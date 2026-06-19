import { describe, it, expect, vi, beforeEach } from "vitest";
import { timestampMockFactory, makeBudget, makePeriod, createMockDataSource } from "../helpers";
import type { DataSource } from "../../src/data-source";

vi.mock("firebase/firestore", () => timestampMockFactory());

import { renderBudgetsContent } from "../../src/pages/budgets";

function seedOptions(dsOverrides: Partial<DataSource> = {}) {
  return { authorized: false, groupName: "", dataSource: createMockDataSource(dsOverrides) };
}

// Unit 4 removed the legacy renderBudgets async wrapper; the surviving sync
// renderBudgetsContent (still used by the SSG prerender) produces the same
// markup these selector smoke checks assert on. This local helper resolves the
// mock dataSource exactly as renderBudgets did, then renders.
async function renderBudgets(options: ReturnType<typeof seedOptions>): Promise<string> {
  const [budgets, periods, weeklyAggregates] = await Promise.all([
    options.dataSource.getBudgets(),
    options.dataSource.getBudgetPeriods(),
    options.dataSource.getWeeklyAggregates(),
  ]);
  return renderBudgetsContent(budgets, periods, weeklyAggregates, options.authorized);
}

describe("budgets pie chart smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders budget page without errors", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([makeBudget()]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        makePeriod({ id: "food-w1", budgetId: "food", total: 80 }),
      ]),
    }));
    expect(html).toContain("<h2>Budgets</h2>");
    expect(html).not.toContain('id="budgets-error"');
  });

  it("pie chart container exists on the page", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([makeBudget()]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        makePeriod({ id: "food-w1", budgetId: "food", total: 80 }),
      ]),
    }));
    expect(html).toContain('id="budgets-pie"');
  });

  it("pie chart container has data-average-weekly-credits attribute", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([makeBudget()]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        makePeriod({ id: "food-w1", budgetId: "food", total: 80 }),
      ]),
    }));
    expect(html).toContain("data-average-weekly-credits=");
  });
});
