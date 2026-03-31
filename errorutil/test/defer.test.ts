import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { deferProgrammerError } from "../src/defer.js";

describe("deferProgrammerError", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("defers TypeError and returns true", () => {
    const error = new TypeError("x is not a function");
    const result = deferProgrammerError(error);
    expect(result).toBe(true);
    expect(() => vi.runAllTimers()).toThrow(error);
  });

  it("defers ReferenceError and returns true", () => {
    const error = new ReferenceError("x is not defined");
    const result = deferProgrammerError(error);
    expect(result).toBe(true);
    expect(() => vi.runAllTimers()).toThrow(error);
  });

  it("returns false for generic Error", () => {
    const error = new Error("runtime error");
    const result = deferProgrammerError(error);
    expect(result).toBe(false);
    vi.runAllTimers(); // should not throw
  });

  it("returns false for RangeError", () => {
    const result = deferProgrammerError(new RangeError("out of range"));
    expect(result).toBe(false);
  });

  it("returns false for non-Error values", () => {
    const result = deferProgrammerError("string");
    expect(result).toBe(false);
  });
});
