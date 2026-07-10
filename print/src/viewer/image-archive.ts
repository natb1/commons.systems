import { unzip } from "unzipit";
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
  // Serializes overlapping goToPage renders: each claims a token synchronously,
  // a later call bumps the counter, and a superseded fetch bails after its await
  // instead of assigning a stale src. Mirrors pdf.ts's renderGen.
  let renderGen = 0;
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

  /** Prefetch the next page after the given 1-based page number. */
  function prefetchNextPage(page: number): void {
    const index = page; // next page after 1-based page N has 0-based index N
    if (index < 0 || index >= _pageCount || pages[index]!.urlPromise || destroyed) return;
    void getObjectUrl(index).catch((err) => {
      if (onError) onError(err);
      else reportError(new Error(`Image prefetch failed for page ${index + 1}`, { cause: err }));
    });
  }

  // Retain object URLs only for a window of pages on each side of the current
  // page. Without this, getObjectUrl accumulates one live object URL (holding a
  // decompressed image blob) per visited page for the whole session — a large
  // archive would grow memory unbounded until teardown.
  const OBJECT_URL_WINDOW = 1;

  /**
   * Revoke and clear cached object URLs for pages outside a window centered on
   * the given 1-based page. Evicted slots re-fetch lazily via getObjectUrl when
   * navigated to again. Only completed slots (resolvedUrl set) are touched, so an
   * in-flight fetch is left alone; the window keeps the current page and the
   * prefetched next page live.
   */
  function evictObjectUrlsOutsideWindow(centerPage: number): void {
    const centerIndex = centerPage - 1;
    for (let i = 0; i < pages.length; i++) {
      if (Math.abs(i - centerIndex) <= OBJECT_URL_WINDOW) continue;
      const slot = pages[i]!;
      if (slot.resolvedUrl) {
        URL.revokeObjectURL(slot.resolvedUrl);
        slot.resolvedUrl = null;
        slot.urlPromise = null;
      }
    }
  }

  return {
    async init(container: HTMLElement, source: string | ArrayBuffer, initialPosition?: string): Promise<void> {
      const { entries } = await unzip(source);

      const imageEntries = Object.keys(entries)
        .filter((path) => IMAGE_EXT.test(path) && !path.startsWith("__MACOSX/"))
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
      const url = await getObjectUrl(startPage - 1);
      if (destroyed) return;
      imgEl.src = url;
      container.appendChild(imgEl);

      prefetchNextPage(startPage);
      evictObjectUrlsOutsideWindow(startPage);

      if (scrollParent) {
        resizeObserver = new ResizeObserver(() => { resetZoomState(); });
        resizeObserver.observe(scrollParent);
      }
    },

    async renderPageInto(page: number, target: HTMLElement): Promise<void> {
      if (page < 1 || page > _pageCount) return;
      // Append the <img> synchronously before the await so a render superseded by
      // render()'s clear+repopulate (innerHTML="") detaches this img — then
      // target.contains(img) is false below and we skip the stale src assignment,
      // preventing a second <img> from stacking in the slot. Mirrors pdf.ts.
      const img = document.createElement("img");
      img.alt = `Page ${page}`;
      target.appendChild(img);
      try {
        const url = await getObjectUrl(page - 1);
        // Supersession: render() cleared the slot with innerHTML="", detaching this
        // img, so target.contains(img) is false — skip the stale src to avoid
        // stacking a second image. Destroyed: tear down the img we appended.
        if (!target.contains(img)) return;
        if (destroyed) { img.remove(); return; }
        img.src = url;
        prefetchNextPage(page);
      } catch (err) {
        // The blob fetch failed — remove the orphaned src-less placeholder so the
        // error path leaves target clean, then rethrow.
        img.remove();
        throw err;
      }
    },

    async goToPage(page: number): Promise<void> {
      if (!imgEl) throw new Error("goToPage called after renderer was destroyed");
      if (page < 1 || page > _pageCount) return;
      // Claim a generation token synchronously. A later goToPage bumps renderGen,
      // marking this fetch stale; the post-await guard then skips assigning a
      // stale src. The synchronous writes below are last-write-wins, so they
      // correctly reflect the latest call. Mirrors pdf.ts's renderPage.
      const gen = ++renderGen;
      resetZoomState();
      _currentPage = page;
      imgEl.alt = `Page ${page}`;
      const url = await getObjectUrl(page - 1);
      if (destroyed || gen !== renderGen) return;
      imgEl.src = url;
      prefetchNextPage(page);
      evictObjectUrlsOutsideWindow(page);
    },

    async goToPosition(position: string): Promise<void> {
      const page = parsePositionPage(position, _pageCount);
      await this.goToPage(page);
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
