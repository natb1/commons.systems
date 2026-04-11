import { escapeHtml } from "@commons-systems/htmlutil";
import type { MediaItem } from "../types.js";
import type { ContentRenderer } from "./types.js";
import {
  spreadsForPageCount,
  spreadIndexForPage,
  spreadPositionLabel,
} from "./spread.js";
import type { Spread } from "./spread.js";
import {
  getReadingPosition,
  saveReadingPosition,
} from "../reading-position.js";
import { renderSearchSection, initSearch } from "./search.js";
import { renderOutlineSection, initOutline } from "./outline.js";

function renderTags(tags: Record<string, string>): string {
  const entries = Object.entries(tags);
  if (entries.length === 0) return "";
  return entries
    .map(([k, v]) => `<span class="viewer-tag">${escapeHtml(k)}: ${escapeHtml(v)}</span>`)
    .join(" ");
}

export function renderViewerShell(item: MediaItem): string {
  return `
    <div class="viewer" data-orientation="landscape">
      <div class="viewer-content">
        <div class="viewer-canvas-wrap"></div>
      </div>
      <button class="viewer-panel-toggle" aria-expanded="true" aria-label="Toggle panel">&#9776;</button>
      <aside class="viewer-panel">
        <a href="/" class="viewer-back">&larr; Back to Library</a>
        <div class="viewer-nav">
          <button class="viewer-prev" disabled aria-label="Previous page">&larr;</button>
          <span class="viewer-position">Loading...</span>
          <button class="viewer-next" disabled aria-label="Next page">&rarr;</button>
          <button class="viewer-zoom-in zoom-hidden" aria-label="Zoom in">+</button>
          <button class="viewer-zoom-out zoom-hidden" aria-label="Zoom out">&minus;</button>
          <button class="viewer-zoom-reset zoom-hidden" aria-label="Reset zoom">&#8865;</button>
          <button class="viewer-spread-toggle spread-hidden" aria-label="Toggle spread view" aria-pressed="false">&#9783;</button>
        </div>
        ${renderSearchSection()}
        ${renderOutlineSection()}
        <div class="viewer-meta">
          <h3 class="viewer-title">${escapeHtml(item.title)}</h3>
          <p class="viewer-type"><span class="media-badge">${escapeHtml(item.mediaType)}</span></p>
          ${item.publicDomain ? '<p class="viewer-pd">Public Domain</p>' : ""}
          <p class="viewer-source">${escapeHtml(item.sourceNotes)}</p>
          <div class="viewer-tags">${renderTags(item.tags)}</div>
        </div>
      </aside>
    </div>
  `;
}

function localStorageKey(mediaId: string): string {
  return `reading-position:${mediaId}`;
}

function loadLocalPosition(mediaId: string): string | null {
  try {
    return localStorage.getItem(localStorageKey(mediaId));
  } catch (e) {
    reportError(new Error("Could not load reading position from localStorage", { cause: e }));
    return null;
  }
}

function saveLocalPosition(mediaId: string, position: string): void {
  try {
    localStorage.setItem(localStorageKey(mediaId), position);
  } catch (e) {
    reportError(new Error("Could not save reading position to localStorage", { cause: e }));
  }
}

