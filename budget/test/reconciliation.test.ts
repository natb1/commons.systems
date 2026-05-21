import { describe, it, expect, vi } from "vitest";
import { timestampMockFactory, ts } from "./helpers";

vi.mock("firebase/firestore", () => timestampMockFactory());

import {
  isAged,
  AGING_THRESHOLD_DAYS,
  signedLegAmount,
  buildReconcileRows,
  clearedBalance,
  balancesMatch,
} from "../src/reconciliation";
import type { JournalEntry, JournalLeg } from "../src/firestore";

describe("isAged", () => {
  it(`returns true when ageDays > ${AGING_THRESHOLD_DAYS}`, () => {
    expect(isAged(AGING_THRESHOLD_DAYS + 1)).toBe(true);
  });
  it(`returns false at the threshold`, () => {
    expect(isAged(AGING_THRESHOLD_DAYS)).toBe(false);
  });
  it("returns false for zero", () => {
    expect(isAged(0)).toBe(false);
  });
});

function leg(overrides: Partial<JournalLeg> = {}): JournalLeg {
  return {
    id: "leg-1",
    entryId: "entry-1",
    accountId: "acct-1",
    debit: 0,
    credit: 0,
    timestamp: ts("2025-02-10"),
    cleared: false,
    reconciledAt: null,
    reconciledEventId: null,
    statementItemId: null,
    groupId: null,
    ...overrides,
  };
}

function entry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: "entry-1",
    timestamp: ts("2025-02-10"),
    description: "Entry",
    note: null,
    legCount: 2,
    groupId: null,
    ...overrides,
  };
}

describe("signedLegAmount", () => {
  it("asset: debit-positive", () => {
    expect(signedLegAmount(leg({ debit: 100, credit: 0 }), "asset")).toBe(100);
    expect(signedLegAmount(leg({ debit: 0, credit: 100 }), "asset")).toBe(-100);
  });
  it("expense: debit-positive", () => {
    expect(signedLegAmount(leg({ debit: 100, credit: 0 }), "expense")).toBe(100);
    expect(signedLegAmount(leg({ debit: 0, credit: 100 }), "expense")).toBe(-100);
  });
  it("liability: credit-positive", () => {
    expect(signedLegAmount(leg({ debit: 0, credit: 100 }), "liability")).toBe(100);
    expect(signedLegAmount(leg({ debit: 100, credit: 0 }), "liability")).toBe(-100);
  });
  it("equity: credit-positive", () => {
    expect(signedLegAmount(leg({ debit: 0, credit: 100 }), "equity")).toBe(100);
    expect(signedLegAmount(leg({ debit: 100, credit: 0 }), "equity")).toBe(-100);
  });
  it("income: credit-positive", () => {
    expect(signedLegAmount(leg({ debit: 0, credit: 100 }), "income")).toBe(100);
    expect(signedLegAmount(leg({ debit: 100, credit: 0 }), "income")).toBe(-100);
  });
});

describe("buildReconcileRows", () => {
  it("sorts legs by timestamp ascending", () => {
    const l1 = leg({ id: "l-late", entryId: "e-late", debit: 10, timestamp: ts("2025-03-01") });
    const l2 = leg({ id: "l-early", entryId: "e-early", debit: 20, timestamp: ts("2025-01-01") });
    const l3 = leg({ id: "l-mid", entryId: "e-mid", debit: 30, timestamp: ts("2025-02-01") });
    const entries = new Map<string, JournalEntry>([
      ["e-late", entry({ id: "e-late" })],
      ["e-early", entry({ id: "e-early" })],
      ["e-mid", entry({ id: "e-mid" })],
    ]);
    const rows = buildReconcileRows([l1, l2, l3], entries, "asset");
    expect(rows.map((r) => r.leg.id)).toEqual(["l-early", "l-mid", "l-late"]);
  });

  it("accumulates a running balance in sorted order", () => {
    const l1 = leg({ id: "l-1", entryId: "e-1", debit: 100, timestamp: ts("2025-01-01") });
    const l2 = leg({ id: "l-2", entryId: "e-2", credit: 30, timestamp: ts("2025-01-02") });
    const l3 = leg({ id: "l-3", entryId: "e-3", debit: 5, timestamp: ts("2025-01-03") });
    const entries = new Map<string, JournalEntry>([
      ["e-1", entry({ id: "e-1" })],
      ["e-2", entry({ id: "e-2" })],
      ["e-3", entry({ id: "e-3" })],
    ]);
    const rows = buildReconcileRows([l3, l1, l2], entries, "asset");
    expect(rows.map((r) => r.signedAmount)).toEqual([100, -30, 5]);
    expect(rows.map((r) => r.runningBalance)).toEqual([100, 70, 75]);
  });

  it("carries the description from the leg's entry", () => {
    const l = leg({ entryId: "e-1", debit: 10 });
    const entries = new Map<string, JournalEntry>([
      ["e-1", entry({ id: "e-1", description: "Grocery run" })],
    ]);
    const rows = buildReconcileRows([l], entries, "asset");
    expect(rows[0].description).toBe("Grocery run");
  });

  it("computes ageDays from leg timestamp to nowMs for every row", () => {
    const nowMs = ts("2025-02-20").toMillis();
    const l = leg({ entryId: "e-1", debit: 10, timestamp: ts("2025-02-10") });
    const entries = new Map<string, JournalEntry>([["e-1", entry({ id: "e-1" })]]);
    const rows = buildReconcileRows([l], entries, "asset", nowMs);
    expect(rows[0].ageDays).toBe(10);
  });

  it("throws when a leg's entry is missing from entriesById", () => {
    const l = leg({ id: "orphan", entryId: "missing", debit: 10 });
    expect(() => buildReconcileRows([l], new Map(), "asset")).toThrow(/missing/);
  });
});

describe("clearedBalance", () => {
  it("sums only cleared legs", () => {
    const legs = [
      leg({ id: "l-1", debit: 100, cleared: true }),
      leg({ id: "l-2", debit: 50, cleared: false }),
      leg({ id: "l-3", credit: 30, cleared: true }),
    ];
    expect(clearedBalance(legs, "asset")).toBe(70);
  });

  it("returns zero when no legs are cleared", () => {
    expect(clearedBalance([leg({ debit: 100, cleared: false })], "asset")).toBe(0);
  });
});

describe("balancesMatch", () => {
  it("returns true within sub-cent tolerance", () => {
    expect(balancesMatch(100.001, 100.0)).toBe(true);
    expect(balancesMatch(100.0, 100.0)).toBe(true);
  });
  it("returns false for a difference of a cent or more", () => {
    expect(balancesMatch(100.0, 100.01)).toBe(false);
  });
});
