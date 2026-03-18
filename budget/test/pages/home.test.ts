import { describe, it, expect, vi, beforeEach } from "vitest";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import type { DataSource } from "../../src/data-source";
import { createMockDataSource } from "../helpers";

vi.mock("firebase/firestore", () => ({
  Timestamp: class Timestamp {
    _date: Date;
    constructor(d: Date) { this._date = d; }
    toDate() { return this._date; }
    toMillis() { return this._date.getTime(); }
    static fromDate(d: Date) { return new Timestamp(d); }
  },
}));

vi.mock("../../src/balance.js", () => ({
  computeAllBudgetBalances: vi.fn(),
}));

import { renderHome } from "../../src/pages/home";
import type { Transaction, BudgetPeriod } from "../../src/firestore";
import { computeAllBudgetBalances } from "../../src/balance";

const mockComputeAllBalances = vi.mocked(computeAllBudgetBalances);

function mockTimestamp(dateStr: string) {
  const d = new Date(dateStr);
  return { toDate: () => d, toMillis: () => d.getTime() } as import("firebase/firestore").Timestamp;
}

function txn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "txn-1",
    institution: "Bank A",
    account: "Checking",
    description: "Grocery store",
    amount: 52.30,
    note: "",
    category: "Food:Groceries",
    reimbursement: 0,
    budget: null,
    timestamp: mockTimestamp("2025-01-15"),
    statementId: null,
    groupId: null,
    normalizedId: null,
    normalizedPrimary: true,
    normalizedDescription: null,
    ...overrides,
  };
}

const defaultBudgets = [
  { id: "food", name: "Food", weeklyAllowance: 150, rollover: "none" as const, groupId: null },
  { id: "vacation", name: "Vacation", weeklyAllowance: 100, rollover: "balance" as const, groupId: null },
];

const defaultPeriods: BudgetPeriod[] = [
  {
    id: "food-2025-01-13",
    budgetId: "food",
    periodStart: mockTimestamp("2025-01-13"),
    periodEnd: mockTimestamp("2025-01-20"),
    total: 5.75,
    count: 0,
    categoryBreakdown: {},
    groupId: null,
  },
];

function seedOptions(dsOverrides: Partial<DataSource> = {}) {
  return { authorized: false, groupName: "", dataSource: createMockDataSource({
    getBudgets: vi.fn().mockResolvedValue(defaultBudgets),
    getBudgetPeriods: vi.fn().mockResolvedValue(defaultPeriods),
    ...dsOverrides,
  }) };
}

function localOptions(dsOverrides: Partial<DataSource> = {}) {
  return { authorized: true, groupName: "household", dataSource: createMockDataSource({
    getBudgets: vi.fn().mockResolvedValue(defaultBudgets),
    getBudgetPeriods: vi.fn().mockResolvedValue(defaultPeriods),
    ...dsOverrides,
  }) };
}

