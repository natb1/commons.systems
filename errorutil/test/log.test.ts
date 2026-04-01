import { describe, it, expect, vi, beforeEach } from "vitest";
import { logError, registerErrorSink } from "../src/log.js";
import type { ErrorSink } from "../src/log.js";

describe("logError", () => {
  beforeEach(() => {
    registerErrorSink(undefined as unknown as ErrorSink);
    vi.restoreAllMocks();
  });

  it("writes to console.error with operation tag", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new Error("boom");
    logError(err, { operation: "test-op" });
    expect(spy).toHaveBeenCalledWith("[test-op]", err);
  });

  it("enriches context with kind from classifyError", () => {
    const sink = vi.fn();
    registerErrorSink(sink);
    vi.spyOn(console, "error").mockImplementation(() => {});

    logError(new TypeError("x"), { operation: "test-op" });

    expect(sink).toHaveBeenCalledWith(
      expect.any(TypeError),
      expect.objectContaining({ kind: "programmer", operation: "test-op" }),
    );
  });

  it("preserves caller-provided kind override", () => {
    const sink = vi.fn();
    registerErrorSink(sink);
    vi.spyOn(console, "error").mockImplementation(() => {});

    logError(new Error("x"), { operation: "test-op", kind: "data-integrity" });

    expect(sink).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ kind: "data-integrity" }),
    );
  });

  it("forwards to registered sink", () => {
    const sink = vi.fn();
    registerErrorSink(sink);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const err = new Error("boom");
    logError(err, { operation: "test-op" });

    expect(sink).toHaveBeenCalledOnce();
    expect(sink).toHaveBeenCalledWith(err, expect.objectContaining({ operation: "test-op" }));
  });

  it("does not throw when no sink is registered", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => logError(new Error("boom"), { operation: "test-op" })).not.toThrow();
  });

  it("catches synchronous sink exceptions and warns", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    const badSink: ErrorSink = () => { throw new Error("sink broke"); };
    registerErrorSink(badSink);

    expect(() => logError(new Error("boom"), { operation: "test-op" })).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith("Error sink threw synchronously", expect.any(Error));
  });

  it("handles non-Error values", () => {
    const sink = vi.fn();
    registerErrorSink(sink);
    vi.spyOn(console, "error").mockImplementation(() => {});

    logError("string error", { operation: "test-op" });

    expect(sink).toHaveBeenCalledWith(
      "string error",
      expect.objectContaining({ kind: "unknown" }),
    );
  });

  it("passes extra context fields to sink", () => {
    const sink = vi.fn();
    registerErrorSink(sink);
    vi.spyOn(console, "error").mockImplementation(() => {});

    logError(new Error("x"), { operation: "test-op", postId: "abc" });

    expect(sink).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ postId: "abc" }),
    );
  });
});
