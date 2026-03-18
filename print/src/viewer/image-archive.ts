import { unzip, HTTPRangeReader } from "unzipit";
import type { ZipEntry } from "unzipit";
import type { ContentRenderer } from "./types.js";
import { parsePositionPage } from "./types.js";

const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;
const ZOOM_FACTOR = 1.2;

function applyZoom(container: HTMLElement, img: HTMLImageElement, level: number, fittedWidth: number, fittedHeight: number): void {
  if (level === 0) {
    container.classList.remove("zoomed");
    img.style.width = "";
    img.style.height = "";
  } else {
    container.classList.add("zoomed");
    const scale = ZOOM_FACTOR ** level;
    img.style.width = `${fittedWidth * scale}px`;
    img.style.height = `${fittedHeight * scale}px`;
  }
}

type PageSlot = {
  entry: ZipEntry;
  urlPromise: Promise<string> | null;
  resolvedUrl: string | null;
};

export function createImageArchiveRenderer(onError?: (err: unknown) => void): ContentRenderer {
  // onError used for background prefetch errors that cannot propagate as exceptions.
  // init and goToPage propagate errors via rejection; zoom operations throw synchronously.
  let pages: PageSlot[] = [];
  let imgEl: HTMLImageElement | null = null;
  let containerEl: HTMLElement | null = null;
  let scrollParent: HTMLElement | null = null;
  let resizeObserver: ResizeObserver | null = null;
  // 0 is the sentinel for uninitialized/destroyed state; position returns "0" and canGoNext/canGoPrev return false.
  let _currentPage = 0;
  let _pageCount = 0;
  let destroyed = false;
  let _onZoomChange: (() => void) | undefined;
  let _zoomLevel = 0; // 0 = fit-to-view, 1+ = zoomed (scale = ZOOM_FACTOR ** level, relative to fitted size)
  // Fit-to-view display size, captured on first zoomIn as zoom scale base. Zero until first zoom; zoomIn bails out if either dimension is zero.
  let _fittedWidth = 0;
  let _fittedHeight = 0;

  function clearZoomLayout(): void {
    _fittedWidth = 0;
    _fittedHeight = 0;
    applyZoom(containerEl!, imgEl!, 0, 0, 0);
    if (scrollParent) {
      scrollParent.scrollTop = 0;
      scrollParent.scrollLeft = 0;
    }
  }

  function resetZoomState(): void {
    if (!containerEl || !imgEl || _zoomLevel === 0) return;
    _zoomLevel = 0;
    clearZoomLayout();
    _onZoomChange?.();
  }

  async function getObjectUrl(index: number): Promise<string> {
    const slot = pages[index]!;
    if (!slot.urlPromise) {
      slot.urlPromise = slot.entry.blob()
        .then(blob => {
          if (destroyed) return "";
          const url = URL.createObjectURL(blob);
          slot.resolvedUrl = url;
          return url;
        })
        .catch(err => {
          slot.urlPromise = null;
          throw err;
        });
    }
    return slot.urlPromise!;
  }

  // Prefetches the blob URL for the page at the given 0-based index, if not already cached.
  function prefetchPage(index: number): void {
    if (index < 0 || index >= _pageCount || pages[index]!.urlPromise || destroyed) return;
    void getObjectUrl(index).catch((err) => {
      if (onError) onError(err);
      else console.warn("Image prefetch failed for page", index + 1, err);
    });
  }

  return {
    async init(container: HTMLElement, url: string, initialPosition?: string): Promise<void> {
      let entries: Record<string, ZipEntry>;
      try {
        const reader = new HTTPRangeReader(url);
        ({ entries } = await unzip(reader));
      } catch (err) {
        console.warn("Range-based archive loading failed, falling back to full download:", err);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch archive: ${res.status}`);
        const buf = await res.arrayBuffer();
        try {
          ({ entries } = await unzip(buf));
        } catch (unzipErr) {
          throw new Error(
            `Failed to decompress archive from ${url} (${buf.byteLength} bytes)`,
            { cause: unzipErr },
          );
        }
      }

      const imageEntries = Object.keys(entries)
        .filter((path) => IMAGE_EXT.test(path))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .map((path) => entries[path]!);

      if (imageEntries.length === 0) throw new Error("No images found in archive");

      pages = imageEntries.map(entry => ({ entry, urlPromise: null, resolvedUrl: null }));
      _pageCount = pages.length;

      if (destroyed) {
        pages = [];
        return;
      }

      const startPage = parsePositionPage(initialPosition, _pageCount);
      _currentPage = startPage;

      containerEl = container;
      scrollParent = container.parentElement;
      imgEl = document.createElement("img");
      imgEl.alt = `Page ${startPage}`;
      imgEl.src = await getObjectUrl(startPage - 1);
      container.appendChild(imgEl);

      prefetchPage(startPage);

      if (scrollParent) {
        resizeObserver = new ResizeObserver(() => { resetZoomState(); });
        resizeObserver.observe(scrollParent);
      }
    },

    async goToPage(page: number): Promise<void> {
      if (!imgEl) throw new Error("goToPage called after renderer was destroyed");
      if (page < 1 || page > _pageCount) return;
      resetZoomState();
      _currentPage = page;
      imgEl.alt = `Page ${page}`;
      const url = await getObjectUrl(page - 1);
      if (destroyed) return;
      imgEl.src = url;
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

    zoomIn(): void {
      if (!containerEl || !imgEl) throw new Error("zoomIn called on uninitialized or destroyed renderer");
      if (_zoomLevel === 0) {
        _fittedWidth = imgEl.clientWidth;
        _fittedHeight = imgEl.clientHeight;
        if (_fittedWidth === 0 || _fittedHeight === 0) return;
      }
      _zoomLevel++;
      applyZoom(containerEl, imgEl, _zoomLevel, _fittedWidth, _fittedHeight);
    },

    zoomOut(): void {
      if (!containerEl || !imgEl) throw new Error("zoomOut called on uninitialized or destroyed renderer");
      if (_zoomLevel <= 0) return;
      _zoomLevel--;
      if (_zoomLevel === 0) {
        clearZoomLayout();
      } else {
        applyZoom(containerEl, imgEl, _zoomLevel, _fittedWidth, _fittedHeight);
      }
    },

    resetZoom(): void {
      if (!containerEl || !imgEl) throw new Error("resetZoom called on uninitialized or destroyed renderer");
      resetZoomState();
    },

    get isZoomed(): boolean {
      return _zoomLevel > 0;
    },

    get onZoomChange() { return _onZoomChange; },
    set onZoomChange(cb: (() => void) | undefined) { _onZoomChange = cb; },

    destroy(): void {
      destroyed = true;
      resizeObserver?.disconnect();
      resizeObserver = null;
      for (const page of pages) {
        if (page.resolvedUrl) URL.revokeObjectURL(page.resolvedUrl);
      }
      pages = [];
      _pageCount = 0;
      if (imgEl) {
        imgEl.remove();
        imgEl = null;
      }
      containerEl = null;
      scrollParent = null;
    },
  };
}
