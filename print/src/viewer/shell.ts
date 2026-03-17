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
  } catch {
    return null;
  }
}

function saveLocalPosition(mediaId: string, position: string): void {
  try {
    localStorage.setItem(localStorageKey(mediaId), position);
  } catch {
    // localStorage may be unavailable (private browsing, quota)
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
    console.error("Render failed:", err);
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

  // Position persistence (debounced)
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = null;
      const pos = renderer.position;
      if (!pos) return;
      if (uid) {
        saveReadingPosition(uid, mediaId, pos).catch((err) => {
          console.error("Failed to save reading position:", err);
        });
      } else {
        saveLocalPosition(mediaId, pos);
      }
    }, 500);
  }

  // Navigation
  function updateNav() {
    position.textContent = renderer.positionLabel;
    prevBtn.disabled = renderer.currentPage <= 1;
    nextBtn.disabled = renderer.currentPage >= renderer.pageCount;
    scheduleSave();
  }

  function handleNavError(err: unknown) {
    console.error("Page navigation failed:", err);
    position.textContent = "Navigation failed";
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

  // Initialize renderer — load saved position, then init
  (async () => {
    let savedPosition: string | null = null;
    if (uid) {
      savedPosition = await getReadingPosition(uid, mediaId);
    } else {
      savedPosition = loadLocalPosition(mediaId);
    }
    await renderer.init(canvasWrap, url, savedPosition ?? undefined);
    updateNav();
  })().catch((err) => {
    console.error("Failed to load document:", err);
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
