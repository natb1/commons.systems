import { describe, it, expect } from "vitest";
import { classifyError } from "../src/classify.js";

describe("classifyError", () => {
  it("classifies TypeError as programmer", () => {
    expect(classifyError(new TypeError("x is not a function"))).toBe("programmer");
  });

  it("classifies ReferenceError as programmer", () => {
    expect(classifyError(new ReferenceError("x is not defined"))).toBe("programmer");
  });

  it("classifies RangeError as range", () => {
    expect(classifyError(new RangeError("out of range"))).toBe("range");
  });

  it("classifies DataIntegrityError by name", () => {
    const error = new Error("bad data");
    error.name = "DataIntegrityError";
    expect(classifyError(error)).toBe("data-integrity");
  });

  it("classifies permission-denied by code", () => {
    const error = Object.assign(new Error("denied"), { code: "permission-denied" });
    expect(classifyError(error)).toBe("permission-denied");
  });

  it("classifies generic Error as unknown", () => {
    expect(classifyError(new Error("something broke"))).toBe("unknown");
  });

  it("classifies non-Error values as unknown", () => {
    expect(classifyError("string error")).toBe("unknown");
  });
});
