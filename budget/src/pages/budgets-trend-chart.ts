import * as Plot from "@observablehq/plot";
import type { AggregatePoint } from "../balance.js";
import type { ChartResult, WeekEntry } from "./budgets-chart.js";
import { getThemeFg, assembleChartLayout, MARGIN_RIGHT, MARGIN_BOTTOM, computeChartWidth, renderAxisSvg } from "./chart-util.js";

export interface TrendChartOptions {
  readonly data: AggregatePoint[];
  readonly containerWidth: number;
  readonly panelWidth: number;
}

const SERIES_INCOME = "12-Week Avg Income";
const SERIES_12W_SPENDING = "12-Week Avg Spending";
const SERIES_3W_SPENDING = "3-Week Avg Spending";
const SERIES_NET_INCOME = "12-Week Avg Net Income";

type SeriesName = typeof SERIES_INCOME | typeof SERIES_12W_SPENDING | typeof SERIES_3W_SPENDING | typeof SERIES_NET_INCOME;

interface LineDatum {
  weekIndex: number;
  weekLabel: string;
  series: SeriesName;
  value: number;
}

const seriesColors: Record<SeriesName, string> = {
  [SERIES_INCOME]: "#66bb6a",
  [SERIES_12W_SPENDING]: "#42a5f5",
  [SERIES_3W_SPENDING]: "#ef5350",
  [SERIES_NET_INCOME]: "#ab47bc",
};

const seriesDash: Record<SeriesName, string | undefined> = {
  [SERIES_INCOME]: "4,3",
  [SERIES_12W_SPENDING]: undefined,
  [SERIES_3W_SPENDING]: undefined,
  [SERIES_NET_INCOME]: "8,4",
};

