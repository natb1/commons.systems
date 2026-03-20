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

  it("renders rows from transactions and statements", async () => {
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ institution: "BankOne", account: "1234" }),
      ]),
      getStatements: vi.fn().mockResolvedValue([
        stmt({ institution: "BankOne", account: "1234", balance: 3825.5 }),
      ]),
    }));
    expect(html).toContain('id="accounts-table"');
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

  it("shows empty state when no transactions", async () => {
    const html = await renderAccounts(seedOptions());
    expect(html).toContain("No accounts found.");
  });

  it("sorts rows ascending by most recent transaction date", async () => {
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ institution: "ZBank", account: "Savings", timestamp: ts("2025-03-01") }),
        txn({ institution: "ABank", account: "Checking", timestamp: ts("2025-01-01") }),
      ]),
      getStatements: vi.fn().mockResolvedValue([]),
    }));
    const tableStart = html.indexOf('id="accounts-table"');
    const tableHtml = html.slice(tableStart);
    const aBankIdx = tableHtml.indexOf("ABank");
    const zBankIdx = tableHtml.indexOf("ZBank");
    expect(aBankIdx).toBeLessThan(zBankIdx);
  });

  it("shows empty balance cell when no matching statement", async () => {
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ institution: "Bank", account: "Checking" }),
      ]),
      getStatements: vi.fn().mockResolvedValue([]),
    }));
    expect(html).toContain('id="accounts-table"');
    // The balance <td> should be empty
    expect(html).toMatch(/<td><\/td>/);
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
        stmt(),
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
        stmt(),
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
      getStatements: vi.fn().mockResolvedValue([stmt()]),
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
    // Two statements for same account: anchor at 2025-02, verify at 2025-01
    // Transaction between them causes divergence
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ id: "t1" as any, institution: "Bank", account: "Checking", amount: 100, timestamp: ts("2025-01-15"), budget: "food" as any }),
      ]),
      getStatements: vi.fn().mockResolvedValue([
        stmt({ id: "s1", period: "2025-01", balance: 500 }),
        stmt({ id: "s2", period: "2025-02", balance: 1000 }),
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
    // Anchor at 2025-02 (balance=1000), derive 2025-01:
    // cumSumBefore(2025-02-01) = 100, cumSumBefore(2025-03-01) = 100
    // anchorCum = cumSumBefore(2025-03-01) = 100
    // derived = 1000 - (cumSumBefore(2025-02-01) - 100) = 1000 - 0 = 1000
    // But statement says 500 → divergence
    expect(html).toContain('id="balance-divergence-warning"');
  });

  it("no divergence warning when balances are consistent", async () => {
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ institution: "Bank", account: "Checking" }),
      ]),
      getStatements: vi.fn().mockResolvedValue([
        stmt({ period: "2025-02", balance: 1000 }),
      ]),
      getBudgetPeriods: vi.fn().mockResolvedValue([]),
    }));
    expect(html).not.toContain('id="balance-divergence-warning"');
  });
});
