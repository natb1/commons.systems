import { describe, it, expect } from "vitest";
import { renderWorkerHistoryChart } from "../src/worker-history-chart.js";
import { type UsageSample } from "../src/usage-samples.js";

const baseSample: UsageSample = {
  sampledAt: new Date("2026-06-07T10:00:00Z"),
  fiveHourUsedPct: 42.5,
  weeklyUsedPct: 18.3,
  fiveHourResetsAt: new Date("2026-06-07T15:00:00Z"),
  weeklyResetsAt: new Date("2026-06-14T00:00:00Z"),
  activeWorkers: 3,
  targetWorkers: 4,
  groupId: "group-abc",
};

const make = (o: Partial<UsageSample> = {}): UsageSample => ({ ...baseSample, ...o });

/**
 * A multi-sample fixture with clear divergence between active and target workers.
 * Active: 1, 2, 4, 3 — Target: 2, 2, 4, 4
 * Max active = 4, max target = 4, so yMax = 5.
 */
function multiSample(): UsageSample[] {
  return [
    make({
      sampledAt: new Date("2026-06-07T10:00:00Z"),
      activeWorkers: 1,
      targetWorkers: 2,
    }),
    make({
      sampledAt: new Date("2026-06-07T16:00:00Z"),
      activeWorkers: 2,
      targetWorkers: 2,
    }),
    make({
      sampledAt: new Date("2026-06-08T02:00:00Z"),
      activeWorkers: 4,
      targetWorkers: 4,
    }),
    make({
      sampledAt: new Date("2026-06-15T09:00:00Z"),
      activeWorkers: 3,
      targetWorkers: 4,
    }),
  ];
}

function withFg(): HTMLElement {
  // happy-dom has no stylesheet, so missing.css's --fg is absent — set it on
  // the container as budget's makeContainer does, so getThemeFg reads it live.
  const container = document.createElement("div");
  container.style.setProperty("--fg", "#ddd");
  document.body.appendChild(container);
  return container;
}

describe("renderWorkerHistoryChart", () => {
  it("renders the chart layout with a fixed axis and a scroll wrapper", () => {
    const host = withFg();
    const el = renderWorkerHistoryChart(multiSample());
    host.appendChild(el);

    expect(el.querySelector(".chart-layout")).not.toBeNull();
    expect(el.querySelector(".chart-y-axis svg")).not.toBeNull();
    expect(el.querySelector(".chart-scroll-wrapper svg")).not.toBeNull();
  });

  it("shows the empty-state message for an empty array", () => {
    const el = renderWorkerHistoryChart([]);
    const empty = el.querySelector(".empty");
    expect(empty).not.toBeNull();
    expect(empty!.textContent).toBe("No worker history to chart.");
    expect(el.querySelector("svg")).toBeNull();
  });

  it("includes both active and target entries in the legend", () => {
    withFg();
    const el = renderWorkerHistoryChart(multiSample());

    const legend = el.querySelector(".trend-legend");
    expect(legend).not.toBeNull();
    const labels = Array.from(legend!.querySelectorAll(".trend-legend-item")).map(
      (i) => i.textContent ?? "",
    );
    expect(labels).toContain("active workers");
    expect(labels).toContain("target (step)");
  });

  it("renders the target entry's legend swatch as dashed", () => {
    withFg();
    const el = renderWorkerHistoryChart(multiSample());

    const legend = el.querySelector(".trend-legend");
    expect(legend).not.toBeNull();

    const targetItem = Array.from(legend!.querySelectorAll(".trend-legend-item")).find(
      (i) => (i.textContent ?? "") === "target (step)",
    );
    expect(targetItem).not.toBeNull();
    const swatch = targetItem!.querySelector(".legend-line") as HTMLElement;
    expect(swatch.style.backgroundImage).toContain("repeating-linear-gradient");
  });

  it("renders two line series in the chart body", () => {
    withFg();
    const el = renderWorkerHistoryChart(multiSample());

    // Plot.lineY marks render path elements inside the chart SVG.
    const chartSvg = el.querySelector(".chart-scroll-wrapper svg");
    expect(chartSvg).not.toBeNull();
    const paths = chartSvg!.querySelectorAll("path");
    // At least 2 paths for the two data series.
    expect(paths.length).toBeGreaterThanOrEqual(2);
  });

  it("does not mutate the input array order", () => {
    withFg();
    // Deliberately unsorted input.
    const a = make({ sampledAt: new Date("2026-06-08T02:00:00Z"), activeWorkers: 4, targetWorkers: 4 });
    const b = make({ sampledAt: new Date("2026-06-07T10:00:00Z"), activeWorkers: 1, targetWorkers: 2 });
    const c = make({ sampledAt: new Date("2026-06-07T16:00:00Z"), activeWorkers: 2, targetWorkers: 2 });
    const samples = [a, b, c];
    const originalRefs = samples.map((s) => s);

    renderWorkerHistoryChart(samples);

    expect(samples[0]).toBe(originalRefs[0]);
    expect(samples[1]).toBe(originalRefs[1]);
    expect(samples[2]).toBe(originalRefs[2]);
  });
});
