import { describe, it, expect } from "vitest";
import { classifyError } from "../src/classify.js";

describe("classifyError", () => {
  it("classifies TypeError as programmer", () => {
    const result = classifyError(new TypeError("x is not a function"));
    expect(result.kind).toBe("programmer");
    expect(result.original).toBeInstanceOf(TypeError);
  });

  it("classifies ReferenceError as programmer", () => {
    const result = classifyError(new ReferenceError("x is not defined"));
    expect(result.kind).toBe("programmer");
    expect(result.original).toBeInstanceOf(ReferenceError);
  });

  it("classifies RangeError as range", () => {
    const result = classifyError(new RangeError("out of range"));
    expect(result.kind).toBe("range");
    expect(result.original).toBeInstanceOf(RangeError);
  });

  it("classifies DataIntegrityError by name", () => {
    const error = new Error("bad data");
    error.name = "DataIntegrityError";
    const result = classifyError(error);
    expect(result.kind).toBe("data-integrity");
    expect(result.original).toBe(error);
  });

  it("classifies permission-denied by code", () => {
    const error = Object.assign(new Error("denied"), { code: "permission-denied" });
    const result = classifyError(error);
    expect(result.kind).toBe("permission-denied");
    expect(result.original).toBe(error);
  });

  it("classifies generic Error as unknown", () => {
    const error = new Error("something broke");
    const result = classifyError(error);
    expect(result.kind).toBe("unknown");
    expect(result.original).toBe(error);
  });

  it("wraps non-Error values", () => {
    const result = classifyError("string error");
    expect(result.kind).toBe("unknown");
    expect(result.original).toBeInstanceOf(Error);
    expect(result.original.message).toBe("string error");
  });
});
