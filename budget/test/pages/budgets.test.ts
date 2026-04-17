import { describe, it, expect, vi, beforeEach } from "vitest";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import type { DataSource } from "../../src/data-source";
import { timestampMockFactory, createMockDataSource } from "../helpers";

vi.mock("firebase/firestore", () => timestampMockFactory());

import { renderBudgets } from "../../src/pages/budgets";
import type { Budget, Transaction, WeeklyAggregate } from "../../src/firestore";
import { Timestamp } from "firebase/firestore";

function budget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: "food",
    name: "Food",
    allowance: 150,
    allowancePeriod: "weekly",
    rollover: "none",
    overrides: [],
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
    virtual: false,
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
    expect(html).toContain('aria-label="Allowance"');
    expect(html).toContain('aria-label="Rollover"');
  });

  it("renders disabled inputs for unauthorized users", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget()]),
    }));
    expect(html).toContain('class="edit-name"');
    expect(html).toContain("disabled");
    // data-budget-id is always emitted on the row element regardless of
    // authorization so variance hydration can namespace its radio group.
    expect(html).toContain('data-budget-id="food"');
    expect(html).toContain("Food");
    expect(html).toContain("150");
    expect(html).toContain("None");
  });

  it("sorts budgets alphabetically by name", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([
        budget({ id: "vacation", name: "Vacation", allowance: 100, rollover: "balance" }),
        budget({ id: "food", name: "Food", allowance: 150, rollover: "none" }),
      ]),
    }));
    const tableStart = html.indexOf('id="budgets-table"');
    const tableHtml = html.slice(tableStart);
    const foodIdx = tableHtml.indexOf("Food");
    const vacationIdx = tableHtml.indexOf("Vacation");
    expect(foodIdx).toBeLessThan(vacationIdx);
  });

  it("renders quarterly period option", async () => {
    const html = await renderBudgets(localOptions({
      getBudgets: vi.fn().mockResolvedValue([budget({ allowancePeriod: "quarterly", groupId: "household" })]),
    }));
    expect(html).toContain('<option value="quarterly" selected>');
    expect(html).toContain("Quarterly");
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
        budget({ id: "food" as Budget["id"], name: "Food", allowance: 100 }),
        budget({ id: "fun" as Budget["id"], name: "Fun", allowance: 50 }),
      ]),
      getWeeklyAggregates: vi.fn().mockResolvedValue([
        {
          id: "2026-02-16",
          weekStart: Timestamp.fromDate(new Date("2026-02-16")),
          creditTotal: 1200,
          unbudgetedTotal: 0,
          groupId: null,
        },
        {
          id: "2026-02-23",
          weekStart: Timestamp.fromDate(new Date("2026-02-23")),
          creditTotal: 0,
          unbudgetedTotal: 0,
          groupId: null,
        },
      ]),
    }));
    expect(html).toContain('id="budget-metrics"');
    // 1200 / 12 = $100.00 (latest week 2026-02-23 excluded from average)
    expect(html).toContain("$100.00");
    expect(html).toContain("$150.00");
  });

  it("renders zero income when no credit aggregates", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([
        budget({ id: "food" as Budget["id"], name: "Food", allowance: 75 }),
      ]),
      getWeeklyAggregates: vi.fn().mockResolvedValue([]),
    }));
    expect(html).toContain("$0.00");
    expect(html).toContain("$75.00");
  });

  it("computes correct total weekly budget sum", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([
        budget({ id: "a" as Budget["id"], name: "A", allowance: 100 }),
        budget({ id: "b" as Budget["id"], name: "B", allowance: 200 }),
        budget({ id: "c" as Budget["id"], name: "C", allowance: 50 }),
      ]),
    }));
    expect(html).toContain("$350.00");
  });

  it("renders 12-Week Avg Weekly Spending metric", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([
        budget({ id: "food" as Budget["id"], name: "Food", allowance: 100 }),
      ]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        {
          id: "food-w1",
          budgetId: "food",
          periodStart: Timestamp.fromDate(new Date("2025-01-06")),
          periodEnd: Timestamp.fromDate(new Date("2025-01-13")),
          total: 80,
          count: 1,
          categoryBreakdown: {},
          groupId: null,
        },
      ]),
    }));
    expect(html).toContain("12-Week Avg Weekly Spending");
  });

  it("metrics section absent on fetch error", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockRejectedValue(new Error("connection failed")),
    }));
    expect(html).not.toContain('id="budget-metrics"');
  });

  it("header contains 12w Diff and 52w Diff columns", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget()]),
    }));
    expect(html).toContain("12w Diff");
    expect(html).toContain("52w Diff");
  });

  it("diff cells show formatted currency", async () => {
    // Two weeks needed: latest (w2) is excluded; w1 (total=100) is the completed data.
    // allowance=150, avg12 = 100/12, diff12 = 150 - 100/12 ≈ 141.67
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget({ id: "food" as Budget["id"], allowance: 150 })]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        {
          id: "food-w1",
          budgetId: "food",
          periodStart: Timestamp.fromDate(new Date("2025-01-06")),
          periodEnd: Timestamp.fromDate(new Date("2025-01-13")),
          total: 100,
          count: 1,
          categoryBreakdown: {},
          groupId: null,
        },
        {
          id: "food-w2",
          budgetId: "food",
          periodStart: Timestamp.fromDate(new Date("2025-01-13")),
          periodEnd: Timestamp.fromDate(new Date("2025-01-20")),
          total: 50,
          count: 1,
          categoryBreakdown: {},
          groupId: null,
        },
      ]),
    }));
    expect(html).toContain("$141.67");
  });

  it("diff cells are spans not inputs", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget({ id: "food" as Budget["id"], allowance: 150 })]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        {
          id: "food-w1",
          budgetId: "food",
          periodStart: Timestamp.fromDate(new Date("2025-01-06")),
          periodEnd: Timestamp.fromDate(new Date("2025-01-13")),
          total: 100,
          count: 1,
          categoryBreakdown: {},
          groupId: null,
        },
        {
          id: "food-w2",
          budgetId: "food",
          periodStart: Timestamp.fromDate(new Date("2025-01-13")),
          periodEnd: Timestamp.fromDate(new Date("2025-01-20")),
          total: 50,
          count: 1,
          categoryBreakdown: {},
          groupId: null,
        },
      ]),
    }));
    expect(html).toContain("$141.67");
    expect(html).not.toMatch(/<input[^>]*\$141\.67/);
  });

  it("surplus diff renders with the favorable class", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget({ id: "food" as Budget["id"], allowance: 150 })]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        {
          id: "food-w1",
          budgetId: "food",
          periodStart: Timestamp.fromDate(new Date("2025-01-06")),
          periodEnd: Timestamp.fromDate(new Date("2025-01-13")),
          total: 100,
          count: 1,
          categoryBreakdown: {},
          groupId: null,
        },
      ]),
    }));
    expect(html).toContain('class="variance-favorable"');
  });

  it("deficit diff renders with the unfavorable class", async () => {
    // Two weeks: latest (w2) excluded. Completed w1 total=2400 → avg12=2400/12=200 > allowance=150 → deficit
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget({ id: "food" as Budget["id"], allowance: 150 })]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        {
          id: "food-w1",
          budgetId: "food",
          periodStart: Timestamp.fromDate(new Date("2025-01-06")),
          periodEnd: Timestamp.fromDate(new Date("2025-01-13")),
          total: 2400,
          count: 1,
          categoryBreakdown: {},
          groupId: null,
        },
        {
          id: "food-w2",
          budgetId: "food",
          periodStart: Timestamp.fromDate(new Date("2025-01-13")),
          periodEnd: Timestamp.fromDate(new Date("2025-01-20")),
          total: 50,
          count: 1,
          categoryBreakdown: {},
          groupId: null,
        },
      ]),
    }));
    expect(html).toContain('class="variance-unfavorable"');
  });

  it("renders overrides table when budgets have overrides", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([
        budget({
          overrides: [{ date: Timestamp.fromDate(new Date("2025-06-15")), balance: 42.5 }],
        }),
      ]),
    }));
    expect(html).toContain('id="overrides-table"');
    expect(html).toContain("Balance Overrides");
    expect(html).toContain("Food");
    expect(html).toContain("2025-06-15");
    expect(html).toContain("42.5");
  });

  it("renders overrides table empty when budgets exist but have no overrides", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget({ overrides: [] })]),
    }));
    expect(html).toContain('id="overrides-table"');
    expect(html).not.toContain('class="override-row"');
  });

  it("hides overrides table when no budgets exist", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([]),
    }));
    expect(html).not.toContain('id="overrides-table"');
  });

  it("renders add override button for authorized users", async () => {
    const html = await renderBudgets(localOptions({
      getBudgets: vi.fn().mockResolvedValue([budget({ groupId: "household" })]),
    }));
    expect(html).toContain('id="add-override"');
  });

  it("does not render add override button for unauthorized users", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget()]),
    }));
    expect(html).not.toContain('id="add-override"');
  });

  it("renders delete button for authorized users", async () => {
    const html = await renderBudgets(localOptions({
      getBudgets: vi.fn().mockResolvedValue([
        budget({
          groupId: "household",
          overrides: [{ date: Timestamp.fromDate(new Date("2025-06-15")), balance: 100 }],
        }),
      ]),
    }));
    expect(html).toContain('class="delete-override"');
  });

  it("disables override inputs for unauthorized users", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([
        budget({
          overrides: [{ date: Timestamp.fromDate(new Date("2025-06-15")), balance: 100 }],
        }),
      ]),
    }));
    expect(html).toContain("disabled");
  });

  it("renders each budget row as an expand-row with variance data attributes", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget()]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        {
          id: "food-w1",
          budgetId: "food",
          periodStart: Timestamp.fromDate(new Date("2025-01-06")),
          periodEnd: Timestamp.fromDate(new Date("2025-01-13")),
          total: 100,
          count: 1,
          categoryBreakdown: { "Food:Groceries": 100 },
          groupId: null,
        },
        {
          id: "food-w2",
          budgetId: "food",
          periodStart: Timestamp.fromDate(new Date("2025-01-13")),
          periodEnd: Timestamp.fromDate(new Date("2025-01-20")),
          total: 50,
          count: 1,
          categoryBreakdown: { "Food:Groceries": 50 },
          groupId: null,
        },
      ]),
    }));
    expect(html).toContain('class="expand-row budget-row"');
    expect(html).toContain('class="budget-variance"');
    expect(html).toContain('data-weekly-allowance=');
    expect(html).toContain('data-window12=');
    expect(html).toContain('data-window52=');
  });

  it("favorable diff cell prefixes amount with a down arrow", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget({ id: "food" as Budget["id"], allowance: 150 })]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        {
          id: "food-w1",
          budgetId: "food",
          periodStart: Timestamp.fromDate(new Date("2025-01-06")),
          periodEnd: Timestamp.fromDate(new Date("2025-01-13")),
          total: 100,
          count: 1,
          categoryBreakdown: {},
          groupId: null,
        },
      ]),
    }));
    expect(html).toContain('aria-label="favorable"');
    expect(html).toContain("▼");
  });

  it("unfavorable diff cell prefixes amount with an up arrow", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget({ id: "food" as Budget["id"], allowance: 150 })]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        {
          id: "food-w1",
          budgetId: "food",
          periodStart: Timestamp.fromDate(new Date("2025-01-06")),
          periodEnd: Timestamp.fromDate(new Date("2025-01-13")),
          total: 2400,
          count: 1,
          categoryBreakdown: {},
          groupId: null,
        },
        {
          id: "food-w2",
          budgetId: "food",
          periodStart: Timestamp.fromDate(new Date("2025-01-13")),
          periodEnd: Timestamp.fromDate(new Date("2025-01-20")),
          total: 0,
          count: 1,
          categoryBreakdown: {},
          groupId: null,
        },
      ]),
    }));
    expect(html).toContain('aria-label="unfavorable"');
    expect(html).toContain("▲");
  });

  it("variance data-window12 contains serialized category rows", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget({ id: "food" as Budget["id"], allowance: 150 })]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        {
          id: "food-w1",
          budgetId: "food",
          periodStart: Timestamp.fromDate(new Date("2025-01-06")),
          periodEnd: Timestamp.fromDate(new Date("2025-01-13")),
          total: 100,
          count: 1,
          categoryBreakdown: { "Food:Groceries": 100 },
          groupId: null,
        },
        {
          id: "food-w2",
          budgetId: "food",
          periodStart: Timestamp.fromDate(new Date("2025-01-13")),
          periodEnd: Timestamp.fromDate(new Date("2025-01-20")),
          total: 0,
          count: 1,
          categoryBreakdown: {},
          groupId: null,
        },
      ]),
    }));
    const match = html.match(/data-window12="([^"]*)"/);
    expect(match).not.toBeNull();
    const unescaped = match![1].replace(/&quot;/g, '"').replace(/&amp;/g, "&");
    const parsed = JSON.parse(unescaped);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].category).toBe("Food:Groceries");
    expect(parsed[0].kind).toBe("category");
  });
});
