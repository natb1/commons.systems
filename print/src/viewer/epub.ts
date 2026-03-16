import ePub, { type Book, type Rendition } from "epubjs";
import type { ContentRenderer } from "./types.js";

export function createEpubRenderer(
  onError?: (err: unknown) => void,
): ContentRenderer {
  let book: Book | null = null;
  let rendition: Rendition | null = null;
  let containerDiv: HTMLDivElement | null = null;
  let _currentPage = 0;
  let _pageCount = 0;
  let destroyed = false;

  // Suppress unused-parameter lint — onError reserved for future use by
  // rendition error events, matching the PDF renderer's signature.
  void onError;

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
      _pageCount = (book.spine as unknown as { length: number }).length;

      rendition.on("relocated", (location: { start: { index: number } }) => {
        _currentPage = location.start.index + 1;
      });

      await rendition.display();
      _currentPage = 1;
    },

    async goToPage(page: number): Promise<void> {
      if (!rendition || !book || page < 1 || page > _pageCount) return;
      const spineItem = book.spine.get(page - 1);
      if (!spineItem) return;
      await rendition.display(spineItem.href);
    },

    async next(): Promise<void> {
      if (!rendition) return;
      const relocated = waitForRelocated();
      await rendition.next();
      await relocated;
    },

    async prev(): Promise<void> {
      if (!rendition) return;
      const relocated = waitForRelocated();
      await rendition.prev();
      await relocated;
    },

    get pageCount() {
      return _pageCount;
    },
    get currentPage() {
      return _currentPage;
    },
    get positionLabel() {
      return `Chapter ${_currentPage} / ${_pageCount}`;
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
