import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("firebase/firestore", () => ({
  Timestamp: class Timestamp {
    _date: Date;
    constructor(d: Date) { this._date = d; }
    toDate() { return this._date; }
    toMillis() { return this._date.getTime(); }
    static fromDate(d: Date) { return new Timestamp(d); }
  },
}));

vi.mock("../../src/firestore.js", () => ({
  getBudgets: vi.fn(),
  getBudgetPeriods: vi.fn(),
  getTransactions: vi.fn(),
}));

import { renderBudgets } from "../../src/pages/budgets";
import { getBudgets, getBudgetPeriods, getTransactions, type Budget, type BudgetPeriod } from "../../src/firestore";
import { Timestamp } from "firebase/firestore";

const mockGetBudgets = vi.mocked(getBudgets);
const mockGetBudgetPeriods = vi.mocked(getBudgetPeriods);
const mockGetTransactions = vi.mocked(getTransactions);

function ts(dateStr: string): Timestamp {
  return Timestamp.fromDate(new Date(dateStr));
}

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

function period(overrides: Partial<BudgetPeriod> & { id: string; budgetId: string }): BudgetPeriod {
  return {
    periodStart: ts("2025-01-13"),
    periodEnd: ts("2025-01-20"),
    total: 0,
    count: 0,
    categoryBreakdown: {},
    groupId: null,
    ...overrides,
  } as BudgetPeriod;
}

describe("budgets pie chart smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders budget page without errors", async () => {
    mockGetBudgets.mockResolvedValue([budget()]);
    mockGetBudgetPeriods.mockResolvedValue([
      period({ id: "food-w1", budgetId: "food", total: 80 }),
    ]);
    mockGetTransactions.mockResolvedValue([]);
    const html = await renderBudgets({ user: null, group: null, groupError: false });
    expect(html).toContain("<h2>Budgets</h2>");
    expect(html).not.toContain('id="budgets-error"');
  });

  it("pie chart container exists on the page", async () => {
    mockGetBudgets.mockResolvedValue([budget()]);
    mockGetBudgetPeriods.mockResolvedValue([
      period({ id: "food-w1", budgetId: "food", total: 80 }),
    ]);
    mockGetTransactions.mockResolvedValue([]);
    const html = await renderBudgets({ user: null, group: null, groupError: false });
    expect(html).toContain('id="budgets-pie"');
  });
});
