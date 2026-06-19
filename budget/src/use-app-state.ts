// Orchestration hook. Holds the app state and the React handlers that CALL the
// preserved data/crypto/file-sync pipeline. The pipeline functions are moved
// here UNCHANGED from the legacy main.ts (loadFromFile, handleFileUpload,
// loadFromHandle, pickAndLoad, export, clear, reload-prompt, external-reload,
// initialize) — only their DOM glue (the imperative nav element + heroContainer
// toggles) is replaced by React state.
//
// Faithfulness note: the legacy `state`, `importPassword`, and the nav-error
// text were module-level `let`s that the ONCE-registered listeners read LIVE
// (the focus handler reads `importPassword`; the write-back listener reads the
// current nav-error for its clobber guard; export/showReloadPrompt read the
// current `state`). To preserve that exactly under React, the read side lives in
// `useRef` (the faithful equivalent of a module `let`) and `useState` mirrors
// only what React renders. Setters write the ref *then* setState.
import { useEffect, useRef, useState, useCallback } from "react";
import type { RenderPageOptions } from "./pages/render-options.js";
import { initAppCheck } from "./firebase.js";
import { deferAppCheckInit } from "@commons-systems/firebaseutil/defer-appcheck";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import { parseUploadedJson, toParsedData, UploadValidationError } from "./upload.js";
import { storeParsedData, clearAll, getMeta, getFileHandle, putFileHandle, clearFileHandle } from "./idb.js";
import {
  isFsaSupported,
  pickBencFile,
  queryReadWritePermission,
  requestReadWritePermission,
  readFileFromHandle,
} from "./local-file.js";
import { SeedDataSource, IdbDataSource, FileSyncingDataSource, type DataSource } from "./data-source.js";
import { configureFileSync, flushWriteBack, resetFileSync, getSyncHandle, getLastSyncedModified, setWriteBackStatusListener, advanceSyncWatermark } from "./file-sync.js";
import { setActiveDataSource } from "./active-data-source.js";
import { exportToJson } from "./export.js";
import { isEncrypted, decrypt, encrypt } from "./crypto.js";

export type AppState =
  | { source: "seed" }
  | { source: "local"; groupName: string };

const FILE_SYNC_WARNING = "Changes could not be saved to disk — an error occurred.";

// Imperative <dialog> password helper — preserved verbatim from main.ts:194-250.
// Kept as an imperative helper appended to document.body returning a Promise
// (NOT a React component), exactly as the parity contract requires.
function promptPassword(message: string): Promise<string | null> {
  return new Promise((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className = "password-dialog";

    const form = document.createElement("form");
    form.method = "dialog";

    const p = document.createElement("p");
    p.textContent = message;

    const input = document.createElement("input");
    input.type = "password";
    input.className = "password-input";
    input.autocomplete = "off";

    const actions = document.createElement("div");
    actions.className = "password-actions";

    const submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.className = "password-submit";
    submitBtn.textContent = "Submit";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "password-cancel";
    cancelBtn.textContent = "Cancel";

    actions.appendChild(submitBtn);
    actions.appendChild(cancelBtn);
    form.appendChild(p);
    form.appendChild(input);
    form.appendChild(actions);
    dialog.appendChild(form);
    document.body.appendChild(dialog);

    cancelBtn.addEventListener("click", () => {
      dialog.close();
      dialog.remove();
      resolve(null);
    });
    dialog.addEventListener("cancel", () => {
      dialog.remove();
      resolve(null);
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const value = input.value;
      dialog.close();
      dialog.remove();
      resolve(value);
    });
    dialog.showModal();
    input.focus();
  });
}

type LoadOutcome = { committed: true; password: string | null } | { committed: false };

