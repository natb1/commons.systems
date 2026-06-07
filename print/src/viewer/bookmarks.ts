import { escapeHtml } from "@commons-systems/htmlutil";
import type { ContentRenderer } from "./types.js";
import type { Bookmark } from "../bookmarks.js";

export function renderBookmarksToggle(): string {
  return `<button class="viewer-bookmark-toggle" aria-pressed="false" aria-label="Bookmark this page" disabled>&#128278;</button>`;
}

export function renderBookmarksSection(): string {
  return `
    <div class="viewer-bookmarks bookmarks-hidden">
      <h4 class="viewer-bookmarks-heading">Bookmarks</h4>
      <ul class="viewer-bookmarks-list" aria-label="Bookmarks"></ul>
    </div>
  `;
}

export interface BookmarksStore {
  load(): Promise<Bookmark[]>;
  save(bookmarks: Bookmark[]): Promise<void>;
}

export function initBookmarks(
  container: HTMLElement,
  renderer: ContentRenderer,
  store: BookmarksStore,
  onNavigate: () => void,
): { cleanup: () => void; sync: () => void } {
  const toggleBtn = container.querySelector(".viewer-bookmark-toggle") as HTMLButtonElement;
  const section = container.querySelector(".viewer-bookmarks") as HTMLElement;
  const list = container.querySelector(".viewer-bookmarks-list") as HTMLUListElement;

  let bookmarks: Bookmark[] = [];
  let destroyed = false;

  function renderList() {
    // Safe: escapeHtml escapes all user-provided label text; position is set via data-position attribute.
    list.innerHTML = bookmarks
      .map(
        (b) =>
          `<li class="viewer-bookmarks-item">` +
          `<a class="viewer-bookmark-entry" href="#" data-position="${escapeHtml(b.position)}">${escapeHtml(b.label)}</a>` +
          `</li>`,
      )
      .join("");
    section.classList.toggle("bookmarks-hidden", bookmarks.length === 0);
  }

  function isBookmarked(pos: string): boolean {
    return bookmarks.some((b) => b.position === pos);
  }

  function sync() {
    toggleBtn.setAttribute("aria-pressed", String(isBookmarked(renderer.position)));
    toggleBtn.removeAttribute("disabled");
  }

  function handleToggleClick() {
    const pos = renderer.position;
    const label = renderer.positionLabel;
    if (isBookmarked(pos)) {
      bookmarks = bookmarks.filter((b) => b.position !== pos);
    } else {
      bookmarks = [...bookmarks, { position: pos, label }];
    }
    store.save(bookmarks).catch((err) => {
      reportError(new Error("Failed to save bookmarks", { cause: err }));
    });
    renderList();
    toggleBtn.setAttribute("aria-pressed", String(isBookmarked(pos)));
  }

  function handleListClick(e: Event) {
    const anchor = (e.target as HTMLElement).closest(".viewer-bookmark-entry") as HTMLElement | null;
    if (!anchor) return;
    e.preventDefault();
    const pos = anchor.dataset.position;
    if (pos === undefined) return;
    renderer.goToPosition(pos).then(() => {
      onNavigate();
    }).catch((err) => {
      reportError(new Error("Bookmark navigation failed", { cause: err }));
    });
  }

  toggleBtn.addEventListener("click", handleToggleClick);
  list.addEventListener("click", handleListClick);

  store.load().then((loaded) => {
    if (destroyed) return;
    bookmarks = loaded;
    renderList();
    sync();
  }).catch((err) => {
    reportError(new Error("Failed to load bookmarks", { cause: err }));
  });

  return {
    cleanup: () => {
      destroyed = true;
      toggleBtn.removeEventListener("click", handleToggleClick);
      list.removeEventListener("click", handleListClick);
    },
    sync,
  };
}
