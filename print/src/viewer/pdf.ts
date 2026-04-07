import * as pdfjsLib from "pdfjs-dist";
import { TextLayer } from "pdfjs-dist";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import type { PageViewport } from "pdfjs-dist/types/src/display/display_utils.js";
import type { ContentRenderer } from "./types.js";
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
  const spreadRenderTasks: RenderTask[] = [];
  const spreadTextLayers: TextLayer[] = [];

  interface CanvasRenderResult {
    task: RenderTask | null;
    cssViewport: PageViewport | null;
  }

  async function renderPageToCanvas(
    pageNum: number,
    targetCanvas: HTMLCanvasElement,
    containerRect: DOMRect,
  ): Promise<CanvasRenderResult> {
    const page = await pdfDoc!.getPage(pageNum);
    if (destroyed) return { task: null, cssViewport: null };

    const baseViewport = page.getViewport({ scale: 1 });
    const scaleX = containerRect.width / baseViewport.width;
    const scaleY = containerRect.height / baseViewport.height;
    const cssScale = Math.min(scaleX, scaleY);
    const cssViewport = page.getViewport({ scale: cssScale });
    const pixelScale = cssScale * window.devicePixelRatio;
    const viewport = page.getViewport({ scale: pixelScale });

    targetCanvas.width = viewport.width;
    targetCanvas.height = viewport.height;
    targetCanvas.style.width = `${cssViewport.width}px`;
    targetCanvas.style.height = `${cssViewport.height}px`;

    const ctx = targetCanvas.getContext("2d");
    if (!ctx) throw new Error("Could not acquire 2D canvas context");
    const task = page.render({ canvasContext: ctx, viewport });

    try {
      await task.promise;
    } catch (e) {
      if ((e as Error).name !== "RenderingCancelledException") throw e;
    }
    return { task, cssViewport };
  }

  async function renderTextLayer(
    pageNum: number,
    cssViewport: PageViewport,
    targetDiv: HTMLDivElement,
  ): Promise<TextLayer | null> {
    const page = await pdfDoc!.getPage(pageNum);
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

    const { task, cssViewport } = await renderPageToCanvas(pageNum, canvas, containerRect);
    if (task) renderTask = task;

    if (cssViewport && pageWrapper && textLayerDiv) {
      pageWrapper.style.width = canvas.style.width;
      pageWrapper.style.height = canvas.style.height;
      activeTextLayer = await renderTextLayer(pageNum, cssViewport, textLayerDiv);
    }
  }

  function cancelSpreadRenderTasks(): void {
    for (const task of spreadRenderTasks) task.cancel();
    spreadRenderTasks.length = 0;
    for (const tl of spreadTextLayers) tl.cancel();
    spreadTextLayers.length = 0;
  }

  async function renderPageInto(pageNum: number, target: HTMLElement): Promise<void> {
    if (!pdfDoc) return;
    if (pageNum < 1 || pageNum > _pageCount) return;
    const targetRect = target.getBoundingClientRect();
    if (targetRect.width === 0 || targetRect.height === 0) return;

    const wrapper = document.createElement("div");
    wrapper.className = "pdf-page-wrapper";
    const c = document.createElement("canvas");
    wrapper.appendChild(c);
    const tlDiv = document.createElement("div");
    tlDiv.className = "textLayer";
    wrapper.appendChild(tlDiv);
    target.appendChild(wrapper);

    const { task, cssViewport } = await renderPageToCanvas(pageNum, c, targetRect);
    if (task) spreadRenderTasks.push(task);

    if (cssViewport) {
      wrapper.style.width = c.style.width;
      wrapper.style.height = c.style.height;
      const tl = await renderTextLayer(pageNum, cssViewport, tlDiv);
      if (tl) spreadTextLayers.push(tl);
    }
  }

  return {
    async init(containerEl: HTMLElement, source: string | ArrayBuffer, initialPosition?: string): Promise<void> {
      container = containerEl;
      pageWrapper = document.createElement("div");
      pageWrapper.className = "pdf-page-wrapper";
      canvas = document.createElement("canvas");
      pageWrapper.appendChild(canvas);
      textLayerDiv = document.createElement("div");
      textLayerDiv.className = "textLayer";
      pageWrapper.appendChild(textLayerDiv);
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
