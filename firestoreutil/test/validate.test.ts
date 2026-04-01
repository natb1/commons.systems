import { describe, it, expect } from "vitest";
import { requireString, requireNumber, requireNonNegativeNumber, requireBoolean, optionalString, optionalNumber, requireStringArray, requireIso8601 } from "../src/validate.js";
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

describe("requireStringArray", () => {
  it("returns empty array", () => {
    expect(requireStringArray([], "field")).toEqual([]);
  });
  it("returns array of strings", () => {
    expect(requireStringArray(["a", "b"], "field")).toEqual(["a", "b"]);
  });
  it("throws for non-array", () => {
    expect(() => requireStringArray("not-array", "field")).toThrow(DataIntegrityError);
    expect(() => requireStringArray(null, "field")).toThrow(DataIntegrityError);
    expect(() => requireStringArray(42, "field")).toThrow(DataIntegrityError);
  });
  it("throws for array with non-string element", () => {
    expect(() => requireStringArray(["a", 42], "field")).toThrow(DataIntegrityError);
    expect(() => requireStringArray([null], "field")).toThrow(DataIntegrityError);
  });
});

describe("requireIso8601", () => {
  it("returns valid UTC ISO 8601 date", () => {
    expect(requireIso8601("2026-03-01T00:00:00Z", "field")).toBe("2026-03-01T00:00:00Z");
  });
  it("accepts fractional seconds", () => {
    expect(requireIso8601("2026-03-01T12:30:00.123Z", "field")).toBe("2026-03-01T12:30:00.123Z");
  });
  it("throws for non-UTC ISO 8601", () => {
    expect(() => requireIso8601("2026-03-01T00:00:00+05:00", "field")).toThrow(DataIntegrityError);
  });
  it("throws for date-only string", () => {
    expect(() => requireIso8601("2026-03-01", "field")).toThrow(DataIntegrityError);
  });
  it("throws for non-string", () => {
    expect(() => requireIso8601(42, "field")).toThrow(DataIntegrityError);
  });
  it("throws for invalid date format", () => {
    expect(() => requireIso8601("not-a-date", "field")).toThrow(DataIntegrityError);
  });
});
