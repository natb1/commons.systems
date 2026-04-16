import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { timestampMockFactory, ts, createMockDataSource } from "../helpers";
import type { DataSource } from "../../src/data-source";
import type { Transaction, Statement } from "../../src/firestore";

vi.mock("firebase/firestore", () => timestampMockFactory());

import { renderAccounts } from "../../src/pages/accounts";

function txn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "txn-1" as any,
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
    statementId: "Bank-Checking-2025-02" as any,
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

describe("accounts page smoke — income statement and cash flow summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-03-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders income statement section with category rows and totals", async () => {
    const transactions = [
      // Feb 2025 — current complete month
      txn({ id: "t-cur-inc" as any, timestamp: ts("2025-02-10"), amount: -5000, category: "Income:Salary" }),
      txn({ id: "t-cur-food" as any, timestamp: ts("2025-02-12"), amount: 400, category: "Food:Groceries" }),
      txn({ id: "t-cur-rent" as any, timestamp: ts("2025-02-01"), amount: 1500, category: "Housing:Rent" }),
      txn({ id: "t-cur-xfer" as any, timestamp: ts("2025-02-20"), amount: 200, category: "Transfer:CardPayment" }),
      // Jan 2025 — prior
      txn({ id: "t-pri-inc" as any, timestamp: ts("2025-01-10"), amount: -5000, category: "Income:Salary" }),
      txn({ id: "t-pri-food" as any, timestamp: ts("2025-01-12"), amount: 500, category: "Food:Groceries" }),
      txn({ id: "t-pri-rent" as any, timestamp: ts("2025-01-01"), amount: 1500, category: "Housing:Rent" }),
      // Feb 2024 — YoY
      txn({ id: "t-yoy-inc" as any, timestamp: ts("2024-02-10"), amount: -4800, category: "Income:Salary" }),
      txn({ id: "t-yoy-food" as any, timestamp: ts("2024-02-12"), amount: 350, category: "Food:Groceries" }),
      txn({ id: "t-yoy-rent" as any, timestamp: ts("2024-02-01"), amount: 1500, category: "Housing:Rent" }),
    ];

    const statements = [
      stmt({ period: "2025-02", balance: 3500, lastTransactionDate: ts("2025-02-20") }),
    ];

    const html = await renderAccounts(seedOptions({
      getTransactions: vi.fn().mockResolvedValue(transactions),
      getStatements: vi.fn().mockResolvedValue(statements),
    }));

    expect(html).toContain('id="accounts-income-statement"');
    expect(html).toContain("<h3>Income statement</h3>");

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
    // Category appears in <td>Transfer</td> form (the top-level name).
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
    expect(html).toContain("<h3>Cash flow summary</h3>");
    expect(html).toContain("Operating");
    expect(html).toContain("Transfers");
    expect(html).toContain("Net change");
  });

  it("renders above charts and above the accounts table", async () => {
    const transactions = [
      txn({ id: "t1" as any, timestamp: ts("2025-02-10"), amount: -1000, category: "Income:Salary" }),
      txn({ id: "t2" as any, timestamp: ts("2025-02-15"), amount: 250, category: "Food:Groceries" }),
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

  it("returns no income statement section when there are no transactions in current month", async () => {
    const transactions = [
      txn({ id: "t-old-1" as any, timestamp: ts("2023-05-01"), amount: -1000, category: "Income:Salary" }),
      txn({ id: "t-old-2" as any, timestamp: ts("2023-06-15"), amount: 300, category: "Food:Groceries" }),
    ];
    const statements = [
      stmt({ period: "2023-06", balance: 500, lastTransactionDate: ts("2023-06-15") }),
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
      txn({ id: "t-cur-inc" as any, timestamp: ts("2025-02-10"), amount: -2000, category: "Income:Salary" }),
      txn({ id: "t-cur-food" as any, timestamp: ts("2025-02-12"), amount: 300, category: "Food:Groceries" }),
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

    // Em dash appears in variance cells when prior and YoY are missing.
    const emDashCount = (html.match(/\u2014/g) ?? []).length;
    expect(emDashCount).toBeGreaterThanOrEqual(2);
  });

  it("only-transfer month: income and expense tables empty, cash flow shows transfers", async () => {
    const transactions = [
      txn({ id: "t-x1" as any, timestamp: ts("2025-02-05"), amount: 200, category: "Transfer:CardPayment" }),
      txn({ id: "t-x2" as any, timestamp: ts("2025-02-12"), amount: 150, category: "Transfer:CardPayment" }),
      txn({ id: "t-x3" as any, timestamp: ts("2025-02-20"), amount: -100, category: "Transfer:CardPayment" }),
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
    // Either "+$" (positive) or "\u2212$" (minus, U+2212) should appear for transfers.
    const hasSignedCurrency = cashFlowHtml.includes("+$") || cashFlowHtml.includes("\u2212$");
    expect(hasSignedCurrency).toBe(true);
  });

  it("excludes non-primary normalized duplicates from income/expense totals", async () => {
    const transactions = [
      txn({
        id: "t-prim" as any,
        timestamp: ts("2025-02-10"),
        amount: 100,
        category: "Food",
        normalizedId: "norm-1" as any,
        normalizedPrimary: true,
      }),
      txn({
        id: "t-dup" as any,
        timestamp: ts("2025-02-11"),
        amount: 100,
        category: "Food",
        normalizedId: "norm-1" as any,
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
