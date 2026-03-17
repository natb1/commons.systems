import { unzipSync } from "fflate";
import type { ContentRenderer } from "./types.js";

const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;

export function createImageArchiveRenderer(_onError?: (err: unknown) => void): ContentRenderer {
  let objectUrls: string[] = [];
  let imgEl: HTMLImageElement | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let _currentPage = 0;
  let _pageCount = 0;

  return {
    async init(container: HTMLElement, url: string): Promise<void> {
      canvas = container.querySelector("canvas") as HTMLCanvasElement;
      if (!canvas) throw new Error("Canvas element not found in container");

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch archive: ${response.status}`);

      const buffer = await response.arrayBuffer();
      const files = unzipSync(new Uint8Array(buffer));

      const imagePaths = Object.keys(files)
        .filter((path) => IMAGE_EXT.test(path))
        .sort();

      if (imagePaths.length === 0) throw new Error("No images found in archive");

      objectUrls = imagePaths.map((path) => URL.createObjectURL(new Blob([files[path] as Uint8Array<ArrayBuffer>])));
      _pageCount = objectUrls.length;
      _currentPage = 1;

      canvas.style.display = "none";
      imgEl = document.createElement("img");
      imgEl.src = objectUrls[0];
      container.appendChild(imgEl);
    },

    async goToPage(page: number): Promise<void> {
      if (page < 1 || page > _pageCount || !imgEl) return;
      _currentPage = page;
      imgEl.src = objectUrls[page - 1];
    },

    get pageCount() {
      return _pageCount;
    },
    get currentPage() {
      return _currentPage;
    },

    destroy(): void {
      for (const url of objectUrls) URL.revokeObjectURL(url);
      objectUrls = [];
      if (imgEl) {
        imgEl.remove();
        imgEl = null;
      }
      if (canvas) {
        canvas.style.display = "";
        canvas = null;
      }
    },
  };
}
