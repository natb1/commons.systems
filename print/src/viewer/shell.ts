import { escapeHtml } from "@commons-systems/htmlutil";
import type { MediaItem } from "../types.js";
import type { ContentRenderer } from "./types.js";
import { SpreadController } from "./spread-controller.js";
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
          ${item.markdownPath ? `<div class="viewer-md-actions">
            <button class="media-md-download" data-md-path="${escapeHtml(item.markdownPath)}" data-title="${escapeHtml(item.title)}" title="Download Markdown" aria-label="Download Markdown">&#128220;</button>
            <button class="media-md-copy" data-md-path="${escapeHtml(item.markdownPath)}" title="Copy Markdown" aria-label="Copy Markdown">&#128203;</button>
          </div>` : ""}
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
    if (controller.enabled) {
      zoomOutBtn.disabled = !controller.canZoomOut;
      zoomResetBtn.disabled = !controller.canZoomOut;
    } else {
      zoomOutBtn.disabled = !renderer.isZoomed;
      zoomResetBtn.disabled = !renderer.isZoomed;
    }
  }

  // Zoom handlers dispatch between spread mode (CSS transform) and renderer zoom
  function handleZoomIn() {
    if (controller.enabled) {
      controller.zoomIn();
    } else {
      renderer.zoomIn!();
    }
    updateZoomState();
  }

  function handleZoomOut() {
    if (controller.enabled) {
      controller.zoomOut();
    } else {
      renderer.zoomOut!();
    }
    updateZoomState();
  }

  function handleZoomReset() {
    if (controller.enabled) {
      controller.zoomReset();
    } else {
      renderer.resetZoom!();
    }
    updateZoomState();
  }

  let searchCleanup: (() => void) | null = null;
  let outlineCleanup: (() => void) | null = null;
  let spreadToggleCleanup: (() => void) | null = null;

  const controller = new SpreadController({
    renderer,
    canvasWrap,
    spreadToggleBtn,
    storageKey: spreadKey,
    onRenderError: handleRenderError,
  });

  function getSpreadPosition(): string {
    return controller.enabled ? controller.position : renderer.position;
  }

  // Navigation
  function updateNav() {
    if (controller.enabled) {
      position.textContent = controller.positionLabel;
      prevBtn.disabled = !controller.canGoPrev;
      nextBtn.disabled = !controller.canGoNext;
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
    if (controller.enabled) {
      await controller.goPrev();
    } else {
      await renderer.prev();
    }
    updateNav();
  }

  async function goNext() {
    if (controller.enabled) {
      await controller.goNext();
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
    if (controller.enabled) {
      const currentPage = controller.leave();
      await renderer.goToPage(currentPage);
      updateNav();
    } else {
      controller.enter(renderer.currentPage);
      await controller.render();
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
      if (SpreadController.loadPreference(spreadKey, reportError)) {
        controller.enter(renderer.currentPage);
        await controller.render();
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
    controller.destroy();
    renderer.destroy();
  };
}
