import { describe, it, expect, vi } from "vitest";
import { timestampMockFactory, ts } from "./helpers";

vi.mock("firebase/firestore", () => timestampMockFactory());

import { reconcile, isAged, AGING_THRESHOLD_DAYS } from "../src/reconciliation";
import type { StatementItem, StatementItemId, Transaction, TransactionId } from "../src/firestore";

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
