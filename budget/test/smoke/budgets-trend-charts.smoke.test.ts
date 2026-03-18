import { describe, it, expect, vi, beforeEach } from "vitest";
import { timestampMockFactory, makeBudget, makePeriod } from "../helpers";

vi.mock("firebase/firestore", () => timestampMockFactory());

vi.mock("../../src/firestore.js", () => ({
  getBudgets: vi.fn(),
  getBudgetPeriods: vi.fn(),
  getTransactions: vi.fn(),
}));

import { renderBudgets } from "../../src/pages/budgets";
import { getBudgets, getBudgetPeriods, getTransactions } from "../../src/firestore";

const mockGetBudgets = vi.mocked(getBudgets);
const mockGetBudgetPeriods = vi.mocked(getBudgetPeriods);
const mockGetTransactions = vi.mocked(getTransactions);

describe("budgets trend charts smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("trend chart container exists on the page", async () => {
    mockGetBudgets.mockResolvedValue([makeBudget()]);
    mockGetBudgetPeriods.mockResolvedValue([
      makePeriod({ id: "food-w1", budgetId: "food", total: 80 }),
    ]);
    mockGetTransactions.mockResolvedValue([]);
    const html = await renderBudgets({ user: null, group: null, groupError: false });
    expect(html).toContain('id="budgets-trend-chart"');
  });

  it("area chart container exists on the page", async () => {
    mockGetBudgets.mockResolvedValue([makeBudget()]);
    mockGetBudgetPeriods.mockResolvedValue([
      makePeriod({ id: "food-w1", budgetId: "food", total: 80 }),
    ]);
    mockGetTransactions.mockResolvedValue([]);
    const html = await renderBudgets({ user: null, group: null, groupError: false });
    expect(html).toContain('id="budgets-area-chart"');
  });

  it("trend chart has aggregate and per-budget data attributes", async () => {
    mockGetBudgets.mockResolvedValue([makeBudget()]);
    mockGetBudgetPeriods.mockResolvedValue([
      makePeriod({ id: "food-w1", budgetId: "food", total: 80 }),
    ]);
    mockGetTransactions.mockResolvedValue([]);
    const html = await renderBudgets({ user: null, group: null, groupError: false });
    expect(html).toContain("data-aggregate-trend");
    expect(html).toContain("data-per-budget-trend");
  });

  it("renders without errors with standard test data", async () => {
    mockGetBudgets.mockResolvedValue([makeBudget()]);
    mockGetBudgetPeriods.mockResolvedValue([
      makePeriod({ id: "food-w1", budgetId: "food", total: 80 }),
    ]);
    mockGetTransactions.mockResolvedValue([]);
    const html = await renderBudgets({ user: null, group: null, groupError: false });
    expect(html).toContain("<h2>Budgets</h2>");
    expect(html).not.toContain('id="budgets-error"');
  });
});
