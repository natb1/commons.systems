import { describe, it, expect, vi, beforeEach } from "vitest";
import { timestampMockFactory, makeContainer } from "../helpers";

vi.mock("firebase/firestore", () => timestampMockFactory());

import { renderPerBudgetAreaChart } from "../../src/pages/budgets-area-chart";
import type { PerBudgetPoint } from "../../src/balance";

function makePerBudgetPoint(overrides: Partial<PerBudgetPoint> = {}): PerBudgetPoint {
  return {
    weekLabel: "1/5",
    weekMs: new Date("2025-01-05").getTime(),
    budget: "Food",
    avg3Spending: 120,
    ...overrides,
  };
}

describe("renderPerBudgetAreaChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders SVG with fixed axis and scroll wrapper", () => {
    const container = makeContainer();
    const data = [
      makePerBudgetPoint({ weekLabel: "1/5", weekMs: new Date("2025-01-05").getTime(), budget: "Food" }),
      makePerBudgetPoint({ weekLabel: "1/12", weekMs: new Date("2025-01-12").getTime(), budget: "Food" }),
    ];
    const result = renderPerBudgetAreaChart(container, { data, containerWidth: 640, panelWidth: 60 });
    expect(container.querySelector(".chart-layout")).not.toBeNull();
    expect(container.querySelector(".chart-y-axis svg")).not.toBeNull();
    expect(container.querySelector(".chart-scroll-wrapper svg")).not.toBeNull();
    expect(result.weeks).toHaveLength(2);
  });

  it("shows empty message when data is empty", () => {
    const container = makeContainer();
    const result = renderPerBudgetAreaChart(container, { data: [], containerWidth: 640, panelWidth: 60 });
    expect(container.textContent).toBe("No per-budget trend data to chart.");
    expect(container.querySelector("svg")).toBeNull();
    expect(result.weeks).toEqual([]);
  });

  it("renders legend with budget names", () => {
    const container = makeContainer();
    const w1 = new Date("2025-01-05").getTime();
    const data = [
      makePerBudgetPoint({ weekLabel: "1/5", weekMs: w1, budget: "Food", avg3Spending: 100 }),
      makePerBudgetPoint({ weekLabel: "1/5", weekMs: w1, budget: "Housing", avg3Spending: 200 }),
    ];
    renderPerBudgetAreaChart(container, { data, containerWidth: 640, panelWidth: 60 });
    const legend = container.querySelector(".area-legend");
    expect(legend).not.toBeNull();
    const items = legend!.querySelectorAll(".area-legend-item");
    expect(items).toHaveLength(2);
    const labels = [...items].map(el => el.textContent);
    expect(labels).toContain("Food");
    expect(labels).toContain("Housing");
  });

  it("'Other' area appears when present", () => {
    const container = makeContainer();
    const w1 = new Date("2025-01-05").getTime();
    const data = [
      makePerBudgetPoint({ weekLabel: "1/5", weekMs: w1, budget: "Food", avg3Spending: 100 }),
      makePerBudgetPoint({ weekLabel: "1/5", weekMs: w1, budget: "Other", avg3Spending: 50 }),
    ];
    renderPerBudgetAreaChart(container, { data, containerWidth: 640, panelWidth: 60 });
    const legend = container.querySelector(".area-legend");
    expect(legend).not.toBeNull();
    const labels = [...legend!.querySelectorAll(".area-legend-item")].map(el => el.textContent);
    expect(labels).toContain("Other");
    // "Other" should be last in the legend
    expect(labels[labels.length - 1]).toBe("Other");
  });
});
