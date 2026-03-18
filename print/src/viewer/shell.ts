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
  url: string,
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

  // Panel toggle
  function handleToggle() {
    const collapsed = panel.classList.toggle("collapsed");
    toggleBtn.setAttribute("aria-expanded", String(!collapsed));
  }
  toggleBtn.addEventListener("click", handleToggle);

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
    if (spreadEnabled) {
      zoomInBtn.disabled = false;
      zoomOutBtn.disabled = spreadZoomLevel <= 0;
      zoomResetBtn.disabled = spreadZoomLevel <= 0;
    } else {
      zoomInBtn.disabled = false;
      zoomOutBtn.disabled = !renderer.isZoomed;
      zoomResetBtn.disabled = !renderer.isZoomed;
    }
  }

  function handleZoomIn() {
    renderer.zoomIn!();
    updateZoomState();
  }

  function handleZoomOut() {
    renderer.zoomOut!();
    updateZoomState();
  }

  function handleZoomReset() {
    renderer.resetZoom!();
    updateZoomState();
  }

  // Spread mode state
  let spreadEnabled = false;
  let spreads: Spread[] = [];
  let spreadIndex = 0;
  let spreadZoomLevel = 0;
  let spreadResizeObserver: ResizeObserver | null = null;
  let spreadResizeTimer: ReturnType<typeof setTimeout> | null = null;

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

    // Clear sub-containers
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
    spreads = spreadsForPageCount(renderer.pageCount);
    spreadIndex = spreadIndexForPage(currentPage, renderer.pageCount);
    spreadZoomLevel = 0;

    // Create sub-containers and hide renderer element
    canvasWrap.classList.add("spread-mode");
    const leftEl = document.createElement("div");
    leftEl.className = "spread-page spread-left";
    const rightEl = document.createElement("div");
    rightEl.className = "spread-page spread-right";
    canvasWrap.appendChild(leftEl);
    canvasWrap.appendChild(rightEl);

    spreadToggleBtn.setAttribute("aria-pressed", "true");
    try { localStorage.setItem("spread-mode", "true"); } catch { /* storage unavailable */ }

    // ResizeObserver for spread re-render
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
    const currentPage = spreads.length > 0 ? spreads[spreadIndex]!.left : 1;
    spreadEnabled = false;
    spreads = [];
    spreadIndex = 0;
    spreadZoomLevel = 0;

    // Remove sub-containers
    canvasWrap.querySelectorAll(".spread-page").forEach(el => el.remove());
    canvasWrap.classList.remove("spread-mode", "solo");
    canvasWrap.style.transform = "";
    canvasWrap.style.transformOrigin = "";
    canvasWrap.classList.remove("zoomed");

    spreadToggleBtn.setAttribute("aria-pressed", "false");
    try { localStorage.setItem("spread-mode", "false"); } catch { /* storage unavailable */ }

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

  // Spread-aware zoom: override handlers when spread mode active
  function handleZoomInSpread() {
    if (spreadEnabled) {
      spreadZoomLevel++;
      updateSpreadZoom();
      updateZoomState();
    } else {
      handleZoomIn();
    }
  }

  function handleZoomOutSpread() {
    if (spreadEnabled) {
      if (spreadZoomLevel <= 0) return;
      spreadZoomLevel--;
      updateSpreadZoom();
      updateZoomState();
    } else {
      handleZoomOut();
    }
  }

  function handleZoomResetSpread() {
    if (spreadEnabled) {
      spreadZoomLevel = 0;
      updateSpreadZoom();
      updateZoomState();
    } else {
      handleZoomReset();
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
    await renderer.init(canvasWrap, url, savedPosition ?? undefined);
    // Sync to actual start page: parsePositionPage may have clamped savedPosition to 1 if out of range.
    // Without this sync, lastSavedPosition would differ from renderer.position, triggering a spurious write on first navigation.
    lastSavedPosition = renderer.position;
    if (renderer.zoomIn) {
      zoomInBtn.classList.remove("zoom-hidden");
      zoomOutBtn.classList.remove("zoom-hidden");
      zoomResetBtn.classList.remove("zoom-hidden");
      zoomInBtn.addEventListener("click", handleZoomInSpread);
      zoomOutBtn.addEventListener("click", handleZoomOutSpread);
      zoomResetBtn.addEventListener("click", handleZoomResetSpread);
      renderer.onZoomChange = updateZoomState;
    }
    if (renderer.renderPageInto) {
      spreadToggleBtn.classList.remove("spread-hidden");
      spreadToggleBtn.addEventListener("click", handleSpreadToggle);
      // Restore spread preference
      let preferSpread = false;
      try { preferSpread = localStorage.getItem("spread-mode") === "true"; } catch { /* storage unavailable */ }
      if (preferSpread) {
        enterSpreadMode(renderer.currentPage);
        await renderSpread();
      }
    }
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
    document.removeEventListener("keydown", handleKeydown);
    zoomInBtn.removeEventListener("click", handleZoomInSpread);
    zoomOutBtn.removeEventListener("click", handleZoomOutSpread);
    zoomResetBtn.removeEventListener("click", handleZoomResetSpread);
    spreadToggleBtn.removeEventListener("click", handleSpreadToggle);
    if (spreadResizeObserver) spreadResizeObserver.disconnect();
    if (spreadResizeTimer) clearTimeout(spreadResizeTimer);
    renderer.destroy();
  };
}
