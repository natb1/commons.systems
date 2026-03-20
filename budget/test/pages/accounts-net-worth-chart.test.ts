import { describe, it, expect, vi, beforeEach } from "vitest";
import { timestampMockFactory, makeContainer } from "../helpers";

vi.mock("firebase/firestore", () => timestampMockFactory());

import { renderNetWorthChart } from "../../src/pages/accounts-net-worth-chart";
import type { NetWorthPoint } from "../../src/balance";

function makePoint(overrides: Partial<NetWorthPoint> = {}): NetWorthPoint {
  return {
    weekLabel: "1/5",
    weekMs: new Date("2025-01-05").getTime(),
    netWorth: 5000,
    ...overrides,
  };
}

describe("renderNetWorthChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders SVG with fixed axis and scroll wrapper", () => {
    const container = makeContainer();
    const data = [
      makePoint({ weekLabel: "1/5", weekMs: new Date("2025-01-05").getTime() }),
      makePoint({ weekLabel: "1/12", weekMs: new Date("2025-01-12").getTime() }),
    ];
    const result = renderNetWorthChart(container, { data, containerWidth: 640, pointWidth: 40 });
    expect(container.querySelector(".chart-layout")).not.toBeNull();
    expect(container.querySelector(".chart-y-axis svg")).not.toBeNull();
    expect(container.querySelector(".chart-scroll-wrapper svg")).not.toBeNull();
    expect(result.weeks).toHaveLength(2);
  });

  it("shows empty message when data is empty", () => {
    const container = makeContainer();
    const result = renderNetWorthChart(container, { data: [], containerWidth: 640, pointWidth: 40 });
    expect(container.textContent).toBe("No net worth data to chart.");
    expect(container.querySelector("svg")).toBeNull();
    expect(result.weeks).toEqual([]);
  });

  it("renders legend with Liquid Net Worth", () => {
    const container = makeContainer();
    const data = [makePoint()];
    renderNetWorthChart(container, { data, containerWidth: 640, pointWidth: 40 });
    const legend = container.querySelector(".trend-legend");
    expect(legend).not.toBeNull();
    const items = legend!.querySelectorAll(".trend-legend-item");
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toBe("Liquid Net Worth");
  });
});
