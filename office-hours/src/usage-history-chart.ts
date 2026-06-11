import * as Plot from "@observablehq/plot";
import { type UsageSample } from "./usage-samples.js";
import { weeklyPaceCurve } from "./weekly-pace-curve.js";
import {
  getThemeFg,
  assembleChartLayout,
  buildLegend,
  computeChartWidth,
  renderAxisSvg,
  MARGIN_RIGHT,
  MARGIN_BOTTOM,
} from "./chart-util.js";

const SERIES_FIVE_HOUR = "5-hour %";
const SERIES_WEEKLY = "weekly %";
const SERIES_PACE = "pace W";

const COLOR_FIVE_HOUR = "#42a5f5";
const COLOR_WEEKLY = "#26a69a";
const COLOR_PACE = "#ab47bc";
const COLOR_RESET = "#ef5350";

/** Per-sample chart width allocation along the time axis. */
const POINT_WIDTH = 60;
/** Approximate visible width before horizontal scrolling kicks in. */
const CONTAINER_WIDTH = 640;
const CHART_HEIGHT = 220;

interface UsagePoint {
  x: Date;
  fiveHourUsedPct: number;
  weeklyUsedPct: number;
  paceW: number;
}

/** Distinct millisecond timestamps from a Date accessor, as Date objects. */
function distinctTimes(samples: UsageSample[], pick: (s: UsageSample) => Date): Date[] {
  const seen = new Set<number>();
  const out: Date[] = [];
  for (const s of samples) {
    const ms = pick(s).getTime();
    if (!seen.has(ms)) {
      seen.add(ms);
      out.push(new Date(ms));
    }
  }
  return out;
}

/**
 * Renders the usage-history chart: 5-hour % and weekly % over time, the weekly
 * pace curve W(x) overlaid on the weekly series with over/under-pace shading
 * between them, and reset boundaries marked for a legible sawtooth.
 *
 * Pure: does not mutate the input array. Returns the composed element (main.ts
 * appends it), or an empty-state element when there are no samples.
 */
export function renderUsageHistoryChart(samples: UsageSample[]): HTMLElement {
  const container = document.createElement("div");
  container.className = "capacity-history-chart";

  if (samples.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No usage history to chart.";
    container.appendChild(empty);
    return container;
  }

  // Sort a copy ascending by sample time — input order is not guaranteed.
  const sorted = [...samples].sort((a, b) => a.sampledAt.getTime() - b.sampledAt.getTime());

  const points: UsagePoint[] = sorted.map((s) => ({
    x: s.sampledAt,
    fiveHourUsedPct: s.fiveHourUsedPct,
    weeklyUsedPct: s.weeklyUsedPct,
    paceW: weeklyPaceCurve(s.sampledAt, s.weeklyResetsAt),
  }));

  const weeklyResetTimes = distinctTimes(sorted, (s) => s.weeklyResetsAt);
  const fiveHourResetTimes = distinctTimes(sorted, (s) => s.fiveHourResetsAt);

  const chartWidth = computeChartWidth(points.length, POINT_WIDTH, CONTAINER_WIDTH);
  const yDomain: [number, number] = [0, 100];

  const fg = getThemeFg(container);
  const sharedStyle = { background: "transparent", color: fg };

  const axisSvg = renderAxisSvg({ height: CHART_HEIGHT, style: sharedStyle, yDomain, label: "%" });

  const chartSvg = Plot.plot({
    width: chartWidth,
    height: CHART_HEIGHT,
    marginBottom: MARGIN_BOTTOM,
    marginLeft: 0,
    marginRight: MARGIN_RIGHT,
    style: sharedStyle,
    x: { type: "time", label: null },
    y: { label: null, axis: null, grid: true, domain: yDomain },
    marks: [
      // Over-pace shading: actual weekly% above the pace curve. Clamp y2 at the
      // pace level so each area renders only where its sign holds (mirrors the
      // cash-flow chart's positive/negative split via min/max).
      Plot.areaY(points, {
        x: "x",
        y1: "paceW",
        y2: (d: UsagePoint) => Math.max(d.paceW, d.weeklyUsedPct),
        fill: COLOR_RESET,
        fillOpacity: 0.15,
        curve: "monotone-x",
      }),
      // Under-pace shading: actual weekly% below the pace curve.
      Plot.areaY(points, {
        x: "x",
        y1: "paceW",
        y2: (d: UsagePoint) => Math.min(d.paceW, d.weeklyUsedPct),
        fill: COLOR_WEEKLY,
        fillOpacity: 0.15,
        curve: "monotone-x",
      }),
      // Reset boundaries — weekly resets (the dominant sawtooth) and 5-hour
      // resets (the finer sawtooth). Distinct dash patterns keep them legible.
      Plot.ruleX(weeklyResetTimes, { stroke: COLOR_RESET, strokeDasharray: "4,3", strokeOpacity: 0.7 }),
      Plot.ruleX(fiveHourResetTimes, { stroke: fg, strokeDasharray: "2,4", strokeOpacity: 0.4 }),
      // Series lines.
      Plot.lineY(points, { x: "x", y: "fiveHourUsedPct", stroke: COLOR_FIVE_HOUR, strokeWidth: 2, curve: "monotone-x" }),
      Plot.lineY(points, { x: "x", y: "weeklyUsedPct", stroke: COLOR_WEEKLY, strokeWidth: 2, curve: "monotone-x" }),
      // Pace overlay — dashed so it reads as the target.
      Plot.lineY(points, { x: "x", y: "paceW", stroke: COLOR_PACE, strokeWidth: 2, strokeDasharray: "8,4", curve: "monotone-x" }),
    ],
  });

  chartSvg.style.width = `${chartWidth}px`;
  chartSvg.style.minWidth = `${chartWidth}px`;

  const { layout, wrapper } = assembleChartLayout(axisSvg, chartSvg);

  const legend = buildLegend([
    { label: SERIES_FIVE_HOUR, color: COLOR_FIVE_HOUR },
    { label: SERIES_WEEKLY, color: COLOR_WEEKLY },
    { label: SERIES_PACE, color: COLOR_PACE, dashed: true },
  ]);

  container.replaceChildren(layout, legend);

  // Scroll to the newest data (rightmost) on first paint. scrollWidth is 0 for a
  // detached element, and this container is still detached here (main.ts attaches
  // the section after this returns), so defer the assignment to the next frame —
  // by then a layout pass has run and scrollWidth is meaningful.
  requestAnimationFrame(() => {
    wrapper.scrollLeft = wrapper.scrollWidth;
  });

  return container;
}
