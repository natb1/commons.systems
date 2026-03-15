import { escapeHtml } from "@commons-systems/htmlutil";
import type { MediaItem } from "../types.js";
import type { ContentRenderer } from "./types.js";

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

export function initViewer(
  outlet: HTMLElement,
  createRenderer: (onError: (err: unknown) => void) => ContentRenderer,
  url: string,
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

  // Navigation
  function updateNav() {
    position.textContent = `Page ${renderer.currentPage} / ${renderer.pageCount}`;
    prevBtn.disabled = renderer.currentPage <= 1;
    nextBtn.disabled = renderer.currentPage >= renderer.pageCount;
  }

  function handleNavError(err: unknown) {
    console.error("Page navigation failed:", err);
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

  // Initialize renderer
  renderer
    .init(canvasWrap, url)
    .then(() => {
      updateNav();
    })
    .catch((err) => {
      console.error("Failed to load document:", err);
      position.textContent = "Failed to load";
    });

  return () => {
    document.body.classList.remove("viewer-active");
    orientationQuery.removeEventListener("change", updateOrientation);
    toggleBtn.removeEventListener("click", handleToggle);
    document.removeEventListener("keydown", handleKeydown);
    renderer.destroy();
  };
}
