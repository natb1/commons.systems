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
        <div class="viewer-canvas-wrap">
          <canvas id="viewer-canvas"></canvas>
        </div>
      </div>
      <button class="viewer-panel-toggle" aria-expanded="true" aria-label="Toggle panel">&#9776;</button>
      <aside class="viewer-panel">
        <a href="/" class="viewer-back">&larr; Back to Library</a>
        <div class="viewer-nav">
          <button class="viewer-prev" disabled aria-label="Previous page">&larr;</button>
          <span class="viewer-position">Loading...</span>
          <button class="viewer-next" disabled aria-label="Next page">&rarr;</button>
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

  document.body.classList.add("viewer-active");

  function handleRenderError(err: unknown) {
    reportError(new Error("Render failed", { cause: err }));
    position.textContent = "Render failed";
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

  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let lastSavedPosition: string | null = null;

  // Persist position after each navigation — debounced (500ms) and deduplicated (only writes when position changes).
  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = null;
      const pos = renderer.position;
      if (!pos || pos === "0" || pos === lastSavedPosition) return;
      lastSavedPosition = pos;
      if (uid) {
        saveReadingPosition(uid, mediaId, pos).catch((err) => {
          reportError(new Error("Failed to save reading position", { cause: err }));
        });
      } else {
        saveLocalPosition(mediaId, pos);
      }
    }, 500);
  }

  // Navigation
  function updateNav() {
    position.textContent = `Page ${renderer.currentPage} / ${renderer.pageCount}`;
    prevBtn.disabled = renderer.currentPage <= 1;
    nextBtn.disabled = renderer.currentPage >= renderer.pageCount;
    scheduleSave();
  }

  function handleNavError(err: unknown) {
    reportError(new Error("Page navigation failed", { cause: err }));
    position.textContent = "Navigation failed";
  }

  async function goPrev() {
    if (renderer.currentPage > 1) {
      await renderer.goToPage(renderer.currentPage - 1);
      updateNav();
    }
  }

  async function goNext() {
    if (renderer.currentPage < renderer.pageCount) {
      await renderer.goToPage(renderer.currentPage + 1);
      updateNav();
    }
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
  // Firestore errors are non-fatal: position restore is skipped and init proceeds from page 1.
  (async () => {
    let savedPosition: string | null = null;
    if (uid) {
      try {
        savedPosition = await getReadingPosition(uid, mediaId);
      } catch (err) {
        reportError(new Error("Failed to restore reading position", { cause: err }));
      }
    } else {
      savedPosition = loadLocalPosition(mediaId);
    }
    lastSavedPosition = savedPosition;
    await renderer.init(canvasWrap, url, savedPosition ?? undefined);
    lastSavedPosition = renderer.position; // sync to actual start page — parsePositionPage may have clamped savedPosition to 1 if out of range
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
    renderer.destroy();
  };
}
