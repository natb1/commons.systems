import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import type { ContentRenderer } from "./types.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export function createPdfRenderer(): ContentRenderer {
  let pdfDoc: PDFDocumentProxy | null = null;
  let _currentPage = 0;
  let _pageCount = 0;
  let canvas: HTMLCanvasElement | null = null;
  let container: HTMLElement | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  let renderTask: RenderTask | null = null;
  let destroyed = false;

  async function renderPage(pageNum: number): Promise<void> {
    if (!pdfDoc || !canvas || !container) return;

    if (renderTask) {
      renderTask.cancel();
      renderTask = null;
    }

    const page = await pdfDoc.getPage(pageNum);
    const containerRect = container.getBoundingClientRect();
    if (containerRect.width === 0 || containerRect.height === 0) return;

    // Scale to fit container; render at devicePixelRatio for sharp text.
    const baseViewport = page.getViewport({ scale: 1 });
    const scaleX = containerRect.width / baseViewport.width;
    const scaleY = containerRect.height / baseViewport.height;
    const cssScale = Math.min(scaleX, scaleY);
    const pixelScale = cssScale * window.devicePixelRatio;

    const viewport = page.getViewport({ scale: pixelScale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = `${viewport.width / window.devicePixelRatio}px`;
    canvas.style.height = `${viewport.height / window.devicePixelRatio}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not acquire 2D canvas context");
    renderTask = page.render({ canvasContext: ctx, viewport });

    try {
      await renderTask.promise;
    } catch (e) {
      if ((e as Error).name !== "RenderingCancelledException") throw e;
    }
    renderTask = null;
  }

  return {
    async init(containerEl: HTMLElement, url: string): Promise<void> {
      container = containerEl;
      canvas = containerEl.querySelector("canvas") as HTMLCanvasElement;
      if (!canvas) throw new Error("Canvas element not found in container");

      const loadingTask = pdfjsLib.getDocument(url);
      const doc = await loadingTask.promise;
      if (destroyed) {
        doc.destroy();
        return;
      }
      pdfDoc = doc;
      _pageCount = pdfDoc.numPages;
      _currentPage = 1;

      await renderPage(1);
      if (destroyed) return;

      resizeObserver = new ResizeObserver(() => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          resizeTimer = null;
          renderPage(_currentPage).catch(console.error);
        }, 150);
      });
      resizeObserver.observe(container);
    },

    async goToPage(page: number): Promise<void> {
      if (page < 1 || page > _pageCount) return;
      _currentPage = page;
      await renderPage(page);
    },

    get pageCount() {
      return _pageCount;
    },
    get currentPage() {
      return _currentPage;
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
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      if (pdfDoc) {
        pdfDoc.destroy();
        pdfDoc = null;
      }
      canvas = null;
      container = null;
    },
  };
}
