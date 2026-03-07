import { describe, it, expect } from "vitest";
import { formatUtcDate, monthName } from "../src/date";

describe("formatUtcDate", () => {
  it("formats with long month by default", () => {
    expect(formatUtcDate("2026-02-01T00:00:00Z")).toBe("February 1, 2026");
  });

  it("formats with short month when requested", () => {
    expect(formatUtcDate("2026-02-01T00:00:00Z", "short")).toBe("Feb 1, 2026");
  });

  it("uses UTC so midnight UTC stays in the correct date", () => {
    expect(formatUtcDate("2026-02-01T00:00:00Z")).toBe("February 1, 2026");
    expect(formatUtcDate("2026-01-01T00:00:00Z")).toBe("January 1, 2026");
  });

  it("throws on invalid date string", () => {
    expect(() => formatUtcDate("not-a-date")).toThrow(
      'formatUtcDate: invalid ISO date string: "not-a-date"',
    );
  });
});

describe("monthName", () => {
  it("returns full month name for index 0-11", () => {
    expect(monthName(0)).toBe("January");
    expect(monthName(1)).toBe("February");
    expect(monthName(11)).toBe("December");
  });
});
