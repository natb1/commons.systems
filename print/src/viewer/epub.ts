import ePub, { type Book, type Rendition, type Location } from "epubjs";
import type { ContentRenderer } from "./types.js";

export function createEpubRenderer(
  onError?: (err: unknown) => void,
): ContentRenderer {
  let book: Book | null = null;
  let rendition: Rendition | null = null;
  let containerDiv: HTMLDivElement | null = null;
  let _chapterCount = 0;
  let _chapterIndex = 0;
  let _subPage = 1;
  let _subPageTotal = 1;
  let _atStart = true;
  let _atEnd = false;
  let _currentCfi = "";
  let destroyed = false;

  // epub.js next()/prev() resolve before the relocated event fires.
  // Callers await this to get updated position state. The 5s timeout
  // prevents a permanent hang if epub.js fails to emit the event.
  function waitForRelocated(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!rendition) { resolve(); return; }
      const timer = setTimeout(() => { reportError(new Error("waitForRelocated: timed out after 5s")); resolve(); }, 5000);
      rendition.once("relocated", () => { clearTimeout(timer); resolve(); });
    });
  }

  return {
    async init(containerEl: HTMLElement, url: string, initialPosition?: string): Promise<void> {
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

      // spine.length exists at runtime but is missing from the epubjs type declarations.
      _chapterCount = (book.spine as unknown as { length: number }).length;
      if (_chapterCount === 0) throw new Error("EPUB spine is empty — no chapters to render");

      rendition.on("relocated", (location: Location) => {
        _chapterIndex = location.start.index;
        _subPage = location.start.displayed.page;
        _subPageTotal = location.start.displayed.total;
        _atStart = location.atStart;
        _atEnd = location.atEnd;
        _currentCfi = location.start.cfi;
      });

      rendition.on("displayerror", onError ?? ((err: unknown) => {
        reportError(new Error("EPUB display error", { cause: err }));
      }));

      await rendition.display(initialPosition ?? undefined);
      if (!initialPosition) {
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
      return _chapterCount;
    },
    get currentPage() {
      return _chapterIndex + 1;
    },
    get canGoNext() { return _chapterCount > 0 && !_atEnd; },
    get canGoPrev() { return _chapterCount > 0 && !_atStart; },
    get position() {
      return _currentCfi;
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
