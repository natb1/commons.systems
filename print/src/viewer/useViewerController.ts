import { useCallback, useEffect, useRef, useState } from "react";
import type { ContentRenderer } from "./types.js";
import { clampGoToPage, isSearchable } from "./types.js";
import { SpreadController } from "./spread-controller.js";
import type { PositionStore } from "../sidecar.js";

/**
 * Inputs to {@link useViewerController}. These are per-mount values — a given
 * media item never changes them — so the hook closes over them via a ref and
 * runs its init/teardown effect exactly once (empty dependency array).
 */
export interface UseViewerControllerArgs {
  /** Build the renderer; `onError` is the render-error sink (sets `loadError`). */
  createRenderer: (onError: (err: unknown) => void) => ContentRenderer;
  /** Resolve the document source (URL string or ArrayBuffer) just before init. */
  resolveSource: () => Promise<string | ArrayBuffer>;
  /** Stable media id; keys the spread-mode + bookmarks storage. */
  mediaId: string;
  /** Injected position backend (sidecar / Firestore / localStorage). */
  store: PositionStore;
  /** Authed user id, or null for anonymous; gates the cloud bookmarks store. */
  uid: string | null;
}

/**
 * The value returned by {@link useViewerController}. The hook owns ALL viewer
 * orchestration (the body ported from `initViewer`); the `<Viewer>` component
 * and its panels stay presentational, wiring these refs/handlers to DOM.
 *
 * Refs the component must attach:
 * - `canvasWrapRef` → the node the renderer draws into. The renderer/engine owns
 *   this element's subtree; React must NEVER render children into it.
 * - `gotoInputRef` → the go-to `<input>`. The hook reads `.value` and toggles
 *   `.disabled`/`.placeholder` imperatively for the "Calculating…" cycle.
 * - `spreadToggleRef` → the spread toggle `<button>`; passed to SpreadController
 *   so its `setAttribute("aria-pressed", …)` keeps working unchanged.
 * - `viewerRef` → the `.viewer` element used for `requestFullscreen()`.
 */
export interface UseViewerControllerResult {
  // --- Refs the component attaches to DOM ---
  /** The renderer draws into this node; do NOT render React children into it. */
  canvasWrapRef: React.RefObject<HTMLDivElement>;
  /** The go-to input element (value/disabled/placeholder poked imperatively). */
  gotoInputRef: React.RefObject<HTMLInputElement>;
  /** The spread toggle button; SpreadController drives its aria-pressed.
   *  MUST be attached to an always-mounted element — hide via CSS or the
   *  `hasSpread` flag, do NOT conditionally render it. SpreadController captures
   *  `spreadToggleRef.current` at mount, and a returning user whose stored spread
   *  preference is "true" enters spread mode DURING init (no interaction), which
   *  calls `.setAttribute("aria-pressed", …)` on it — a null ref would crash. */
  spreadToggleRef: React.RefObject<HTMLButtonElement>;
  /** The `.viewer` element used for fullscreen requests. */
  viewerRef: React.RefObject<HTMLElement>;

  // --- Render-only state projection (recomputed by syncNav) ---
  /** Position label, e.g. "Page 5 / 10" or "Pages 2–3 / 10". */
  positionLabel: string;
  /** Whether prev navigation is available (prev button enabled). */
  canGoPrev: boolean;
  /** Whether next navigation is available (next button enabled). */
  canGoNext: boolean;
  /** Zoom-out disabled state (zoom-in is always enabled when hasZoom). */
  zoomOutDisabled: boolean;
  /** Zoom-reset disabled state. */
  zoomResetDisabled: boolean;
  /** Whether spread (two-page) mode is currently active. */
  spreadEnabled: boolean;
  /** Go-to input mode: page numbers, percent, or hidden (null). */
  gotoMode: "page" | "percent" | null;
  /** Whether the renderer supports full-text search (panel may show). */
  searchable: boolean;
  /** Whether the renderer supports zoom (zoom controls may show). */
  hasZoom: boolean;
  /** Whether the renderer supports spread mode (spread toggle may show). */
  hasSpread: boolean;
  /** Whether the side panel is collapsed (fullscreen reading). */
  panelCollapsed: boolean;
  /** Current device orientation. */
  orientation: "landscape" | "portrait";
  /** A user-facing load/render/navigation error message, or null when healthy. */
  loadError: string | null;

