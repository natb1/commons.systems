import { escapeHtml } from "@commons-systems/htmlutil";
import type { MediaItem } from "../types.js";
import type { ContentRenderer } from "./types.js";
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
      const pos = renderer.position;
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
    zoomOutBtn.disabled = !renderer.isZoomed;
    zoomResetBtn.disabled = !renderer.isZoomed;
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

  // Navigation
  function updateNav() {
    position.textContent = renderer.positionLabel;
    prevBtn.disabled = !renderer.canGoPrev;
    nextBtn.disabled = !renderer.canGoNext;
    updateZoomState();
    scheduleSave();
  }

  function handleNavError(err: unknown) {
    reportError(new Error("Page navigation failed", { cause: err }));
    position.textContent = "Navigation failed. Try refreshing the page.";
  }

  async function goPrev() {
    await renderer.prev();
    updateNav();
  }

  async function goNext() {
    await renderer.next();
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
    zoomInBtn.removeEventListener("click", handleZoomIn);
    zoomOutBtn.removeEventListener("click", handleZoomOut);
    zoomResetBtn.removeEventListener("click", handleZoomReset);
    renderer.destroy();
  };
}
