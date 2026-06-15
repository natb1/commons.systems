import * as Plot from "@observablehq/plot";
import { type UsageSample } from "./usage-samples.js";
import {
  getThemeFg,
  assembleChartLayout,
  buildLegend,
  computeChartWidth,
  renderAxisSvg,
  MARGIN_RIGHT,
  MARGIN_BOTTOM,
} from "./chart-util.js";

const SERIES_ACTIVE = "active workers";
const SERIES_TARGET = "target (step)";

const COLOR_ACTIVE = "#42a5f5";
const COLOR_TARGET = "#ab47bc";

/** Per-sample chart width allocation along the time axis. */
const POINT_WIDTH = 60;
/** Approximate visible width before horizontal scrolling kicks in. */
const CONTAINER_WIDTH = 640;
const CHART_HEIGHT = 220;

interface WorkerPoint {
  x: Date;
  activeWorkers: number;
  targetWorkers: number;
}

/**
 * Renders the worker-history chart: active workers (solid line) vs target
 * workers (dashed step line) over time.
 *
 * Pure: does not mutate the input array. Returns the composed element (main.ts
 * appends it), or an empty-state element when there are no samples.
 */
export function renderWorkerHistoryChart(samples: UsageSample[]): HTMLElement {
  const container = document.createElement("div");
  container.className = "capacity-history-chart";

  if (samples.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No worker history to chart.";
    container.appendChild(empty);
    return container;
  }

  // Sort a copy ascending by sample time — input order is not guaranteed.
  const sorted = [...samples].sort((a, b) => a.sampledAt.getTime() - b.sampledAt.getTime());

  const points: WorkerPoint[] = sorted.map((s) => ({
    x: s.sampledAt,
    activeWorkers: s.activeWorkers,
    targetWorkers: s.targetWorkers,
  }));

  const maxActive = Math.max(...points.map((p) => p.activeWorkers));
  const maxTarget = Math.max(...points.map((p) => p.targetWorkers));
  const yMax = Math.max(maxActive, maxTarget) + 1;
  const yDomain: [number, number] = [0, yMax];

  const chartWidth = computeChartWidth(points.length, POINT_WIDTH, CONTAINER_WIDTH);

  const fg = getThemeFg(container);
  const sharedStyle = { background: "transparent", color: fg };

  const axisSvg = renderAxisSvg({ height: CHART_HEIGHT, style: sharedStyle, yDomain, label: "workers" });

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
      // Active workers — solid line.
      Plot.lineY(points, { x: "x", y: "activeWorkers", stroke: COLOR_ACTIVE, strokeWidth: 2, curve: "monotone-x" }),
      // Target workers — dashed step line.
      Plot.lineY(points, { x: "x", y: "targetWorkers", stroke: COLOR_TARGET, strokeWidth: 2, strokeDasharray: "8,4", curve: "step-after" }),
    ],
  });

  chartSvg.style.width = `${chartWidth}px`;
  chartSvg.style.minWidth = `${chartWidth}px`;

  const { layout, wrapper } = assembleChartLayout(axisSvg, chartSvg);

  const legend = buildLegend([
    { label: SERIES_ACTIVE, color: COLOR_ACTIVE },
    { label: SERIES_TARGET, color: COLOR_TARGET, dashed: true },
  ]);

  container.replaceChildren(layout, legend);
  wrapper.scrollLeft = wrapper.scrollWidth;

  return container;
}
