import { escapeHtml } from "@commons-systems/htmlutil";
import type { ContentRenderer, OutlineEntry } from "./types.js";

export function renderOutlineSection(): string {
  return `
    <div class="viewer-outline outline-hidden">
      <h4 class="viewer-outline-heading">Contents</h4>
      <ul class="viewer-outline-list" role="tree"></ul>
    </div>
  `;
}

function renderEntryItem(entry: OutlineEntry, index: number, depth: number): string {
  const hasChildren = entry.children.length > 0;
  const toggleBtn = hasChildren
    ? `<button class="viewer-outline-toggle" aria-expanded="false" aria-label="Expand">\u25b6</button>`
    : "";
  const childrenHtml = hasChildren
    ? `<ul class="viewer-outline-children outline-collapsed" role="group">${
        entry.children.map((child, i) => renderEntryItem(child, i, depth + 1)).join("")
      }</ul>`
    : "";
  return `<li class="viewer-outline-item" role="treeitem" data-depth="${depth}" data-index="${index}">` +
    `<span class="viewer-outline-row">${toggleBtn}<a class="viewer-outline-entry" href="#" data-depth="${depth}" data-index="${index}">${escapeHtml(entry.title)}</a></span>` +
    childrenHtml +
    `</li>`;
}

export function initOutline(
  container: HTMLElement,
  renderer: ContentRenderer,
  onNavigate: () => void,
): (() => void) | null {
  if (!renderer.getOutline || !renderer.goToOutlineEntry) return null;
  const getOutline = renderer.getOutline;
  const goToOutlineEntry = renderer.goToOutlineEntry;

  const section = container.querySelector(".viewer-outline") as HTMLElement;
  const list = container.querySelector(".viewer-outline-list") as HTMLUListElement;

  let entries: OutlineEntry[] = [];
  let destroyed = false;

  function handleEntryClick(e: Event) {
    e.preventDefault();
    const anchor = (e.target as HTMLElement).closest(".viewer-outline-entry") as HTMLElement | null;
    if (!anchor) return;
    const li = anchor.closest(".viewer-outline-item") as HTMLElement | null;
    if (!li) return;
    const entry = findEntryForElement(li);
    if (!entry) return;
    goToOutlineEntry(entry).then(() => {
      onNavigate();
    }).catch((err) => {
      reportError(new Error("Outline navigation failed", { cause: err }));
    });
  }

  function findEntryForElement(li: HTMLElement): OutlineEntry | null {
    const path: number[] = [];
    let current: HTMLElement | null = li;
    while (current) {
      const parent = current.parentElement;
      if (!parent) break;
      const siblings = Array.from(parent.children).filter(
        (el) => el.classList.contains("viewer-outline-item"),
      );
      const idx = siblings.indexOf(current);
      if (idx === -1) break;
      path.unshift(idx);
      current = parent.closest(".viewer-outline-item") as HTMLElement | null;
    }
    let items: readonly OutlineEntry[] = entries;
    let entry: OutlineEntry | null = null;
    for (const idx of path) {
      if (idx >= items.length) return null;
      entry = items[idx]!;
      items = entry.children;
    }
    return entry;
  }

  function handleToggleClick(e: Event) {
    const btn = (e.target as HTMLElement).closest(".viewer-outline-toggle") as HTMLButtonElement | null;
    if (!btn) return;
    const li = btn.closest(".viewer-outline-item") as HTMLElement | null;
    if (!li) return;
    const childList = li.querySelector(":scope > .viewer-outline-children") as HTMLElement | null;
    if (!childList) return;
    const collapsed = childList.classList.toggle("outline-collapsed");
    btn.setAttribute("aria-expanded", String(!collapsed));
    btn.textContent = collapsed ? "\u25b6" : "\u25bc";
    btn.setAttribute("aria-label", collapsed ? "Expand" : "Collapse");
  }

  // Safe: renderEntryItem escapes all user-provided text via escapeHtml.
  getOutline().then((result) => {
    if (destroyed) return;
    entries = result;
    if (entries.length === 0) return;
    section.classList.remove("outline-hidden");
    list.innerHTML = entries.map((entry, i) => renderEntryItem(entry, i, 0)).join("");
  }).catch((err) => {
    reportError(new Error("Failed to load outline", { cause: err }));
  });

  list.addEventListener("click", handleEntryClick);
  list.addEventListener("click", handleToggleClick);

  return () => {
    destroyed = true;
    list.removeEventListener("click", handleEntryClick);
    list.removeEventListener("click", handleToggleClick);
  };
}
