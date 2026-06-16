import * as pdfjsLib from "pdfjs-dist";
import { TextLayer } from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from "pdfjs-dist";
import type { PageViewport } from "pdfjs-dist/types/src/display/display_utils.js";
import type { ContentRenderer, OutlineEntry, SearchResult } from "./types.js";
import { parsePositionPage } from "./types.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// ---------------------------------------------------------------------------
// Pure search helpers — no DOM, no pdf.js calls. Exported for unit tests.
// ---------------------------------------------------------------------------

/**
 * Reconstruct a page's plain text from a pdf.js getTextContent() items array.
 *
 * LOAD-BEARING: the empty-separator join is intentional and must not be
 * changed. Later units map highlight offsets back to text-layer spans using
 * these exact byte offsets. Any separator (space, newline, etc.) would shift
 * every offset and break highlight placement.
 */
export function buildPageText(items: ReadonlyArray<{ str?: string }>): string {
  return items.map((i) => ("str" in i ? i.str : "")).join("");
}

/**
 * Find all non-overlapping occurrences of `query` in `pageText` (case-insensitive).
 * Returns an array of { offset, length } pairs. Advances past each match to
 * avoid overlap. `query` is guaranteed non-empty by the caller.
 */
export function findMatches(
  pageText: string,
  query: string,
): { offset: number; length: number }[] {
  const haystack = pageText.toLowerCase();
  const needle = query.toLowerCase();
  const results: { offset: number; length: number }[] = [];
  let from = 0;
  while (from < haystack.length) {
    const offset = haystack.indexOf(needle, from);
    if (offset === -1) break;
    results.push({ offset, length: query.length });
    from = offset + query.length;
  }
  return results;
}

/**
 * Build a text snippet around a match at [offset, offset+length) in pageText.
 * Adds an ellipsis character (…) when the window is clipped at either end,
 * and adjusts matchStart so it correctly points into the returned snippet.
 * Preserves the SearchResult invariant: matchStart + matchLength <= snippet.length.
 */
export function buildSnippet(
  pageText: string,
  offset: number,
  length: number,
): { snippet: string; matchStart: number; matchLength: number } {
  const windowStart = Math.max(0, offset - 35);
  const windowEnd = Math.min(pageText.length, offset + length + 35);
  let snippet = pageText.slice(windowStart, windowEnd);
  let matchStart = offset - windowStart;
  if (windowStart > 0) {
    snippet = "…" + snippet;
    matchStart += 1;
  }
  if (windowEnd < pageText.length) {
    snippet = snippet + "…";
  }
  return { snippet, matchStart, matchLength: length };
}

/**
 * Encode a match location as an opaque string token for use in SearchResult.location.
 * Format: "page:offset:length" (all base-10 integers).
 */
export function encodeLocation(page: number, offset: number, length: number): string {
  return `${page}:${offset}:${length}`;
}

/**
 * Decode a location token produced by encodeLocation.
 * Returns null when the token is malformed (wrong number of parts or any part is NaN).
 */
export function decodeLocation(
  location: string,
): { page: number; offset: number; length: number } | null {
  const parts = location.split(":");
  if (parts.length !== 3) return null;
  const page = parseInt(parts[0], 10);
  const offset = parseInt(parts[1], 10);
  const length = parseInt(parts[2], 10);
  if (Number.isNaN(page) || Number.isNaN(offset) || Number.isNaN(length)) return null;
  return { page, offset, length };
}

/**
 * Map a [offset, offset+length) range — expressed in the coordinate space of
 * `textContentItemsStr.join("")` — onto per-item (per-div) local segments.
 *
 * LOAD-BEARING: the concatenation uses an EMPTY join, matching buildPageText's
 * empty-separator rule. The cumulative character offset summed across
 * `textContentItemsStr` is the same coordinate space as the offset stored in a
 * SearchResult.location. Adding any separator here would shift every segment.
 *
 * Returns one segment per item that overlaps the range, in item order. Each
 * segment's localStart/localEnd are offsets within that item's own string.
 * Empty-string items contribute zero width and are skipped. Walking stops once
 * the cumulative offset passes the end of the range.
 */