export function initViewer(
  outlet: HTMLElement,
  createRenderer: (onError: (err: unknown) => void) => ContentRenderer,
  resolveSource: () => Promise<string | ArrayBuffer>,
  mediaId: string,
  uid: string | null,
): () => void {
  const viewer = outlet.querySelector(".viewer") as HTMLElement;
  if (!viewer) throw new Error(".viewer element not found");

  const canvasWrap = viewer.querySelector(".viewer-canvas-wrap") as HTMLElement;
  const prevBtn = viewer.querySelector(".viewer-prev") as HTMLButtonElement;
  const nextBtn = viewer.querySelector(".viewer-next") as HTMLButtonElement;
  const position = viewer.querySelector(".viewer-position") as HTMLElement;
  const toggleBtn = viewer.querySelector(".viewer-panel-toggle") as HTMLButtonElement;
  const panel = viewer.querySelector(".viewer-panel") as HTMLElement;
  const zoomInBtn = viewer.querySelector(".viewer-zoom-in") as HTMLButtonElement;
  const zoomOutBtn = viewer.querySelector(".viewer-zoom-out") as HTMLButtonElement;
  const zoomResetBtn = viewer.querySelector(".viewer-zoom-reset") as HTMLButtonElement;
  const spreadToggleBtn = viewer.querySelector(".viewer-spread-toggle") as HTMLButtonElement;

  const spreadKey = `spread-mode:${mediaId}`;
  document.body.classList.add("viewer-active");

  function handleRenderError(err: unknown) {
    reportError(new Error("Render failed", { cause: err }));
    position.textContent = "Render failed. Try refreshing the page.";
    prevBtn.disabled = true;
    nextBtn.disabled = true;
  }

  const renderer = createRenderer(handleRenderError);

  // Orientation detection
  const orientationQuery = matchMedia("(orientation: landscape)");
  function updateOrientation() {
    viewer.dataset.orientation = orientationQuery.matches ? "landscape" : "portrait";
  }
  updateOrientation();
  orientationQuery.addEventListener("change", updateOrientation);

  // Tap zones for touch navigation when panel is collapsed
  const viewerContent = viewer.querySelector(".viewer-content") as HTMLElement;

  function createTapZones(): void {
    if (viewerContent.querySelector(".tap-zone")) return;
    const prev = document.createElement("div");
    prev.className = "tap-zone tap-zone-prev";
    prev.addEventListener("click", () => { goPrev().catch(handleNavError); });
    const next = document.createElement("div");
    next.className = "tap-zone tap-zone-next";
    next.addEventListener("click", () => { goNext().catch(handleNavError); });
    viewerContent.appendChild(prev);
    viewerContent.appendChild(next);
  }

  function removeTapZones(): void {
    viewerContent.querySelectorAll(".tap-zone").forEach((el) => el.remove());
  }

  // Panel toggle with fullscreen
  function handleToggle() {
    const collapsed = panel.classList.toggle("collapsed");
    toggleBtn.setAttribute("aria-expanded", String(!collapsed));
    if (collapsed) {
      createTapZones();
      // Best-effort: fullscreen is unavailable on some platforms (e.g. iPhone Safari)
      viewer.requestFullscreen().catch(() => {});
    } else {
      removeTapZones();
      if (document.fullscreenElement) {
        // Best-effort: may reject if not in fullscreen or API unsupported
        document.exitFullscreen().catch(() => {});
      }
    }
  }
  toggleBtn.addEventListener("click", handleToggle);

  function handleFullscreenChange() {
    if (!document.fullscreenElement && panel.classList.contains("collapsed")) {
      panel.classList.remove("collapsed");
      toggleBtn.setAttribute("aria-expanded", "true");
      removeTapZones();
    }
  }
  document.addEventListener("fullscreenchange", handleFullscreenChange);

  // Position persistence: Firestore for authenticated users, localStorage otherwise.
  // Debounced to avoid writes on every sub-page turn.
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let lastSavedPosition: string | null = null;
  // Set true when Firestore read fails at init; prevents overwriting unknown saved state on write.
  let firestoreReadFailed = false;

  // Persist position after each navigation — debounced (500ms), deduplicated (skips matching position).
  // Skips Firestore writes if the initial read failed.
  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = null;
      const pos = getSpreadPosition();
      if (!pos || pos === lastSavedPosition) return;
      lastSavedPosition = pos;
      if (uid && !firestoreReadFailed) {
        saveReadingPosition(uid, mediaId, pos).catch((err) => {
          reportError(new Error("Failed to save reading position", { cause: err }));
        });
      } else {
        saveLocalPosition(mediaId, pos);
      }
    }, 500);
  }

  // Zoom controls — update enabled/disabled state
  function updateZoomState() {
    if (!renderer.zoomIn) return;
    zoomInBtn.disabled = false;
    if (spreadEnabled) {
      zoomOutBtn.disabled = spreadZoomLevel <= 0;
      zoomResetBtn.disabled = spreadZoomLevel <= 0;
    } else {
      zoomOutBtn.disabled = !renderer.isZoomed;
      zoomResetBtn.disabled = !renderer.isZoomed;
    }
  }

  // Zoom handlers dispatch between spread mode (CSS transform) and renderer zoom
  function handleZoomIn() {
    if (spreadEnabled) {
      spreadZoomLevel++;
      updateSpreadZoom();
    } else {
      renderer.zoomIn!();
    }
    updateZoomState();
  }

  function handleZoomOut() {
    if (spreadEnabled) {
      if (spreadZoomLevel <= 0) return;
      spreadZoomLevel--;
      updateSpreadZoom();
    } else {
      renderer.zoomOut!();
    }
    updateZoomState();
  }

  function handleZoomReset() {
    if (spreadEnabled) {
      spreadZoomLevel = 0;
      updateSpreadZoom();
    } else {
      renderer.resetZoom!();
    }
    updateZoomState();
  }

  let searchCleanup: (() => void) | null = null;
  let outlineCleanup: (() => void) | null = null;
  let spreadToggleCleanup: (() => void) | null = null;
  let spreadEnabled = false;
  let spreads: Spread[] = [];
  let spreadIndex = 0;
  let spreadZoomLevel = 0;
  let spreadResizeObserver: ResizeObserver | null = null;
  let spreadResizeTimer: ReturnType<typeof setTimeout> | null = null;
  // Page the user was on when entering spread mode; used to restore position on exit.
  let preSpreadPage = 1;

  function getSpreadPosition(): string {
    if (spreadEnabled && spreads.length > 0) {
      return String(spreads[spreadIndex]!.left);
    }
    return renderer.position;
  }

  async function renderSpread(): Promise<void> {
    if (!renderer.renderPageInto || spreads.length === 0) return;
    const spread = spreads[spreadIndex]!;
    const isSolo = spread.right === null;

    const leftEl = canvasWrap.querySelector(".spread-left") as HTMLElement;
    const rightEl = canvasWrap.querySelector(".spread-right") as HTMLElement;
    leftEl.innerHTML = "";
    rightEl.innerHTML = "";

    canvasWrap.classList.toggle("solo", isSolo);

    await renderer.renderPageInto(spread.left, leftEl);
    if (spread.right !== null) {
      await renderer.renderPageInto(spread.right, rightEl);
    }
  }

  function updateSpreadZoom(): void {
    if (spreadZoomLevel === 0) {
      canvasWrap.style.transform = "";
      canvasWrap.classList.remove("zoomed");
    } else {
      const scale = 1.2 ** spreadZoomLevel;
      canvasWrap.style.transform = `scale(${scale})`;
      canvasWrap.style.transformOrigin = "top left";
      canvasWrap.classList.add("zoomed");
    }
  }

  function enterSpreadMode(currentPage: number): void {
    spreadEnabled = true;
    preSpreadPage = currentPage;
    spreads = spreadsForPageCount(renderer.pageCount);
    spreadIndex = spreadIndexForPage(currentPage, renderer.pageCount);
    spreadZoomLevel = 0;

    // Create sub-containers (CSS hides the single-page renderer element)
    canvasWrap.classList.add("spread-mode");
    const leftEl = document.createElement("div");
    leftEl.className = "spread-page spread-left";
    const rightEl = document.createElement("div");
    rightEl.className = "spread-page spread-right";
    canvasWrap.appendChild(leftEl);
    canvasWrap.appendChild(rightEl);

    spreadToggleBtn.setAttribute("aria-pressed", "true");
    try { localStorage.setItem(spreadKey, "true"); }
    catch (e) { reportError(new Error("Could not save spread preference", { cause: e })); }

    spreadResizeObserver = new ResizeObserver(() => {
      if (spreadResizeTimer) clearTimeout(spreadResizeTimer);
      spreadResizeTimer = setTimeout(() => {
        spreadResizeTimer = null;
        renderSpread().catch(handleRenderError);
      }, 150);
    });
    spreadResizeObserver.observe(canvasWrap);
  }

  function leaveSpreadMode(): number {
    const spread = spreads.length > 0 ? spreads[spreadIndex]! : null;
    const currentPage = spread !== null
      && preSpreadPage >= spread.left
      && (spread.right === null || preSpreadPage <= spread.right)
      ? preSpreadPage
      : (spread?.left ?? 1);
    spreadEnabled = false;
    spreads = [];
    spreadIndex = 0;
    spreadZoomLevel = 0;

    canvasWrap.querySelectorAll(".spread-page").forEach(el => el.remove());
    canvasWrap.classList.remove("spread-mode", "solo");
    canvasWrap.style.transform = "";
    canvasWrap.style.transformOrigin = "";
    canvasWrap.classList.remove("zoomed");

    spreadToggleBtn.setAttribute("aria-pressed", "false");
    try { localStorage.setItem(spreadKey, "false"); }
    catch (e) { reportError(new Error("Could not save spread preference", { cause: e })); }

    if (spreadResizeObserver) {
      spreadResizeObserver.disconnect();
      spreadResizeObserver = null;
    }
    if (spreadResizeTimer) {
      clearTimeout(spreadResizeTimer);
      spreadResizeTimer = null;
    }

    return currentPage;
  }

  // Navigation
  function updateNav() {
    if (spreadEnabled && spreads.length > 0) {
      position.textContent = spreadPositionLabel(spreads[spreadIndex]!, renderer.pageCount);
      prevBtn.disabled = spreadIndex <= 0;
      nextBtn.disabled = spreadIndex >= spreads.length - 1;
    } else {
      position.textContent = renderer.positionLabel;
      prevBtn.disabled = !renderer.canGoPrev;
      nextBtn.disabled = !renderer.canGoNext;
    }
    updateZoomState();
    scheduleSave();
  }

  function handleNavError(err: unknown) {
    reportError(new Error("Page navigation failed", { cause: err }));
    position.textContent = "Navigation failed. Try refreshing the page.";
  }

  async function goPrev() {
    if (spreadEnabled) {
      if (spreadIndex > 0) {
        spreadIndex--;
        await renderSpread();
      }
    } else {
      await renderer.prev();
    }
    updateNav();
  }

  async function goNext() {
    if (spreadEnabled) {
      if (spreadIndex < spreads.length - 1) {
        spreadIndex++;
        await renderSpread();
      }
    } else {
      await renderer.next();
    }
    updateNav();
  }

  prevBtn.addEventListener("click", () => {
    goPrev().catch(handleNavError);
  });
  nextBtn.addEventListener("click", () => {
    goNext().catch(handleNavError);
  });

  // Keyboard navigation
  function handleKeydown(e: KeyboardEvent) {
    if ((e.target as HTMLElement)?.closest(".viewer-search-input")) return;
    if (e.key === "ArrowLeft") goPrev().catch(handleNavError);
    else if (e.key === "ArrowRight") goNext().catch(handleNavError);
  }
  document.addEventListener("keydown", handleKeydown);

  // Spread toggle
  async function handleSpreadToggle() {
    if (spreadEnabled) {
      const currentPage = leaveSpreadMode();
      await renderer.goToPage(currentPage);
      updateNav();
    } else {
      const currentPage = renderer.currentPage;
      enterSpreadMode(currentPage);
      await renderSpread();
      updateNav();
    }
  }

  // Initialize renderer — load saved position (Firestore if authenticated, localStorage otherwise), then init.
  // Position-load errors are non-fatal: if Firestore or localStorage fails, init proceeds from page 1.
  (async () => {
    let savedPosition: string | null = null;
    if (uid) {
      try {
        savedPosition = await getReadingPosition(uid, mediaId);
      } catch (err) {
        reportError(new Error("Failed to restore reading position", { cause: err }));
        firestoreReadFailed = true;
      }
    } else {
      savedPosition = loadLocalPosition(mediaId);
    }
    lastSavedPosition = savedPosition;
    const source = await resolveSource();
    await renderer.init(canvasWrap, source, savedPosition ?? undefined);
    // Sync to actual start page: parsePositionPage may have clamped savedPosition to 1 if out of range.
    // Without this sync, lastSavedPosition would differ from renderer.position, triggering a spurious write on first navigation.
    lastSavedPosition = renderer.position;
    if (renderer.zoomIn) {
      zoomInBtn.classList.remove("zoom-hidden");
      zoomOutBtn.classList.remove("zoom-hidden");
      zoomResetBtn.classList.remove("zoom-hidden");
      zoomInBtn.addEventListener("click", handleZoomIn);
      zoomOutBtn.addEventListener("click", handleZoomOut);
      zoomResetBtn.addEventListener("click", handleZoomReset);
      renderer.onZoomChange = updateZoomState;
    }
    if (renderer.renderPageInto) {
      spreadToggleBtn.classList.remove("spread-hidden");
      const onSpreadToggle = () => { handleSpreadToggle().catch(handleRenderError); };
      spreadToggleBtn.addEventListener("click", onSpreadToggle);
      spreadToggleCleanup = () => { spreadToggleBtn.removeEventListener("click", onSpreadToggle); };
      let preferSpread = false;
      try { preferSpread = localStorage.getItem(spreadKey) === "true"; }
      catch (e) { reportError(new Error("Could not load spread preference", { cause: e })); }
      if (preferSpread) {
        enterSpreadMode(renderer.currentPage);
        await renderSpread();
      }
    }
    searchCleanup = initSearch(viewer, renderer, () => updateNav());
    outlineCleanup = initOutline(viewer, renderer, () => updateNav());
    updateNav();
  })().catch((err) => {
    reportError(new Error("Viewer initialization failed", { cause: err }));
    position.textContent = "Failed to load";
  });

  return () => {
    if (saveTimer) clearTimeout(saveTimer);
    document.body.classList.remove("viewer-active");
    orientationQuery.removeEventListener("change", updateOrientation);
    toggleBtn.removeEventListener("click", handleToggle);
    document.removeEventListener("fullscreenchange", handleFullscreenChange);
    removeTapZones();
    if (document.fullscreenElement) {
      // Best-effort cleanup: suppress errors during teardown
      document.exitFullscreen().catch(() => {});
    }
    document.removeEventListener("keydown", handleKeydown);
    zoomInBtn.removeEventListener("click", handleZoomIn);
    zoomOutBtn.removeEventListener("click", handleZoomOut);
    zoomResetBtn.removeEventListener("click", handleZoomReset);
    searchCleanup?.();
    outlineCleanup?.();
    spreadToggleCleanup?.();
    if (spreadResizeObserver) spreadResizeObserver.disconnect();
    if (spreadResizeTimer) clearTimeout(spreadResizeTimer);
    renderer.destroy();
  };
}
