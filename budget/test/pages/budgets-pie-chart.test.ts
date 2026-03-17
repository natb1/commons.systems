import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { timestampMockFactory, ts, makeBudget, makePeriod, makeContainer } from "../helpers";

vi.mock("firebase/firestore", () => timestampMockFactory());

import { Timestamp } from "firebase/firestore";
import { filterPeriodsToWindow, aggregateByBudget, renderBudgetPieChart } from "../../src/pages/budgets-pie-chart";

const containers: HTMLElement[] = [];

function trackedContainer(): HTMLElement {
  const c = makeContainer();
  containers.push(c);
  return c;
}

describe("filterPeriodsToWindow", () => {
  it("returns only the last windowWeeks weeks from 20 weeks of data", () => {
    const periods = [];
    const baseDate = new Date("2025-01-06");
    for (let i = 0; i < 20; i++) {
      const start = new Date(baseDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      periods.push(makePeriod({
        id: `food-w${i}`,
        budgetId: "food",
        periodStart: Timestamp.fromDate(start),
        periodEnd: Timestamp.fromDate(end),
        total: (i + 1) * 10,
      }));
    }

    const result = filterPeriodsToWindow(periods, 12);
    expect(result).toHaveLength(12);

    const resultIds = result.map(p => (p as any).id);
    for (let i = 8; i < 20; i++) {
      expect(resultIds).toContain(`food-w${i}`);
    }
    for (let i = 0; i < 8; i++) {
      expect(resultIds).not.toContain(`food-w${i}`);
    }
  });

  it("returns all periods when fewer than windowWeeks exist", () => {
    const periods = [
      makePeriod({ id: "w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 10 }),
      makePeriod({ id: "w2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 20 }),
    ];
    const result = filterPeriodsToWindow(periods, 12);
    expect(result).toHaveLength(2);
  });
});

describe("aggregateByBudget", () => {
  it("groups periods by budget and sums totals", () => {
    const budgets = [
      makeBudget({ id: "food" as any, name: "Food" }),
      makeBudget({ id: "transport" as any, name: "Transport" }),
    ];
    const periods = [
      makePeriod({ id: "f1", budgetId: "food", total: 50 }),
      makePeriod({ id: "f2", budgetId: "food", total: 30 }),
      makePeriod({ id: "t1", budgetId: "transport", total: 25 }),
    ];
    const slices = aggregateByBudget(budgets, periods);
    expect(slices).toHaveLength(2);
    expect(slices).toEqual([
      { name: "Food", total: 80 },
      { name: "Transport", total: 25 },
    ]);
  });

  it("filters out budgets with zero total spend", () => {
    const budgets = [
      makeBudget({ id: "food" as any, name: "Food" }),
      makeBudget({ id: "transport" as any, name: "Transport" }),
    ];
    const periods = [
      makePeriod({ id: "f1", budgetId: "food", total: 50 }),
      makePeriod({ id: "t1", budgetId: "transport", total: 0 }),
    ];
    const slices = aggregateByBudget(budgets, periods);
    expect(slices).toHaveLength(1);
    expect(slices[0]).toEqual({ name: "Food", total: 50 });
  });

  it("returns empty array when all budgets have zero spend", () => {
    const budgets = [makeBudget({ id: "food" as any, name: "Food" })];
    const periods = [
      makePeriod({ id: "f1", budgetId: "food", total: 0 }),
    ];
    const slices = aggregateByBudget(budgets, periods);
    expect(slices).toHaveLength(0);
  });

  it("excludes budgets whose periods sum to a negative total", () => {
    const budgets = [
      makeBudget({ id: "food" as any, name: "Food" }),
      makeBudget({ id: "transport" as any, name: "Transport" }),
    ];
    const periods = [
      makePeriod({ id: "f1", budgetId: "food", total: 50 }),
      makePeriod({ id: "t1", budgetId: "transport", total: -30 }),
    ];
    const slices = aggregateByBudget(budgets, periods);
    expect(slices).toHaveLength(1);
    expect(slices[0]).toEqual({ name: "Food", total: 50 });
  });
});

describe("renderBudgetPieChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    for (const c of containers) c.remove();
    containers.length = 0;
  });

  it("renders SVG paths and legend items for multiple budgets", () => {
    const container = trackedContainer();
    const budgets = [
      makeBudget({ id: "food" as any, name: "Food" }),
      makeBudget({ id: "transport" as any, name: "Transport" }),
      makeBudget({ id: "fun" as any, name: "Fun" }),
    ];
    const periods = [
      makePeriod({ id: "f1", budgetId: "food", total: 100 }),
      makePeriod({ id: "t1", budgetId: "transport", total: 60 }),
      makePeriod({ id: "u1", budgetId: "fun", total: 40 }),
    ];

    renderBudgetPieChart(container, { budgets, periods, windowWeeks: 12 });

    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();

    const paths = svg!.querySelectorAll("path");
    expect(paths).toHaveLength(3);

    const legendItems = container.querySelectorAll(".pie-legend-item");
    expect(legendItems).toHaveLength(3);

    const legendText = container.querySelector(".pie-legend")!.textContent || "";
    expect(legendText).toContain("Food");
    expect(legendText).toContain("Transport");
    expect(legendText).toContain("Fun");
  });

  it("renders a single arc path for a single budget", () => {
    const container = trackedContainer();
    const budgets = [makeBudget({ id: "food" as any, name: "Food" })];
    const periods = [
      makePeriod({ id: "f1", budgetId: "food", total: 75 }),
    ];

    renderBudgetPieChart(container, { budgets, periods, windowWeeks: 12 });

    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();

    const paths = svg!.querySelectorAll("path");
    expect(paths).toHaveLength(1);
  });

  it("shows empty state message when all spending is zero", () => {
    const container = trackedContainer();
    const budgets = [
      makeBudget({ id: "food" as any, name: "Food" }),
      makeBudget({ id: "transport" as any, name: "Transport" }),
    ];
    const periods = [
      makePeriod({ id: "f1", budgetId: "food", total: 0 }),
      makePeriod({ id: "t1", budgetId: "transport", total: 0 }),
    ];

    renderBudgetPieChart(container, { budgets, periods, windowWeeks: 12 });

    expect(container.textContent).toBe("No spending data");
    expect(container.querySelector("svg")).toBeNull();
  });

  it("legend percentages sum to approximately 100%", () => {
    const container = trackedContainer();
    const budgets = [
      makeBudget({ id: "food" as any, name: "Food" }),
      makeBudget({ id: "transport" as any, name: "Transport" }),
      makeBudget({ id: "fun" as any, name: "Fun" }),
    ];
    const periods = [
      makePeriod({ id: "f1", budgetId: "food", total: 33 }),
      makePeriod({ id: "t1", budgetId: "transport", total: 33 }),
      makePeriod({ id: "u1", budgetId: "fun", total: 34 }),
    ];

    renderBudgetPieChart(container, { budgets, periods, windowWeeks: 12 });

    const legendItems = container.querySelectorAll(".pie-legend-item");
    let totalPct = 0;
    for (const item of legendItems) {
      const text = item.textContent || "";
      const match = text.match(/([\d.]+)%/);
      expect(match).not.toBeNull();
      totalPct += parseFloat(match![1]);
    }
    expect(totalPct).toBeCloseTo(100, 0);
  });
});
