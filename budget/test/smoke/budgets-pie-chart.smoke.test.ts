import { describe, it, expect, vi, beforeEach } from "vitest";
import { timestampMockFactory, makeBudget, makePeriod } from "../helpers";
import type { DataSource } from "../../src/data-source";

vi.mock("firebase/firestore", () => timestampMockFactory());

import { renderBudgets } from "../../src/pages/budgets";

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
});
