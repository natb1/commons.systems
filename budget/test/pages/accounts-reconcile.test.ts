import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DataSource } from "../../src/data-source";
import { timestampMockFactory, createMockDataSource, ts } from "../helpers";

vi.mock("firebase/firestore", () => timestampMockFactory());

import { renderReconcileHtml, parseReconcileQuery } from "../../src/pages/accounts-reconcile";
import type {
  StatementItem,
  StatementItemId,
  Transaction,
  TransactionId,
  Statement,
  ReconciliationNote,
} from "../../src/firestore";

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
    category: "Food",
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

function stmt(overrides: Partial<Statement> = {}): Statement {
  return {
    id: "s-1",
    statementId: "stmt-1" as any,
    institution: "Bank",
    account: "Checking",
    balance: 1000,
    period: "2025-02",
    balanceDate: null,
    lastTransactionDate: null,
    groupId: null,
    virtual: false,
    ...overrides,
  };
}

describe("parseReconcileQuery", () => {
  it("returns defaults for empty query string", () => {
    const q = parseReconcileQuery("");
    expect(q.institution).toBeNull();
    expect(q.account).toBeNull();
    expect(q.period).toBeNull();
    expect(q.toleranceDays).toBe(3);
  });

  it("parses full query", () => {
    const q = parseReconcileQuery("?institution=Bank&account=Checking&period=2025-02&tolerance=7");
    expect(q.institution).toBe("Bank");
    expect(q.account).toBe("Checking");
    expect(q.period).toBe("2025-02");
    expect(q.toleranceDays).toBe(7);
  });

  it("ignores tolerance values outside [0, 30]", () => {
    expect(parseReconcileQuery("?tolerance=-1").toleranceDays).toBe(3);
    expect(parseReconcileQuery("?tolerance=31").toleranceDays).toBe(3);
    expect(parseReconcileQuery("?tolerance=abc").toleranceDays).toBe(3);
  });
});

describe("renderReconcileHtml", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a prompt when no account selected", () => {
    const html = renderReconcileHtml({
      statementItems: [],
      transactions: [],
      statements: [stmt()],
      notes: [],
      query: { institution: null, account: null, period: null, toleranceDays: 3 },
    });
    expect(html).toContain("Select an account and period to reconcile");
    expect(html).toContain("reconcile-controls");
  });

  it("renders three columns with seeded data", () => {
    const nowMs = ts("2025-02-20").toMillis();
    const items = [
      item({ id: "si-m", statementItemId: "si-m" as StatementItemId, amount: -50, timestamp: ts("2025-02-10"), description: "Matched Store" }),
      item({ id: "si-u", statementItemId: "si-u" as StatementItemId, amount: -10, timestamp: ts("2025-02-15"), description: "Unmatched Store" }),
    ];
    const txns = [
      txn({ id: "t-match" as TransactionId, amount: 50, timestamp: ts("2025-02-10"), description: "Matched Txn" }),
      txn({ id: "t-only" as TransactionId, amount: 88, timestamp: ts("2025-02-12"), description: "Only Txn" }),
    ];
    const html = renderReconcileHtml({
      statementItems: items,
      transactions: txns,
      statements: [stmt()],
      notes: [],
      query: { institution: "Bank", account: "Checking", period: "2025-02", toleranceDays: 3 },
      nowMs,
    });
    expect(html).toMatch(/Matched \(1\)/);
    expect(html).toMatch(/Unmatched statement items \(1\)/);
    expect(html).toMatch(/Unmatched transactions \(1\)/);
    expect(html).toContain("Matched Store");
    expect(html).toContain("Unmatched Store");
    expect(html).toContain("Only Txn");
  });

  it("renders Confirm button for suggested matches and omits it for explicit matches", () => {
    const explicitItem = item({ id: "si-e", statementItemId: "si-e" as StatementItemId, amount: -100, timestamp: ts("2025-02-10") });
    const suggestedItem = item({ id: "si-s", statementItemId: "si-s" as StatementItemId, amount: -30, timestamp: ts("2025-02-12"), description: "SuggestedItem" });
    const txns = [
      txn({ id: "t-explicit" as TransactionId, amount: 100, timestamp: ts("2025-02-10"), statementItemId: "si-e" as StatementItemId }),
      txn({ id: "t-suggested" as TransactionId, amount: 30, timestamp: ts("2025-02-12"), description: "SuggestedTxn" }),
    ];
    const html = renderReconcileHtml({
      statementItems: [explicitItem, suggestedItem],
      transactions: txns,
      statements: [stmt()],
      notes: [],
      query: { institution: "Bank", account: "Checking", period: "2025-02", toleranceDays: 3 },
    });
    expect(html).toContain("reconcile-match-suggested");
    expect(html).toContain("reconcile-match-explicit");
    const suggestedIdx = html.indexOf("reconcile-match-suggested");
    expect(html.slice(suggestedIdx).includes("Confirm match")).toBe(true);
  });

  it("renders an aging badge for items older than 30 days", () => {
    const nowMs = ts("2025-03-20").toMillis();
    const oldItem = item({ timestamp: ts("2025-02-01"), description: "Old" });
    const freshItem = item({ id: "si-fresh", statementItemId: "si-fresh" as StatementItemId, timestamp: ts("2025-03-15"), description: "Fresh" });
    const html = renderReconcileHtml({
      statementItems: [oldItem, freshItem],
      transactions: [],
      statements: [stmt()],
      notes: [],
      query: { institution: "Bank", account: "Checking", period: "2025-02", toleranceDays: 3 },
      nowMs,
    });
    expect(html).toMatch(/reconcile-aging.*47d/);
  });

  it("renders classification selects for unmatched items", () => {
    const html = renderReconcileHtml({
      statementItems: [item()],
      transactions: [],
      statements: [stmt()],
      notes: [],
      query: { institution: "Bank", account: "Checking", period: "2025-02", toleranceDays: 3 },
    });
    expect(html).toContain("reconcile-classification");
    expect(html).toContain("Timing");
    expect(html).toContain("Missing entry");
    expect(html).toContain("Discrepancy");
  });

  it("renders existing classification when a reconciliation note is present", () => {
    const note: ReconciliationNote = {
      id: "statementItem_si-1",
      entityType: "statementItem",
      entityId: "si-1",
      classification: "timing",
      note: "waiting on post",
      updatedAt: ts("2025-02-20"),
      updatedBy: "user@example.com",
      groupId: null,
    };
    const html = renderReconcileHtml({
      statementItems: [item()],
      transactions: [],
      statements: [stmt()],
      notes: [note],
      query: { institution: "Bank", account: "Checking", period: "2025-02", toleranceDays: 3 },
    });
    expect(html).toContain('value="timing" selected');
    expect(html).toContain("waiting on post");
  });

  it("tolerance change re-classifies items as matched", () => {
    const items = [item({ timestamp: ts("2025-02-05") })];
    const txns = [txn({ timestamp: ts("2025-02-10") })];
    const loose = renderReconcileHtml({
      statementItems: items,
      transactions: txns,
      statements: [stmt()],
      notes: [],
      query: { institution: "Bank", account: "Checking", period: "2025-02", toleranceDays: 7 },
    });
    expect(loose).toMatch(/Matched \(1\)/);
    const tight = renderReconcileHtml({
      statementItems: items,
      transactions: txns,
      statements: [stmt()],
      notes: [],
      query: { institution: "Bank", account: "Checking", period: "2025-02", toleranceDays: 3 },
    });
    expect(tight).toMatch(/Matched \(0\)/);
  });
});
