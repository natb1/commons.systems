import "missing.css";
import "./style/theme.css";
import { createHistoryRouter } from "@commons-systems/router";
import { hydrateOnce } from "@commons-systems/router/hydrate";
import { renderHome } from "./pages/home.js";
import { renderBudgets } from "./pages/budgets.js";
import { renderAccounts } from "./pages/accounts.js";
import { renderAccountsReconcile } from "./pages/accounts-reconcile.js";
import { renderRules } from "./pages/rules.js";
import "@commons-systems/components/nav";
import type { AppNavElement } from "@commons-systems/components/nav";
import type { RenderPageOptions } from "./pages/render-options.js";
import { hydrateTransactionTable } from "./pages/home-hydrate.js";
import { hydrateCategorySankey } from "./pages/home-chart.js";
import { hydrateBudgetTable, hydrateBudgetChart, hydrateOverridesTable } from "./pages/budgets-hydrate.js";
import { hydrateRulesTable } from "./pages/rules-hydrate.js";
import { hydrateAccountsCharts } from "./pages/accounts-hydrate.js";
import { hydrateAccountsReconcile } from "./pages/accounts-reconcile-hydrate.js";
import { mountHero } from "@commons-systems/components/hero";
import { renderHero } from "./pages/hero.js";
import { trackPageView, initAppCheck } from "./firebase.js";
import { deferAppCheckInit } from "@commons-systems/firebaseutil/defer-appcheck";
import { classifyError } from "@commons-systems/errorutil/classify";
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
import { configureFileSync, flushWriteBack, resetFileSync, getSyncHandle, getLastSyncedModified } from "./file-sync.js";
import { setActiveDataSource } from "./active-data-source.js";
import { exportToJson } from "./export.js";
import { isEncrypted, decrypt, encrypt } from "./crypto.js";
import { NAV_LINKS } from "./nav-links.js";

const navEl = document.getElementById("nav") as AppNavElement;
if (!navEl) throw new Error("#nav element not found");
const app = document.getElementById("app") as HTMLElement;
if (!app) throw new Error("#app element not found");

const heroContainer = document.getElementById("hero-container") as HTMLElement;
if (!heroContainer) throw new Error("#hero-container element not found");
mountHero(heroContainer, renderHero);

export type AppState =
  | { source: "seed" }
  | { source: "local"; groupName: string };

let state: AppState = { source: "seed" };
let importPassword: string | null = null;

navEl.links = [...NAV_LINKS];
navEl.showAuth = false;

// File upload UI
const uploadContainer = document.createElement("div");
uploadContainer.className = "nav-upload";
uploadContainer.innerHTML = `<label class="upload-label" tabindex="0">Load data<input type="file" accept=".json,.benc" class="upload-input" hidden></label>`;
const authContainer = navEl.querySelector(".nav-auth");
if (!authContainer) throw new Error(".nav-auth container not found in nav element");
authContainer.appendChild(uploadContainer);

const uploadInput = uploadContainer.querySelector(".upload-input") as HTMLInputElement;
const uploadLabel = uploadContainer.querySelector(".upload-label") as HTMLLabelElement;

// Group name, export button, and clear button (shown when local data is loaded)
const localInfoContainer = document.createElement("div");
localInfoContainer.className = "nav-local-info";
localInfoContainer.hidden = true;
localInfoContainer.innerHTML = `<span class="local-group-name"></span><button class="export-data">Export</button><button class="clear-data">Clear data</button>`;
authContainer.appendChild(localInfoContainer);

const groupNameSpan = localInfoContainer.querySelector(".local-group-name") as HTMLSpanElement;
const exportButton = localInfoContainer.querySelector(".export-data") as HTMLButtonElement;
const clearButton = localInfoContainer.querySelector(".clear-data") as HTMLButtonElement;

// Error display
const errorEl = document.createElement("p");
errorEl.className = "nav-error";
errorEl.hidden = true;
authContainer.appendChild(errorEl);