export function offsetToDivRanges(
  textContentItemsStr: readonly string[],
  offset: number,
  length: number,
): { divIndex: number; localStart: number; localEnd: number }[] {
  const segments: { divIndex: number; localStart: number; localEnd: number }[] = [];
  const rangeStart = offset;
  const rangeEnd = offset + length;
  let cumulative = 0;
  for (let k = 0; k < textContentItemsStr.length; k++) {
    const itemStart = cumulative;
    const itemEnd = cumulative + textContentItemsStr[k].length;
    cumulative = itemEnd;
    // Intersect [itemStart, itemEnd) with [rangeStart, rangeEnd).
    const interStart = Math.max(itemStart, rangeStart);
    const interEnd = Math.min(itemEnd, rangeEnd);
    if (interStart < interEnd) {
      segments.push({
        divIndex: k,
        localStart: interStart - itemStart,
        localEnd: interEnd - itemStart,
      });
    }
    if (cumulative >= rangeEnd) break;
  }
  return segments;
}

export function createPdfRenderer(onError?: (err: unknown) => void): ContentRenderer {
  let pdfDoc: PDFDocumentProxy | null = null;
  let _currentPage = 0;
  let _pageCount = 0;
  let canvas: HTMLCanvasElement | null = null;
  let container: HTMLElement | null = null;
  let pageWrapper: HTMLDivElement | null = null;
  let textLayerDiv: HTMLDivElement | null = null;
  let activeTextLayer: TextLayer | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  let renderTask: RenderTask | null = null;
  let renderGen = 0;
  let spreadGen = 0;
  let destroyed = false;
  // Lazily-populated cache of page plain-text strings. Keyed by 1-based page
  // number. Populated on first search pass and reused across debounced
  // keystrokes. Unit 4 clears this in destroy().
  const pageTextCache = new Map<number, string>();
  // A pending search-result highlight to apply once its page finishes
  // rendering. Left set across renders so the debounced ResizeObserver
  // re-render (renderPage(_currentPage)) re-applies it after a resize. Cleared
  // by the public manual-nav methods so a stale highlight never reappears.
  let pendingHighlight: { page: number; offset: number; length: number } | null = null;
  // Records the original text content of every div mutated by the most recent
  // applyHighlight call so unwrapHighlights can restore the text layer to its
  // pristine state. Invariant: after applyHighlight returns, this array holds
  // exactly one entry per currently-highlighted div (the divs from the most
  // recent call only — earlier entries are cleared by the unwrapHighlights()
  // call at the start of applyHighlight).
  const highlightRestores: { div: HTMLElement; originalText: string }[] = [];
  interface SpreadPage { renderTask: RenderTask; textLayer: TextLayer | null; }
  const spreadPages: SpreadPage[] = [];
  const outlinePageMap = new WeakMap<OutlineEntry, number>();

  type PdfOutlineItem = {
    title: string;
    dest: string | Array<unknown> | null;
    items: PdfOutlineItem[];
  };

  async function resolveOutlineItems(items: PdfOutlineItem[]): Promise<OutlineEntry[]> {
    const entries: OutlineEntry[] = [];
    for (const item of items) {
      let page: number | null = null;
      if (item.dest) {
        try {
          let destArray: Array<unknown> | null = null;
          if (typeof item.dest === "string") {
            destArray = await pdfDoc!.getDestination(item.dest);
          } else {
            destArray = item.dest;
          }
          if (destArray && destArray.length > 0) {
            const pageIndex = await pdfDoc!.getPageIndex(destArray[0] as { num: number; gen: number });
            page = pageIndex + 1; // 1-based
          }
        } catch (err) {
          reportError(new Error(`Failed to resolve outline destination for "${item.title}"`, { cause: err }));
        }
      }
      const children = item.items.length > 0 ? await resolveOutlineItems(item.items) : [];
      const entry: OutlineEntry = { title: item.title, children };
      if (page !== null) {
        outlinePageMap.set(entry, page);
      }
      entries.push(entry);
    }
    return entries;
  }

  interface CanvasRenderResult {
    task: RenderTask;
    cssViewport: PageViewport;
    page: PDFPageProxy;
  }

  function createPageWrapper(): { wrapper: HTMLDivElement; canvas: HTMLCanvasElement; textLayerDiv: HTMLDivElement } {
    const wrapper = document.createElement("div");
    wrapper.className = "pdf-page-wrapper";
    const canvas = document.createElement("canvas");
    wrapper.appendChild(canvas);
    const textLayerDiv = document.createElement("div");
    textLayerDiv.className = "textLayer";
    wrapper.appendChild(textLayerDiv);
    return { wrapper, canvas, textLayerDiv };
  }

  async function renderPageToCanvas(
    pageNum: number,
    targetCanvas: HTMLCanvasElement,
    containerRect: DOMRect,
    wrapper?: HTMLDivElement,
    shouldAbort?: () => boolean,
    onTaskStart?: (task: RenderTask) => void,
  ): Promise<CanvasRenderResult | null> {
    const page = await pdfDoc!.getPage(pageNum);
    if (destroyed) return null;
    // Bail before any canvas mutation or page.render() if a newer generation has
    // superseded this render. renderGen is bumped synchronously, so an older
    // render suspended in getPage above sees the bump and returns here — keeping
    // overlapping renders off the shared canvas. Must stay synchronous through
    // page.render() below (no await) so check-then-render is atomic.
    if (shouldAbort?.()) return null;

    const baseViewport = page.getViewport({ scale: 1 });
    const scaleX = containerRect.width / baseViewport.width;
    const scaleY = containerRect.height / baseViewport.height;
    const cssScale = Math.min(scaleX, scaleY);
    // Two viewports: cssViewport positions text layer spans at CSS scale,
    // while the canvas renders at devicePixelRatio for sharp output.
    const cssViewport = page.getViewport({ scale: cssScale });
    const pixelScale = cssScale * window.devicePixelRatio;
    const viewport = page.getViewport({ scale: pixelScale });

    targetCanvas.width = viewport.width;
    targetCanvas.height = viewport.height;
    targetCanvas.style.width = `${cssViewport.width}px`;
    targetCanvas.style.height = `${cssViewport.height}px`;

    if (wrapper) {
      wrapper.style.width = `${cssViewport.width}px`;
      wrapper.style.height = `${cssViewport.height}px`;
    }

    const ctx = targetCanvas.getContext("2d");
    if (!ctx) throw new Error("Could not acquire 2D canvas context");
    const task = page.render({ canvasContext: ctx, viewport });
    // Publish the RenderTask synchronously (page.render returns it before its
    // .promise resolves) so a superseding renderPage's top-of-function cancel
    // can abort this in-flight render and free the shared canvas.
    onTaskStart?.(task);

    try {
      await task.promise;
    } catch (e) {
      if ((e as Error).name !== "RenderingCancelledException") throw e;
    }
    return { task, cssViewport, page };
  }

  async function renderTextLayer(
    page: PDFPageProxy,
    cssViewport: PageViewport,
    targetDiv: HTMLDivElement,
  ): Promise<TextLayer | null> {
    if (destroyed) return null;
    const textContent = await page.getTextContent();
    if (destroyed) return null;

    targetDiv.replaceChildren();
    const tl = new TextLayer({
      textContentSource: textContent,
      container: targetDiv,
      viewport: cssViewport,
    });
    try {
      await tl.render();
    } catch (e) {
      // A superseding render cancelled this text layer — benign, mirrors the
      // canvas RenderingCancelledException handling in renderPageToCanvas.
      if ((e as Error).name !== "AbortException") throw e;
      return null;
    }
    return tl;
  }

  /**
   * Wrap the text covered by `h` in <span class="search-highlight active">
   * elements inside the rendered text layer, then scroll the first highlight
   * into view. The text layer's textContentItemsStr/textDivs are index-aligned;
   * offsetToDivRanges maps the stored offset/length onto per-div local segments
   * using the same empty-join coordinate space as buildPageText.
   *
   * Children are rebuilt with createTextNode/createElement (never innerHTML) so
   * the text layer's transparent-text CSS keeps applying.
   *
   * Calls unwrapHighlights() first so it is idempotent: any prior highlight
   * (including detached divs from a superseded render) is restored and
   * highlightRestores is cleared before the new entries are recorded. After
   * this function returns, highlightRestores holds exactly one entry per
   * currently-highlighted div.
   */
  function applyHighlight(tl: TextLayer, h: { offset: number; length: number }): void {
    unwrapHighlights();
    const itemsStr = tl.textContentItemsStr;
    const divs = tl.textDivs;
    const segments = offsetToDivRanges(itemsStr, h.offset, h.length);
    let firstSpan: HTMLSpanElement | null = null;
    for (const seg of segments) {
      const div = divs[seg.divIndex];
      if (!div) continue;
      const original = div.textContent ?? "";
      highlightRestores.push({ div, originalText: original });
      const beforeNode = document.createTextNode(original.slice(0, seg.localStart));
      const span = document.createElement("span");
      span.className = "search-highlight active";
      span.appendChild(document.createTextNode(original.slice(seg.localStart, seg.localEnd)));
      const afterNode = document.createTextNode(original.slice(seg.localEnd));
      div.replaceChildren(beforeNode, span, afterNode);
      if (!firstSpan) firstSpan = span;
    }
    if (firstSpan) firstSpan.scrollIntoView({ block: "nearest" });
  }

  /**
   * Restore every div mutated by applyHighlight to its original text content,
   * then empty the restore log. (Unit 4 wires this into clearSearch/destroy.)
   */
  function unwrapHighlights(): void {
    for (const { div, originalText } of highlightRestores) {
      div.textContent = originalText;
    }
    highlightRestores.length = 0;
  }

  async function renderPage(pageNum: number): Promise<void> {
    if (!pdfDoc || !canvas || !container) return;

    // Each render claims a generation token. A later renderPage call bumps the
    // counter, marking any in-flight render stale; the stale render bails after
    // its next await instead of clobbering the winner or surfacing a spurious
    // "Navigation failed". This serializes concurrent renderPage calls — e.g. a
    // ResizeObserver re-render racing a navigation tap.
    const gen = ++renderGen;

    if (renderTask) {
      renderTask.cancel();
      renderTask = null;
    }
    if (activeTextLayer) {
      activeTextLayer.cancel();
      activeTextLayer = null;
    }

    const containerRect = container.getBoundingClientRect();
    if (containerRect.width === 0 || containerRect.height === 0) return;

    // Clear the previous page's text-layer spans up-front, synchronously before
    // the first await. renderTextLayer would clear them too, but a render
    // superseded between the canvas and text-layer stages (the gen check below)
    // returns before reaching it — leaving the previous page's selectable text
    // in the DOM until the winning render completes. Clearing here guarantees a
    // superseded render never surfaces stale text.
    if (textLayerDiv) textLayerDiv.replaceChildren();

    const result = await renderPageToCanvas(
      pageNum,
      canvas,
      containerRect,
      pageWrapper ?? undefined,
      () => gen !== renderGen,
      (task) => { renderTask = task; },
    );
    if (!result) return;
    if (gen !== renderGen) {
      result.task.cancel();
      // Only clear the slot if it still holds our task; a superseding render
      // may have already published its own in-flight task via onTaskStart, and
      // nulling that would let a later render/destroy skip the cancel and start
      // a second page.render on the shared canvas.
      if (renderTask === result.task) renderTask = null;
      return;
    }

    renderTask = result.task;
    if (textLayerDiv) {
      const tl = await renderTextLayer(result.page, result.cssViewport, textLayerDiv);
      if (gen !== renderGen) {
        tl?.cancel();
        return;
      }
      activeTextLayer = tl;
      // Reaching here means this render won the gen race (checked just above,
      // no await since). Apply a pending search highlight for this page. Kept
      // set (not cleared) so a ResizeObserver re-render re-applies it.
      if (pendingHighlight && pendingHighlight.page === pageNum && activeTextLayer) {
        applyHighlight(activeTextLayer, pendingHighlight);
      }
    }
  }

  function cancelSpreadRenderTasks(): void {
    // Bump the spread generation up-front so any renderPageInto suspended in an
    // await sees the change and bails before pushing into the spreadPages array
    // we're about to clear — keeping a superseded render off the cleared list.
    spreadGen++;
    for (const sp of spreadPages) {
      sp.renderTask.cancel();
      if (sp.textLayer) sp.textLayer.cancel();
    }
    spreadPages.length = 0;
  }

  async function renderPageInto(pageNum: number, target: HTMLElement): Promise<void> {
    if (!pdfDoc) return;
    if (pageNum < 1 || pageNum > _pageCount) return;
    const targetRect = target.getBoundingClientRect();
    if (targetRect.width === 0 || targetRect.height === 0) return;

    const gen = spreadGen;
    const { wrapper, canvas: c, textLayerDiv: tlDiv } = createPageWrapper();
    target.appendChild(wrapper);

    const result = await renderPageToCanvas(pageNum, c, targetRect, wrapper, () => gen !== spreadGen);
    if (!result) return;
    if (gen !== spreadGen) {
      // The canvas render already completed; only the orphaned wrapper needs cleanup.
      wrapper.remove();
      return;
    }

    const tl = await renderTextLayer(result.page, result.cssViewport, tlDiv);
    if (gen !== spreadGen) {
      // The canvas render already completed; cancel only the in-flight text layer
      // and remove the orphaned wrapper.
      tl?.cancel();
      wrapper.remove();
      return;
    }
    spreadPages.push({ renderTask: result.task, textLayer: tl });
    if (pendingHighlight && pendingHighlight.page === pageNum && tl) {
      applyHighlight(tl, pendingHighlight);
    }
  }

  return {
    async init(containerEl: HTMLElement, source: string | ArrayBuffer, initialPosition?: string): Promise<void> {
      container = containerEl;
      const pw = createPageWrapper();
      pageWrapper = pw.wrapper;
      canvas = pw.canvas;
      textLayerDiv = pw.textLayerDiv;
      containerEl.appendChild(pageWrapper);

      const loadingTask = pdfjsLib.getDocument(source);
      const doc = await loadingTask.promise;
      if (destroyed) {
        doc.destroy();
        return;
      }
      pdfDoc = doc;
      _pageCount = pdfDoc.numPages;

      const startPage = parsePositionPage(initialPosition, _pageCount);
      _currentPage = startPage;

      await renderPage(startPage);
      if (destroyed) return;

      resizeObserver = new ResizeObserver(() => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          resizeTimer = null;
          renderPage(_currentPage).catch(onError ?? ((err: unknown) => {
            reportError(new Error("PDF render failed during resize", { cause: err }));
          }));
        }, 150);
      });
      resizeObserver.observe(container);
    },

    async goToPage(page: number): Promise<void> {
      // Manual navigation discards any active search highlight so a stale
      // highlight never reappears on the new page.
      pendingHighlight = null;
      unwrapHighlights();
      if (page < 1 || page > _pageCount) return;
      _currentPage = page;
      await renderPage(page);
    },

    async goToPosition(position: string): Promise<void> {
      const page = parsePositionPage(position, _pageCount);
      _currentPage = page;
      await renderPage(page);
    },

    async next(): Promise<void> {
      pendingHighlight = null;
      unwrapHighlights();
      if (_currentPage < _pageCount) {
        _currentPage++;
        await renderPage(_currentPage);
      }
    },

    async prev(): Promise<void> {
      pendingHighlight = null;
      unwrapHighlights();
      if (_currentPage > 1) {
        _currentPage--;
        await renderPage(_currentPage);
      }
    },

    renderPageInto(page: number, target: HTMLElement): Promise<void> {
      cancelSpreadRenderTasks();
      return renderPageInto(page, target);
    },

    get pageCount() {
      return _pageCount;
    },
    get currentPage() {
      return _currentPage;
    },
    get canGoNext() { return _currentPage < _pageCount; },
    get canGoPrev() { return _currentPage > 1; },
    get position() {
      return String(_currentPage);
    },
    get positionLabel() {
      return `Page ${_currentPage} / ${_pageCount}`;
    },

    // No per-call generation/cancellation guard needed here: search.ts already
    // discards stale results via `trimmed !== currentQuery` after each await.
    async search(query: string): Promise<SearchResult[]> {
      const trimmed = query.trim();
      if (!trimmed) return [];

      const results: SearchResult[] = [];

      // Cap total results at 200 to avoid an unbounded list when the query is
      // very short and matches thousands of positions across a long document.
      const MAX_RESULTS = 200;

      for (let i = 1; i <= _pageCount; i++) {
        // Lazily populate the page-text cache. Re-fetching text for every
        // debounced keystroke would be wasteful; cache across search calls.
        let pageText = pageTextCache.get(i);
        if (pageText === undefined) {
          const page = await pdfDoc!.getPage(i);
          if (destroyed) return results;
          const tc = await page.getTextContent();
          if (destroyed) return results;
          pageText = buildPageText(tc.items as { str?: string }[]);
          pageTextCache.set(i, pageText);
        }

        const matches = findMatches(pageText, trimmed);
        for (const { offset, length } of matches) {
          const location = encodeLocation(i, offset, length);
          const label = "Page " + i;
          const { snippet, matchStart, matchLength } = buildSnippet(pageText, offset, length);
          results.push({ location, label, snippet, matchStart, matchLength });
          if (results.length >= MAX_RESULTS) break;
        }
        if (results.length >= MAX_RESULTS) break;
      }

      return results;
    },

    async getOutline(): Promise<OutlineEntry[]> {
      if (!pdfDoc) return [];
      const outline = await pdfDoc.getOutline();
      if (!outline || outline.length === 0) return [];
      return resolveOutlineItems(outline as PdfOutlineItem[]);
    },

    async goToOutlineEntry(entry: OutlineEntry): Promise<void> {
      const page = outlinePageMap.get(entry);
      if (page === undefined) return;
      _currentPage = page;
      await renderPage(page);
    },

    async goToResult(result: SearchResult): Promise<void> {
      const decoded = decodeLocation(result.location);
      if (!decoded) return;
      // Drain stale highlightRestores entries — they reference now-detached
      // nodes from the previous result's text layer — before arming the new
      // highlight, mirroring goToPage/next/prev. Without this the array grows
      // unboundedly across result clicks, leaking detached DOM node references.
      unwrapHighlights();
      _currentPage = decoded.page;
      // Arm the highlight before rendering; renderPage applies it as its final
      // gen-guarded step. Call the internal renderPage directly (like
      // goToOutlineEntry) — the public goToPage would clear pendingHighlight.
      pendingHighlight = { page: decoded.page, offset: decoded.offset, length: decoded.length };
      await renderPage(decoded.page);
    },

    // Called by search.ts when the user clears the query WITHOUT navigating
    // (~lines 89, 103). A query clear triggers no re-render, so the highlight
    // spans left by the last applyHighlight call would persist in the DOM.
    // We must actively restore the divs here; we cannot rely on the next
    // renderTextLayer's replaceChildren to clean them up.
    clearSearch(): void {
      unwrapHighlights();
      pendingHighlight = null;
    },

    destroy(): void {
      destroyed = true;
      if (resizeTimer) {
        clearTimeout(resizeTimer);
        resizeTimer = null;
      }
      if (renderTask) {
        renderTask.cancel();
        renderTask = null;
      }
      if (activeTextLayer) {
        activeTextLayer.cancel();
        activeTextLayer = null;
      }
      cancelSpreadRenderTasks();
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      if (pdfDoc) {
        pdfDoc.destroy();
        pdfDoc = null;
      }
      if (pageWrapper) {
        pageWrapper.remove();
        pageWrapper = null;
      }
      canvas = null;
      textLayerDiv = null;
      container = null;
      // Tear down search state: restore any highlight-mutated divs, disarm the
      // pending highlight, and release the page-text cache.
      unwrapHighlights();
      pendingHighlight = null;
      pageTextCache.clear();
    },
  };
}