  // --- Dispatch handlers (stable; safe to pass to presentational children) ---
  /** Navigate to the previous page/spread, then sync nav state. */
  goPrev: () => void;
  /** Navigate to the next page/spread, then sync nav state. */
  goNext: () => void;
  /** Navigate to a 1-based page number, then sync nav state. */
  goToPage: (page: number) => void;
  /** Submit the go-to input (page jump or percent jump). */
  submitGoto: () => void;
  /** Zoom in (spread CSS transform or renderer zoom). */
  zoomIn: () => void;
  /** Zoom out. */
  zoomOut: () => void;
  /** Reset zoom. */
  zoomReset: () => void;
  /** Toggle spread (two-page) mode. */
  toggleSpread: () => void;
  /** Toggle the side panel collapse + best-effort fullscreen request/exit. */
  togglePanel: () => void;

  // --- Panel-facing API (Units 3-5) ---
  /** The live renderer instance (null before init resolves). Panels call
   *  search/getOutline/goToResult/goToPosition/clearSearch on it. */
  getRenderer: () => ContentRenderer | null;
  /** Post-search-result navigation: spread → controller.goToPage(currentPage),
   *  single → renderer.renderResult(); then syncNav. Does NOT clear search. */
  onSearchNavigate: () => void;
  /** Generic post-navigation callback for outline + bookmark nav: just syncNav. */
  onPanelNavigate: () => void;
  /** True when the position store's initial read failed (Unit 5 store gate). */
  readFailed: boolean;
  /** The media id (Unit 5 bookmarks store key). */
  mediaId: string;
  /** The authed user id, or null (Unit 5 cloud-vs-local store gate). */
  uid: string | null;
  /** Incrementing counter bumped on every syncNav; bookmark/search subscribers
   *  read this to re-render after navigation. */
  navSignal: number;
}

/**
 * Mutable orchestration state, held in a single ref. This mirrors the closure
 * variables of `initViewer` — handlers read/write these so the once-registered
 * document listeners stay correct without re-subscribing.
 */
interface ControllerInternals {
  renderer: ContentRenderer | null;
  controller: SpreadController | null;
  saveTimer: ReturnType<typeof setTimeout> | null;
  lastSavedPosition: string | null;
  readFailed: boolean;
  gotoMode: "page" | "percent" | null;
  gotoInFlight: boolean;
}