function showNavError(message: string): void {
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function clearNavError(): void {
  errorEl.hidden = true;
  errorEl.textContent = "";
}

function updateNav(): void {
  if (state.source === "local") {
    uploadContainer.hidden = true;
    localInfoContainer.hidden = false;
    groupNameSpan.textContent = state.groupName;
  } else {
    uploadContainer.hidden = false;
    localInfoContainer.hidden = true;
  }
}

function createDataSource(): DataSource {
  if (state.source === "local") {
    return new FileSyncingDataSource(new IdbDataSource());
  }
  return new SeedDataSource();
}

function renderOptions(): RenderPageOptions {
  const ds = createDataSource();
  setActiveDataSource(ds);
  return {
    authorized: state.source === "local",
    groupName: state.source === "local" ? state.groupName : "",
    dataSource: ds,
  };
}

const router = createHistoryRouter(
  app,
  [
    { path: "/", render: () => renderBudgets(renderOptions()) },
    { path: "/transactions", render: () => renderHome(renderOptions()) },
    { path: "/accounts", render: () => renderAccounts(renderOptions()) },
    { path: "/accounts/reconcile", render: () => renderAccountsReconcile(renderOptions()) },
    { path: "/rules", render: () => renderRules(renderOptions()) },
  ],
  {
    onNavigate: ({ path }) => trackPageView(path),
    formatError: (error) => {
      const kind = classifyError(error);
      if (kind === "data-integrity" || kind === "range")
        return "A data error occurred. Please contact support.";
      return undefined;
    },
  },
);

function transition(next: AppState): void {
  state = next;
  heroContainer.hidden = next.source === "local";
  updateNav();
  clearNavError();
  router.navigate();
}

// Hydrate interactive containers (tables, chart) whenever they appear in the DOM.
// Multiple code paths trigger renders (navigation, data source changes), so an
// observer catches all of them. Observer runs for page lifetime: each render
// replaces page content, so containers start unhydrated and need re-initialization.
function hydrateTable(
  selector: string,
  hydrate: (el: HTMLElement) => void,
  errorLabel?: string,
): void {
  hydrateOnce(app, selector, hydrate, (error, el) => {
    const kind = classifyError(error);
    logError(error, { operation: "hydration" });
    el.querySelectorAll("input, select").forEach((input) => {
      (input as HTMLInputElement | HTMLSelectElement).disabled = true;
    });
    const msg = document.createElement("p");
    msg.textContent = kind === "data-integrity"
      ? "A data error occurred. Please contact support."
      : errorLabel
        ? `${errorLabel} is temporarily unavailable. Try refreshing the page.`
        : "Editing is temporarily unavailable. Try refreshing the page.";
    el.appendChild(msg);
  });
}

const observer = new MutationObserver(() => {
  hydrateTable("#category-sankey", hydrateCategorySankey, "Chart rendering");
  hydrateTable("#transactions-table", hydrateTransactionTable);
  hydrateTable("#budgets-chart", hydrateBudgetChart);
  hydrateTable("#budgets-table", hydrateBudgetTable);
  hydrateTable("#overrides-table", hydrateOverridesTable);
  hydrateTable("#rules-table", hydrateRulesTable);
  hydrateTable("#accounts-trend-chart", hydrateAccountsCharts, "Chart rendering");
  hydrateTable("#reconcile-container", hydrateAccountsReconcile);
});
observer.observe(app, { childList: true, subtree: true });

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

// Core load pipeline shared by the upload path and the FSA handle path:
// read bytes, decrypt-or-decode, parse, store, and transition to the local
// state. Throws on any failure; callers wrap it in error handling.
// Pass `cachedPassword` to skip the password dialog when the session password
// is already known (e.g. on an external-change reload).
async function loadFromFile(file: File, cachedPassword?: string): Promise<void> {
  const buffer = await file.arrayBuffer();
  let text: string;
  let pw: string | null = null;
  if (isEncrypted(buffer)) {
    if (cachedPassword !== undefined) {
      pw = cachedPassword;
    } else {
      pw = await promptPassword("Enter password to decrypt");
      if (pw === null) return;
    }
    text = await decrypt(buffer, pw);
  } else {
    text = new TextDecoder().decode(buffer);
  }
  const parsed = parseUploadedJson(text);
  const data = toParsedData(parsed);
  await storeParsedData(data);
  importPassword = pw;
  transition({ source: "local", groupName: parsed.groupName });
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
    // Stale/invalid handle (file moved or deleted): drop it and surface the
    // re-link picker rather than crashing.
    await clearFileHandle();
    if (deferProgrammerError(error)) return;
    logError(error, { operation: "load-from-handle" });
    showNavError("The linked file is no longer available. Please re-link it.");
    return;
  }
  // Run the parse/validation pipeline directly (rather than via handleFileUpload)
  // so a content-validation failure can drop the persisted handle. Without this,
  // a handle pointing at a non-budget file would be auto-loaded, fail validation,
  // and be retried on every subsequent startup — a permanent failing-load loop.
  try {
    await loadFromFile(file);
    // Arm encrypted write-back so subsequent UI edits overwrite this on-disk
    // file in place. loadFromFile sets importPassword only on the success path
    // (an encrypted file decrypted, or null for a plaintext file); a
    // password-cancel returns early without transitioning to local, leaving
    // importPassword null, so this no-ops there.
    if (importPassword) configureFileSync(handle, importPassword, file.lastModified);
  } catch (error) {
    if (error instanceof UploadValidationError) {
      // The persisted handle points to a file that is not valid budget data
      // (e.g. the wrong file was picked). Drop the handle so it does not
      // re-trigger a failing auto-load on every startup. A wrong decryption
      // password throws a different error (handled below) and keeps the handle,
      // since the file itself is valid and the user can retry.
      await clearFileHandle();
      showNavError(error.message);
      return;
    }
    if (deferProgrammerError(error)) return;
    logError(error, { operation: "load-from-handle" });
    showNavError("Could not load the linked file. Please re-link it.");
  }
}