export function renderAggregateTrendChart(container: HTMLElement, options: TrendChartOptions): ChartResult {
  const { data, containerWidth, panelWidth } = options;

  if (data.length === 0) {
    container.textContent = "No trend data to chart.";
    return { weeks: [] };
  }

  const weeks: WeekEntry[] = data.map(d => ({ label: d.weekLabel, ms: d.weekMs }));
  const weekLabels = weeks.map(w => w.label);
  const weekCount = weeks.length;

  const weekIndexMap = new Map<number, number>();
  data.forEach((d, i) => weekIndexMap.set(d.weekMs, i));

  const lineData: LineDatum[] = [];
  for (const d of data) {
    const weekIndex = weekIndexMap.get(d.weekMs);
    if (weekIndex === undefined) throw new Error(`Unknown weekMs: ${d.weekMs}`);
    lineData.push({ weekIndex, weekLabel: d.weekLabel, series: SERIES_INCOME, value: d.avg12Income });
    lineData.push({ weekIndex, weekLabel: d.weekLabel, series: SERIES_12W_SPENDING, value: d.avg12Spending });
    lineData.push({ weekIndex, weekLabel: d.weekLabel, series: SERIES_3W_SPENDING, value: d.avg3Spending });
    lineData.push({ weekIndex, weekLabel: d.weekLabel, series: SERIES_NET_INCOME, value: d.avg12NetIncome });
  }

  const chartWidth = computeChartWidth(weekCount, panelWidth, containerWidth);
  const height = 200;

  const fg = getThemeFg(container);
  const sharedStyle = { background: "transparent", color: fg };

  let yMax = 0;
  let yMin = 0;
  for (const d of lineData) {
    yMax = Math.max(yMax, d.value);
    yMin = Math.min(yMin, d.value);
  }
  const yDomain: [number, number] = [yMin < 0 ? yMin * 1.1 : 0, yMax * 1.1 || 1];

  const axisSvg = renderAxisSvg({ height, style: sharedStyle, yDomain });

  // Chart body with faceted dots; line paths drawn by overlaySvg
  const seriesOrder: SeriesName[] = [SERIES_INCOME, SERIES_12W_SPENDING, SERIES_3W_SPENDING, SERIES_NET_INCOME];
  const chartSvg = Plot.plot({
    width: chartWidth,
    height,
    marginBottom: MARGIN_BOTTOM,
    marginLeft: 0,
    marginRight: MARGIN_RIGHT,
    style: sharedStyle,
    x: { axis: null, domain: [0, 1] },
    y: { label: null, axis: null, grid: true, domain: yDomain },
    fx: {
      label: null,
      padding: 0.15,
      domain: weekLabels.map((_, i) => i),
      tickFormat: (i: number) => {
        if (i < 0 || i >= weekLabels.length) throw new Error(`tickFormat index ${i} out of bounds [0, ${weekLabels.length})`);
        return weekLabels[i];
      },
    },
    marks: [
      ...seriesOrder.map(series =>
        Plot.dot(
          lineData.filter(d => d.series === series),
          {
            fx: "weekIndex",
            x: () => 0.5,
            y: "value",
            fill: seriesColors[series],
            r: 3,
          },
        ),
      ),
      Plot.tip(lineData, Plot.pointer({
        fx: "weekIndex",
        x: () => 0.5,
        y: "value",
        title: (d: LineDatum) =>
          `${d.series}\nWeek: ${d.weekLabel}\n$${d.value.toFixed(2)}`,
      })),
    ],
  });

  chartSvg.style.width = `${chartWidth}px`;
  chartSvg.style.minWidth = `${chartWidth}px`;

  // Plot facets isolate each week's coordinate space, so dots in different
  // panels can't be connected with a single Plot.line mark. An overlay SVG
  // reads the rendered dot positions and draws paths across panels.
  const overlaySvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  overlaySvg.setAttribute("width", String(chartWidth));
  overlaySvg.setAttribute("height", String(height));
  overlaySvg.style.position = "absolute";
  overlaySvg.style.top = "0";
  overlaySvg.style.left = "0";
  overlaySvg.style.pointerEvents = "none";

  // Read dot positions from the rendered chart. Only X needs adjustment — Plot (as of v0.6)
  // applies horizontal translate transforms to facet panels, but Y is in absolute chart space.
  const dots = chartSvg.querySelectorAll("circle");
  if (dots.length !== lineData.length) {
    throw new Error(`Expected ${lineData.length} dots but found ${dots.length}`);
  }
  const dotsBySeriesIndex = new Map<number, { cx: number; cy: number }[]>();
  let idx = 0;
  for (let sIdx = 0; sIdx < seriesOrder.length; sIdx++) {
    const count = weekCount;
    const points: { cx: number; cy: number }[] = [];
    for (let i = 0; i < count; i++) {
      const dot = dots[idx++];
      const cxAttr = dot.getAttribute("cx");
      const cyAttr = dot.getAttribute("cy");
      if (cxAttr === null || cyAttr === null) throw new Error(`Dot ${idx - 1} missing cx/cy attributes`);
      let cx = parseFloat(cxAttr);
      const cy = parseFloat(cyAttr);
      if (Number.isNaN(cx) || Number.isNaN(cy)) throw new Error(`Dot ${idx - 1} has non-numeric cx/cy: cx="${cxAttr}", cy="${cyAttr}"`);
      let el: Element | null = dot.parentElement;
      while (el && el !== chartSvg) {
        const transform = el.getAttribute("transform");
        if (transform) {
          const match = transform.match(/translate\(([^,)]+)/);
          if (match) {
            const dx = parseFloat(match[1]);
            if (Number.isNaN(dx)) throw new Error(`Non-numeric translate value in transform: ${transform}`);
            cx += dx;
          }
        }
        el = el.parentElement;
      }
      points.push({ cx, cy });
    }
    dotsBySeriesIndex.set(sIdx, points);
  }

  for (const [sIdx, points] of dotsBySeriesIndex) {
    if (points.length < 2) continue;
    const series = seriesOrder[sIdx];
    const pathData = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.cx},${p.cy}`).join(" ");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", seriesColors[series]);
    path.setAttribute("stroke-width", "2");
    if (seriesDash[series]) path.setAttribute("stroke-dasharray", seriesDash[series]!);
    overlaySvg.appendChild(path);
  }

  const { layout, wrapper } = assembleChartLayout(axisSvg, chartSvg);
  wrapper.style.position = "relative";
  wrapper.appendChild(overlaySvg);

  const legend = document.createElement("div");
  legend.className = "trend-legend";
  for (const series of seriesOrder) {
    const item = document.createElement("div");
    item.className = "trend-legend-item";

    const line = document.createElement("span");
    line.className = "legend-line";
    line.style.backgroundColor = seriesColors[series];
    if (seriesDash[series]) {
      line.style.backgroundImage = `repeating-linear-gradient(90deg, ${seriesColors[series]} 0 4px, transparent 4px 7px)`;
      line.style.backgroundColor = "transparent";
    }

    const label = document.createElement("span");
    label.textContent = series;

    item.appendChild(line);
    item.appendChild(label);
    legend.appendChild(item);
  }

  container.replaceChildren(layout, legend);
  wrapper.scrollLeft = wrapper.scrollWidth;

  return { weeks };
}
