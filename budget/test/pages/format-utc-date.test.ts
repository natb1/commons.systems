import { describe, it, expect } from "vitest";
import { formatUtcDate } from "../../src/pages/format-utc-date";

describe("formatUtcDate", () => {
  it("renders a UTC-midnight timestamp using its UTC calendar date", () => {
    // Transaction dates are stored as UTC midnight.
    expect(formatUtcDate(Date.UTC(2025, 0, 22))).toBe("1/22/2025");
  });

  it("renders the UTC date even when a west-of-UTC viewer's local date is the previous day", () => {
    // 2025-01-22T03:00Z is still Jan 21 (evening) everywhere in the Americas.
    // toLocaleDateString() would render "1/21/2025" there; reading the UTC
    // fields keeps the displayed date equal to the stored UTC date.
    const ms = Date.UTC(2025, 0, 22, 3, 0, 0);
    expect(formatUtcDate(ms)).toBe("1/22/2025");
  });

  it("does not zero-pad the month or day (M/D/YYYY)", () => {
    expect(formatUtcDate(Date.UTC(2025, 2, 5))).toBe("3/5/2025");
  });
});
