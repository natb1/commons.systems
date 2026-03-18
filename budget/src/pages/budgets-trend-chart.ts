import * as Plot from "@observablehq/plot";
import type { AggregatePoint } from "../balance.js";
import type { ChartResult, WeekEntry } from "./budgets-chart.js";

export interface TrendChartOptions {
  data: AggregatePoint[];
  containerWidth: number;
  panelWidth: number;
}

interface LineDatum {
  week: string;
  series: string;
  value: number;
}

const SERIES_INCOME = "12-Week Avg Income";
const SERIES_12W_SPENDING = "12-Week Avg Spending";
const SERIES_3W_SPENDING = "3-Week Avg Spending";

const seriesColors: Record<string, string> = {
  [SERIES_INCOME]: "#66bb6a",
  [SERIES_12W_SPENDING]: "#42a5f5",
  [SERIES_3W_SPENDING]: "#ef5350",
};

const seriesDash: Record<string, string | undefined> = {
  [SERIES_INCOME]: "4,3",
  [SERIES_12W_SPENDING]: undefined,
  [SERIES_3W_SPENDING]: undefined,
};

function getThemeFg(container: HTMLElement): string {
  const fg = getComputedStyle(container).getPropertyValue("--fg").trim();
  if (!fg) throw new Error("Missing required CSS custom property --fg");
  return fg;
}

export function renderAggregateTrendChart(container: HTMLElement, options: TrendChartOptions): ChartResult {
  const { data, containerWidth, panelWidth } = options;

  if (data.length === 0) {
    container.textContent = "No trend data to chart.";
    return { weeks: [] };
  }

  const weeks: WeekEntry[] = data.map(d => ({ label: d.weekLabel, ms: d.weekMs }));
  const weekLabels = weeks.map(w => w.label);
  const weekCount = weeks.length;

  // Build line data: one point per series per week, using a constant x within each facet panel
  const lineData: LineDatum[] = [];
  for (const d of data) {
    lineData.push({ week: d.weekLabel, series: SERIES_INCOME, value: d.avg12Income });
    lineData.push({ week: d.weekLabel, series: SERIES_12W_SPENDING, value: d.avg12Spending });
    lineData.push({ week: d.weekLabel, series: SERIES_3W_SPENDING, value: d.avg3Spending });
  }

  const axisWidth = 50;
  const marginRight = 20;
  const chartWidth = Math.max(weekCount * panelWidth + marginRight, containerWidth - axisWidth);
  const height = 200;
  const marginBottom = 50;

  const fg = getThemeFg(container);
  const sharedStyle = { background: "transparent", color: fg };

  let yMax = 0;
  for (const d of lineData) yMax = Math.max(yMax, d.value);
  const yDomain: [number, number] = [0, yMax * 1.1 || 1];

  // Fixed Y-axis
  const axisSvg = Plot.plot({
    width: axisWidth,
    height,
    marginBottom,
    marginLeft: axisWidth - 1,
    marginRight: 0,
    style: sharedStyle,
    x: { axis: null, domain: [0, 1] },
    y: { label: "$", grid: false, domain: yDomain },
    marks: [Plot.ruleY([0])],
  });

  // Scrollable chart body with lines
  const seriesOrder = [SERIES_INCOME, SERIES_12W_SPENDING, SERIES_3W_SPENDING];
  const chartSvg = Plot.plot({
    width: chartWidth,
    height,
    marginBottom,
    marginLeft: 0,
    marginRight,
    style: sharedStyle,
    x: { axis: null, domain: [0, 1] },
    y: { label: null, axis: null, grid: true, domain: yDomain },
    fx: { label: null, padding: 0.15, domain: weekLabels },
    marks: seriesOrder.map(series =>
      Plot.dot(
        lineData.filter(d => d.series === series),
        {
          fx: "week",
          x: () => 0.5,
          y: "value",
          fill: seriesColors[series],
          r: 3,
          stroke: seriesDash[series] ? fg : undefined,
          strokeWidth: seriesDash[series] ? 0.5 : 0,
          strokeDasharray: seriesDash[series],
        },
      ),
    ),
  });

  chartSvg.style.width = `${chartWidth}px`;
  chartSvg.style.minWidth = `${chartWidth}px`;

  // Connect dots with lines across facet panels using an overlay SVG
  const overlaySvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  overlaySvg.setAttribute("width", String(chartWidth));
  overlaySvg.setAttribute("height", String(height));
  overlaySvg.style.position = "absolute";
  overlaySvg.style.top = "0";
  overlaySvg.style.left = "0";
  overlaySvg.style.pointerEvents = "none";

  // Get dot positions from the rendered chart
  const dots = chartSvg.querySelectorAll("circle");
  const dotsBySeriesIndex = new Map<number, { cx: number; cy: number }[]>();
  let idx = 0;
  for (const series of seriesOrder) {
    const count = lineData.filter(d => d.series === series).length;
    const points: { cx: number; cy: number }[] = [];
    for (let i = 0; i < count; i++) {
      const dot = dots[idx++];
      if (dot) {
        // Get the actual position by traversing parent transforms
        let cx = parseFloat(dot.getAttribute("cx") ?? "0");
        const cy = parseFloat(dot.getAttribute("cy") ?? "0");
        // Walk up parent <g> elements to accumulate transforms
        let el: Element | null = dot.parentElement;
        while (el && el !== chartSvg) {
          const transform = el.getAttribute("transform");
          if (transform) {
            const match = transform.match(/translate\(([^,)]+)/);
            if (match) cx += parseFloat(match[1]);
          }
          el = el.parentElement;
        }
        points.push({ cx, cy });
      }
    }
    dotsBySeriesIndex.set(seriesOrder.indexOf(series), points);
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

  // Build layout
  const layout = document.createElement("div");
  layout.className = "chart-layout";

  const axisDiv = document.createElement("div");
  axisDiv.className = "chart-y-axis";
  axisDiv.appendChild(axisSvg);

  const wrapper = document.createElement("div");
  wrapper.className = "chart-scroll-wrapper";
  wrapper.style.position = "relative";
  wrapper.appendChild(chartSvg);
  wrapper.appendChild(overlaySvg);

  layout.appendChild(axisDiv);
  layout.appendChild(wrapper);

  // Legend
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
