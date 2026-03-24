import { describe, it, expect, vi, beforeEach } from "vitest";
import { timestampMockFactory, ts, createMockDataSource } from "../helpers";
import type { DataSource } from "../../src/data-source";
import type { Transaction } from "../../src/firestore";

vi.mock("firebase/firestore", () => timestampMockFactory());

import { renderHome } from "../../src/pages/home";

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

function localOptions(dsOverrides: Partial<DataSource> = {}) {
  return { authorized: true, groupName: "household", dataSource: createMockDataSource(dsOverrides) };
}

function seedOptions(dsOverrides: Partial<DataSource> = {}) {
  return { authorized: false, groupName: "", dataSource: createMockDataSource(dsOverrides) };
}

describe("home page infinite scroll smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("home page renders with scroll sentinel for authorized users", async () => {
    const html = await renderHome(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ id: "t1" as any }),
      ]),
    }));
    expect(html).toContain('id="scroll-sentinel"');
  });

  it("sentinel has data-next-before attribute with numeric value", async () => {
    const html = await renderHome(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ id: "t1" as any }),
      ]),
    }));
    const match = html.match(/data-next-before="(\d+)"/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThan(0);
  });

  it("no console errors on initial load", async () => {
    const consoleSpy = vi.spyOn(console, "error");
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ id: "t1" as any }),
      ]),
    }));
    expect(html).toContain("<h2>Transactions</h2>");
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("transactions table has data-group-name and data-editable attributes", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ id: "t1" as any }),
      ]),
    }));
    expect(html).toContain('id="transactions-table"');
    expect(html).toContain('data-group-name="');
    expect(html).toContain('data-editable="');
  });

  it("budget filter input renders in sankey controls", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ id: "t1" as any }),
      ]),
      getBudgets: vi.fn().mockResolvedValue([
        { id: "groceries" as any, name: "Groceries", weeklyAllowance: 100, rollover: "none", groupId: null },
      ]),
    }));
    expect(html).toContain('id="sankey-budget-filter"');
    expect(html).toContain("data-budget-options");
  });

  it("data-budget-name attribute present on transaction rows", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ id: "t1" as any, budget: "groceries" as any }),
      ]),
      getBudgets: vi.fn().mockResolvedValue([
        { id: "groceries" as any, name: "Groceries", weeklyAllowance: 100, rollover: "none", groupId: null },
      ]),
    }));
    expect(html).toContain('data-budget-name="Groceries"');
  });

  it("serializeChartTransactions produces valid SerializedChartTransaction objects", async () => {
    const { serializeChartTransactions } = await import("../../src/pages/home");
    const budgetIdToName = new Map([["b1", "Groceries"]]);
    const result = serializeChartTransactions(
      [txn({ id: "t1" as any, budget: "b1" as any, category: "Food", amount: 50, reimbursement: 0 })],
      budgetIdToName,
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      category: "Food",
      amount: 50,
      reimbursement: 0,
      timestampMs: expect.any(Number),
      budgetName: "Groceries",
    });
  });

  it("serializeChartTransactions maps null budget to null budgetName", async () => {
    const { serializeChartTransactions } = await import("../../src/pages/home");
    const result = serializeChartTransactions(
      [txn({ id: "t2" as any, budget: null })],
      new Map(),
    );
    expect(result).toHaveLength(1);
    expect(result[0].budgetName).toBeNull();
  });
});
