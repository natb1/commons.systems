import { describe, it, expect, vi, beforeEach } from "vitest";
import { timestampMockFactory, ts, createMockDataSource } from "../helpers";
import type { DataSource } from "../../src/data-source";
import type { StatementItem, StatementItemId, Statement, Transaction, TransactionId } from "../../src/firestore";

vi.mock("firebase/firestore", () => timestampMockFactory());

import { renderAccountsReconcile } from "../../src/pages/accounts-reconcile";

function item(overrides: Partial<StatementItem> = {}): StatementItem {
  return {
    id: "si-1",
    statementItemId: "si-1" as StatementItemId,
    statementId: "stmt-1" as any,
    institution: "Bank",
    account: "Checking",
    period: "2025-02",
    amount: -42.17,
    timestamp: ts("2025-02-08"),
    description: "SHELL GAS",
    fitid: "F1",
    groupId: null,
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

function txn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "t-1" as TransactionId,
    institution: "Bank",
    account: "Checking",
    description: "Gas Station",
    amount: 42.17,
    note: "",
    category: "Transportation:Fuel",
    reimbursement: 0,
    budget: null,
    timestamp: ts("2025-02-08"),
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

function seedOptions(dsOverrides: Partial<DataSource> = {}) {
  return { authorized: false, groupName: "", dataSource: createMockDataSource(dsOverrides) };
}

describe("accounts-reconcile page smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // location.search drives parseReconcileQuery
    // @ts-expect-error jsdom allows reassigning location
    window.history.replaceState(null, "", "/accounts/reconcile?institution=Bank&account=Checking&period=2025-02");
  });

  it("renders heading, controls, and three-column skeleton", async () => {
    const html = await renderAccountsReconcile(seedOptions({
      getStatementItems: vi.fn().mockResolvedValue([item()]),
      getTransactions: vi.fn().mockResolvedValue([txn()]),
      getStatements: vi.fn().mockResolvedValue([stmt()]),
      getReconciliationNotes: vi.fn().mockResolvedValue([]),
    }));
    expect(html).toContain("<h2>Reconcile account</h2>");
    expect(html).toContain('id="reconcile-container"');
    expect(html).toContain('id="reconcile-controls"');
    expect(html).toContain("reconcile-column-matched");
    expect(html).toContain("reconcile-column-unmatched-items");
    expect(html).toContain("reconcile-column-unmatched-txns");
  });

  it("renders account and period selectors from statements", async () => {
    const html = await renderAccountsReconcile(seedOptions({
      getStatementItems: vi.fn().mockResolvedValue([]),
      getTransactions: vi.fn().mockResolvedValue([]),
      getStatements: vi.fn().mockResolvedValue([
        stmt({ institution: "Bank", account: "Checking", period: "2025-01" }),
        stmt({ institution: "Bank", account: "Checking", period: "2025-02" }),
        stmt({ institution: "Credit Union", account: "Savings", period: "2025-02" }),
      ]),
      getReconciliationNotes: vi.fn().mockResolvedValue([]),
    }));
    expect(html).toContain('id="reconcile-account-select"');
    expect(html).toContain('id="reconcile-period-select"');
    expect(html).toContain("Bank — Checking");
    expect(html).toContain("Credit Union — Savings");
  });

  it("renders seed-data notice when not authorized", async () => {
    const html = await renderAccountsReconcile(seedOptions());
    expect(html).toContain("seed-data-notice");
  });
});
