import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { SpreadController } from "../../src/viewer/spread-controller";
import { makeMockRenderer } from "./mock-renderer";
import { spreadPositionLabel } from "../../src/viewer/spread";
import type { ContentRenderer } from "../../src/viewer/types";

const STORAGE_KEY = "spread-mode:test";

function makeController(overrides: Partial<ContentRenderer> = {}) {
  const renderer = makeMockRenderer(overrides);
  const canvasWrap = document.createElement("div");
  const spreadToggleBtn = document.createElement("button");
  const onRenderError = vi.fn();
  const controller = new SpreadController({
    renderer,
    canvasWrap,
    spreadToggleBtn,
    storageKey: STORAGE_KEY,
    onRenderError,
  });
  return { controller, renderer, canvasWrap, spreadToggleBtn, onRenderError };
}

describe("SpreadController", () => {
  let reportErrorMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    // happy-dom does not define reportError; stub it so loadPreference's catch
    // branch (and savePreference) have a callable global to invoke.
    reportErrorMock = vi.fn();
    vi.stubGlobal("reportError", reportErrorMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("canGoPrev/canGoNext reflect boundaries before and after enter", async () => {
    const { controller } = makeController({ renderPageInto: vi.fn() });

    // Before enter, spreads.length === 0.
    expect(controller.canGoPrev).toBe(false);
    expect(controller.canGoNext).toBe(false);

    // 10-page doc => 6 spreads (indices 0..5).
    controller.enter(1);
    expect(controller.canGoPrev).toBe(false);
    expect(controller.canGoNext).toBe(true);

    // Walk to the last spread (index 5).
    for (let i = 0; i < 5; i++) {
      await controller.goNext();
    }
    expect(controller.canGoNext).toBe(false);
    expect(controller.canGoPrev).toBe(true);
  });

  it("position/positionLabel fall back to renderer when no spreads, then reflect spread", () => {
    const { controller } = makeController({
      position: "7",
      positionLabel: "custom label",
      renderPageInto: vi.fn(),
    });

    // Before enter: falls back to renderer's position/positionLabel.
    expect(controller.position).toBe("7");
    expect(controller.positionLabel).toBe("custom label");

    controller.enter(1);
    // After enter on a 10-page doc, index 0 is the solo spread {left:1,right:null}.
    expect(controller.position).toBe("1");
    expect(controller.positionLabel).toBe(
      spreadPositionLabel({ left: 1, right: null }, 10),
    );
    expect(controller.positionLabel).toBe("Page 1 / 10");
  });

  describe("leave() page-restore", () => {
    it("returns preSpreadPage when both-sides-bounded and inside the spread", () => {
      const { controller } = makeController({ renderPageInto: vi.fn() });
      // enter(2) => current spread {left:2,right:3}, preSpreadPage=2 within [2,3].
      controller.enter(2);
      expect(controller.leave()).toBe(2);
    });

    it("returns preSpreadPage for a solo spread where page === left", () => {
      const { controller } = makeController({ renderPageInto: vi.fn() });
      // enter(1) => solo spread {left:1,right:null}, preSpreadPage=1 === left.
      controller.enter(1);
      expect(controller.leave()).toBe(1);
    });

    it("returns spread.left when preSpreadPage is outside the current spread", async () => {
      const { controller } = makeController({ renderPageInto: vi.fn() });
      // enter(2) sets preSpreadPage=2 and starts at index 1 (spread {2,3}).
      controller.enter(2);
      await controller.goNext(); // index 2 => spread {4,5}
      // preSpreadPage=2 < left=4 => restore to spread.left (4).
      expect(controller.leave()).toBe(4);
    });
  });

  it("zoomOut early-returns at zoom 0 and floors at 0", () => {
    const { controller, canvasWrap } = makeController({ renderPageInto: vi.fn() });
    controller.enter(1);

    // Zoom level 0: no-op, transform stays cleared.
    expect(controller.canZoomOut).toBe(false);
    controller.zoomOut();
    expect(controller.canZoomOut).toBe(false);
    expect(canvasWrap.style.transform).toBe("");

    // One zoom in: transform set, canZoomOut true.
    controller.zoomIn();
    expect(controller.canZoomOut).toBe(true);
    expect(canvasWrap.style.transform).not.toBe("");

    // Two zoom outs: floors at 0, transform cleared, canZoomOut false.
    controller.zoomOut();
    controller.zoomOut();
    expect(controller.canZoomOut).toBe(false);
    expect(canvasWrap.style.transform).toBe("");
  });

  it("loadPreference returns false and reports error when getItem throws", () => {
    const { controller } = makeController();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("boom");
    });

    expect(controller.loadPreference()).toBe(false);
    expect(reportErrorMock).toHaveBeenCalled();
  });

  it("destroy() is safe before enter and when called twice", () => {
    const { controller } = makeController({ renderPageInto: vi.fn() });

    // Before enter: no observer/timer registered.
    expect(() => controller.destroy()).not.toThrow();

    controller.enter(1);
    expect(() => {
      controller.destroy();
      controller.destroy();
    }).not.toThrow();
  });

  it("invokes onRenderError when a resize-triggered render rejects (#616 guard)", async () => {
    vi.useFakeTimers();

    let capturedCb: (() => void) | null = null;
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: () => void) {
          capturedCb = cb;
        }
        observe() {}
        disconnect() {}
      },
    );

    const renderErr = new Error("render fail");
    const { controller, onRenderError } = makeController({
      renderPageInto: vi.fn().mockRejectedValue(renderErr),
    });

    controller.enter(1);
    expect(capturedCb).not.toBeNull();

    // Fire the observer callback; it debounces with setTimeout(150).
    capturedCb!();
    await vi.advanceTimersByTimeAsync(150);

    expect(onRenderError).toHaveBeenCalledWith(renderErr);
  });
});
