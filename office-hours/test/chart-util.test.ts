import { describe, it, expect, afterEach, vi } from "vitest";
import { mountResponsiveChart } from "../src/chart-util.js";

describe("mountResponsiveChart", () => {
  let savedResizeObserver: typeof ResizeObserver | undefined;

  afterEach(() => {
    // Restore ResizeObserver if it was replaced by a test.
    if (savedResizeObserver !== undefined) {
      (global as Record<string, unknown>).ResizeObserver = savedResizeObserver;
      savedResizeObserver = undefined;
    } else {
      // It was undefined before; delete so other files aren't affected.
      delete (global as Record<string, unknown>).ResizeObserver;
    }
    vi.restoreAllMocks();
    // Clean up any body children appended during tests.
    document.body.replaceChildren();
  });

  it("(a) initial synchronous paint at fallback width", () => {
    // Detached slot: clientWidth is 0 under happy-dom, so the fallback 640 is used.
    const slot = document.createElement("div");
    const widthsSeen: number[] = [];

    const render = (w: number): Node => {
      widthsSeen.push(w);
      const marker = document.createElement("span");
      marker.dataset.testid = "marker";
      return marker;
    };

    mountResponsiveChart(slot, render);

    expect(widthsSeen).toEqual([640]);
    const child = slot.firstElementChild as HTMLElement | null;
    expect(child).not.toBeNull();
    expect(child!.dataset.testid).toBe("marker");
  });

  it("(b) ResizeObserver re-paints at a new width", () => {
    // Capture the current value (likely undefined in happy-dom) so afterEach can restore it.
    savedResizeObserver = (global as Record<string, unknown>).ResizeObserver as
      | typeof ResizeObserver
      | undefined;

    let capturedCallback: ((entries: ResizeObserverEntry[]) => void) | null = null;
    const disconnectSpy = vi.fn();

    class MockResizeObserver {
      constructor(cb: (entries: ResizeObserverEntry[]) => void) {
        capturedCallback = cb;
      }
      observe() {}
      disconnect = disconnectSpy;
    }

    (global as Record<string, unknown>).ResizeObserver = MockResizeObserver;

    const slot = document.createElement("div");
    document.body.appendChild(slot); // slot.isConnected === true

    const renderSpy = vi.fn((w: number): Node => {
      const marker = document.createElement("span");
      marker.dataset.testid = `marker-${w}`;
      return marker;
    });

    mountResponsiveChart(slot, renderSpy);
    // Initial paint happened at fallback 640.
    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(renderSpy).toHaveBeenCalledWith(640);

    // Simulate a ResizeObserver callback at width 900.
    expect(capturedCallback).not.toBeNull();
    capturedCallback!([{ contentRect: { width: 900 } } as ResizeObserverEntry]);

    expect(renderSpy).toHaveBeenCalledTimes(2);
    expect(renderSpy).toHaveBeenLastCalledWith(900);
    const child = slot.firstElementChild as HTMLElement | null;
    expect(child).not.toBeNull();
    expect(child!.dataset.testid).toBe("marker-900");
  });

  it("(c) self-disconnects when slot is detached", () => {
    savedResizeObserver = (global as Record<string, unknown>).ResizeObserver as
      | typeof ResizeObserver
      | undefined;

    let capturedCallback: ((entries: ResizeObserverEntry[]) => void) | null = null;
    const disconnectSpy = vi.fn();

    class MockResizeObserver {
      constructor(cb: (entries: ResizeObserverEntry[]) => void) {
        capturedCallback = cb;
      }
      observe() {}
      disconnect = disconnectSpy;
    }

    (global as Record<string, unknown>).ResizeObserver = MockResizeObserver;

    // Slot NOT appended to document: slot.isConnected === false.
    const slot = document.createElement("div");

    const renderSpy = vi.fn((w: number): Node => {
      const marker = document.createElement("span");
      marker.dataset.testid = `marker-${w}`;
      return marker;
    });

    mountResponsiveChart(slot, renderSpy);
    expect(renderSpy).toHaveBeenCalledTimes(1); // initial paint

    renderSpy.mockClear();

    // Invoke the callback — slot is detached, so the observer should self-disconnect.
    expect(capturedCallback).not.toBeNull();
    capturedCallback!([{ contentRect: { width: 900 } } as ResizeObserverEntry]);

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
    expect(renderSpy).not.toHaveBeenCalled();
  });
});
