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

  // Both tests stub the global localStorage object rather than spy on
  // Storage.prototype.getItem. Under happy-dom only the first prototype getItem
  // spy in a Storage instance's lifetime is wired to localStorage, so a second
  // spy silently reads through to real storage — making prototype-spy tests
  // order- and cross-file-dependent. Stubbing the global (cleaned by
  // vi.unstubAllGlobals in afterEach) targets the boundary the controller
  // actually reads and is immune to that quirk.
  it("loadPreference returns false and reports error when getItem throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("boom");
      },
    });
    const { controller } = makeController();

    expect(controller.loadPreference()).toBe(false);
    expect(reportErrorMock).toHaveBeenCalled();
  });

  it("loadPreference returns true when the stored preference is 'true'", () => {
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => (key === STORAGE_KEY ? "true" : null),
    });
    const { controller } = makeController();
    expect(controller.loadPreference()).toBe(true);
    expect(reportErrorMock).not.toHaveBeenCalled();
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

  it("concurrent render() calls do not stack children in a slot (#1279)", async () => {
    // renderPageInto appends its child synchronously (as pdf.ts appends its
    // wrapper before any await) then awaits. A render() superseded after its
    // left renderPageInto must bail before calling the right renderPageInto and
    // before its tail continues — otherwise the stale render appends a second
    // child into a slot the winning render already cleared and repopulated.
    let resolveFirstLeft: (() => void) | null = null;
    const renderPageInto = vi
      .fn()
      .mockImplementationOnce((_page: number, target: HTMLElement) => {
        // First (stale) left render: append synchronously, then hang.
        target.appendChild(document.createElement("img"));
        return new Promise<void>(resolve => {
          resolveFirstLeft = resolve;
        });
      })
      .mockImplementation(async (_page: number, target: HTMLElement) => {
        target.appendChild(document.createElement("img"));
      });

    const { controller, canvasWrap } = makeController({ renderPageInto });

    // enter(2) => index 1, two-page spread {left:2,right:3}; exercises both slots.
    controller.enter(2);

    // First render appends one left child, then hangs on that left renderPageInto.
    const first = controller.render();

    // Supersede with a second render that clears both slots and completes fully.
    await controller.render();

    // Release the stale first render last; its generation guard must bail before
    // calling the right renderPageInto or re-entering the cleared slots.
    resolveFirstLeft!();
    await first;

    const leftEl = canvasWrap.querySelector(".spread-left") as HTMLElement;
    const rightEl = canvasWrap.querySelector(".spread-right") as HTMLElement;
    // Each slot holds exactly one rendered child despite the overlapping renders.
    expect(leftEl.querySelectorAll("img")).toHaveLength(1);
    expect(rightEl.querySelectorAll("img")).toHaveLength(1);
    // The stale render never reached its right renderPageInto: only the two left
    // calls (stale + winner) plus the winner's one right call ran.
    expect(renderPageInto).toHaveBeenCalledTimes(3);
    // Latest spread index (1 => spread {2,3}) is reflected.
    expect(controller.position).toBe("2");
  });

  it("leave() during render() cancels the in-flight render before the right slot (#1383)", async () => {
    // leave() bumps renderGen, so an in-flight render() that is awaiting its
    // left renderPageInto must bail before calling the right renderPageInto.
    let resolveFirstLeft: (() => void) | null = null;
    const renderPageInto = vi
      .fn()
      .mockImplementationOnce((_page: number, target: HTMLElement) => {
        // First (stale) left render: append synchronously, then hang.
        target.appendChild(document.createElement("img"));
        return new Promise<void>(resolve => {
          resolveFirstLeft = resolve;
        });
      })
      .mockImplementation(async (_page: number, target: HTMLElement) => {
        target.appendChild(document.createElement("img"));
      });

    const { controller } = makeController({ renderPageInto });

    // enter(2) => index 1, two-page spread {left:2,right:3}; exercises both slots.
    controller.enter(2);

    // Start a render that appends one left child then hangs on left renderPageInto.
    const first = controller.render();

    // leave() bumps renderGen and removes the spread slot elements.
    controller.leave();

    // Release the stale render last; its generation guard must bail before
    // calling the right renderPageInto.
    resolveFirstLeft!();
    await first;

    // Only the hung left renderPageInto call ran; the right was never reached.
    expect(renderPageInto).toHaveBeenCalledTimes(1);
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

    // Fire the observer callback; it debounces the render with setTimeout.
    capturedCb!();
    await vi.runAllTimersAsync();

    expect(onRenderError).toHaveBeenCalledWith(renderErr);
  });
});
