import { describe, it, expect, vi } from "vitest";
import { timestampMockFactory, ts } from "./helpers";

vi.mock("firebase/firestore", () => timestampMockFactory());

import {
  reconcile,
  isAged,
  AGING_THRESHOLD_DAYS,
  signedLegAmount,
  buildReconcileRows,
  clearedBalance,
  balancesMatch,
} from "../src/reconciliation";
import type {
  JournalEntry,
  JournalLeg,
  StatementItem,
  StatementItemId,
  Transaction,
  TransactionId,
} from "../src/firestore";

function item(overrides: Partial<StatementItem> = {}): StatementItem {
  return {
    id: "si-1",
    statementItemId: "si-1" as StatementItemId,
    statementId: "stmt-1" as any,
    institution: "Bank",
    account: "Checking",
    period: "2025-02",
    amount: -20,
    timestamp: ts("2025-02-10"),
    description: "Coffee Shop",
    fitid: "F1",
    groupId: null,
    ...overrides,
  };
}

function txn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "t-1" as TransactionId,
    institution: "Bank",
    account: "Checking",
    description: "Coffee Shop",
    amount: 20,
    note: "",
    category: "Food:Coffee",
    reimbursement: 0,
    budget: null,
    timestamp: ts("2025-02-10"),
    statementId: null,
    statementItemId: null,
    groupId: null,
    normalizedId: null,
    normalizedPrimary: true,
    normalizedDescription: null,
    virtual: false,
    ...overrides,
  };
}

describe("reconcile", () => {
  it("returns empty result for empty inputs", () => {
    const r = reconcile([], [], 3);
    expect(r.matched).toEqual([]);
    expect(r.unmatchedItems).toEqual([]);
    expect(r.unmatchedTransactions).toEqual([]);
  });

  it("explicit link matches regardless of date/amount", () => {
    const i = item({ amount: -100, timestamp: ts("2025-01-01") });
    const t = txn({
      statementItemId: i.statementItemId,
      amount: 200, // amount mismatch intentional — explicit link wins
      timestamp: ts("2025-03-30"),
    });
    const r = reconcile([i], [t], 3);
    expect(r.matched).toHaveLength(1);
    expect(r.matched[0].matchType).toBe("explicit");
    expect(r.unmatchedItems).toHaveLength(0);
    expect(r.unmatchedTransactions).toHaveLength(0);
  });

  it("suggests a match when amount and date align within tolerance", () => {
    const i = item({ amount: -16.19, timestamp: ts("2025-02-10") });
    const t = txn({ amount: 16.19, timestamp: ts("2025-02-12") });
    const r = reconcile([i], [t], 3);
    expect(r.matched).toHaveLength(1);
    expect(r.matched[0].matchType).toBe("suggested");
    expect(r.unmatchedItems).toHaveLength(0);
    expect(r.unmatchedTransactions).toHaveLength(0);
  });

  it("does not suggest a match outside the date tolerance", () => {
    const i = item({ timestamp: ts("2025-02-01") });
    const t = txn({ timestamp: ts("2025-02-10") });
    const r = reconcile([i], [t], 3);
    expect(r.matched).toHaveLength(0);
    expect(r.unmatchedItems).toHaveLength(1);
    expect(r.unmatchedTransactions).toHaveLength(1);
  });

  it("does not suggest a match when amounts differ by a cent or more", () => {
    const i = item({ amount: -10.00 });
    const t = txn({ amount: 10.01 });
    const r = reconcile([i], [t], 3);
    expect(r.matched).toHaveLength(0);
    expect(r.unmatchedItems).toHaveLength(1);
    expect(r.unmatchedTransactions).toHaveLength(1);
  });

  it("prefers smaller date delta on tie in amount", () => {
    const i = item({ amount: -50, timestamp: ts("2025-02-10") });
    const farTxn = txn({ id: "t-far" as TransactionId, amount: 50, timestamp: ts("2025-02-13") });
    const nearTxn = txn({ id: "t-near" as TransactionId, amount: 50, timestamp: ts("2025-02-11") });
    const r = reconcile([i], [farTxn, nearTxn], 3);
    expect(r.matched).toHaveLength(1);
    expect(r.matched[0].txn.id).toBe("t-near");
    expect(r.unmatchedTransactions.map((u) => u.txn.id)).toEqual(["t-far"]);
  });

  it("greedy one-to-one: each item and transaction appears at most once", () => {
    const i1 = item({ id: "si-1", statementItemId: "si-1" as StatementItemId, amount: -30, timestamp: ts("2025-02-10") });
    const i2 = item({ id: "si-2", statementItemId: "si-2" as StatementItemId, amount: -30, timestamp: ts("2025-02-10") });
    const t1 = txn({ id: "t-1" as TransactionId, amount: 30, timestamp: ts("2025-02-10") });
    const r = reconcile([i1, i2], [t1], 3);
    expect(r.matched).toHaveLength(1);
    expect(r.unmatchedItems).toHaveLength(1);
    expect(r.unmatchedTransactions).toHaveLength(0);
  });

  it("computes ageDays from item timestamp to nowMs", () => {
    const nowMs = ts("2025-03-15").toMillis();
    const i = item({ timestamp: ts("2025-02-10") });
    const r = reconcile([i], [], 3, nowMs);
    expect(r.unmatchedItems).toHaveLength(1);
    expect(r.unmatchedItems[0].ageDays).toBe(33);
  });

  it("transactions without a timestamp are not candidates for suggestion", () => {
    const i = item();
    const t = txn({ timestamp: null });
    const r = reconcile([i], [t], 3);
    expect(r.matched).toHaveLength(0);
    expect(r.unmatchedItems).toHaveLength(1);
    expect(r.unmatchedTransactions).toHaveLength(1);
  });

  it("throws RangeError for a negative tolerance", () => {
    expect(() => reconcile([], [], -1)).toThrow(RangeError);
  });
});

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
