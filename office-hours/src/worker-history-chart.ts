import * as Plot from "@observablehq/plot";
import { type UsageSample } from "./usage-samples.js";
import {
  getThemeFg,
  readChartPalette,
  assembleChartLayout,
  buildLegend,
  computeChartWidth,
  renderAxisSvg,
  mountResponsiveChart,
  MARGIN_RIGHT,
  MARGIN_BOTTOM,
  POINT_WIDTH,
  CHART_HEIGHT,
} from "./chart-util.js";

const SERIES_ACTIVE = "active workers";
const SERIES_TARGET = "target (step)";

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

  const fg = getThemeFg(container);
  // DS categorical palette, read from the container at runtime.
  const palette = readChartPalette(container);
  const COLOR_ACTIVE = palette[1]; // --chart-2 amber
  const COLOR_TARGET = palette[4]; // --chart-5 tan (dashed target overlay)
  const sharedStyle = { background: "transparent", color: fg };

  const legend = buildLegend([
    { label: SERIES_ACTIVE, color: COLOR_ACTIVE },
    { label: SERIES_TARGET, color: COLOR_TARGET, dashed: true },
  ]);

  // Block-level slot the ResizeObserver measures; .chart-scroll-wrapper inside
  // clips horizontally so the slot stays at the panel content-box width.
  const slot = document.createElement("div");

  mountResponsiveChart(slot, (width) => {
    const chartWidth = computeChartWidth(points.length, POINT_WIDTH, width);

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

    // Scroll to the newest data (rightmost). The slot is detached on the first
    // paint, so a synchronous scroll there is a no-op (scrollWidth is 0); defer
    // to the next frame, by which a layout pass has run.
    requestAnimationFrame(() => {
      wrapper.scrollLeft = wrapper.scrollWidth;
    });

    return layout;
  });

  container.replaceChildren(slot, legend);

  return container;
}
