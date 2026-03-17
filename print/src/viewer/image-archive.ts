import { unzip, HTTPRangeReader } from "unzipit";
import type { ZipEntry } from "unzipit";
import type { ContentRenderer } from "./types.js";
import { parsePositionPage } from "./types.js";

const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;

export function createImageArchiveRenderer(_onError?: (err: unknown) => void): ContentRenderer {
  // _onError accepted for factory signature consistency with createPdfRenderer. Unlike createPdfRenderer,
  // this renderer has no background re-render path (no ResizeObserver), so the callback is never invoked;
  // all errors surface as thrown exceptions from init.
  let sortedEntries: ZipEntry[] = [];
  let objectUrlCache: (string | null)[] = [];
  let imgEl: HTMLImageElement | null = null;
  // 0 is the pre-init sentinel; position returns "0" and canGoNext/canGoPrev return false until init resolves.
  let _currentPage = 0;
  let _pageCount = 0;
  let destroyed = false;

  async function getObjectUrl(index: number): Promise<string> {
    if (!objectUrlCache[index]) {
      const blob = await sortedEntries[index]!.blob();
      objectUrlCache[index] = URL.createObjectURL(blob);
    }
    return objectUrlCache[index] as string;
  }

  function prefetchPage(index: number): void {
    if (index < 0 || index >= _pageCount || objectUrlCache[index] || destroyed) return;
    void getObjectUrl(index).catch(() => {});
  }

  return {
    async init(container: HTMLElement, url: string, initialPosition?: string): Promise<void> {
      const reader = new HTTPRangeReader(url);
      const { entries } = await unzip(reader);

      const imageEntries = Object.keys(entries)
        .filter((path) => IMAGE_EXT.test(path))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .map((path) => entries[path]!);

      if (imageEntries.length === 0) throw new Error("No images found in archive");

      sortedEntries = imageEntries;
      objectUrlCache = new Array(sortedEntries.length).fill(null);
      _pageCount = sortedEntries.length;

      if (destroyed) {
        sortedEntries = [];
        objectUrlCache = [];
        return;
      }

      const startPage = parsePositionPage(initialPosition, _pageCount);
      _currentPage = startPage;

      imgEl = document.createElement("img");
      imgEl.alt = `Page ${startPage}`;
      imgEl.src = await getObjectUrl(startPage - 1);
      container.appendChild(imgEl);

      prefetchPage(startPage);
    },

    async goToPage(page: number): Promise<void> {
      if (page < 1 || page > _pageCount) return;
      if (!imgEl) throw new Error("goToPage called after renderer was destroyed");
      _currentPage = page;
      imgEl.alt = `Page ${page}`;
      imgEl.src = await getObjectUrl(page - 1);
      prefetchPage(page);
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

    destroy(): void {
      destroyed = true;
      for (const url of objectUrlCache) {
        if (url) URL.revokeObjectURL(url);
      }
      sortedEntries = [];
      objectUrlCache = [];
      if (imgEl) {
        imgEl.remove();
        imgEl = null;
      }
    },
  };
}