export interface AppApi {
  state: AppState;
  navError: string | null;
  // Bumped on every data transition; App keys <LegacyRoute> by it so the body
  // re-resolves against the new data (legacy's trailing router.navigate()).
  navEpoch: number;
  // False until initialize() settles (success OR error). App gates the route
  // body on this so the body mounts exactly once — after initialize's trailing
  // transition() has already bumped navEpoch 0→1 — instead of mounting eagerly
  // at navEpoch=0 and then unmounting on that bump (the startup double-mount
  // race the e2e chart/table visibility checks tripped over).
  initialized: boolean;
  // The handle whose permission is in the "prompt" state, surfaced by App as a
  // one-click "Reload <name>" affordance. null when no prompt is pending.
  reloadHandle: FileSystemFileHandle | null;
  renderOptions: () => RenderPageOptions;
  onUploadInputChange: (file: File) => void;
  onUploadLabelClick: () => void;
  onUploadLabelKeydown: (key: string) => void;
  onExport: () => void;
  onClear: () => void;
  onReloadHandle: () => void;
}

export function useAppState(): AppApi {
  // Read-side refs (faithful equivalents of the legacy module-level `let`s) —
  // the once-registered listeners read these LIVE.
  const stateRef = useRef<AppState>({ source: "seed" });
  const importPasswordRef = useRef<string | null>(null);
  const navErrorRef = useRef<string | null>(null);
  const reloadInFlightRef = useRef<Promise<void> | null>(null);
  // Mirrors the rendered reloadHandle so the mount-effect closure can read and
  // clear it live (the legacy showReloadPrompt read/removed the DOM button).
  const reloadHandleRef = useRef<FileSystemFileHandle | null>(null);

  // Render-side state mirrors.
  const [state, setStateValue] = useState<AppState>({ source: "seed" });
  const [navError, setNavErrorValue] = useState<string | null>(null);
  const [reloadHandle, setReloadHandle] = useState<FileSystemFileHandle | null>(null);
  // navEpoch mirrors "how many times legacy called router.navigate()". Legacy's
  // transition() ended with router.navigate(), which re-ran route.render(
  // renderOptions()) against the new data source and replaced the outlet's HTML.
  // Bumping navEpoch on every transition lets App re-key <LegacyRoute> so the
  // body re-resolves against the new data — including same-path transitions
  // (upload / clear / external reload / initialize) where `path` is unchanged.
  const [navEpoch, setNavEpochValue] = useState(0);
  const navEpochRef = useRef(0);
  // Gates the route body's first render until initialize() settles (see AppApi).
  const [initialized, setInitialized] = useState(false);

  const setState = useCallback((next: AppState) => {
    stateRef.current = next;
    setStateValue(next);
  }, []);

  const showNavError = useCallback((message: string) => {
    navErrorRef.current = message;
    setNavErrorValue(message);
  }, []);

  const clearNavError = useCallback(() => {
    navErrorRef.current = null;
    setNavErrorValue(null);
  }, []);

  // transition() — legacy main.ts:149-155, minus the imperative DOM glue. The
  // hero visibility derives from `state` in App; updateNav() is replaced by the
  // <AuthControls> render. router.navigate() is not needed: the route body is a
  // <LegacyRoute> keyed by path whose `render` thunk reads renderOptions() at
  // render time, so a state change re-renders App and the body re-resolves.
  const transition = useCallback((next: AppState) => {
    setState(next);
    clearNavError();
    // Mirror legacy's trailing router.navigate(): force the route body to
    // re-resolve against the new data source.
    navEpochRef.current += 1;
    setNavEpochValue(navEpochRef.current);
  }, [setState, clearNavError]);

  const createDataSource = useCallback((): DataSource => {
    if (stateRef.current.source === "local") {
      return new FileSyncingDataSource(new IdbDataSource());
    }
    return new SeedDataSource();
  }, []);

  const renderOptions = useCallback((): RenderPageOptions => {
    const s = stateRef.current;
    const ds = createDataSource();
    setActiveDataSource(ds);
    return {
      authorized: s.source === "local",
      groupName: s.source === "local" ? s.groupName : "",
      dataSource: ds,
    };
  }, [createDataSource]);

  // The remaining pipeline functions are stable across renders and read live
  // refs, so they live in a single mount effect closure. App accesses them via
  // the callbacks returned below, which forward to refs populated here.
  const apiRef = useRef<{
    handleFileUpload: (file: File) => Promise<void>;
    pickAndLoad: () => Promise<void>;
    loadFromHandle: (handle: FileSystemFileHandle) => Promise<void>;
    onExport: () => Promise<void>;
    onClear: () => Promise<void>;
    onReloadHandle: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    // ----- Preserved pipeline (main.ts:265-624), DOM glue swapped for state. -----

    async function loadFromFile(file: File, cachedPassword?: string, requireEncrypted = false): Promise<LoadOutcome> {
      const buffer = await file.arrayBuffer();
      if (requireEncrypted && !isEncrypted(buffer)) {
        throw new UploadValidationError(
          "The linked file was replaced with an unencrypted file and was not loaded.",
        );
      }
      let text: string;
      let pw: string | null = null;
      if (isEncrypted(buffer)) {
        if (cachedPassword !== undefined) {
          pw = cachedPassword;
        } else {
          pw = await promptPassword("Enter password to decrypt");
          if (pw === null) return { committed: false };
        }
        text = await decrypt(buffer, pw);
      } else {
        text = new TextDecoder().decode(buffer);
      }
      const parsed = parseUploadedJson(text);
      const data = toParsedData(parsed);
      await storeParsedData(data);
      resetFileSync();
      importPasswordRef.current = pw;
      transition({ source: "local", groupName: parsed.groupName });
      return { committed: true, password: pw };
    }

    async function handleFileUpload(file: File): Promise<void> {
      clearNavError();
      try {
        await loadFromFile(file);
      } catch (error) {
        if (error instanceof UploadValidationError) {
          showNavError(error.message);
          return;
        }
        if (deferProgrammerError(error)) return;
        logError(error, { operation: "upload" });
        showNavError("Upload failed. Please try again.");
      }
    }

    async function loadFromHandle(handle: FileSystemFileHandle): Promise<void> {
      clearNavError();
      let file: File;
      try {
        file = await readFileFromHandle(handle);
      } catch (error) {
        await clearFileHandle();
        if (deferProgrammerError(error)) return;
        logError(error, { operation: "load-from-handle" });
        showNavError("The linked file is no longer available. Please re-link it.");
        return;
      }
      try {
        const outcome = await loadFromFile(file);
        if (outcome.committed && outcome.password !== null) {
          await putFileHandle(handle);
          configureFileSync(handle, outcome.password, file.lastModified);
        } else if (outcome.committed && outcome.password === null) {
          await clearFileHandle();
          showNavError(
            "Unencrypted data has been stored locally in this browser. It won't " +
              "be written back to the file or auto-loaded next session, but it " +
              "remains in browser storage until you clear it. Export as an " +
              "encrypted .benc file to protect it.",
          );
        }
      } catch (error) {
        if (error instanceof UploadValidationError) {
          await clearFileHandle();
          showNavError(error.message);
          return;
        }
        if (deferProgrammerError(error)) return;
        logError(error, { operation: "load-from-handle" });
        showNavError("Could not load the linked file. Please re-link it.");
      }
    }

    async function pickAndLoad(): Promise<void> {
      clearNavError();
      try {
        const handle = await pickBencFile();
        if (!handle) return; // user canceled
        await requestReadWritePermission(handle);
        await loadFromHandle(handle);
      } catch (error) {
        if (deferProgrammerError(error)) return;
        logError(error, { operation: "upload" });
        showNavError("Upload failed. Please try again.");
      }
    }

    async function onExport(): Promise<void> {
      try {
        const json = await exportToJson();
        let blob: Blob;
        const importPassword = importPasswordRef.current;
        if (importPassword) {
          const encrypted = await encrypt(json, importPassword);
          blob = new Blob([encrypted], { type: "application/octet-stream" });
        } else {
          blob = new Blob([json], { type: "application/json" });
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const date = new Date().toISOString().slice(0, 10);
        const s = stateRef.current;
        const groupName = s.source === "local" ? s.groupName : "budget";
        const ext = importPassword ? "benc" : "json";
        a.download = `budget-${groupName}-${date}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        if (deferProgrammerError(error)) return;
        logError(error, { operation: "export" });
        showNavError(error instanceof Error ? error.message : "Export failed. Please try again.");
      }
    }

    async function onClear(): Promise<void> {
      try {
        await clearAll();
        importPasswordRef.current = null;
        resetFileSync();
        transition({ source: "seed" });
      } catch (error) {
        if (deferProgrammerError(error)) return;
        logError(error, { operation: "clear-data" });
        showNavError("Failed to clear data. Try closing other tabs or refreshing the page.");
      }
    }

    // showReloadPrompt → set reload-prompt state that AuthControls renders as a
    // button; its click handler logic stays the same (main.ts:593-624).
    async function onReloadHandle(): Promise<void> {
      const handle = reloadHandleRef.current;
      if (!handle) return;
      try {
        const perm = await requestReadWritePermission(handle);
        if (perm === "granted") {
          await loadFromHandle(handle);
          setReloadHandle(null);
          reloadHandleRef.current = null;
          return;
        }
        const stateBefore = stateRef.current;
        await pickAndLoad();
        if (stateRef.current !== stateBefore && stateRef.current.source === "local") {
          setReloadHandle(null);
          reloadHandleRef.current = null;
        }
      } catch (error) {
        if (deferProgrammerError(error)) return;
        logError(error, { operation: "reload-handle" });
        showNavError("Could not reload the linked file. Please re-link it.");
      }
    }

    function showReloadPrompt(handle: FileSystemFileHandle): void {
      reloadHandleRef.current = handle;
      setReloadHandle(handle);
    }

    async function reloadIfExternallyChanged(): Promise<void> {
      if (reloadInFlightRef.current) { await reloadInFlightRef.current; return; }
      const handle = getSyncHandle();
      if (!handle) return;
      const watermark = getLastSyncedModified();
      let file: File;
      try {
        file = await readFileFromHandle(handle);
      } catch (error) {
        logError(error, { operation: "external-change-reload" });
        return;
      }
      if (watermark === null || file.lastModified <= watermark) return;
      const importPassword = importPasswordRef.current;
      const cachedPw = importPassword ?? undefined;
      reloadInFlightRef.current = (async () => {
        clearNavError();
        try {
          const outcome = await loadFromFile(file, cachedPw, importPassword !== null);
          if (outcome.committed && outcome.password !== null) {
            configureFileSync(handle, outcome.password, file.lastModified);
          }
        } catch (error) {
          if (deferProgrammerError(error)) return;
          if (error instanceof UploadValidationError) {
            advanceSyncWatermark(file.lastModified);
            showNavError(error.message);
            return;
          }
          logError(error, { operation: "external-change-reload" });
          showNavError("Could not reload the linked file.");
        }
      })();
      try {
        await reloadInFlightRef.current;
      } finally {
        reloadInFlightRef.current = null;
      }
    }

    async function initialize(): Promise<void> {
      let denied = false;
      const handle = await getFileHandle();
      if (handle) {
        const perm = await queryReadWritePermission(handle);
        if (perm === "granted") {
          let file: File | null = null;
          try {
            file = await readFileFromHandle(handle);
          } catch {
            await loadFromHandle(handle);
            return;
          }
          if (!isEncrypted(await file.arrayBuffer())) {
            await clearFileHandle();
            const meta = await getMeta();
            if (meta) {
              transition({ source: "local", groupName: meta.groupName });
            } else {
              transition({ source: "seed" });
            }
            showNavError(
              "Unlinked an unencrypted file so it won't auto-load. Re-link or export as an encrypted .benc file.",
            );
            return;
          }
          await loadFromHandle(handle);
          return;
        }
        if (perm === "prompt") {
          const meta = await getMeta();
          if (meta) {
            transition({ source: "local", groupName: meta.groupName });
          } else {
            transition({ source: "seed" });
          }
          showReloadPrompt(handle);
          return;
        }
        await clearFileHandle();
        denied = true;
      }
      const meta = await getMeta();
      if (meta) {
        transition({ source: "local", groupName: meta.groupName });
      } else {
        transition({ source: "seed" });
      }
      if (denied) {
        showNavError("Access to the linked file was denied; it has been unlinked.");
      }
    }

    apiRef.current = { handleFileUpload, pickAndLoad, loadFromHandle, onExport, onClear, onReloadHandle };

    // ----- Listener registration (main.ts:481-575, 627-704), once on mount. -----
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") void flushWriteBack();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    setWriteBackStatusListener((ok) => {
      if (!ok) showNavError(FILE_SYNC_WARNING);
      else if (navErrorRef.current === FILE_SYNC_WARNING) clearNavError();
    });

    const onFocus = () => {
      reloadIfExternallyChanged().catch((error) => {
        if (deferProgrammerError(error)) return;
        logError(error, { operation: "external-change-reload" });
      });
    };
    window.addEventListener("focus", onFocus);

    // Mirror the legacy router's popstate-driven route re-render: the reconcile
    // flow (accounts-reconcile-hydrate triggerReload) dispatches a popstate to
    // force the current route body to re-resolve against the new data + query.
    // use-router no-ops a same-path popstate, so bump navEpoch here to re-key
    // <LegacyRoute>. Harmless for path-changing back/forward (which already re-key).
    const onPopState = () => {
      navEpochRef.current += 1;
      setNavEpochValue(navEpochRef.current);
    };
    window.addEventListener("popstate", onPopState);

    initialize().catch((error) => {
      if (deferProgrammerError(error)) return;
      logError(error, { operation: "initialization" });
      showNavError("Could not load saved data. You may need to re-upload your file.");
      transition({ source: "seed" });
    }).finally(() => {
      // Both paths end with a transition() that already bumped navEpoch to 1;
      // flip `initialized` so App now mounts the body once at navEpoch=1.
      setInitialized(true);
    });

    deferAppCheckInit(initAppCheck);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  const onUploadInputChange = useCallback((file: File) => {
    apiRef.current?.handleFileUpload(file).catch((error) => {
      if (deferProgrammerError(error)) return;
      logError(error, { operation: "upload" });
    });
  }, []);

  const onUploadLabelClick = useCallback(() => {
    // FSA picker flow when supported (main.ts:427-433). The label's preventDefault
    // is handled in AuthControls so the native dialog never opens; here we only
    // run the FSA pick.
    apiRef.current?.pickAndLoad().catch((error) => {
      if (deferProgrammerError(error)) return;
      logError(error, { operation: "upload" });
    });
  }, []);

  const onUploadLabelKeydown = useCallback(() => {
    apiRef.current?.pickAndLoad().catch((error) => {
      if (deferProgrammerError(error)) return;
      logError(error, { operation: "upload" });
    });
  }, []);

  const onExport = useCallback(() => {
    void apiRef.current?.onExport();
  }, []);

  const onClear = useCallback(() => {
    void apiRef.current?.onClear();
  }, []);

  const onReloadHandle = useCallback(() => {
    void apiRef.current?.onReloadHandle();
  }, []);

  return {
    state,
    navError,
    navEpoch,
    initialized,
    reloadHandle,
    renderOptions,
    onUploadInputChange,
    onUploadLabelClick,
    onUploadLabelKeydown,
    onExport,
    onClear,
    onReloadHandle,
  };
}

export { isFsaSupported };
