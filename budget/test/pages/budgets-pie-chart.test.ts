import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { timestampMockFactory, makeBudget, makeContainer } from "../helpers";

vi.mock("firebase/firestore", () => timestampMockFactory());

import { buildAllocationSlices, renderBudgetPieChart } from "../../src/pages/budgets-pie-chart";

const containers: HTMLElement[] = [];

function trackedContainer(): HTMLElement {
  const c = makeContainer();
  containers.push(c);
  return c;
}

describe("buildAllocationSlices", () => {
  it("produces 'Not Budgeted' slice for the difference when under-budget", () => {
    const budgets = [
      makeBudget({ id: "food" as any, name: "Food", weeklyAllowance: 100 }),
      makeBudget({ id: "transport" as any, name: "Transport", weeklyAllowance: 50 }),
    ];
    const result = buildAllocationSlices(budgets, 200);
    expect(result.slices).toEqual([
      { name: "Food", total: 100 },
      { name: "Transport", total: 50 },
      { name: "Not Budgeted", total: 50 },
    ]);
    expect(result.overage).toBe(0);
  });

  it("returns no 'Not Budgeted' slice and overage=0 on exact match", () => {
    const budgets = [
      makeBudget({ id: "food" as any, name: "Food", weeklyAllowance: 120 }),
      makeBudget({ id: "transport" as any, name: "Transport", weeklyAllowance: 80 }),
    ];
    const result = buildAllocationSlices(budgets, 200);
    expect(result.slices).toEqual([
      { name: "Food", total: 120 },
      { name: "Transport", total: 80 },
    ]);
    expect(result.overage).toBe(0);
  });

  it("returns overage and no 'Not Budgeted' slice when over-budget", () => {
    const budgets = [
      makeBudget({ id: "food" as any, name: "Food", weeklyAllowance: 300 }),
      makeBudget({ id: "transport" as any, name: "Transport", weeklyAllowance: 200 }),
    ];
    const result = buildAllocationSlices(budgets, 400);
    expect(result.slices).toEqual([
      { name: "Food", total: 300 },
      { name: "Transport", total: 200 },
    ]);
    expect(result.overage).toBe(100);
  });

  it("excludes budgets with weeklyAllowance=0", () => {
    const budgets = [
      makeBudget({ id: "food" as any, name: "Food", weeklyAllowance: 100 }),
      makeBudget({ id: "transport" as any, name: "Transport", weeklyAllowance: 0 }),
    ];
    const result = buildAllocationSlices(budgets, 200);
    expect(result.slices).toEqual([
      { name: "Food", total: 100 },
      { name: "Not Budgeted", total: 100 },
    ]);
    expect(result.overage).toBe(0);
  });

  it("returns only Not Budgeted slice when all allowances are zero", () => {
    const budgets = [
      makeBudget({ id: "food" as any, name: "Food", weeklyAllowance: 0 }),
      makeBudget({ id: "transport" as any, name: "Transport", weeklyAllowance: 0 }),
    ];
    const result = buildAllocationSlices(budgets, 200);
    expect(result.slices).toEqual([{ name: "Not Budgeted", total: 200 }]);
    expect(result.overage).toBe(0);
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
      makeBudget({ id: "food" as any, name: "Food", weeklyAllowance: 400 }),
      makeBudget({ id: "transport" as any, name: "Transport", weeklyAllowance: 350 }),
      makeBudget({ id: "fun" as any, name: "Fun", weeklyAllowance: 250 }),
    ];

    renderBudgetPieChart(container, { budgets, averageWeeklyCredits: 1000 });

    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute("aria-label")).toBe("Credits allocation pie chart");

    const paths = svg!.querySelectorAll("path");
    expect(paths).toHaveLength(3);

    const legendItems = container.querySelectorAll(".pie-legend-item");
    expect(legendItems).toHaveLength(3);

    const legendText = container.querySelector(".pie-legend")!.textContent || "";
    expect(legendText).toContain("Food");
    expect(legendText).toContain("Transport");
    expect(legendText).toContain("Fun");
  });

  it("shows empty state message when income is zero", () => {
    const container = trackedContainer();
    const budgets = [
      makeBudget({ id: "food" as any, name: "Food", weeklyAllowance: 100 }),
    ];

    renderBudgetPieChart(container, { budgets, averageWeeklyCredits: 0 });

    expect(container.textContent).toBe("No credits data");
    expect(container.querySelector("svg")).toBeNull();
  });

  it("renders warning banner when over-budget", () => {
    const container = trackedContainer();
    const budgets = [
      makeBudget({ id: "food" as any, name: "Food", weeklyAllowance: 600 }),
      makeBudget({ id: "transport" as any, name: "Transport", weeklyAllowance: 500 }),
    ];

    renderBudgetPieChart(container, { budgets, averageWeeklyCredits: 800 });

    const warning = container.querySelector(".pie-overage-warning");
    expect(warning).not.toBeNull();
    expect(warning!.textContent).toContain("Budgets exceed credits by");
    expect(warning!.textContent).toContain("/week");
  });

  it("does not render warning when under-budget", () => {
    const container = trackedContainer();
    const budgets = [
      makeBudget({ id: "food" as any, name: "Food", weeklyAllowance: 100 }),
    ];

    renderBudgetPieChart(container, { budgets, averageWeeklyCredits: 500 });

    const warning = container.querySelector(".pie-overage-warning");
    expect(warning).toBeNull();
  });

  it("shows 'Not Budgeted' in legend when under-budget", () => {
    const container = trackedContainer();
    const budgets = [
      makeBudget({ id: "food" as any, name: "Food", weeklyAllowance: 200 }),
    ];

    renderBudgetPieChart(container, { budgets, averageWeeklyCredits: 500 });

    const legendText = container.querySelector(".pie-legend")!.textContent || "";
    expect(legendText).toContain("Not Budgeted");

    const paths = container.querySelectorAll("path");
    expect(paths).toHaveLength(2);

    const notBudgetedPath = Array.from(paths).find(
      p => p.getAttribute("fill") === "#ccc",
    );
    expect(notBudgetedPath).not.toBeUndefined();
  });

  it("donut hole shows income, not spending sum", () => {
    const container = trackedContainer();
    const budgets = [
      makeBudget({ id: "food" as any, name: "Food", weeklyAllowance: 200 }),
      makeBudget({ id: "transport" as any, name: "Transport", weeklyAllowance: 100 }),
    ];

    renderBudgetPieChart(container, { budgets, averageWeeklyCredits: 750 });

    const svg = container.querySelector("svg")!;
    const text = svg.querySelector("text");
    expect(text).not.toBeNull();
    expect(text!.textContent).toBe(
      (750).toLocaleString("en-US", { style: "currency", currency: "USD" }),
    );
  });

  it("legend percentages sum to approximately 100%", () => {
    const container = trackedContainer();
    const budgets = [
      makeBudget({ id: "food" as any, name: "Food", weeklyAllowance: 333 }),
      makeBudget({ id: "transport" as any, name: "Transport", weeklyAllowance: 333 }),
      makeBudget({ id: "fun" as any, name: "Fun", weeklyAllowance: 334 }),
    ];

    renderBudgetPieChart(container, { budgets, averageWeeklyCredits: 1000 });

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
