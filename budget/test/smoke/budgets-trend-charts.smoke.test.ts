import { describe, it, expect, vi } from "vitest";
import { timestampMockFactory, makeBudget, makePeriod, createMockDataSource } from "../helpers";

vi.mock("firebase/firestore", () => timestampMockFactory());

import { renderBudgets } from "../../src/pages/budgets";

function seedOptions(dsOverrides = {}) {
  return { authorized: false, groupName: "", dataSource: createMockDataSource(dsOverrides) };
}

describe("budgets trend charts smoke", () => {
  it("trend chart container exists on the page", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([makeBudget()]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        makePeriod({ id: "food-w1", budgetId: "food", total: 80 }),
      ]),
    }));
    expect(html).toContain('id="budgets-trend-chart"');
  });

  it("area chart container exists on the page", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([makeBudget()]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        makePeriod({ id: "food-w1", budgetId: "food", total: 80 }),
      ]),
    }));
    expect(html).toContain('id="budgets-area-chart"');
  });

  it("trend chart has aggregate and per-budget data attributes", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([makeBudget()]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        makePeriod({ id: "food-w1", budgetId: "food", total: 80 }),
      ]),
    }));
    expect(html).toContain("data-aggregate-trend");
    expect(html).toContain("data-per-budget-trend");
  });

  it("renders without errors with standard test data", async () => {
    const html = await renderBudgets(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([makeBudget()]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        makePeriod({ id: "food-w1", budgetId: "food", total: 80 }),
      ]),
    }));
    expect(html).toContain("<h2>Budgets</h2>");
    expect(html).not.toContain('id="budgets-error"');
  });
});
