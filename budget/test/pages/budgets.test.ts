import { describe, it, expect, vi, beforeEach } from "vitest";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import type { DataSource } from "../../src/data-source";
import { timestampMockFactory } from "../helpers";

vi.mock("firebase/firestore", () => timestampMockFactory());

import { renderBudgets } from "../../src/pages/budgets";
import type { Budget, Transaction } from "../../src/firestore";
import { Timestamp } from "firebase/firestore";

function budget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: "food",
    name: "Food",
    weeklyAllowance: 150,
    rollover: "none",
    groupId: null,
    ...overrides,
  };
}

function txn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "txn-1" as Transaction["id"],
    institution: "Bank",
    account: "Checking",
    description: "Test transaction",
    amount: 0,
    note: "",
    category: "Uncategorized",
    reimbursement: 0,
    budget: null,
    timestamp: null,
    statementId: null,
    groupId: null,
    normalizedId: null,
    normalizedPrimary: true,
    normalizedDescription: null,
    ...overrides,
  };
}

function createMockDataSource(overrides: Partial<DataSource> = {}): DataSource {
  return {
    getTransactions: vi.fn().mockResolvedValue([]),
    getBudgets: vi.fn().mockResolvedValue([]),
    getBudgetPeriods: vi.fn().mockResolvedValue([]),
    getRules: vi.fn().mockResolvedValue([]),
    getNormalizationRules: vi.fn().mockResolvedValue([]),
    updateTransaction: vi.fn(),
    updateBudget: vi.fn(),
    adjustBudgetPeriodTotal: vi.fn(),
    createRule: vi.fn(),
    updateRule: vi.fn(),
    deleteRule: vi.fn(),
    createNormalizationRule: vi.fn(),
    updateNormalizationRule: vi.fn(),
    deleteNormalizationRule: vi.fn(),
    ...overrides,
  };
}

function seedOptions(dsOverrides: Partial<DataSource> = {}) {
  return { authorized: false, groupName: "", dataSource: createMockDataSource(dsOverrides) };
}

function localOptions(dsOverrides: Partial<DataSource> = {}) {
  return { authorized: true, groupName: "household", dataSource: createMockDataSource(dsOverrides) };
}

