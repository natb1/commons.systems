import * as Plot from "@observablehq/plot";
import type { NetWorthPoint } from "../balance.js";
import type { ChartResult, WeekEntry } from "./budgets-chart.js";
import { getThemeFg, assembleChartLayout, MARGIN_RIGHT, MARGIN_BOTTOM, computeChartWidth, renderAxisSvg } from "./chart-util.js";

export interface NetWorthChartOptions {
  readonly data: NetWorthPoint[];
  readonly containerWidth: number;
  readonly panelWidth: number;
}

const SERIES_NET_WORTH = "Liquid Net Worth";

interface LineDatum {
  weekIndex: number;
  weekLabel: string;
  value: number;
}

export function renderNetWorthChart(container: HTMLElement, options: NetWorthChartOptions): ChartResult {
  const { data, containerWidth, panelWidth } = options;

  if (data.length === 0) {
    container.textContent = "No net worth data to chart.";
    return { weeks: [] };
  }

  const weeks: WeekEntry[] = data.map(d => ({ label: d.weekLabel, ms: d.weekMs }));
  const weekLabels = weeks.map(w => w.label);
  const weekCount = weeks.length;

  const lineData: LineDatum[] = data.map((d, i) => ({
    weekIndex: i,
    weekLabel: d.weekLabel,
    value: d.netWorth,
  }));

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
  const margin = Math.max(Math.abs(yMax), Math.abs(yMin)) * 0.1 || 1;
  const yDomain: [number, number] = [yMin - margin, yMax + margin];

  const axisSvg = renderAxisSvg({ height, style: sharedStyle, yDomain });

  const color = "#26a69a";

  const chartSvg = Plot.plot({
    width: chartWidth,
    height,
    marginBottom: MARGIN_BOTTOM,
    marginLeft: 0,
    marginRight: MARGIN_RIGHT,
    style: sharedStyle,
    x: {
      label: null,
      tickRotate: -45,
      domain: [0, weekCount - 1],
      ticks: weekLabels.map((_, i) => i),
      tickFormat: (i: number) => {
        if (i < 0 || i >= weekLabels.length) throw new Error(`tickFormat index ${i} out of bounds [0, ${weekLabels.length})`);
        return weekLabels[i];
      },
    },
    y: { label: null, axis: null, grid: true, domain: yDomain },
    marks: [
      Plot.ruleY([0]),
      Plot.areaY(lineData, {
        x: "weekIndex",
        y: "value",
        fill: color,
        fillOpacity: 0.15,
        curve: "monotone-x",
      }),
      Plot.lineY(lineData, {
        x: "weekIndex",
        y: "value",
        stroke: color,
        strokeWidth: 2,
        curve: "monotone-x",
      }),
      Plot.dot(lineData, {
        x: "weekIndex",
        y: "value",
        fill: color,
        r: 3,
      }),
      Plot.tip(lineData, Plot.pointer({
        x: "weekIndex",
        y: "value",
        title: (d: LineDatum) =>
          `${SERIES_NET_WORTH}\nWeek: ${d.weekLabel}\n$${d.value.toFixed(2)}`,
      })),
    ],
  });

  chartSvg.style.width = `${chartWidth}px`;
  chartSvg.style.minWidth = `${chartWidth}px`;

  const { layout, wrapper } = assembleChartLayout(axisSvg, chartSvg);

  const legend = document.createElement("div");
  legend.className = "trend-legend";
  const item = document.createElement("div");
  item.className = "trend-legend-item";
  const line = document.createElement("span");
  line.className = "legend-line";
  line.style.backgroundColor = color;
  const label = document.createElement("span");
  label.textContent = SERIES_NET_WORTH;
  item.appendChild(line);
  item.appendChild(label);
  legend.appendChild(item);

  container.replaceChildren(layout, legend);
  wrapper.scrollLeft = wrapper.scrollWidth;

  return { weeks };
}
