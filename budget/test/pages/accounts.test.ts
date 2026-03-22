import { describe, it, expect, vi, beforeEach } from "vitest";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import type { DataSource } from "../../src/data-source";
import { timestampMockFactory, createMockDataSource, ts } from "../helpers";

vi.mock("firebase/firestore", () => timestampMockFactory());

import { renderAccounts } from "../../src/pages/accounts";
import type { Transaction, Statement } from "../../src/firestore";

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
    ...overrides,
  };
}

function seedOptions(dsOverrides: Partial<DataSource> = {}) {
  return { authorized: false, groupName: "", dataSource: createMockDataSource(dsOverrides) };
}

function localOptions(dsOverrides: Partial<DataSource> = {}) {
  return { authorized: true, groupName: "household", dataSource: createMockDataSource(dsOverrides) };
}

describe("renderAccounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Accounts heading", async () => {
    const html = await renderAccounts(seedOptions());
    expect(html).toContain("<h2>Accounts</h2>");
  });

  it("renders rows from statements with lastTransactionDate", async () => {
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ institution: "BankOne", account: "1234" }),
      ]),
      getStatements: vi.fn().mockResolvedValue([
        stmt({ institution: "BankOne", account: "1234", balance: 3825.5, lastTransactionDate: ts("2025-02-15") }),
      ]),
    }));
    expect(html).toContain('id="accounts-table"');
    expect(html).toContain("<th>Derived</th>");
    expect(html).toContain("BankOne");
    expect(html).toContain("1234");
    expect(html).toContain("$3,825.50");
  });

  it("shows balance from latest statement period per account", async () => {
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ institution: "Bank", account: "Checking" }),
      ]),
      getStatements: vi.fn().mockResolvedValue([
        stmt({ period: "2025-01", balance: 500 }),
        stmt({ id: "stmt-2", statementId: "Bank-Checking-2025-02" as any, period: "2025-02", balance: 750 }),
      ]),
    }));
    expect(html).toContain("$750.00");
    expect(html).not.toContain("$500.00");
  });

  it("shows empty state when no statements", async () => {
    const html = await renderAccounts(seedOptions());
    expect(html).toContain("No accounts found.");
  });

  it("sorts rows ascending by lastTransactionDate", async () => {
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([]),
      getStatements: vi.fn().mockResolvedValue([
        stmt({ institution: "ZBank", account: "Savings", period: "2025-03", lastTransactionDate: ts("2025-03-01") }),
        stmt({ institution: "ABank", account: "Checking", period: "2025-01", lastTransactionDate: ts("2025-01-01") }),
      ]),
    }));
    const tableStart = html.indexOf('id="accounts-table"');
    const tableHtml = html.slice(tableStart);
    const aBankIdx = tableHtml.indexOf("ABank");
    const zBankIdx = tableHtml.indexOf("ZBank");
    expect(aBankIdx).toBeLessThan(zBankIdx);
  });

  it("shows empty date cell when lastTransactionDate is null", async () => {
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([]),
      getStatements: vi.fn().mockResolvedValue([
        stmt({ institution: "Bank", account: "Checking", lastTransactionDate: null }),
      ]),
    }));
    expect(html).toContain('id="accounts-table"');
  });

  it("renders error fallback when data source fails", async () => {
    const html = await renderAccounts(seedOptions({
      getTransactions: vi.fn().mockRejectedValue(new Error("connection failed")),
    }));
    expect(html).toContain("Could not load data");
    expect(html).toContain('id="accounts-error"');
  });

  it("re-throws RangeError instead of showing fallback", async () => {
    await expect(renderAccounts(seedOptions({
      getTransactions: vi.fn().mockRejectedValue(new RangeError("out of range")),
    }))).rejects.toThrow(RangeError);
  });

  it("re-throws DataIntegrityError instead of showing fallback", async () => {
    await expect(renderAccounts(seedOptions({
      getTransactions: vi.fn().mockRejectedValue(new DataIntegrityError("bad data")),
    }))).rejects.toThrow(DataIntegrityError);
  });

  it("shows seed data notice for unauthorized users", async () => {
    const html = await renderAccounts(seedOptions());
    expect(html).toContain('id="seed-data-notice"');
    expect(html).toContain("Load a data file to see your accounts");
  });

  it("renders trend chart container with aggregate data", async () => {
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ institution: "Bank", account: "Checking", budget: "food" as any }),
      ]),
      getStatements: vi.fn().mockResolvedValue([
        stmt({ lastTransactionDate: ts("2025-02-15") }),
      ]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        {
          id: "food-w1",
          budgetId: "food",
          periodStart: ts("2025-02-10"),
          periodEnd: ts("2025-02-17"),
          total: 50,
          count: 1,
          categoryBreakdown: {},
          groupId: null,
        },
      ]),
    }));
    expect(html).toContain('id="accounts-trend-chart"');
    expect(html).toContain("data-aggregate-trend");
  });

  it("renders net worth chart container", async () => {
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ institution: "Bank", account: "Checking", budget: "food" as any }),
      ]),
      getStatements: vi.fn().mockResolvedValue([
        stmt({ lastTransactionDate: ts("2025-02-15") }),
      ]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        {
          id: "food-w1",
          budgetId: "food",
          periodStart: ts("2025-02-10"),
          periodEnd: ts("2025-02-17"),
          total: 50,
          count: 1,
          categoryBreakdown: {},
          groupId: null,
        },
      ]),
    }));
    expect(html).toContain('id="accounts-net-worth-chart"');
    expect(html).toContain("data-net-worth");
  });

  it("renders date picker for chart navigation", async () => {
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ institution: "Bank", account: "Checking", budget: "food" as any }),
      ]),
      getStatements: vi.fn().mockResolvedValue([stmt({ lastTransactionDate: ts("2025-02-15") })]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        {
          id: "food-w1",
          budgetId: "food",
          periodStart: ts("2025-02-10"),
          periodEnd: ts("2025-02-17"),
          total: 50,
          count: 1,
          categoryBreakdown: {},
          groupId: null,
        },
      ]),
    }));
    expect(html).toContain('id="accounts-date-picker"');
  });

  it("shows divergence warning when balances diverge", async () => {
    // computeDerivedBalances anchors on earliest statement and computes forward.
    // Anchor: 2025-01 balance=500. Transaction (amount=100) is in Jan (anchor period, skipped).
    // Derive 2025-02: 500 - txnSum(Feb)=0 → derived=500. Statement says 1000 → discrepancy.
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ id: "t1" as any, institution: "Bank", account: "Checking", amount: 100, timestamp: ts("2025-01-15"), budget: "food" as any }),
      ]),
      getStatements: vi.fn().mockResolvedValue([
        stmt({ id: "s1", period: "2025-01", balance: 500, lastTransactionDate: ts("2025-01-15") }),
        stmt({ id: "s2", period: "2025-02", balance: 1000, lastTransactionDate: ts("2025-01-15") }),
      ]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        {
          id: "food-w1",
          budgetId: "food",
          periodStart: ts("2025-01-13"),
          periodEnd: ts("2025-01-20"),
          total: 100,
          count: 1,
          categoryBreakdown: {},
          groupId: null,
        },
      ]),
    }));
    expect(html).toContain('id="balance-divergence-warning"');
  });

  it("shows derived balance in table when statements exist", async () => {
    // Anchor: 2025-01 balance=500. Derive 2025-02: 500 - txnSum(Feb)=50 → 450.
    // Table row shows latest derived period balance ($450.00).
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ institution: "Bank", account: "Checking", amount: 50, timestamp: ts("2025-02-15") }),
      ]),
      getStatements: vi.fn().mockResolvedValue([
        stmt({ id: "s1", period: "2025-01", balance: 500 }),
        stmt({ id: "s2", statementId: "Bank-Checking-2025-02" as any, period: "2025-02", balance: 750 }),
      ]),
    }));
    expect(html).toContain("$450.00");
  });

  it("highlights row with discrepancy class when derived balance diverges", async () => {
    // Anchor: 2025-01 balance=500. No transactions in Feb.
    // Derive 2025-02: 500 - 0 = 500. Statement says 1000 → discrepancy.
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ institution: "Bank", account: "Checking", timestamp: ts("2025-02-15") }),
      ]),
      getStatements: vi.fn().mockResolvedValue([
        stmt({ id: "s1", period: "2025-01", balance: 500 }),
        stmt({ id: "s2", statementId: "Bank-Checking-2025-02" as any, period: "2025-02", balance: 1000 }),
      ]),
    }));
    expect(html).toContain('class="discrepancy"');
  });

  it("no divergence warning when balances are consistent", async () => {
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ institution: "Bank", account: "Checking" }),
      ]),
      getStatements: vi.fn().mockResolvedValue([
        stmt({ period: "2025-02", balance: 1000, lastTransactionDate: ts("2025-02-15") }),
      ]),
      getBudgetPeriods: vi.fn().mockResolvedValue([]),
    }));
    expect(html).not.toContain('id="balance-divergence-warning"');
  });
});
