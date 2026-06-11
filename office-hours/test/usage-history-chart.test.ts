import { describe, it, expect } from "vitest";
import { renderUsageHistoryChart } from "../src/usage-history-chart.js";
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
 * A multi-sample fixture with a known number of DISTINCT reset times:
 *   - 2 distinct weekly resets (06-14, then 06-21 after the weekly reset)
 *   - 3 distinct 5-hour resets (15:00, 20:00, and the next-day 05:00)
 * → 5 ruleX reset boundary marks total.
 */
function multiSample(): UsageSample[] {
  return [
    make({
      sampledAt: new Date("2026-06-07T10:00:00Z"),
      fiveHourResetsAt: new Date("2026-06-07T15:00:00Z"),
      weeklyResetsAt: new Date("2026-06-14T00:00:00Z"),
      fiveHourUsedPct: 30,
      weeklyUsedPct: 10,
    }),
    make({
      sampledAt: new Date("2026-06-07T16:00:00Z"),
      fiveHourResetsAt: new Date("2026-06-07T20:00:00Z"),
      weeklyResetsAt: new Date("2026-06-14T00:00:00Z"),
      fiveHourUsedPct: 60,
      weeklyUsedPct: 25,
    }),
    make({
      sampledAt: new Date("2026-06-08T02:00:00Z"),
      fiveHourResetsAt: new Date("2026-06-08T05:00:00Z"),
      weeklyResetsAt: new Date("2026-06-14T00:00:00Z"),
      fiveHourUsedPct: 80,
      weeklyUsedPct: 40,
    }),
    make({
      sampledAt: new Date("2026-06-15T09:00:00Z"),
      fiveHourResetsAt: new Date("2026-06-07T15:00:00Z"),
      weeklyResetsAt: new Date("2026-06-21T00:00:00Z"),
      fiveHourUsedPct: 20,
      weeklyUsedPct: 5,
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

describe("renderUsageHistoryChart", () => {
  it("renders the chart layout with a fixed axis and a scroll wrapper", () => {
    const host = withFg();
    const el = renderUsageHistoryChart(multiSample());
    host.appendChild(el);

    expect(el.querySelector(".chart-layout")).not.toBeNull();
    expect(el.querySelector(".chart-y-axis svg")).not.toBeNull();
    expect(el.querySelector(".chart-scroll-wrapper svg")).not.toBeNull();
  });

  it("shows the empty-state message for an empty array", () => {
    const el = renderUsageHistoryChart([]);
    const empty = el.querySelector(".empty");
    expect(empty).not.toBeNull();
    expect(empty!.textContent).toBe("No usage history to chart.");
    expect(el.querySelector("svg")).toBeNull();
  });

  it("includes the pace-curve entry in the legend (dashed)", () => {
    withFg();
    const el = renderUsageHistoryChart(multiSample());

    const legend = el.querySelector(".trend-legend");
    expect(legend).not.toBeNull();
    const labels = Array.from(legend!.querySelectorAll(".trend-legend-item")).map(
      (i) => i.textContent ?? "",
    );
    expect(labels).toContain("pace W");
    expect(labels).toContain("5-hour %");
    expect(labels).toContain("weekly %");

    // The pace entry's swatch is dashed (rendered via a repeating gradient).
    const paceItem = Array.from(legend!.querySelectorAll(".trend-legend-item")).find(
      (i) => (i.textContent ?? "") === "pace W",
    );
    const swatch = paceItem!.querySelector(".legend-line") as HTMLElement;
    expect(swatch.style.backgroundImage).toContain("repeating-linear-gradient");
  });

  it("renders the reset-boundary rules (5 distinct reset times → vertical lines)", () => {
    withFg();
    const el = renderUsageHistoryChart(multiSample());

    // ruleX marks render as <line> elements. The fixture has 2 distinct weekly
    // + 3 distinct 5-hour reset times = 5 reset boundary lines. The y-axis
    // ruleY(0) renders in the separate axis SVG, so the chart-body SVG's lines
    // are the reset boundaries.
    const chartSvg = el.querySelector(".chart-scroll-wrapper svg");
    expect(chartSvg).not.toBeNull();
    const lines = chartSvg!.querySelectorAll("line");
    // At least the 5 reset boundaries (Plot may also emit grid/tick lines, so
    // assert a lower bound rather than an exact count).
    expect(lines.length).toBeGreaterThanOrEqual(5);
  });

  it("does not mutate the input array order", () => {
    withFg();
    // Deliberately unsorted input.
    const a = make({ sampledAt: new Date("2026-06-08T02:00:00Z") });
    const b = make({ sampledAt: new Date("2026-06-07T10:00:00Z") });
    const c = make({ sampledAt: new Date("2026-06-07T16:00:00Z") });
    const samples = [a, b, c];
    const originalRefs = samples.map((s) => s);

    renderUsageHistoryChart(samples);

    expect(samples[0]).toBe(originalRefs[0]);
    expect(samples[1]).toBe(originalRefs[1]);
    expect(samples[2]).toBe(originalRefs[2]);
  });
});