uploadInput.addEventListener("change", () => {
  const file = uploadInput.files?.[0];
  if (file) {
    handleFileUpload(file).catch((error) => {
      if (deferProgrammerError(error)) return;
      logError(error, { operation: "upload" });
    });
  }
  // Reset so the same file can be re-uploaded
  uploadInput.value = "";
});

// FSA picker flow (Chromium): pick a file, persist its handle, then load it.
// Shared between the label click and keyboard activation handlers.
async function pickAndLoad(): Promise<void> {
  clearNavError();
  try {
    const handle = await pickBencFile();
    if (!handle) return; // user canceled
    await putFileHandle(handle);
    // Request readwrite up front so the handle can be written back to. Reads
    // work from a freshly-picked handle regardless; doWrite re-checks lazily,
    // so the result is not branched on here.
    await requestReadWritePermission(handle);
    await loadFromHandle(handle);
  } catch (error) {
    if (deferProgrammerError(error)) return;
    logError(error, { operation: "upload" });
    showNavError("Upload failed. Please try again.");
  }
}

if (isFsaSupported()) {
  // A <label> wrapping an <input> natively forwards clicks to the input, which
  // would open the legacy file dialog. preventDefault() stops that so the FSA
  // picker is the only dialog shown.
  uploadLabel.addEventListener("click", (e) => {
    e.preventDefault();
    pickAndLoad().catch((error) => {
      if (deferProgrammerError(error)) return;
      logError(error, { operation: "upload" });
    });
  });
}

// Allow keyboard activation of the label
uploadLabel.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    if (isFsaSupported()) {
      pickAndLoad().catch((error) => {
        if (deferProgrammerError(error)) return;
        logError(error, { operation: "upload" });
      });
    } else {
      uploadInput.click();
    }
  }
});

exportButton.addEventListener("click", async () => {
  try {
    const json = await exportToJson();
    let blob: Blob;
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
    const groupName = state.source === "local" ? state.groupName : "budget";
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
});

// Force any pending debounced write-back to run when the tab is hidden, so a
// tab close does not lose the last edit. Registered once at the top level.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") void flushWriteBack();
});

// External-change reload: when the window regains focus, re-read the on-disk
// file's lastModified. If it is newer than the watermark the app stamped at its
// last load or write-back, an external writer changed the file (another device's
// sync, or a dispatched budget-etl parse) — reload it so we do not overwrite a
// newer external write with stale in-memory state. Last-write-wins, whole-file.
// No-op in seed / non-FSA sessions (no armed handle).
let reloadInFlight: Promise<void> | null = null;
async function reloadIfExternallyChanged(): Promise<void> {
  // Coalesce concurrent focus events (e.g. rapid tab-in/tab-out) into a single
  // reload: if one is already running, wait for it and return rather than
  // stacking a second concurrent storeParsedData + transition pair.
  if (reloadInFlight) { await reloadInFlight; return; }
  const handle = getSyncHandle();
  if (!handle) return;
  const watermark = getLastSyncedModified();
  let file: File;
  try {
    file = await readFileFromHandle(handle);
  } catch (error) {
    // Stale handle (file moved/deleted): leave it for the next explicit load,
    // which surfaces the re-link picker. Do not crash the focus handler.
    logError(error, { operation: "external-change-reload" });
    return;
  }
  // No watermark means the session is not armed for sync (handle and watermark
  // are always set/cleared together by configureFileSync/resetFileSync), so a
  // null watermark is an explicit no-op rather than an unconditional reload.
  if (watermark === null || file.lastModified <= watermark) return;
  // Reload using the already-read File and the session's cached password so the
  // user is not re-prompted for their decryption password on every external write.
  const cachedPw = importPassword ?? undefined;
  reloadInFlight = (async () => {
    clearNavError();
    try {
      await loadFromFile(file, cachedPw);
      // Stamp the watermark. loadFromFile either set importPassword (success) or
      // returned early (wrong cached pw). In the early-return case importPassword
      // still holds its old value, so configureFileSync still advances the watermark
      // past this file version, preventing a re-prompt loop.
      if (importPassword) configureFileSync(handle, importPassword, file.lastModified);
    } catch (error) {
      // Do NOT clear the file handle here: a content-validation error in an
      // external write should not permanently unlink the FSA handle. The handle
      // is valid; only this particular file version is bad.
      if (deferProgrammerError(error)) return;
      logError(error, { operation: "external-change-reload" });
      showNavError("Could not reload the linked file.");
    }
  })();
  try {
    await reloadInFlight;
  } finally {
    reloadInFlight = null;
  }
}

