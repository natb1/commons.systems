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

describe("budgets pie chart smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders budget page without errors", async () => {
    mockGetBudgets.mockResolvedValue([makeBudget()]);
    mockGetBudgetPeriods.mockResolvedValue([
      makePeriod({ id: "food-w1", budgetId: "food", total: 80 }),
    ]);
    mockGetTransactions.mockResolvedValue([]);
    const html = await renderBudgets({ user: null, group: null, groupError: false });
    expect(html).toContain("<h2>Budgets</h2>");
    expect(html).not.toContain('id="budgets-error"');
  });

  it("pie chart container exists on the page", async () => {
    mockGetBudgets.mockResolvedValue([makeBudget()]);
    mockGetBudgetPeriods.mockResolvedValue([
      makePeriod({ id: "food-w1", budgetId: "food", total: 80 }),
    ]);
    mockGetTransactions.mockResolvedValue([]);
    const html = await renderBudgets({ user: null, group: null, groupError: false });
    expect(html).toContain('id="budgets-pie"');
  });
});
