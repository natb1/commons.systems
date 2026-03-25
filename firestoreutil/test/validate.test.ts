import { describe, it, expect } from "vitest";
import { requireString, requireNumber, requireNonNegativeNumber, requireBoolean, optionalString, optionalNumber } from "../src/validate.js";
import { DataIntegrityError } from "../src/errors.js";

describe("requireString", () => {
  it("returns the value for a string", () => {
    expect(requireString("hello", "field")).toBe("hello");
  });
  it("returns empty string", () => {
    expect(requireString("", "field")).toBe("");
  });
  it("throws DataIntegrityError for non-string", () => {
    expect(() => requireString(123, "field")).toThrow(DataIntegrityError);
    expect(() => requireString(null, "field")).toThrow(DataIntegrityError);
    expect(() => requireString(undefined, "field")).toThrow(DataIntegrityError);
  });
});

describe("requireNumber", () => {
  it("returns the value for a finite number", () => {
    expect(requireNumber(42, "field")).toBe(42);
    expect(requireNumber(-3.5, "field")).toBe(-3.5);
    expect(requireNumber(0, "field")).toBe(0);
  });
  it("throws for non-number", () => {
    expect(() => requireNumber("42", "field")).toThrow(DataIntegrityError);
    expect(() => requireNumber(null, "field")).toThrow(DataIntegrityError);
  });
  it("throws for non-finite number", () => {
    expect(() => requireNumber(NaN, "field")).toThrow(DataIntegrityError);
    expect(() => requireNumber(Infinity, "field")).toThrow(DataIntegrityError);
  });
});

describe("requireNonNegativeNumber", () => {
  it("returns the value for a non-negative number", () => {
    expect(requireNonNegativeNumber(0, "field")).toBe(0);
    expect(requireNonNegativeNumber(42, "field")).toBe(42);
  });
  it("throws for negative number", () => {
    expect(() => requireNonNegativeNumber(-1, "field")).toThrow(DataIntegrityError);
  });
  it("throws for non-number", () => {
    expect(() => requireNonNegativeNumber("5", "field")).toThrow(DataIntegrityError);
  });
});

describe("requireBoolean", () => {
  it("returns the value for a boolean", () => {
    expect(requireBoolean(true, "field")).toBe(true);
    expect(requireBoolean(false, "field")).toBe(false);
  });
  it("throws for non-boolean", () => {
    expect(() => requireBoolean(1, "field")).toThrow(DataIntegrityError);
    expect(() => requireBoolean("true", "field")).toThrow(DataIntegrityError);
    expect(() => requireBoolean(null, "field")).toThrow(DataIntegrityError);
  });
});

describe("optionalString", () => {
  it("returns the value for a string", () => {
    expect(optionalString("hello", "field")).toBe("hello");
  });
  it("returns null for null", () => {
    expect(optionalString(null, "field")).toBeNull();
  });
  it("returns null for undefined", () => {
    expect(optionalString(undefined, "field")).toBeNull();
  });
  it("throws for non-string non-null", () => {
    expect(() => optionalString(123, "field")).toThrow(DataIntegrityError);
    expect(() => optionalString(true, "field")).toThrow(DataIntegrityError);
  });
});

describe("optionalNumber", () => {
  it("returns the value for a finite number", () => {
    expect(optionalNumber(42, "field")).toBe(42);
    expect(optionalNumber(-3.5, "field")).toBe(-3.5);
    expect(optionalNumber(0, "field")).toBe(0);
  });
  it("returns null for null", () => {
    expect(optionalNumber(null, "field")).toBeNull();
  });
  it("returns null for undefined", () => {
    expect(optionalNumber(undefined, "field")).toBeNull();
  });
  it("throws for non-number", () => {
    expect(() => optionalNumber("42", "field")).toThrow(DataIntegrityError);
    expect(() => optionalNumber(true, "field")).toThrow(DataIntegrityError);
  });
  it("throws for non-finite number", () => {
    expect(() => optionalNumber(NaN, "field")).toThrow(DataIntegrityError);
    expect(() => optionalNumber(Infinity, "field")).toThrow(DataIntegrityError);
  });
});