export function useViewerController(
  args: UseViewerControllerArgs,
): UseViewerControllerResult {
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const gotoInputRef = useRef<HTMLInputElement>(null);
  const spreadToggleRef = useRef<HTMLButtonElement>(null);
  const viewerRef = useRef<HTMLElement>(null);

  // Args are per-mount; close over them via a ref so the empty-deps effect
  // never re-runs for a given media item.
  const argsRef = useRef(args);
  argsRef.current = args;

  const [positionLabel, setPositionLabel] = useState("Loading...");
  const [canGoPrev, setCanGoPrev] = useState(false);
  const [canGoNext, setCanGoNext] = useState(false);
  const [zoomOutDisabled, setZoomOutDisabled] = useState(true);
  const [zoomResetDisabled, setZoomResetDisabled] = useState(true);
  const [spreadEnabled, setSpreadEnabled] = useState(false);
  const [gotoMode, setGotoMode] = useState<"page" | "percent" | null>(null);
  const [searchable, setSearchable] = useState(false);
  const [hasZoom, setHasZoom] = useState(false);
  const [hasSpread, setHasSpread] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [orientation, setOrientation] = useState<"landscape" | "portrait">(
    "landscape",
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [readFailed, setReadFailed] = useState(false);
  const [navSignal, setNavSignal] = useState(0);

  const internals = useRef<ControllerInternals>({
    renderer: null,
    controller: null,
    saveTimer: null,
    lastSavedPosition: null,
    readFailed: false,
    gotoMode: null,
    gotoInFlight: false,
  });

  // The handler API closures live inside the effect (like initViewer) and are
  // stashed here; the stable public callbacks delegate through this ref.
  const apiRef = useRef<{
    goPrev: () => Promise<void>;
    goNext: () => Promise<void>;
    goToPage: (page: number) => Promise<void>;
    submitGoto: () => Promise<void>;
    zoomIn: () => void;
    zoomOut: () => void;
    zoomReset: () => void;
    toggleSpread: () => Promise<void>;
    togglePanel: () => void;
    onSearchNavigate: () => void;
    onPanelNavigate: () => void;
  } | null>(null);

  useEffect(() => {
    const { createRenderer, resolveSource, mediaId, store } = argsRef.current;
    const st = internals.current;
    // Per-effect-invocation cancellation token. A local (not a shared ref field)
    // so each (re)mount gets its own copy: a prior mount's in-flight async init
    // keeps seeing its own `cancelled = true` even after a new mount starts,
    // making same-instance remounts (incl. React StrictMode double-invoke) safe.
    let cancelled = false;

    const spreadKey = `spread-mode:${mediaId}`;
    document.body.classList.add("viewer-active");

    function handleRenderError(err: unknown) {
      reportError(new Error("Render failed", { cause: err }));
      setLoadError("Render failed. Try refreshing the page.");
      setCanGoPrev(false);
      setCanGoNext(false);
    }

    function handleNavError(err: unknown) {
      reportError(new Error("Page navigation failed", { cause: err }));
      setLoadError("Navigation failed. Try refreshing the page.");
    }

    const renderer = createRenderer(handleRenderError);
    st.renderer = renderer;

    const canvasWrap = canvasWrapRef.current;
    if (!canvasWrap) {
      throw new Error("canvasWrapRef not attached before init");
    }

    const controller = new SpreadController({
      renderer,
      canvasWrap,
      spreadToggleBtn: spreadToggleRef.current!,
      storageKey: spreadKey,
      onRenderError: handleRenderError,
    });
    st.controller = controller;

    // --- Orientation ---
    const orientationQuery = matchMedia("(orientation: landscape)");
    function updateOrientation() {
      setOrientation(orientationQuery.matches ? "landscape" : "portrait");
    }
    updateOrientation();
    orientationQuery.addEventListener("change", updateOrientation);

    // --- Position persistence ---
    function getSpreadPosition(): string {
      return controller.position;
    }

    function persistPosition() {
      const pos = getSpreadPosition();
      if (!pos || pos === st.lastSavedPosition) return;
      st.lastSavedPosition = pos;
      if (st.readFailed) return;
      store.save(pos).catch((err) => {
        reportError(new Error("Failed to save reading position", { cause: err }));
      });
    }

    function scheduleSave() {
      if (st.saveTimer) clearTimeout(st.saveTimer);
      st.saveTimer = setTimeout(() => {
        st.saveTimer = null;
        persistPosition();
      }, 500);
    }

    function flushSave() {
      if (st.saveTimer) {
        clearTimeout(st.saveTimer);
        st.saveTimer = null;
        persistPosition();
      }
    }

    // --- Zoom enabled-state projection ---
    function updateZoomState() {
      if (!renderer.zoomIn) return;
      if (controller.enabled) {
        setZoomOutDisabled(!controller.canZoomOut);
        setZoomResetDisabled(!controller.canZoomOut);
      } else {
        setZoomOutDisabled(!renderer.isZoomed);
        setZoomResetDisabled(!renderer.isZoomed);
      }
    }

    // --- Nav state projection (React replacement for updateNav) ---
    function syncNav() {
      if (controller.enabled) {
        setPositionLabel(controller.positionLabel);
        setCanGoPrev(controller.canGoPrev);
        setCanGoNext(controller.canGoNext);
      } else {
        setPositionLabel(renderer.positionLabel);
        setCanGoPrev(renderer.canGoPrev);
        setCanGoNext(renderer.canGoNext);
      }
      if (st.gotoMode === "page") {
        const input = gotoInputRef.current;
        if (input) {
          input.max = String(renderer.pageCount);
          if (document.activeElement !== input) {
            input.value = controller.enabled
              ? controller.position
              : String(renderer.currentPage);
          }
        }
      }
      updateZoomState();
      scheduleSave();
      setNavSignal((n) => n + 1);
    }

    // --- Navigation handlers ---
    async function goPrev() {
      if (controller.enabled) {
        if (!controller.canGoPrev) return;
        // Optional chain is intentional: `renderer` is an un-narrowed ContentRenderer,
        // where clearSearch is optional (types.ts). Only a SearchableRenderer — reached
        // via isSearchable() — requires it. Do not drop the `?.`: a non-searchable
        // renderer (e.g. image-archive) has no clearSearch.
        renderer.clearSearch?.();
        await controller.goPrev();
      } else {
        await renderer.prev();
      }
      syncNav();
    }

    async function goNext() {
      if (controller.enabled) {
        if (!controller.canGoNext) return;
        // Intentional optional chain — see goPrev (un-narrowed ContentRenderer).
        renderer.clearSearch?.();
        await controller.goNext();
      } else {
        await renderer.next();
      }
      syncNav();
    }

    async function goToPageNum(page: number): Promise<void> {
      if (controller.enabled) {
        // Intentional optional chain — see goPrev (un-narrowed ContentRenderer).
        renderer.clearSearch?.();
        await controller.goToPage(page);
      } else {
        await renderer.goToPage(page);
      }
      syncNav();
    }

    async function submitGoto(): Promise<void> {
      if (st.gotoInFlight) return;
      st.gotoInFlight = true;
      try {
        const input = gotoInputRef.current;
        if (!input) return;
        if (st.gotoMode === "percent") {
          const pct = parseFloat(input.value);
          if (Number.isNaN(pct)) return;
          const frac = Math.max(0, Math.min(100, pct)) / 100;
          const savedValue = input.value;
          input.value = "";
          input.disabled = true;
          input.placeholder = "Calculating…";
          try {
            await renderer.goToFraction!(frac);
          } finally {
            input.value = savedValue;
            input.disabled = false;
            input.placeholder = "%";
          }
          syncNav();
        } else if (st.gotoMode === "page") {
          const page = clampGoToPage(input.value, renderer.pageCount);
          if (page === null) return;
          await goToPageNum(page);
        }
      } finally {
        st.gotoInFlight = false;
      }
    }

    function initGoto(): void {
      const input = gotoInputRef.current;
      if (renderer.goToFraction) {
        if (input) {
          input.min = "0";
          input.max = "100";
          input.step = "1";
          input.setAttribute("aria-label", "Go to location percent");
          input.placeholder = "%";
        }
        st.gotoMode = "percent";
        setGotoMode("percent");
      } else if (renderer.pageCount > 1) {
        if (input) {
          input.min = "1";
          input.max = String(renderer.pageCount);
          input.step = "1";
          input.setAttribute("aria-label", "Go to page");
          input.placeholder = "#";
        }
        st.gotoMode = "page";
        setGotoMode("page");
      }
    }

    // --- Zoom handlers ---
    function zoomIn() {
      if (controller.enabled) controller.zoomIn();
      else renderer.zoomIn!();
      updateZoomState();
    }
    function zoomOut() {
      if (controller.enabled) controller.zoomOut();
      else renderer.zoomOut!();
      updateZoomState();
    }
    function zoomReset() {
      if (controller.enabled) controller.zoomReset();
      else renderer.resetZoom!();
      updateZoomState();
    }

    // --- Spread toggle ---
    async function toggleSpread() {
      if (controller.enabled) {
        const currentPage = controller.leave();
        await renderer.goToPage(currentPage);
        setSpreadEnabled(false);
        syncNav();
      } else {
        controller.enter(renderer.currentPage);
        await controller.render();
        setSpreadEnabled(true);
        syncNav();
      }
    }

    // --- Panel toggle + fullscreen ---
    function togglePanel() {
      setPanelCollapsed((prev) => {
        const next = !prev;
        if (next) {
          // Best-effort: fullscreen is unavailable on some platforms.
          viewerRef.current?.requestFullscreen().catch(() => {});
        } else if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        return next;
      });
    }

    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        setPanelCollapsed(false);
      }
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    // --- Keyboard navigation ---
    function handleKeydown(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.closest(".viewer-search-input, .viewer-goto-input")) return;
      if (e.key === "ArrowLeft") goPrev().catch(handleNavError);
      else if (e.key === "ArrowRight") goNext().catch(handleNavError);
    }
    document.addEventListener("keydown", handleKeydown);

    // --- Panel-facing nav callbacks ---
    function onSearchNavigate() {
      if (controller.enabled) {
        controller.goToPage(renderer.currentPage).catch(handleRenderError);
      } else if (isSearchable(renderer)) {
        renderer.renderResult().catch(handleRenderError);
      }
      syncNav();
    }

    function onPanelNavigate() {
      syncNav();
    }

    apiRef.current = {
      goPrev,
      goNext,
      goToPage: goToPageNum,
      submitGoto,
      zoomIn,
      zoomOut,
      zoomReset,
      toggleSpread,
      togglePanel,
      onSearchNavigate,
      onPanelNavigate,
    };

    // --- Init (replaces the async IIFE) ---
    void (async () => {
      let savedPosition: string | null = null;
      try {
        savedPosition = await store.load();
      } catch (err) {
        reportError(new Error("Failed to restore reading position", { cause: err }));
        st.readFailed = true;
        if (!cancelled) setReadFailed(true);
      }
      if (cancelled) return;
      st.lastSavedPosition = savedPosition;
      const source = await resolveSource();
      if (cancelled) return;
      await renderer.init(canvasWrap, source, savedPosition ?? undefined);
      if (cancelled) return;
      // Sync to actual start page: init may have clamped savedPosition. Without
      // this, lastSavedPosition would differ from renderer.position and trigger
      // a spurious write on first navigation.
      st.lastSavedPosition = renderer.position;
      if (renderer.zoomIn) {
        setHasZoom(true);
        renderer.onZoomChange = updateZoomState;
      }
      if (renderer.renderPageInto) {
        setHasSpread(true);
        if (controller.loadPreference()) {
          controller.enter(renderer.currentPage);
          await controller.render();
          if (cancelled) return;
          setSpreadEnabled(true);
        }
      }
      initGoto();
      if (isSearchable(renderer)) {
        setSearchable(true);
      }
      syncNav();
    })().catch((err) => {
      reportError(new Error("Viewer initialization failed", { cause: err }));
      if (!cancelled) setLoadError("Failed to load");
    });

    // --- Full teardown (double-invoke-safe) ---
    return () => {
      cancelled = true;
      flushSave();
      document.body.classList.remove("viewer-active");
      orientationQuery.removeEventListener("change", updateOrientation);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      document.removeEventListener("keydown", handleKeydown);
      controller.destroy();
      renderer.destroy();
      st.renderer = null;
      st.controller = null;
      apiRef.current = null;
    };
    // Empty deps: args are per-mount (closed over via argsRef); init/teardown
    // run exactly once.
  }, []);

  // Stable public callbacks delegating through apiRef.
  const handleNavError = useCallback((err: unknown) => {
    reportError(new Error("Page navigation failed", { cause: err }));
    setLoadError("Navigation failed. Try refreshing the page.");
  }, []);

  const goPrev = useCallback(() => {
    apiRef.current?.goPrev().catch(handleNavError);
  }, [handleNavError]);
  const goNext = useCallback(() => {
    apiRef.current?.goNext().catch(handleNavError);
  }, [handleNavError]);
  const goToPage = useCallback((page: number) => {
    apiRef.current?.goToPage(page).catch(handleNavError);
  }, [handleNavError]);
  const submitGoto = useCallback(() => {
    apiRef.current?.submitGoto().catch(handleNavError);
  }, [handleNavError]);
  const zoomIn = useCallback(() => {
    apiRef.current?.zoomIn();
  }, []);
  const zoomOut = useCallback(() => {
    apiRef.current?.zoomOut();
  }, []);
  const zoomReset = useCallback(() => {
    apiRef.current?.zoomReset();
  }, []);
  const toggleSpread = useCallback(() => {
    apiRef.current?.toggleSpread().catch((err) => {
      reportError(new Error("Render failed", { cause: err }));
      setLoadError("Render failed. Try refreshing the page.");
    });
  }, []);
  const togglePanel = useCallback(() => {
    apiRef.current?.togglePanel();
  }, []);
  const onSearchNavigate = useCallback(() => {
    apiRef.current?.onSearchNavigate();
  }, []);
  const onPanelNavigate = useCallback(() => {
    apiRef.current?.onPanelNavigate();
  }, []);
  const getRenderer = useCallback(() => internals.current.renderer, []);

  return {
    canvasWrapRef,
    gotoInputRef,
    spreadToggleRef,
    viewerRef,
    positionLabel,
    canGoPrev,
    canGoNext,
    zoomOutDisabled,
    zoomResetDisabled,
    spreadEnabled,
    gotoMode,
    searchable,
    hasZoom,
    hasSpread,
    panelCollapsed,
    orientation,
    loadError,
    goPrev,
    goNext,
    goToPage,
    submitGoto,
    zoomIn,
    zoomOut,
    zoomReset,
    toggleSpread,
    togglePanel,
    getRenderer,
    onSearchNavigate,
    onPanelNavigate,
    readFailed,
    mediaId: args.mediaId,
    uid: args.uid,
    navSignal,
  };
}
