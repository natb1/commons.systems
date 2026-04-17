import { describe, it, expect, vi, beforeEach } from "vitest";
import { timestampMockFactory, makeBudget, makePeriod, createMockDataSource, ts } from "../helpers";
import type { DataSource } from "../../src/data-source";
import type { Budget } from "../../src/firestore";

vi.mock("firebase/firestore", () => timestampMockFactory());

import { renderBudgets } from "../../src/pages/budgets";

function seedOptions(dsOverrides: Partial<DataSource> = {}) {
  return { authorized: false, groupName: "", dataSource: createMockDataSource(dsOverrides) };
}

describe("budgets variance smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without errors when categoryBreakdown is populated", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([makeBudget({ id: "food" as Budget["id"], name: "Food", allowance: 150 })]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        makePeriod({
          id: "food-w1", budgetId: "food",
          periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"),
          total: 100, categoryBreakdown: { "Food:Groceries": 90, "Food:Coffee": 10 },
        }),
        makePeriod({
          id: "food-w2", budgetId: "food",
          periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"),
          total: 50, categoryBreakdown: { "Food:Groceries": 50 },
        }),
      ]),
    }));
    expect(html).toContain("<h2>Budgets</h2>");
    expect(html).not.toContain('id="budgets-error"');
  });

  it("emits expand-row budget-row with variance data attributes", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([makeBudget()]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        makePeriod({ id: "food-w1", budgetId: "food", total: 80 }),
      ]),
    }));
    expect(html).toContain('class="expand-row budget-row"');
    expect(html).toContain('data-weekly-allowance=');
    expect(html).toContain('data-window12=');
    expect(html).toContain('data-window52=');
  });

  it("diff cell includes the favorable/unfavorable indicator arrow", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([makeBudget({ id: "food" as Budget["id"], allowance: 150 })]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        makePeriod({
          id: "food-w1", budgetId: "food",
          periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"),
          total: 100,
        }),
      ]),
    }));
    expect(html).toMatch(/aria-label="(favorable|unfavorable)"/);
    expect(html).toMatch(/[▲▼]/);
  });
});
