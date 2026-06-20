// Contract test: pins the public API surface of MockTimestamp as exposed through
// the exported helpers. MockTimestamp itself is not exported; consumers reach it
// via timestampMockFactory() and ts().
//
// Expected public surface:
//   static fromMillis(ms: number): MockTimestamp
//   static fromDate(d: Date): MockTimestamp
//   instance toMillis(): number
//   instance toDate(): Date
//
// If any of these are renamed or removed, this file produces a clear,
// localized failure rather than confusing breakage in downstream test files.

import { describe, it, expect } from "vitest";
import { timestampMockFactory, ts } from "./helpers";

const { Timestamp } = timestampMockFactory();

const MS_TABLE = [
  { label: "epoch zero", ms: 0 },
  { label: "2025-01-13", ms: Date.UTC(2025, 0, 13) },
  { label: "negative (one day before epoch)", ms: -86_400_000 },
];

describe("MockTimestamp contract", () => {
  describe("fromMillis / toMillis round-trip", () => {
    for (const { label, ms } of MS_TABLE) {
      it(`round-trips ${label} (ms=${ms})`, () => {
        expect(Timestamp.fromMillis(ms).toMillis()).toBe(ms);
      });
    }
  });

  describe("fromMillis / toDate", () => {
    for (const { label, ms } of MS_TABLE) {
      it(`toDate() returns a Date with getTime() === ms for ${label}`, () => {
        const result = Timestamp.fromMillis(ms).toDate();
        expect(result).toBeInstanceOf(Date);
        expect(result.getTime()).toBe(ms);
      });
    }
  });

  describe("fromDate / toMillis round-trip", () => {
    it("toMillis() returns d.getTime() for a constructed Date", () => {
      const d = new Date(Date.UTC(2025, 0, 13));
      expect(Timestamp.fromDate(d).toMillis()).toBe(d.getTime());
    });
  });

  describe("fromDate / toDate identity", () => {
    it("toDate() returns the same Date instance passed to fromDate()", () => {
      // MockTimestamp stores the input Date by reference (helpers.ts:9-12),
      // so toBe (reference equality) must hold.
      const d = new Date(Date.UTC(2025, 5, 20));
      expect(Timestamp.fromDate(d).toDate()).toBe(d);
    });
  });

  describe("ts() helper", () => {
    it("ts(dateStr).toMillis() equals new Date(dateStr).getTime()", () => {
      const dateStr = "2025-01-13";
      expect(ts(dateStr).toMillis()).toBe(new Date(dateStr).getTime());
    });
  });
});
