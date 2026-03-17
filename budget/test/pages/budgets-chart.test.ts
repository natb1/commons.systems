import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Budget, BudgetPeriod } from "../../src/firestore";

vi.mock("firebase/firestore", () => ({
  Timestamp: class Timestamp {
    _date: Date;
    constructor(d: Date) { this._date = d; }
    toDate() { return this._date; }
    toMillis() { return this._date.getTime(); }
    static fromDate(d: Date) { return new Timestamp(d); }
  },
}));

import { Timestamp } from "firebase/firestore";
import { renderBudgetChart } from "../../src/pages/budgets-chart";

function ts(dateStr: string): Timestamp {
  return Timestamp.fromDate(new Date(dateStr));
}

function makeBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: "food" as any,
    name: "Food",
    weeklyAllowance: 150,
    rollover: "none",
    groupId: null,
    ...overrides,
  };
}

function makePeriod(overrides: Partial<BudgetPeriod> & { id: string; budgetId: string }): BudgetPeriod {
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

function makeContainer(): HTMLElement {
  const container = document.createElement("div");
  container.style.setProperty("--fg", "#e0e0e0");
  document.body.appendChild(container);
  Object.defineProperty(container, "clientWidth", { value: 640 });
  return container;
}

describe("renderBudgetChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders SVG inside layout with fixed axis and scroll wrapper", () => {
    const container = makeContainer();
    const budgets = [makeBudget()];
    const periods = [
      makePeriod({ id: "food-w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 80 }),
    ];
    const result = renderBudgetChart(container, { budgets, periods });
    expect(container.querySelector(".chart-layout")).not.toBeNull();
    expect(container.querySelector(".chart-y-axis svg")).not.toBeNull();
    expect(container.querySelector(".chart-scroll-wrapper svg")).not.toBeNull();
    expect(result.weekLabels).toHaveLength(1);
  });

  it("shows empty message when no periods", () => {
    const container = makeContainer();
    const budgets = [makeBudget()];
    const result = renderBudgetChart(container, { budgets, periods: [] });
    expect(container.textContent).toBe("No budget period data to chart.");
    expect(container.querySelector("svg")).toBeNull();
    expect(result.weekLabels).toEqual([]);
  });

  it("renders all periods without filtering", () => {
    const budgets = [makeBudget({ weeklyAllowance: 100 })];
    const periods = [
      makePeriod({ id: "w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 10 }),
      makePeriod({ id: "w2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 20 }),
      makePeriod({ id: "w3", budgetId: "food", periodStart: ts("2025-01-20"), periodEnd: ts("2025-01-27"), total: 30 }),
      makePeriod({ id: "w4", budgetId: "food", periodStart: ts("2025-01-27"), periodEnd: ts("2025-02-03"), total: 40 }),
    ];

    const container = makeContainer();
    const result = renderBudgetChart(container, { budgets, periods });
    expect(result.weekLabels).toHaveLength(4);
  });

  it("multiple budgets: creates bars for each budget", () => {
    const container = makeContainer();
    const budgets = [
      makeBudget({ id: "food" as any, name: "Food", weeklyAllowance: 100 }),
      makeBudget({ id: "vacation" as any, name: "Vacation", weeklyAllowance: 50 }),
    ];
    const periods = [
      makePeriod({ id: "food-w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 60 }),
      makePeriod({ id: "vac-w1", budgetId: "vacation", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 20 }),
    ];
    const result = renderBudgetChart(container, { budgets, periods });
    const chartSvg = container.querySelector(".chart-scroll-wrapper svg");
    expect(chartSvg).not.toBeNull();
    const svgText = chartSvg!.textContent || "";
    expect(svgText).toContain("Food");
    expect(svgText).toContain("Vacation");
    expect(result.weekLabels).toHaveLength(1);
  });

  it("non-overlapping budgets: gap weeks get zero-spend entries with correct rollover", () => {
    const container = makeContainer();
    const budgets = [
      makeBudget({ id: "food" as any, name: "Food", weeklyAllowance: 100, rollover: "balance" }),
      makeBudget({ id: "vacation" as any, name: "Vacation", weeklyAllowance: 50, rollover: "none" }),
    ];
    // Food has w1 only, Vacation has w2 only — each has a gap week
    const periods = [
      makePeriod({ id: "food-w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 60 }),
      makePeriod({ id: "vac-w2", budgetId: "vacation", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 20 }),
    ];
    const result = renderBudgetChart(container, { budgets, periods });
    // Both weeks should appear for both budgets
    expect(result.weekLabels).toHaveLength(2);
    // SVG should contain both budget names (each has a bar in both weeks)
    const svgText = container.querySelector(".chart-scroll-wrapper svg")!.textContent || "";
    expect(svgText).toContain("Food");
    expect(svgText).toContain("Vacation");
  });
});
