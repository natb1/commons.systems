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

  it("aggregates 3 accounts across 2 institutions with correct row count", async () => {
    const transactions = [
      // Bank / Checking — 3 transactions
      txn({ id: "t1" as any, institution: "Bank", account: "Checking", timestamp: ts("2025-01-10"), amount: 100 }),
      txn({ id: "t2" as any, institution: "Bank", account: "Checking", timestamp: ts("2025-02-15"), amount: 50 }),
      txn({ id: "t3" as any, institution: "Bank", account: "Checking", timestamp: ts("2025-02-20"), amount: 75 }),
      // Bank / Savings — 2 transactions
      txn({ id: "t4" as any, institution: "Bank", account: "Savings", timestamp: ts("2025-01-05"), amount: 200 }),
      txn({ id: "t5" as any, institution: "Bank", account: "Savings", timestamp: ts("2025-01-20"), amount: 300 }),
      // Credit Union / Checking — 2 transactions, no statement
      txn({ id: "t6" as any, institution: "Credit Union", account: "Checking", timestamp: ts("2025-02-01"), amount: 80 }),
      txn({ id: "t7" as any, institution: "Credit Union", account: "Checking", timestamp: ts("2025-02-10"), amount: 120 }),
    ];

    const statements = [
      stmt({ id: "s1", institution: "Bank", account: "Checking", period: "2025-01", balance: 3000 }),
      stmt({ id: "s2", institution: "Bank", account: "Checking", period: "2025-02", balance: 3500 }),
      stmt({ id: "s3", institution: "Bank", account: "Savings", period: "2025-01", balance: 10000 }),
    ];

    const html = await renderAccounts(seedOptions({
      getTransactions: vi.fn().mockResolvedValue(transactions),
      getStatements: vi.fn().mockResolvedValue(statements),
    }));

    expect(html).toContain('id="accounts-table"');

    // 3 accounts → 3 <tr> rows in <tbody>
    const tbody = html.slice(html.indexOf("<tbody>"), html.indexOf("</tbody>"));
    const rowCount = (tbody.match(/<tr>/g) ?? []).length;
    expect(rowCount).toBe(3);

    // Bank/Checking gets latest statement balance ($3,500.00)
    expect(html).toContain("$3,500.00");
    // Bank/Savings gets its statement balance ($10,000.00)
    expect(html).toContain("$10,000.00");
    // Credit Union/Checking has no statement — empty balance cell
    expect(html).toContain("Credit Union");
  });

  it("table structure has expected column headers", async () => {
    const html = await renderAccounts(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ institution: "Bank", account: "Checking" }),
      ]),
      getStatements: vi.fn().mockResolvedValue([]),
    }));

    expect(html).toContain("<th>Institution</th>");
    expect(html).toContain("<th>Account</th>");
    expect(html).toContain("<th>Most recent transaction</th>");
    expect(html).toContain("<th>Balance</th>");
  });
});
