import * as pdfjsLib from "pdfjs-dist";
import { TextLayer } from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from "pdfjs-dist";
import type { PageViewport } from "pdfjs-dist/types/src/display/display_utils.js";
import type { ContentRenderer, OutlineEntry } from "./types.js";
import { parsePositionPage } from "./types.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

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
  let destroyed = false;
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
  ): Promise<CanvasRenderResult | null> {
    const page = await pdfDoc!.getPage(pageNum);
    if (destroyed) return null;

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
    await tl.render();
    return tl;
  }

  async function renderPage(pageNum: number): Promise<void> {
    if (!pdfDoc || !canvas || !container) return;

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

    const result = await renderPageToCanvas(pageNum, canvas, containerRect, pageWrapper ?? undefined);
    if (!result) return;

    renderTask = result.task;
    if (textLayerDiv) {
      activeTextLayer = await renderTextLayer(result.page, result.cssViewport, textLayerDiv);
    }
  }

  function cancelSpreadRenderTasks(): void {
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

    const { wrapper, canvas: c, textLayerDiv: tlDiv } = createPageWrapper();
    target.appendChild(wrapper);

    const result = await renderPageToCanvas(pageNum, c, targetRect, wrapper);
    if (!result) return;

    const tl = await renderTextLayer(result.page, result.cssViewport, tlDiv);
    spreadPages.push({ renderTask: result.task, textLayer: tl });
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
      if (page < 1 || page > _pageCount) return;
      _currentPage = page;
      await renderPage(page);
    },

    async next(): Promise<void> {
      if (_currentPage < _pageCount) {
        _currentPage++;
        await renderPage(_currentPage);
      }
    },

    async prev(): Promise<void> {
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
    },
  };
}