window.addEventListener("focus", () => {
  reloadIfExternallyChanged().catch((error) => {
    if (deferProgrammerError(error)) return;
    logError(error, { operation: "external-change-reload" });
  });
});

clearButton.addEventListener("click", async () => {
  try {
    await clearAll();
    importPassword = null;
    resetFileSync();
    transition({ source: "seed" });
  } catch (error) {
    if (deferProgrammerError(error)) return;
    logError(error, { operation: "clear-data" });
    showNavError("Failed to clear data. Try closing other tabs or refreshing the page.");
  }
});

// Render a one-click "Reload <file>" affordance into the nav. Used when a
// persisted handle's permission is in the "prompt" state: we show cached/seed
// data immediately and let the user re-grant with a single click.
function showReloadPrompt(handle: FileSystemFileHandle): void {
  const existing = authContainer!.querySelector(".reload-handle");
  if (existing) existing.remove();
  const button = document.createElement("button");
  button.className = "reload-handle";
  button.textContent = `Reload ${handle.name}`;
  authContainer!.appendChild(button);
  button.addEventListener("click", async () => {
    try {
      const perm = await requestReadWritePermission(handle);
      if (perm === "granted") {
        await loadFromHandle(handle);
        button.remove();
        return;
      }
      // Still not granted: fall back to the re-link picker.
      // Only remove the button when the picker resulted in a successful load
      // (state transitions to "local"). If the user cancels the picker,
      // pickAndLoad returns normally without transitioning, and the button
      // must remain so the user can retry.
      const stateBefore = state;
      await pickAndLoad();
      if (state !== stateBefore && state.source === "local") {
        button.remove();
      }
    } catch (error) {
      if (deferProgrammerError(error)) return;
      logError(error, { operation: "reload-handle" });
      showNavError("Could not reload the linked file. Please re-link it.");
    }
  });
}

// Startup: check for a persisted FSA handle, then fall back to cached/seed data.
async function initialize(): Promise<void> {
  let denied = false;
  const handle = await getFileHandle();
  if (handle) {
    const perm = await queryReadWritePermission(handle);
    if (perm === "granted") {
      await loadFromHandle(handle);
      return;
    }
    if (perm === "prompt") {
      // Show cached data (or seed) immediately, plus a one-click reload affordance.
      const meta = await getMeta();
      if (meta) {
        transition({ source: "local", groupName: meta.groupName });
      } else {
        transition({ source: "seed" });
      }
      showReloadPrompt(handle);
      return;
    }
    // perm === "denied": the browser will not re-prompt for a denied handle, so
    // it is permanently unusable. Drop it (rather than silently re-entering the
    // denied path every session, a dead end) and fall through to the cached/seed
    // display below, then tell the user it was unlinked so they can re-link.
    await clearFileHandle();
    denied = true;
  }
  const meta = await getMeta();
  if (meta) {
    transition({ source: "local", groupName: meta.groupName });
  } else {
    transition({ source: "seed" });
  }
  // transition() clears any nav error, so surface the denied notice afterward.
  if (denied) {
    showNavError("Access to the linked file was denied; it has been unlinked.");
  }
}

initialize().catch((error) => {
  if (deferProgrammerError(error)) return;
  logError(error, { operation: "initialization" });
  showNavError("Could not load saved data. You may need to re-upload your file.");
  transition({ source: "seed" });
});

deferAppCheckInit(initAppCheck);
