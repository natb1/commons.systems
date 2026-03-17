import { unzipSync } from "fflate";
import type { ContentRenderer } from "./types.js";
import { parsePositionPage } from "./types.js";

const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;

export function createImageArchiveRenderer(_onError?: (err: unknown) => void): ContentRenderer {
  // _onError accepted for factory signature consistency with createPdfRenderer. Unlike createPdfRenderer,
  // this renderer has no background re-render path (no ResizeObserver), so the callback is never invoked;
  // all errors surface as thrown exceptions from init.
  let fileData: Uint8Array[] = [];
  let objectUrlCache: (string | null)[] = [];
  let imgEl: HTMLImageElement | null = null;
  let containerEl: HTMLElement | null = null;
  // 0 is the pre-init sentinel; position returns "0" and canGoNext/canGoPrev return false until init resolves.
  let _currentPage = 0;
  let _pageCount = 0;
  let destroyed = false;

  function getObjectUrl(index: number): string {
    if (!objectUrlCache[index]) {
      objectUrlCache[index] = URL.createObjectURL(new Blob([fileData[index] as Uint8Array<ArrayBuffer>]));
    }
    return objectUrlCache[index] as string;
  }

  return {
    async init(container: HTMLElement, url: string, initialPosition?: string): Promise<void> {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch archive: ${response.status}`);

      const buffer = await response.arrayBuffer();
      let files: ReturnType<typeof unzipSync>;
      try {
        files = unzipSync(new Uint8Array(buffer));
      } catch (err) {
        throw new Error(
          `Failed to decompress archive from ${url} (${buffer.byteLength} bytes): ${err instanceof Error ? err.message : String(err)}`,
          { cause: err },
        );
      }

      const imagePaths = Object.keys(files)
        .filter((path) => IMAGE_EXT.test(path))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

      if (imagePaths.length === 0) throw new Error("No images found in archive");

      fileData = imagePaths.map((path) => files[path] as Uint8Array<ArrayBuffer>);
      objectUrlCache = new Array(fileData.length).fill(null);
      _pageCount = fileData.length;

      if (destroyed) {
        fileData = [];
        objectUrlCache = [];
        return;
      }

      const startPage = parsePositionPage(initialPosition, _pageCount);
      _currentPage = startPage;

      containerEl = container;
      imgEl = document.createElement("img");
      imgEl.alt = `Page ${startPage}`;
      imgEl.src = getObjectUrl(startPage - 1);
      container.appendChild(imgEl);
    },

    async goToPage(page: number): Promise<void> {
      if (page < 1 || page > _pageCount) return;
      if (!imgEl) throw new Error("goToPage called after renderer was destroyed");
      this.resetZoom!();
      _currentPage = page;
      imgEl.alt = `Page ${page}`;
      imgEl.src = getObjectUrl(page - 1);
    },

    async next(): Promise<void> {
      if (_currentPage < _pageCount) {
        await this.goToPage(_currentPage + 1);
      }
    },

    async prev(): Promise<void> {
      if (_currentPage > 1) {
        await this.goToPage(_currentPage - 1);
      }
    },

    get canGoNext() { return _currentPage < _pageCount; },
    get canGoPrev() { return _currentPage > 1; },

    get position() {
      return String(_currentPage);
    },
    get positionLabel() {
      return `Page ${_currentPage} / ${_pageCount}`;
    },
    get pageCount() {
      return _pageCount;
    },
    get currentPage() {
      return _currentPage;
    },

    zoomIn(): void {
      if (!containerEl) return;
      containerEl.classList.add("zoomed");
    },

    resetZoom(): void {
      if (!containerEl) return;
      containerEl.classList.remove("zoomed");
      const scrollParent = containerEl.parentElement;
      if (scrollParent) {
        scrollParent.scrollTop = 0;
        scrollParent.scrollLeft = 0;
      }
    },

    get isZoomed(): boolean {
      return containerEl?.classList.contains("zoomed") ?? false;
    },

    destroy(): void {
      destroyed = true;
      for (const url of objectUrlCache) {
        if (url) URL.revokeObjectURL(url);
      }
      fileData = [];
      objectUrlCache = [];
      if (imgEl) {
        imgEl.remove();
        imgEl = null;
      }
    },
  };
}
