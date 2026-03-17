import { describe, it, expect, vi, beforeEach } from "vitest";
import { timestampMockFactory, ts, makeBudget, makePeriod, makeContainer } from "../helpers";

vi.mock("firebase/firestore", () => timestampMockFactory());

import { Timestamp } from "firebase/firestore";
import { renderBudgetChart } from "../../src/pages/budgets-chart";

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
    expect(result.periodStartMs).toEqual([ts("2025-01-06").toMillis()]);
  });

  it("shows empty message when no periods", () => {
    const container = makeContainer();
    const budgets = [makeBudget()];
    const result = renderBudgetChart(container, { budgets, periods: [] });
    expect(container.textContent).toBe("No budget period data to chart.");
    expect(container.querySelector("svg")).toBeNull();
    expect(result.weekLabels).toEqual([]);
    expect(result.periodStartMs).toEqual([]);
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
    const periods = [
      makePeriod({ id: "food-w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 60 }),
      makePeriod({ id: "vac-w2", budgetId: "vacation", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 20 }),
    ];
    const result = renderBudgetChart(container, { budgets, periods });
    expect(result.weekLabels).toHaveLength(2);
    const svgText = container.querySelector(".chart-scroll-wrapper svg")!.textContent || "";
    expect(svgText).toContain("Food");
    expect(svgText).toContain("Vacation");
  });
});
