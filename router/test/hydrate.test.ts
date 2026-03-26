import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { hydrateOnce, isOutletCurrent } from "../src/hydrate";

describe("hydrateOnce", () => {
  let root: HTMLDivElement;
  let reportErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    root = document.createElement("div");
    if (typeof globalThis.reportError !== "function") {
      globalThis.reportError = () => {};
    }
    reportErrorSpy = vi.spyOn(globalThis, "reportError").mockImplementation(() => {});
  });

  afterEach(() => {
    reportErrorSpy.mockRestore();
  });

  it("calls hydrate and sets dataset.hydrated to true", () => {
    root.innerHTML = '<div id="target"></div>';
    const hydrate = vi.fn();
    hydrateOnce(root, "#target", hydrate);
    expect(hydrate).toHaveBeenCalledWith(root.querySelector("#target"));
    expect((root.querySelector("#target") as HTMLElement).dataset.hydrated).toBe("true");
  });

  it("skips when element not found", () => {
    const hydrate = vi.fn();
    hydrateOnce(root, "#missing", hydrate);
    expect(hydrate).not.toHaveBeenCalled();
  });

  it("skips when already hydrated with true", () => {
    root.innerHTML = '<div id="target" data-hydrated="true"></div>';
    const hydrate = vi.fn();
    hydrateOnce(root, "#target", hydrate);
    expect(hydrate).not.toHaveBeenCalled();
  });

  it("skips when already hydrated with error", () => {
    root.innerHTML = '<div id="target" data-hydrated="error"></div>';
    const hydrate = vi.fn();
    hydrateOnce(root, "#target", hydrate);
    expect(hydrate).not.toHaveBeenCalled();
  });

  it("sets error and calls onError for non-programmer errors", () => {
    root.innerHTML = '<div id="target"></div>';
    const error = new Error("boom");
    const onError = vi.fn();
    hydrateOnce(root, "#target", () => { throw error; }, onError);
    expect((root.querySelector("#target") as HTMLElement).dataset.hydrated).toBe("error");
    expect(onError).toHaveBeenCalledWith(error, root.querySelector("#target"));
  });

  it("defers TypeError and does not call onError", () => {
    const deferredErrors: unknown[] = [];
    vi.spyOn(globalThis, "setTimeout").mockImplementation((fn: TimerHandler) => {
      if (typeof fn === "function") {
        try { fn(); } catch (e) { deferredErrors.push(e); }
      }
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });

    try {
      root.innerHTML = '<div id="target"></div>';
      const onError = vi.fn();
      hydrateOnce(root, "#target", () => { throw new TypeError("bad"); }, onError);
      expect((root.querySelector("#target") as HTMLElement).dataset.hydrated).toBe("error");
      expect(onError).not.toHaveBeenCalled();
      expect(deferredErrors).toHaveLength(1);
      expect(deferredErrors[0]).toBeInstanceOf(TypeError);
    } finally {
      vi.mocked(globalThis.setTimeout).mockRestore();
    }
  });

  it("defers ReferenceError and does not call onError", () => {
    const deferredErrors: unknown[] = [];
    vi.spyOn(globalThis, "setTimeout").mockImplementation((fn: TimerHandler) => {
      if (typeof fn === "function") {
        try { fn(); } catch (e) { deferredErrors.push(e); }
      }
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });

    try {
      root.innerHTML = '<div id="target"></div>';
      const onError = vi.fn();
      hydrateOnce(root, "#target", () => { throw new ReferenceError("bad"); }, onError);
      expect((root.querySelector("#target") as HTMLElement).dataset.hydrated).toBe("error");
      expect(onError).not.toHaveBeenCalled();
      expect(deferredErrors).toHaveLength(1);
      expect(deferredErrors[0]).toBeInstanceOf(ReferenceError);
    } finally {
      vi.mocked(globalThis.setTimeout).mockRestore();
    }
  });

  it("falls back to reportError when no onError provided", () => {
    root.innerHTML = '<div id="target"></div>';
    const error = new Error("boom");
    hydrateOnce(root, "#target", () => { throw error; });
    expect(reportErrorSpy).toHaveBeenCalledWith(error);
  });
});

describe("isOutletCurrent", () => {
  it("returns true when anchor is a descendant of outlet", () => {
    const outlet = document.createElement("div");
    const anchor = document.createElement("span");
    outlet.appendChild(anchor);
    expect(isOutletCurrent(outlet, anchor)).toBe(true);
  });

  it("returns false when anchor has been detached", () => {
    const outlet = document.createElement("div");
    const anchor = document.createElement("span");
    outlet.appendChild(anchor);
    outlet.innerHTML = "<p>new content</p>";
    expect(isOutletCurrent(outlet, anchor)).toBe(false);
  });
});
