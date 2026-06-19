// @vitest-environment happy-dom
//
// Smoke test for the React <Accounts> page (income statement + cash flow
// summary). Ported from the legacy renderAccounts string-render smoke (deleted
// in Unit 4): the accounts route is React now, so we render <Accounts options=…>
// and read the settled innerHTML, keeping the original substring assertions.
//
// The report's "current month" is derived from Date.now(); we pin it with a
// Date.now spy (not vi.useFakeTimers, which would stall the async load effect /
// waitFor). The three chart renderers are stubbed to no-ops so the island effect
// never touches d3 / readThemeVar (mirroring Accounts.test.tsx).
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

// Render <Accounts> and resolve once the async load effect settles into the
// loaded body or the inline error region; return the container's innerHTML
// (mirrors Accounts.test.tsx so the legacy substring assertions still apply).
async function renderAccounts(options: Parameters<typeof Accounts>[0]["options"]): Promise<string> {
  const { container } = render(createElement(Accounts, { options }));
  await waitFor(() => {
    const settled =
      container.querySelector("#accounts-table") ||
      container.querySelector("#accounts-error") ||
      container.querySelector("p");
    if (!settled) throw new Error("not settled");
  });
  return container.innerHTML;
}

describe("accounts page smoke — income statement and cash flow summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // happy-dom lacks ResizeObserver; the chart island constructs one.
    class FakeRO { observe() {} unobserve() {} disconnect() {} }
    vi.stubGlobal("ResizeObserver", FakeRO);
    // Pin "now" so the report's current month is deterministic (2025-03-15).
    vi.spyOn(Date, "now").mockReturnValue(new Date("2025-03-15T12:00:00Z").getTime());
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders income statement section with category rows and totals", async () => {
    const transactions = [
      // Feb 2025 — current complete month
      txn({ id: "t-cur-inc" as never, timestamp: ts("2025-02-10"), amount: -5000, category: "Income:Salary" }),
      txn({ id: "t-cur-food" as never, timestamp: ts("2025-02-12"), amount: 400, category: "Food:Groceries" }),
      txn({ id: "t-cur-rent" as never, timestamp: ts("2025-02-01"), amount: 1500, category: "Housing:Rent" }),
      txn({ id: "t-cur-xfer" as never, timestamp: ts("2025-02-20"), amount: 200, category: "Transfer:CardPayment" }),
      // Jan 2025 — prior
      txn({ id: "t-pri-inc" as never, timestamp: ts("2025-01-10"), amount: -5000, category: "Income:Salary" }),
      txn({ id: "t-pri-food" as never, timestamp: ts("2025-01-12"), amount: 500, category: "Food:Groceries" }),
      txn({ id: "t-pri-rent" as never, timestamp: ts("2025-01-01"), amount: 1500, category: "Housing:Rent" }),
      // Feb 2024 — YoY
      txn({ id: "t-yoy-inc" as never, timestamp: ts("2024-02-10"), amount: -4800, category: "Income:Salary" }),
      txn({ id: "t-yoy-food" as never, timestamp: ts("2024-02-12"), amount: 350, category: "Food:Groceries" }),
      txn({ id: "t-yoy-rent" as never, timestamp: ts("2024-02-01"), amount: 1500, category: "Housing:Rent" }),
    ];

    const statements = [
      stmt({ period: "2025-02", balance: 3500, lastTransactionDate: ts("2025-02-20") }),
    ];

    const html = await renderAccounts(seedOptions({
      getTransactions: vi.fn().mockResolvedValue(transactions),
      getStatements: vi.fn().mockResolvedValue(statements),
    }));

    expect(html).toContain('id="accounts-income-statement"');
    expect(html).toContain("Income statement");

    // Top-level category names
    expect(html).toContain("Income");
    expect(html).toContain("Food");
    expect(html).toContain("Housing");

    // Transfers should not appear as rows in the income or expense tables.
    const incomeTableStart = html.indexOf('id="accounts-income-table"');
    const expensesTableStart = html.indexOf('id="accounts-expenses-table"');
    const netTableStart = html.indexOf('id="accounts-net-income-table"');
    expect(incomeTableStart).toBeGreaterThan(-1);
    expect(expensesTableStart).toBeGreaterThan(-1);
    expect(netTableStart).toBeGreaterThan(-1);

    const incomeTableHtml = html.slice(incomeTableStart, expensesTableStart);
    const expensesTableHtml = html.slice(expensesTableStart, netTableStart);
    // Transfer category must not be emitted as a row in either table.
    expect(incomeTableHtml).not.toContain("<td>Transfer</td>");
    expect(expensesTableHtml).not.toContain("<td>Transfer</td>");

    // Formatted amounts
    expect(html).toContain("$5,000.00");
    expect(html).toContain("$400.00");
    expect(html).toContain("$1,500.00");

    // Column headers for the three periods
    expect(html).toContain("Feb 2025");
    expect(html).toContain("Jan 2025");
    expect(html).toContain("Feb 2024");

    // Totals and summary row labels
    expect(html).toContain("Total income");
    expect(html).toContain("Total expenses");
    expect(html).toContain("Net income");
    expect(html).toContain("Savings rate");

    // Cash flow summary section
    expect(html).toContain('id="accounts-cash-flow-summary"');
    expect(html).toContain("Cash flow summary");
    expect(html).toContain("Operating");
    expect(html).toContain("Transfers");
    expect(html).toContain("Net change");
  });

  it("renders above charts and above the accounts table", async () => {
    const transactions = [
      txn({ id: "t1" as never, timestamp: ts("2025-02-10"), amount: -1000, category: "Income:Salary" }),
      txn({ id: "t2" as never, timestamp: ts("2025-02-15"), amount: 250, category: "Food:Groceries" }),
    ];
    const statements = [
      stmt({ period: "2025-02", balance: 1000, lastTransactionDate: ts("2025-02-15") }),
    ];

    const html = await renderAccounts(seedOptions({
      getTransactions: vi.fn().mockResolvedValue(transactions),
      getStatements: vi.fn().mockResolvedValue(statements),
    }));

    const incomeStatementIdx = html.indexOf('id="accounts-income-statement"');
    const trendChartIdx = html.indexOf('id="accounts-trend-chart"');
    const tableIdx = html.indexOf('id="accounts-table"');

    expect(incomeStatementIdx).toBeGreaterThan(-1);
    expect(trendChartIdx).toBeGreaterThan(-1);
    expect(tableIdx).toBeGreaterThan(-1);

    expect(incomeStatementIdx).toBeLessThan(trendChartIdx);
    expect(trendChartIdx).toBeLessThan(tableIdx);
  });

  it("hides sections when all transactions are in the current partial month", async () => {
    // nowMs = 2025-03-15; only March transactions exist (the current partial
    // month is excluded), so no complete month has data.
    const transactions = [
      txn({ id: "t-new-1" as never, timestamp: ts("2025-03-01"), amount: -1000, category: "Income:Salary" }),
      txn({ id: "t-new-2" as never, timestamp: ts("2025-03-10"), amount: 300, category: "Food:Groceries" }),
    ];
    const statements = [
      stmt({ period: "2025-03", balance: 700, lastTransactionDate: ts("2025-03-10") }),
    ];

    const html = await renderAccounts(seedOptions({
      getTransactions: vi.fn().mockResolvedValue(transactions),
      getStatements: vi.fn().mockResolvedValue(statements),
    }));

    expect(html).not.toContain('id="accounts-income-statement"');
    expect(html).not.toContain('id="accounts-cash-flow-summary"');
    // The accounts table still renders.
    expect(html).toContain('id="accounts-table"');
  });

  it("renders report with only current-month data (variance cells show em dash)", async () => {
    const transactions = [
      txn({ id: "t-cur-inc" as never, timestamp: ts("2025-02-10"), amount: -2000, category: "Income:Salary" }),
      txn({ id: "t-cur-food" as never, timestamp: ts("2025-02-12"), amount: 300, category: "Food:Groceries" }),
    ];
    const statements = [
      stmt({ period: "2025-02", balance: 1700, lastTransactionDate: ts("2025-02-12") }),
    ];

    const html = await renderAccounts(seedOptions({
      getTransactions: vi.fn().mockResolvedValue(transactions),
      getStatements: vi.fn().mockResolvedValue(statements),
    }));

    expect(html).toContain('id="accounts-income-statement"');

    // Current-month amounts are rendered
    expect(html).toContain("$2,000.00");
    expect(html).toContain("$300.00");

    // Em dash appears in variance cells when prior and YoY are missing. Scope the
    // count to the income table so unrelated em dashes do not inflate the total.
    const incomeTableStart = html.indexOf('id="accounts-income-table"');
    const expensesTableStart = html.indexOf('id="accounts-expenses-table"');
    expect(incomeTableStart).toBeGreaterThan(-1);
    expect(expensesTableStart).toBeGreaterThan(incomeTableStart);
    const incomeTableHtml = html.slice(incomeTableStart, expensesTableStart);
    const emDashCount = (incomeTableHtml.match(/—/g) ?? []).length;
    expect(emDashCount).toBeGreaterThanOrEqual(2);
  });

  it("renders negative netChange with U+2212 minus and variance-negative class", async () => {
    const transactions = [
      // Feb 2025 — current month: expenses > income, producing negative operating + netChange
      txn({ id: "t-cur-inc" as never, timestamp: ts("2025-02-10"), amount: -500, category: "Income:Salary" }),
      txn({ id: "t-cur-food" as never, timestamp: ts("2025-02-12"), amount: 1000, category: "Food:Groceries" }),
    ];
    const statements = [
      stmt({ period: "2025-02", balance: -500, lastTransactionDate: ts("2025-02-12") }),
    ];

    const html = await renderAccounts(seedOptions({
      getTransactions: vi.fn().mockResolvedValue(transactions),
      getStatements: vi.fn().mockResolvedValue(statements),
    }));

    const cashFlowStart = html.indexOf('id="accounts-cash-flow-table"');
    expect(cashFlowStart).toBeGreaterThan(-1);
    const cashFlowHtml = html.slice(cashFlowStart);
    expect(cashFlowHtml).toContain("−$");
    expect(cashFlowHtml).toContain("variance-negative");
  });

  it("only-transfer month: income and expense tables empty, cash flow shows transfers", async () => {
    const transactions = [
      txn({ id: "t-x1" as never, timestamp: ts("2025-02-05"), amount: 200, category: "Transfer:CardPayment" }),
      txn({ id: "t-x2" as never, timestamp: ts("2025-02-12"), amount: 150, category: "Transfer:CardPayment" }),
      txn({ id: "t-x3" as never, timestamp: ts("2025-02-20"), amount: -100, category: "Transfer:CardPayment" }),
    ];
    const statements = [
      stmt({ period: "2025-02", balance: 2000, lastTransactionDate: ts("2025-02-20") }),
    ];

    const html = await renderAccounts(seedOptions({
      getTransactions: vi.fn().mockResolvedValue(transactions),
      getStatements: vi.fn().mockResolvedValue(statements),
    }));

    expect(html).toContain('id="accounts-income-statement"');
    expect(html).toContain('id="accounts-cash-flow-summary"');

    // Empty-row placeholders for income and expenses.
    expect(html).toContain("No income this period.");
    expect(html).toContain("No expenses this period.");

    // Totals all zero
    expect(html).toContain("$0.00");

    // Transfers row in cash flow contains a signed currency.
    const cashFlowStart = html.indexOf('id="accounts-cash-flow-table"');
    expect(cashFlowStart).toBeGreaterThan(-1);
    const cashFlowHtml = html.slice(cashFlowStart);
    const hasSignedCurrency = cashFlowHtml.includes("+$") || cashFlowHtml.includes("−$");
    expect(hasSignedCurrency).toBe(true);
  });

  it("renders sections against stale fixture data (nowMs well after latest transaction)", async () => {
    // Simulate seed data that has not been refreshed: 'current' should still fall
    // back to the latest complete month with data (Feb 2025), not hide.
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-04-15T12:00:00Z").getTime());

    const transactions = [
      // Feb 2025 — latest month with data
      txn({ id: "t-cur-inc" as never, timestamp: ts("2025-02-10"), amount: -5000, category: "Income:Salary" }),
      txn({ id: "t-cur-food" as never, timestamp: ts("2025-02-12"), amount: 400, category: "Food:Groceries" }),
      // Jan 2025 — prior
      txn({ id: "t-pri-inc" as never, timestamp: ts("2025-01-10"), amount: -5000, category: "Income:Salary" }),
      txn({ id: "t-pri-food" as never, timestamp: ts("2025-01-12"), amount: 500, category: "Food:Groceries" }),
      // Feb 2024 — YoY
      txn({ id: "t-yoy-inc" as never, timestamp: ts("2024-02-10"), amount: -4800, category: "Income:Salary" }),
      txn({ id: "t-yoy-food" as never, timestamp: ts("2024-02-12"), amount: 350, category: "Food:Groceries" }),
    ];
    const statements = [
      stmt({ period: "2025-02", balance: 3500, lastTransactionDate: ts("2025-02-12") }),
    ];

    const html = await renderAccounts(seedOptions({
      getTransactions: vi.fn().mockResolvedValue(transactions),
      getStatements: vi.fn().mockResolvedValue(statements),
    }));

    expect(html).toContain('id="accounts-income-statement"');
    expect(html).toContain('id="accounts-cash-flow-summary"');
    expect(html).toContain("Feb 2025");
    expect(html).toContain("Jan 2025");
    expect(html).toContain("Feb 2024");
  });

  it("excludes non-primary normalized duplicates from income/expense totals", async () => {
    const transactions = [
      txn({
        id: "t-prim" as never,
        timestamp: ts("2025-02-10"),
        amount: 100,
        category: "Food",
        normalizedId: "norm-1" as never,
        normalizedPrimary: true,
      }),
      txn({
        id: "t-dup" as never,
        timestamp: ts("2025-02-11"),
        amount: 100,
        category: "Food",
        normalizedId: "norm-1" as never,
        normalizedPrimary: false,
      }),
    ];
    const statements = [
      stmt({ period: "2025-02", balance: 900, lastTransactionDate: ts("2025-02-11") }),
    ];

    const html = await renderAccounts(seedOptions({
      getTransactions: vi.fn().mockResolvedValue(transactions),
      getStatements: vi.fn().mockResolvedValue(statements),
    }));

    expect(html).toContain('id="accounts-income-statement"');
    // The primary transaction is counted.
    expect(html).toContain("$100.00");
    // The duplicate is NOT counted, so no Food expense total of $200.00 should appear.
    expect(html).not.toContain("$200.00");
  });
});
