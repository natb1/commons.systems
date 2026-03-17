import { describe, it, expect } from "vitest";
import { parsePositionPage } from "../../src/viewer/types";

describe("parsePositionPage", () => {
  it("returns parsed page for valid in-range string", () => {
    expect(parsePositionPage("5", 10)).toBe(5);
  });

  it("returns pageCount when position equals exact upper bound", () => {
    expect(parsePositionPage("10", 10)).toBe(10);
  });

  it("returns 1 when position is '1' (lower bound)", () => {
    expect(parsePositionPage("1", 10)).toBe(1);
  });

  it("returns 1 when position is '0' (below range)", () => {
    expect(parsePositionPage("0", 10)).toBe(1);
  });

  it("returns 1 when position exceeds pageCount", () => {
    expect(parsePositionPage("11", 10)).toBe(1);
  });

  it("returns 1 for non-numeric string", () => {
    expect(parsePositionPage("abc", 10)).toBe(1);
  });

  it("returns 1 when position is undefined", () => {
    expect(parsePositionPage(undefined, 10)).toBe(1);
  });

  it("returns 1 when position is empty string", () => {
    expect(parsePositionPage("", 10)).toBe(1);
  });

  it("truncates decimal string via parseInt", () => {
    // parseInt("1.9", 10) === 1, which is in range
    expect(parsePositionPage("1.9", 10)).toBe(1);
  });
});
