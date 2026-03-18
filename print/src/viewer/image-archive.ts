import { unzipSync } from "fflate";
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

export function createImageArchiveRenderer(_onError?: (err: unknown) => void): ContentRenderer {
  // _onError accepted for factory signature consistency with createPdfRenderer. Unlike createPdfRenderer,
  // this renderer's ResizeObserver only resets zoom state (no re-rendering), so the callback is never
  // invoked; all errors surface as thrown exceptions from the renderer's methods.
  let fileData: Uint8Array[] = [];
  let objectUrlCache: (string | null)[] = [];
  let imgEl: HTMLImageElement | null = null;
  let containerEl: HTMLElement | null = null;
  let scrollParent: HTMLElement | null = null;
  let resizeObserver: ResizeObserver | null = null;
  // 0 is the pre-init sentinel; position returns "0" and canGoNext/canGoPrev return false until init resolves.
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
      scrollParent = container.parentElement;
      imgEl = document.createElement("img");
      imgEl.alt = `Page ${startPage}`;
      imgEl.src = getObjectUrl(startPage - 1);
      container.appendChild(imgEl);

      resizeObserver = new ResizeObserver(() => { resetZoomState(); });
      resizeObserver.observe(container);
    },

    async goToPage(page: number): Promise<void> {
      if (page < 1 || page > _pageCount) return;
      if (!imgEl) throw new Error("goToPage called after renderer was destroyed");
      resetZoomState();
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
      for (const url of objectUrlCache) {
        if (url) URL.revokeObjectURL(url);
      }
      fileData = [];
      objectUrlCache = [];
      if (imgEl) {
        imgEl.remove();
        imgEl = null;
      }
      containerEl = null;
      scrollParent = null;
    },
  };
}