describe("renderHome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockComputeAllBalances.mockReturnValue(new Map());
  });

  it("returns HTML containing a Transactions heading", async () => {
    const html = await renderHome(seedOptions());
    expect(html).toContain("<h2>Transactions</h2>");
  });

  it("shows seed data notice for unauthorized users", async () => {
    const html = await renderHome(seedOptions());
    expect(html).toContain('id="seed-data-notice"');
  });

  it("does not show seed data notice for authorized users", async () => {
    const html = await renderHome(localOptions());
    expect(html).not.toContain('id="seed-data-notice"');
  });

  it("renders transaction list with data", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ note: "weekly groceries", statementId: "stmt-2025-01" }),
      ]),
    }));
    expect(html).toContain('id="transactions-table"');
    expect(html).toContain("Grocery store");
    expect(html).toContain("52.30");
    expect(html).toContain("Food &gt; Groceries");
  });

  it("renders error fallback when data source fails", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockRejectedValue(new Error("connection failed")),
    }));
    expect(html).toContain("Could not load data");
    expect(html).toContain('id="transactions-error"');
  });

  it("re-throws RangeError instead of showing fallback", async () => {
    await expect(renderHome(seedOptions({
      getTransactions: vi.fn().mockRejectedValue(new RangeError("reimbursement must be between 0 and 100")),
    }))).rejects.toThrow(RangeError);
  });

  it("re-throws DataIntegrityError instead of showing fallback", async () => {
    await expect(renderHome(seedOptions({
      getTransactions: vi.fn().mockRejectedValue(new DataIntegrityError("Expected string for description, got undefined")),
    }))).rejects.toThrow(DataIntegrityError);
  });

  it("renders empty state when no transactions", async () => {
    const html = await renderHome(seedOptions());
    expect(html).toContain("No transactions found.");
  });

  it("renders inline edit inputs for authorized users", async () => {
    const html = await renderHome(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ note: "weekly groceries", budget: "food", statementId: "stmt-2025-01", groupId: "household" }),
      ]),
    }));
    expect(html).toContain('class="edit-note"');
    expect(html).toContain('class="edit-category"');
    expect(html).toContain('class="edit-reimbursement"');
    expect(html).toContain('class="edit-budget"');
    expect(html).toContain('data-txn-id="txn-1"');
    expect(html).toContain('aria-label="Note"');
    expect(html).toContain('aria-label="Category"');
    expect(html).toContain('aria-label="Reimbursement"');
    expect(html).toContain('aria-label="Budget"');
  });

  it("renders read-only cells for unauthorized users", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ note: "weekly groceries" }),
      ]),
    }));
    expect(html).not.toContain('class="edit-note"');
    expect(html).not.toContain('class="edit-category"');
    expect(html).toContain("weekly groceries");
  });

  it("renders accordion rows with details/summary elements", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: "food", statementId: "stmt-2025-01" }),
      ]),
    }));
    expect(html).toContain('class="expand-row txn-row"');
    expect(html).toContain('class="txn-summary"');
    expect(html).toContain('class="txn-summary-content"');
    expect(html).toContain('class="expand-details txn-details"');
    expect(html).toContain("Bank A");
    expect(html).toContain("Checking");
  });

  it("renders date and statement link in expanded details", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: "food", statementId: "stmt-2025-01" }),
      ]),
    }));
    expect(html).toContain("<dt>Date</dt>");
    expect(html).toContain("<dt>Statement</dt>");
    expect(html).toContain('<a href="#">statement</a>');
  });

  it("renders empty statement dd when statementId is null", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ timestamp: null }),
      ]),
    }));
    expect(html).toContain("<dt>Statement</dt><dd></dd>");
  });

  it("renders budget options as data attribute for authorized users", async () => {
    const html = await renderHome(localOptions({
      getBudgets: vi.fn().mockResolvedValue([
        { id: "food", name: "Food", weeklyAllowance: 150, rollover: "none", groupId: "household" },
        { id: "vacation", name: "Vacation", weeklyAllowance: 100, rollover: "balance", groupId: "household" },
      ]),
      getTransactions: vi.fn().mockResolvedValue([
        txn({ category: "Food", budget: "food", groupId: "household" }),
        txn({
          id: "txn-2", institution: "Bank B", account: "Savings",
          description: "Hotel", amount: 215, category: "Travel",
          budget: "vacation", timestamp: mockTimestamp("2025-02-01"), groupId: "household",
        }),
      ]),
    }));
    expect(html).toContain("data-budget-options");
    expect(html).toContain("Food");
    expect(html).toContain("Vacation");
  });

  it("does not render autocomplete options for unauthorized users", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ category: "Food", budget: "food" }),
      ]),
    }));
    expect(html).not.toContain("data-budget-options");
    expect(html).not.toContain("data-category-options");
  });

  it("renders category options as data attribute for authorized users", async () => {
    const html = await renderHome(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: "food", groupId: "household" }),
        txn({
          id: "txn-2", institution: "Bank B", account: "Savings",
          description: "Hotel", amount: 215, category: "Travel:Lodging",
          budget: "vacation", timestamp: mockTimestamp("2025-02-01"), groupId: "household",
        }),
      ]),
    }));
    expect(html).toContain("data-category-options");
    expect(html).toContain("Food:Groceries");
    expect(html).toContain("Travel:Lodging");
  });

  it("renders group name in expanded details", async () => {
    const html = await renderHome(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ category: "Food", budget: "food", groupId: "household" }),
      ]),
    }));
    expect(html).toContain("<dt>Group</dt>");
    expect(html).toContain("<dd>household</dd>");
  });

  it("throws DataIntegrityError when transaction references unknown budget ID", async () => {
    await expect(renderHome(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([
        { id: "food", name: "Food", weeklyAllowance: 150, rollover: "none", groupId: null },
      ]),
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: "nonexistent-budget" }),
      ]),
    }))).rejects.toThrow(DataIntegrityError);
  });

  it("throws DataIntegrityError for duplicate budget names", async () => {
    await expect(renderHome(localOptions({
      getBudgets: vi.fn().mockResolvedValue([
        { id: "food-1", name: "Food", weeklyAllowance: 150, rollover: "none", groupId: "household" },
        { id: "food-2", name: "Food", weeklyAllowance: 200, rollover: "none", groupId: "household" },
      ]),
      getTransactions: vi.fn().mockResolvedValue([txn()]),
    }))).rejects.toThrow("Duplicate budget name: Food");
  });

  it("renders budget name-to-ID map as data attribute for authorized users", async () => {
    const html = await renderHome(localOptions({
      getBudgets: vi.fn().mockResolvedValue([
        { id: "budget-food", name: "Food", weeklyAllowance: 150, rollover: "none", groupId: "household" },
      ]),
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: "budget-food", groupId: "household" }),
      ]),
    }));
    expect(html).toContain("data-budget-map");
    expect(html).toContain("budget-food");
  });

  it("shows access denied message for permission-denied error", async () => {
    const error = new Error("permission denied");
    (error as any).code = "permission-denied";
    const html = await renderHome(localOptions({
      getTransactions: vi.fn().mockRejectedValue(error),
    }));
    expect(html).toContain("Access denied");
  });

  it("sorts transactions by timestamp descending with nulls last", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({
          description: "Older", amount: 10, category: "A",
          timestamp: mockTimestamp("2025-01-01"),
        }),
        txn({
          id: "txn-2", institution: "Bank B", account: "Savings",
          description: "Newer", amount: 20, category: "B",
          timestamp: mockTimestamp("2025-02-01"),
        }),
        txn({
          id: "txn-3", institution: "Bank C", account: "Credit",
          description: "No date", amount: 30, category: "C", timestamp: null,
        }),
      ]),
    }));
    const newerIdx = html.indexOf("Newer");
    const olderIdx = html.indexOf("Older");
    const noDateIdx = html.indexOf("No date");
    expect(newerIdx).toBeLessThan(olderIdx);
    expect(olderIdx).toBeLessThan(noDateIdx);
  });

  it("renders Budget Balance dt/dd in expanded details", async () => {
    mockComputeAllBalances.mockReturnValue(new Map([["txn-1", 144.25]]));
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: "food" }),
      ]),
    }));
    expect(html).toContain("<dt>Budget Balance</dt>");
    expect(html).toContain('<dd class="budget-balance">144.25</dd>');
  });

  it("omits budget balance row when computeBudgetBalance returns null", async () => {
    mockComputeAllBalances.mockReturnValue(new Map());
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: "food" }),
      ]),
    }));
    expect(html).not.toContain("<dt>Budget Balance</dt>");
  });

  it("omits budget balance row when transaction has no budget", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: null }),
      ]),
    }));
    expect(html).not.toContain("<dt>Budget Balance</dt>");
    expect(mockComputeAllBalances).toHaveBeenCalled();
  });

  it("renders data-amount, data-budget-id, data-timestamp, data-reimbursement on rows for authorized users", async () => {
    const ts = mockTimestamp("2025-01-15");
    const html = await renderHome(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: "food", timestamp: ts, amount: 52.30, reimbursement: 25, groupId: "household" }),
      ]),
    }));
    expect(html).toContain('data-amount="52.3"');
    expect(html).toContain('data-budget-id="food"');
    expect(html).toContain(`data-timestamp="${ts.toMillis()}"`);
    expect(html).toContain('data-reimbursement="25"');
  });

  it("does not render data-amount, data-budget-id, data-timestamp, data-reimbursement for unauthorized users", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: "food" }),
      ]),
    }));
    expect(html).not.toContain("data-amount");
    expect(html).not.toContain("data-budget-id");
    expect(html).not.toContain("data-timestamp");
    expect(html).not.toContain("data-reimbursement");
  });

  it("renders data-budget-periods on container for authorized users", async () => {
    const html = await renderHome(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: "food", groupId: "household" }),
      ]),
    }));
    expect(html).toContain("data-budget-periods");
    expect(html).toContain("food-2025-01-13");
  });

  it("does not render data-budget-periods for unauthorized users", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: "food" }),
      ]),
    }));
    expect(html).not.toContain("data-budget-periods");
  });

  it("renders #category-sankey container with script tag for chart data", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ category: "Food:Groceries", amount: 52.30, reimbursement: 0 }),
      ]),
    }));
    expect(html).toContain('id="category-sankey"');
    expect(html).toContain('<script type="application/json" id="sankey-data">');
    expect(html).toContain("Food:Groceries");
  });

  it("renders sankey controls above chart container", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([txn()]),
    }));
    expect(html).toContain('id="sankey-controls"');
    expect(html).toContain('id="sankey-weeks"');
    expect(html).toContain('id="sankey-end-week"');
    expect(html).toContain('id="sankey-end-label"');
  });

  it("excludes non-primary normalized transactions from chart data", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({
          id: "txn-a", description: "Store A", amount: 50,
          normalizedId: "norm-1", normalizedPrimary: true,
        }),
        txn({
          id: "txn-b", description: "Store B", amount: 30,
          normalizedId: "norm-1", normalizedPrimary: false,
        }),
      ]),
    }));
    // Parse the JSON from the script tag to verify filtering
    const match = html.match(/<script type="application\/json" id="sankey-data">([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();
    const chartTxns = JSON.parse(match![1]);
    expect(chartTxns).toHaveLength(1);
    expect(chartTxns[0].amount).toBe(50);
  });

  describe("normalized transaction groups", () => {
    it("renders normalized group as single row", async () => {
      const html = await renderHome(seedOptions({
        getTransactions: vi.fn().mockResolvedValue([
          txn({
            id: "txn-a",
            description: "Store A",
            amount: 50,
            normalizedId: "norm-1",
            normalizedPrimary: true,
            timestamp: mockTimestamp("2025-01-15"),
          }),
          txn({
            id: "txn-b",
            description: "Store B",
            amount: 30,
            normalizedId: "norm-1",
            normalizedPrimary: false,
            timestamp: mockTimestamp("2025-01-14"),
          }),
        ]),
      }));
      expect(html).toContain('class="expand-row txn-row normalized-group"');
      const summaryMatches = html.match(/class="txn-summary"/g);
      expect(summaryMatches).toHaveLength(1);
    });

    it("renders originals section with all member descriptions", async () => {
      const html = await renderHome(seedOptions({
        getTransactions: vi.fn().mockResolvedValue([
          txn({
            id: "txn-a",
            description: "Store Alpha",
            amount: 50,
            normalizedId: "norm-1",
            normalizedPrimary: true,
            timestamp: mockTimestamp("2025-01-15"),
          }),
          txn({
            id: "txn-b",
            description: "Store Beta",
            amount: 30,
            normalizedId: "norm-1",
            normalizedPrimary: false,
            timestamp: mockTimestamp("2025-01-14"),
          }),
        ]),
      }));
      expect(html).toContain('class="normalized-originals"');
      expect(html).toContain("Original Transactions");
      expect(html).toContain("Store Alpha");
      expect(html).toContain("Store Beta");
    });

    it("uses normalizedDescription in summary", async () => {
      const html = await renderHome(seedOptions({
        getTransactions: vi.fn().mockResolvedValue([
          txn({
            id: "txn-a",
            description: "Raw Desc",
            amount: 50,
            normalizedId: "norm-1",
            normalizedPrimary: true,
            normalizedDescription: "Canonical Desc",
            timestamp: mockTimestamp("2025-01-15"),
          }),
        ]),
      }));
      expect(html).toContain("Canonical Desc");
      const summaryStart = html.indexOf('class="txn-summary-content"');
      const summaryEnd = html.indexOf("</summary>");
      const summarySlice = html.slice(summaryStart, summaryEnd);
      expect(summarySlice).toContain("Canonical Desc");
      expect(summarySlice).not.toContain("Raw Desc");
    });

    it("renders ungrouped transaction without normalized-group class", async () => {
      const html = await renderHome(seedOptions({
        getTransactions: vi.fn().mockResolvedValue([
          txn({
            id: "txn-plain",
            description: "Plain purchase",
            normalizedId: null,
            normalizedPrimary: true,
          }),
        ]),
      }));
      expect(html).toContain('class="expand-row txn-row"');
      expect(html).not.toContain("normalized-group");
    });
  });
});
