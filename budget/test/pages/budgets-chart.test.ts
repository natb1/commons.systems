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
import { renderBudgetChart, type ChartOptions } from "../../src/pages/budgets-chart";

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
  Object.defineProperty(container, "clientWidth", { value: 640 });
  return container;
}

describe("renderBudgetChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders SVG element into container when given valid data", () => {
    const container = makeContainer();
    const budgets = [makeBudget()];
    const periods = [
      makePeriod({ id: "food-w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 80 }),
    ];
    renderBudgetChart(container, { budgets, periods, windowWeeks: 12 });
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
  });

  it("shows empty message when no periods", () => {
    const container = makeContainer();
    const budgets = [makeBudget()];
    renderBudgetChart(container, { budgets, periods: [], windowWeeks: 12 });
    expect(container.textContent).toBe("No budget period data to chart.");
    expect(container.querySelector("svg")).toBeNull();
  });

  it("window filtering: smaller window produces fewer bars", () => {
    const budgets = [makeBudget({ weeklyAllowance: 100 })];
    const periods = [
      makePeriod({ id: "w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 10 }),
      makePeriod({ id: "w2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 20 }),
      makePeriod({ id: "w3", budgetId: "food", periodStart: ts("2025-01-20"), periodEnd: ts("2025-01-27"), total: 30 }),
      makePeriod({ id: "w4", budgetId: "food", periodStart: ts("2025-01-27"), periodEnd: ts("2025-02-03"), total: 40 }),
    ];

    const fullContainer = makeContainer();
    renderBudgetChart(fullContainer, { budgets, periods, windowWeeks: 12 });
    const fullRects = fullContainer.querySelectorAll("svg rect").length;

    const windowContainer = makeContainer();
    renderBudgetChart(windowContainer, { budgets, periods, windowWeeks: 2 });
    const windowRects = windowContainer.querySelectorAll("svg rect").length;

    expect(windowRects).toBeLessThan(fullRects);
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
    renderBudgetChart(container, { budgets, periods, windowWeeks: 12 });
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    const svgText = svg!.textContent || "";
    expect(svgText).toContain("Food");
    expect(svgText).toContain("Vacation");
  });
});
