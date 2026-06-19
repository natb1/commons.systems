// @vitest-environment happy-dom
//
// Smoke test for the React <Accounts> page (multi-account aggregation). Ported
// from the legacy renderAccounts string-render smoke (deleted in Unit 4): the
// accounts route is React now, so we render <Accounts options=…> and assert the
// observable DOM. Compute helpers (buildAccountRows / computeDerivedBalances)
// are the real reused implementations; only the three chart RENDERERS are
// stubbed to no-ops so the island effect never touches d3 / readThemeVar
// (mirroring Accounts.test.tsx).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { timestampMockFactory, ts, createMockDataSource } from "../helpers";
import type { DataSource } from "../../src/data-source";
import type { Transaction, Statement } from "../../src/firestore";

vi.mock("firebase/firestore", () => timestampMockFactory());

vi.mock("../../src/pages/budgets-trend-chart.js", () => ({ renderAggregateTrendChart: vi.fn(() => ({ weeks: [] })) }));
vi.mock("../../src/pages/accounts-net-worth-chart.js", () => ({ renderNetWorthChart: vi.fn(() => ({ weeks: [] })) }));
vi.mock("../../src/pages/accounts-cash-flow-chart.js", () => ({ renderCashFlowChart: vi.fn(() => ({ weeks: [] })) }));

import { Accounts } from "../../src/pages/Accounts";

function txn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "txn-1" as never,
    institution: "Bank",
    account: "Checking",
    description: "Test",
    amount: 50,
    note: "",
    category: "Food",
    reimbursement: 0,
    budget: null,
    timestamp: ts("2025-02-15"),
    statementId: null,
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
    id: "stmt-1",
    statementId: "Bank-Checking-2025-02" as never,
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

function seedOptions(dsOverrides: Partial<DataSource> = {}) {
  return { authorized: false, groupName: "", dataSource: createMockDataSource(dsOverrides) };
}

describe("accounts page smoke — multi-account aggregation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("aggregates accounts from statements with correct row count", async () => {
    const transactions = [
      txn({ id: "t1" as never, institution: "Bank", account: "Checking", timestamp: ts("2025-02-20"), amount: 75 }),
      txn({ id: "t4" as never, institution: "Bank", account: "Savings", timestamp: ts("2025-01-20"), amount: 300 }),
      txn({ id: "t6" as never, institution: "Credit Union", account: "Checking", timestamp: ts("2025-02-10"), amount: 120 }),
    ];

    const statements = [
      stmt({ id: "s1", institution: "Bank", account: "Checking", period: "2025-01", balance: 3000, lastTransactionDate: ts("2025-01-10") }),
      stmt({ id: "s2", institution: "Bank", account: "Checking", period: "2025-02", balance: 3500, lastTransactionDate: ts("2025-02-20") }),
      stmt({ id: "s3", institution: "Bank", account: "Savings", period: "2025-01", balance: 10000, lastTransactionDate: ts("2025-01-20") }),
      stmt({ id: "s4", institution: "Credit Union", account: "Checking", period: "2025-02", balance: 500, lastTransactionDate: ts("2025-02-10") }),
    ];

    const { container } = render(createElement(Accounts, {
      options: seedOptions({
        getTransactions: vi.fn().mockResolvedValue(transactions),
        getStatements: vi.fn().mockResolvedValue(statements),
      }),
    }));

    await waitFor(() => expect(container.querySelector("#accounts-table")).not.toBeNull());

    // 3 accounts → 3 <tr> rows in the accounts-table <tbody>.
    const tbody = container.querySelector("#accounts-table tbody")!;
    expect(tbody.querySelectorAll("tr")).toHaveLength(3);

    // Bank/Checking gets latest statement balance ($3,500.00).
    expect(container.textContent).toContain("$3,500.00");
    // Bank/Savings gets its statement balance ($10,000.00).
    expect(container.textContent).toContain("$10,000.00");
    // Credit Union/Checking has statement with balance ($500.00).
    expect(container.textContent).toContain("Credit Union");
    expect(container.textContent).toContain("$500.00");
  });

  it("table structure has expected column headers", async () => {
    const { container } = render(createElement(Accounts, {
      options: seedOptions({
        getTransactions: vi.fn().mockResolvedValue([]),
        getStatements: vi.fn().mockResolvedValue([
          stmt({ institution: "Bank", account: "Checking", lastTransactionDate: ts("2025-02-15") }),
        ]),
      }),
    }));

    await waitFor(() => expect(container.querySelector("#accounts-table")).not.toBeNull());

    const headers = [...container.querySelectorAll("#accounts-table thead th")].map((th) => th.textContent);
    expect(headers).toContain("Institution");
    expect(headers).toContain("Account");
    expect(headers).toContain("Most recent transaction");
    expect(headers).toContain("Balance");
    expect(headers).toContain("Derived");
  });
});
