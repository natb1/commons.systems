import { describe, it, expect, vi, beforeEach } from "vitest";
import { installGlobalErrorHandlers } from "../src/global-handler.js";
import { registerErrorSink } from "../src/log.js";

/**
 * Minimal stand-in for the global EventTarget. Stores listeners per type and
 * lets a test dispatch a plain event object. errorutil's tsconfig has no DOM
 * lib, and the production handler reads only `.error`/`.message`/`.reason`, so
 * a real `ErrorEvent`/`PromiseRejectionEvent` is unnecessary — and
 * `PromiseRejectionEvent` is not even constructible in the test env.
 */
class MockTarget {
  private listeners = new Map<string, Set<(event: unknown) => void>>();

  addEventListener(type: string, listener: (event: unknown) => void): void {
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    set.add(listener);
  }

  removeEventListener(type: string, listener: (event: unknown) => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type: string, event: unknown): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

describe("installGlobalErrorHandlers", () => {
  beforeEach(() => {
    registerErrorSink(undefined);
    vi.restoreAllMocks();
  });

  it("forwards an uncaught error event's .error to logError", () => {
    const sink = vi.fn();
    registerErrorSink(sink);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const target = new MockTarget();
    installGlobalErrorHandlers(target);

    const err = new Error("boom");
    target.dispatch("error", { error: err });

    expect(sink).toHaveBeenCalledWith(
      err,
      expect.objectContaining({ operation: "uncaught" }),
    );
  });

  it("falls back to the message string when .error is null", () => {
    const sink = vi.fn();
    registerErrorSink(sink);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const target = new MockTarget();
    installGlobalErrorHandlers(target);

    expect(() =>
      target.dispatch("error", { error: null, message: "Script error." }),
    ).not.toThrow();

    expect(sink).toHaveBeenCalledWith(
      "Script error.",
      expect.objectContaining({ operation: "uncaught" }),
    );
  });

  it("forwards an unhandledrejection event's .reason to logError", () => {
    const sink = vi.fn();
    registerErrorSink(sink);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const target = new MockTarget();
    installGlobalErrorHandlers(target);

    const reason = new Error("rejected");
    target.dispatch("unhandledrejection", { reason });

    expect(sink).toHaveBeenCalledWith(
      reason,
      expect.objectContaining({ operation: "unhandledrejection" }),
    );
  });

  it("disposer removes both listeners", () => {
    const sink = vi.fn();
    registerErrorSink(sink);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const target = new MockTarget();
    const dispose = installGlobalErrorHandlers(target);
    dispose();

    target.dispatch("error", { error: new Error("boom") });
    target.dispatch("unhandledrejection", { reason: new Error("rejected") });

    expect(sink).not.toHaveBeenCalled();
  });
});
