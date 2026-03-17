import ePub, { type Book, type Rendition, type Location } from "epubjs";
import type { ContentRenderer } from "./types.js";

export function createEpubRenderer(
  onError?: (err: unknown) => void,
): ContentRenderer {
  let book: Book | null = null;
  let rendition: Rendition | null = null;
  let containerDiv: HTMLDivElement | null = null;
  let _chapterCount = 0;
  let _chapterIndex = 0; // 0-based
  let _subPage = 1;
  let _subPageTotal = 1;
  let _atStart = true;
  let _atEnd = false;
  let _storageKey = "";
  let destroyed = false;

  // Suppress unused-parameter lint — onError reserved for future use by
  // rendition error events, matching the PDF renderer's signature.
  void onError;

  function savePosition(cfi: string): void {
    try {
      localStorage.setItem(_storageKey, cfi);
    } catch {
      // localStorage may be unavailable (private browsing, quota)
    }
  }

  function loadPosition(): string | null {
    try {
      return localStorage.getItem(_storageKey);
    } catch {
      return null;
    }
  }

  function waitForRelocated(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!rendition) {
        resolve();
        return;
      }
      rendition.once("relocated", () => resolve());
    });
  }

  return {
    async init(containerEl: HTMLElement, url: string): Promise<void> {
      containerDiv = document.createElement("div");
      containerDiv.className = "viewer-epub-container";
      containerEl.appendChild(containerDiv);

      _storageKey = `epub-position:${url}`;

      book = ePub(url);
      rendition = book.renderTo(containerDiv, {
        width: "100%",
        height: "100%",
        flow: "paginated",
      });

      await book.ready;
      await book.loaded.spine;

      if (destroyed) return;

      // spine.length exists at runtime but is missing from @types/epubjs
      _chapterCount = (book.spine as unknown as { length: number }).length;

      rendition.on("relocated", (location: Location) => {
        _chapterIndex = location.start.index;
        _subPage = location.start.displayed.page;
        _subPageTotal = location.start.displayed.total;
        _atStart = location.atStart;
        _atEnd = location.atEnd;
        savePosition(location.start.cfi);
      });

      const savedCfi = loadPosition();
      await rendition.display(savedCfi ?? undefined);
      if (!savedCfi) {
        _chapterIndex = 0;
        _subPage = 1;
      }
    },

    async goToPage(page: number): Promise<void> {
      if (!rendition || !book || page < 1 || page > _chapterCount) return;
      const spineItem = book.spine.get(page - 1);
      if (!spineItem) return;
      await rendition.display(spineItem.href);
    },

    async next(): Promise<void> {
      if (!rendition || _atEnd) return;
      const relocated = waitForRelocated();
      await rendition.next();
      await relocated;
    },

    async prev(): Promise<void> {
      if (!rendition || _atStart) return;
      const relocated = waitForRelocated();
      await rendition.prev();
      await relocated;
    },

    get pageCount() {
      // Shell uses currentPage >= pageCount to disable "next".
      // Return 2 so only currentPage=2 (atEnd) disables it.
      return 2;
    },
    get currentPage() {
      // Shell uses currentPage <= 1 to disable "prev".
      // Return 1 when atStart, 2 when atEnd, otherwise in between.
      if (_atStart) return 1;
      if (_atEnd) return 2;
      return 1.5; // neither boundary — both buttons enabled
    },
    get positionLabel() {
      return `Ch. ${_chapterIndex + 1}/${_chapterCount} — p. ${_subPage}/${_subPageTotal}`;
    },

    destroy(): void {
      destroyed = true;
      if (rendition) {
        rendition.destroy();
        rendition = null;
      }
      if (book) {
        book.destroy();
        book = null;
      }
      if (containerDiv) {
        containerDiv.remove();
        containerDiv = null;
      }
    },
  };
}
