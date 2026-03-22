import { describe, it, expect, vi, beforeEach } from "vitest";
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

describe("accounts page smoke — multi-account aggregation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aggregates accounts from statements with correct row count", async () => {
    const transactions = [
      txn({ id: "t1" as any, institution: "Bank", account: "Checking", timestamp: ts("2025-02-20"), amount: 75 }),
      txn({ id: "t4" as any, institution: "Bank", account: "Savings", timestamp: ts("2025-01-20"), amount: 300 }),
      txn({ id: "t6" as any, institution: "Credit Union", account: "Checking", timestamp: ts("2025-02-10"), amount: 120 }),
    ];

    const statements = [
      stmt({ id: "s1", institution: "Bank", account: "Checking", period: "2025-01", balance: 3000, lastTransactionDate: ts("2025-01-10") }),
      stmt({ id: "s2", institution: "Bank", account: "Checking", period: "2025-02", balance: 3500, lastTransactionDate: ts("2025-02-20") }),
      stmt({ id: "s3", institution: "Bank", account: "Savings", period: "2025-01", balance: 10000, lastTransactionDate: ts("2025-01-20") }),
      stmt({ id: "s4", institution: "Credit Union", account: "Checking", period: "2025-02", balance: 500, lastTransactionDate: ts("2025-02-10") }),
    ];

    const html = await renderAccounts(seedOptions({
      getTransactions: vi.fn().mockResolvedValue(transactions),
      getStatements: vi.fn().mockResolvedValue(statements),
    }));

    expect(html).toContain('id="accounts-table"');

    // 3 accounts → 3 <tr> rows in <tbody>
    const tbody = html.slice(html.indexOf("<tbody>"), html.indexOf("</tbody>"));
    const rowCount = (tbody.match(/<tr[\s>]/g) ?? []).length;
    expect(rowCount).toBe(3);

    // Bank/Checking gets latest statement balance ($3,500.00)
    expect(html).toContain("$3,500.00");
    // Bank/Savings gets its statement balance ($10,000.00)
    expect(html).toContain("$10,000.00");
    // Credit Union/Checking has statement with balance ($500.00)
    expect(html).toContain("Credit Union");
    expect(html).toContain("$500.00");
  });

  it("table structure has expected column headers", async () => {
    const html = await renderAccounts(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([]),
      getStatements: vi.fn().mockResolvedValue([
        stmt({ institution: "Bank", account: "Checking", lastTransactionDate: ts("2025-02-15") }),
      ]),
    }));

    expect(html).toContain("<th>Institution</th>");
    expect(html).toContain("<th>Account</th>");
    expect(html).toContain("<th>Most recent transaction</th>");
    expect(html).toContain("<th>Balance</th>");
    expect(html).toContain("<th>Derived</th>");
  });
});
