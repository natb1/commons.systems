import {
  spreadsForPageCount,
  spreadIndexForPage,
  spreadPositionLabel,
} from "./spread.js";
import type { Spread } from "./spread.js";
import type { ContentRenderer } from "./types.js";

export interface SpreadControllerDeps {
  renderer: ContentRenderer;
  canvasWrap: HTMLElement;
  spreadToggleBtn: HTMLButtonElement;
  storageKey: string;
  onRenderError: (err: unknown) => void;
}

export class SpreadController {
  private readonly renderer: ContentRenderer;
  private readonly canvasWrap: HTMLElement;
  private readonly spreadToggleBtn: HTMLButtonElement;
  private readonly storageKey: string;
  private readonly onRenderError: (err: unknown) => void;

  private spreadEnabled = false;
  private spreads: Spread[] = [];
  private spreadIndex = 0;
  private spreadZoomLevel = 0;
  private spreadResizeObserver: ResizeObserver | null = null;
  private spreadResizeTimer: ReturnType<typeof setTimeout> | null = null;
  // Page the user was on when entering spread mode; used to restore position on exit.
  private preSpreadPage = 1;

  constructor(deps: SpreadControllerDeps) {
    this.renderer = deps.renderer;
    this.canvasWrap = deps.canvasWrap;
    this.spreadToggleBtn = deps.spreadToggleBtn;
    this.storageKey = deps.storageKey;
    this.onRenderError = deps.onRenderError;
  }

  get enabled(): boolean {
    return this.spreadEnabled;
  }

  get canGoPrev(): boolean {
    return this.spreadIndex > 0;
  }

  get canGoNext(): boolean {
    return this.spreadIndex < this.spreads.length - 1;
  }

  get canZoomOut(): boolean {
    return this.spreadZoomLevel > 0;
  }

  get position(): string {
    if (this.spreads.length === 0) return this.renderer.position;
    return String(this.spreads[this.spreadIndex]!.left);
  }

  get positionLabel(): string {
    if (this.spreads.length === 0) return this.renderer.positionLabel;
    return spreadPositionLabel(this.spreads[this.spreadIndex]!, this.renderer.pageCount);
  }

  enter(currentPage: number): void {
    this.spreadEnabled = true;
    this.preSpreadPage = currentPage;
    this.spreads = spreadsForPageCount(this.renderer.pageCount);
    this.spreadIndex = spreadIndexForPage(currentPage, this.renderer.pageCount);
    this.spreadZoomLevel = 0;

    // Create sub-containers (CSS hides the single-page renderer element)
    this.canvasWrap.classList.add("spread-mode");
    const leftEl = document.createElement("div");
    leftEl.className = "spread-page spread-left";
    const rightEl = document.createElement("div");
    rightEl.className = "spread-page spread-right";
    this.canvasWrap.appendChild(leftEl);
    this.canvasWrap.appendChild(rightEl);

    this.spreadToggleBtn.setAttribute("aria-pressed", "true");
    try { localStorage.setItem(this.storageKey, "true"); }
    catch (e) { reportError(new Error("Could not save spread preference", { cause: e })); }

    this.spreadResizeObserver = new ResizeObserver(() => {
      if (this.spreadResizeTimer) clearTimeout(this.spreadResizeTimer);
      this.spreadResizeTimer = setTimeout(() => {
        this.spreadResizeTimer = null;
        this.render().catch(this.onRenderError);
      }, 150);
    });
    this.spreadResizeObserver.observe(this.canvasWrap);
  }

  leave(): number {
    const spread = this.spreads.length > 0 ? this.spreads[this.spreadIndex]! : null;
    const currentPage = spread !== null
      && this.preSpreadPage >= spread.left
      && (spread.right === null || this.preSpreadPage <= spread.right)
      ? this.preSpreadPage
      : (spread?.left ?? 1);
    this.spreadEnabled = false;
    this.spreads = [];
    this.spreadIndex = 0;
    this.spreadZoomLevel = 0;

    this.canvasWrap.querySelectorAll(".spread-page").forEach(el => el.remove());
    this.canvasWrap.classList.remove("spread-mode", "solo");
    this.canvasWrap.style.transform = "";
    this.canvasWrap.style.transformOrigin = "";
    this.canvasWrap.classList.remove("zoomed");

    this.spreadToggleBtn.setAttribute("aria-pressed", "false");
    try { localStorage.setItem(this.storageKey, "false"); }
    catch (e) { reportError(new Error("Could not save spread preference", { cause: e })); }

    if (this.spreadResizeObserver) {
      this.spreadResizeObserver.disconnect();
      this.spreadResizeObserver = null;
    }
    if (this.spreadResizeTimer) {
      clearTimeout(this.spreadResizeTimer);
      this.spreadResizeTimer = null;
    }

    return currentPage;
  }

  async render(): Promise<void> {
    if (!this.renderer.renderPageInto || this.spreads.length === 0) return;
    const spread = this.spreads[this.spreadIndex]!;
    const isSolo = spread.right === null;

    const leftEl = this.canvasWrap.querySelector(".spread-left") as HTMLElement;
    const rightEl = this.canvasWrap.querySelector(".spread-right") as HTMLElement;
    leftEl.innerHTML = "";
    rightEl.innerHTML = "";

    this.canvasWrap.classList.toggle("solo", isSolo);

    await this.renderer.renderPageInto(spread.left, leftEl);
    if (spread.right !== null) {
      await this.renderer.renderPageInto(spread.right, rightEl);
    }
  }

  async goNext(): Promise<void> {
    if (this.spreadIndex < this.spreads.length - 1) {
      this.spreadIndex++;
      await this.render();
    }
  }

  async goPrev(): Promise<void> {
    if (this.spreadIndex > 0) {
      this.spreadIndex--;
      await this.render();
    }
  }

  zoomIn(): void {
    this.spreadZoomLevel++;
    this.updateZoom();
  }

  zoomOut(): void {
    if (this.spreadZoomLevel <= 0) return;
    this.spreadZoomLevel--;
    this.updateZoom();
  }

  zoomReset(): void {
    this.spreadZoomLevel = 0;
    this.updateZoom();
  }

  private updateZoom(): void {
    if (this.spreadZoomLevel === 0) {
      this.canvasWrap.style.transform = "";
      this.canvasWrap.classList.remove("zoomed");
    } else {
      const scale = 1.2 ** this.spreadZoomLevel;
      this.canvasWrap.style.transform = `scale(${scale})`;
      this.canvasWrap.style.transformOrigin = "top left";
      this.canvasWrap.classList.add("zoomed");
    }
  }

  static loadPreference(storageKey: string, onError: (err: unknown) => void): boolean {
    try {
      return localStorage.getItem(storageKey) === "true";
    } catch (e) {
      onError(new Error("Could not load spread preference", { cause: e }));
      return false;
    }
  }

  destroy(): void {
    if (this.spreadResizeObserver) {
      this.spreadResizeObserver.disconnect();
      this.spreadResizeObserver = null;
    }
    if (this.spreadResizeTimer) {
      clearTimeout(this.spreadResizeTimer);
      this.spreadResizeTimer = null;
    }
  }
}