describe("renderBudgets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns HTML containing a Budgets heading", async () => {
    const html = await renderBudgets(seedOptions());
    expect(html).toContain("<h2>Budgets</h2>");
  });

  it("shows seed data notice for unauthorized users", async () => {
    const html = await renderBudgets(seedOptions());
    expect(html).toContain('id="seed-data-notice"');
    expect(html).toContain("Load a data file to see your budgets");
  });

  it("does not show seed data notice for authorized users", async () => {
    const html = await renderBudgets(localOptions());
    expect(html).not.toContain('id="seed-data-notice"');
  });

  it("renders budget table with data", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget()]),
    }));
    expect(html).toContain('id="budgets-table"');
    expect(html).toContain("Food");
    expect(html).toContain("150");
  });

  it("renders error fallback when data source fails", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockRejectedValue(new Error("connection failed")),
    }));
    expect(html).toContain("Could not load data");
    expect(html).toContain('id="budgets-error"');
  });

  it("re-throws RangeError instead of showing fallback", async () => {
    await expect(renderBudgets(seedOptions({
      getBudgets: vi.fn().mockRejectedValue(new RangeError("out of range")),
    }))).rejects.toThrow(RangeError);
  });

  it("re-throws DataIntegrityError instead of showing fallback", async () => {
    await expect(renderBudgets(seedOptions({
      getBudgets: vi.fn().mockRejectedValue(new DataIntegrityError("bad data")),
    }))).rejects.toThrow(DataIntegrityError);
  });

  it("renders empty state when no budgets", async () => {
    const html = await renderBudgets(seedOptions());
    expect(html).toContain("No budgets found.");
  });

  it("renders edit controls for authorized users", async () => {
    const html = await renderBudgets(localOptions({
      getBudgets: vi.fn().mockResolvedValue([budget({ groupId: "household" })]),
    }));
    expect(html).toContain('class="edit-name"');
    expect(html).toContain('class="edit-allowance"');
    expect(html).toContain('class="edit-rollover"');
    expect(html).toContain('data-budget-id="food"');
    expect(html).toContain('aria-label="Name"');
    expect(html).toContain('aria-label="Weekly allowance"');
    expect(html).toContain('aria-label="Rollover"');
  });

  it("renders disabled inputs for unauthorized users", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget()]),
    }));
    expect(html).toContain('class="edit-name"');
    expect(html).toContain("disabled");
    expect(html).not.toContain('data-budget-id=');
    expect(html).toContain("Food");
    expect(html).toContain("150");
    expect(html).toContain("None");
  });

  it("sorts budgets alphabetically by name", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([
        budget({ id: "vacation", name: "Vacation", weeklyAllowance: 100, rollover: "balance" }),
        budget({ id: "food", name: "Food", weeklyAllowance: 150, rollover: "none" }),
      ]),
    }));
    const tableStart = html.indexOf('id="budgets-table"');
    const tableHtml = html.slice(tableStart);
    const foodIdx = tableHtml.indexOf("Food");
    const vacationIdx = tableHtml.indexOf("Vacation");
    expect(foodIdx).toBeLessThan(vacationIdx);
  });

  it("renders rollover select with correct selected state", async () => {
    const html = await renderBudgets(localOptions({
      getBudgets: vi.fn().mockResolvedValue([budget({ rollover: "debt", groupId: "household" })]),
    }));
    expect(html).toContain('<option value="debt" selected>');
    expect(html).not.toContain('<option value="none" selected>');
  });

  it("renders rollover labels for unauthorized users", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([
        budget({ id: "a", name: "A", rollover: "none" }),
        budget({ id: "b", name: "B", rollover: "debt" }),
        budget({ id: "c", name: "C", rollover: "balance" }),
      ]),
    }));
    expect(html).toContain("None");
    expect(html).toContain("Debt only");
    expect(html).toContain("Full balance");
  });

  it("shows access denied message for permission-denied error", async () => {
    const error = new Error("permission denied");
    (error as any).code = "permission-denied";
    const html = await renderBudgets(localOptions({
      getBudgets: vi.fn().mockRejectedValue(error),
    }));
    expect(html).toContain("Access denied");
  });

  it("renders chart container with data attributes", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget()]),
    }));
    expect(html).toContain('id="budgets-chart"');
    expect(html).toContain('data-budgets="');
    expect(html).toContain('data-periods="');
  });

  it("renders date picker for chart navigation", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget()]),
    }));
    expect(html).toContain('id="chart-date-picker"');
    expect(html).toContain('type="date"');
    expect(html).not.toContain('id="chart-window"');
  });

  it("data attributes contain valid JSON", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget()]),
    }));
    const budgetsMatch = html.match(/data-budgets="([^"]*)"/);
    expect(budgetsMatch).not.toBeNull();
    const unescaped = budgetsMatch![1].replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    const budgetsJson = JSON.parse(unescaped);
    expect(budgetsJson).toHaveLength(1);
    expect(budgetsJson[0].name).toBe("Food");
  });

  it("renders metrics section with formatted currency", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([
        budget({ id: "food" as Budget["id"], name: "Food", weeklyAllowance: 100 }),
        budget({ id: "fun" as Budget["id"], name: "Fun", weeklyAllowance: 50 }),
      ]),
      getTransactions: vi.fn().mockResolvedValue([
        txn({
          id: "inc-1" as Transaction["id"],
          category: "Income",
          amount: 1200,
          timestamp: Timestamp.fromDate(new Date("2026-03-01")),
          normalizedId: null,
          normalizedPrimary: true,
        }),
      ]),
    }));
    expect(html).toContain('id="budget-metrics"');
    expect(html).toContain("$100.00");
    expect(html).toContain("$150.00");
  });

  it("renders zero income when no income transactions", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([
        budget({ id: "food" as Budget["id"], name: "Food", weeklyAllowance: 75 }),
      ]),
      getTransactions: vi.fn().mockResolvedValue([
        txn({
          id: "exp-1" as Transaction["id"],
          category: "Food",
          amount: 50,
          timestamp: Timestamp.fromDate(new Date("2026-03-01")),
        }),
      ]),
    }));
    expect(html).toContain("$0.00");
    expect(html).toContain("$75.00");
  });

  it("computes correct total weekly budget sum", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([
        budget({ id: "a" as Budget["id"], name: "A", weeklyAllowance: 100 }),
        budget({ id: "b" as Budget["id"], name: "B", weeklyAllowance: 200 }),
        budget({ id: "c" as Budget["id"], name: "C", weeklyAllowance: 50 }),
      ]),
    }));
    expect(html).toContain("$350.00");
  });

  it("metrics section absent on fetch error", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockRejectedValue(new Error("connection failed")),
    }));
    expect(html).not.toContain('id="budget-metrics"');
  });
});
