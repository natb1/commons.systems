import { describe, it, expect, vi, beforeEach } from "vitest";
import { timestampMockFactory, makeContainer } from "../helpers";

vi.mock("firebase/firestore", () => timestampMockFactory());

import { renderAggregateTrendChart } from "../../src/pages/budgets-trend-chart";
import type { AggregatePoint } from "../../src/balance";

function makePoint(overrides: Partial<AggregatePoint> = {}): AggregatePoint {
  return {
    weekLabel: "1/5",
    weekMs: new Date("2025-01-05").getTime(),
    avg12Credits: 500,
    avg12Spending: 300,
    avg3Spending: 280,
    ...overrides,
  };
}

describe("renderAggregateTrendChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders SVG with fixed axis and scroll wrapper", () => {
    const container = makeContainer();
    const data = [
      makePoint({ weekLabel: "1/5", weekMs: new Date("2025-01-05").getTime() }),
      makePoint({ weekLabel: "1/12", weekMs: new Date("2025-01-12").getTime() }),
    ];
    const result = renderAggregateTrendChart(container, { data, containerWidth: 640, panelWidth: 60 });
    expect(container.querySelector(".chart-layout")).not.toBeNull();
    expect(container.querySelector(".chart-y-axis svg")).not.toBeNull();
    expect(container.querySelector(".chart-scroll-wrapper svg")).not.toBeNull();
    expect(result.weeks).toHaveLength(2);
  });

  it("shows empty message when data is empty", () => {
    const container = makeContainer();
    const result = renderAggregateTrendChart(container, { data: [], containerWidth: 640, panelWidth: 60 });
    expect(container.textContent).toBe("No trend data to chart.");
    expect(container.querySelector("svg")).toBeNull();
    expect(result.weeks).toEqual([]);
  });

  it("renders legend with 3 items", () => {
    const container = makeContainer();
    const data = [makePoint()];
    renderAggregateTrendChart(container, { data, containerWidth: 640, panelWidth: 60 });
    const legend = container.querySelector(".trend-legend");
    expect(legend).not.toBeNull();
    const items = legend!.querySelectorAll(".trend-legend-item");
    expect(items).toHaveLength(3);
    const labels = [...items].map(el => el.textContent);
    expect(labels).toContain("12-Week Avg Credits");
    expect(labels).toContain("12-Week Avg Spending");
    expect(labels).toContain("3-Week Avg Spending");
  });
});
