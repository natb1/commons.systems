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
    virtual: false,
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
});
