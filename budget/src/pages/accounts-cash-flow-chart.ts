import * as Plot from "@observablehq/plot";
import { computeRollingAverage, type CashFlowPoint } from "../balance.js";
import type { ChartResult, WeekEntry } from "./budgets-chart.js";
import { getThemeFg, assembleChartLayout, MARGIN_RIGHT, MARGIN_BOTTOM, computeChartWidth, renderAxisSvg } from "./chart-util.js";

export interface CashFlowChartOptions {
  readonly data: CashFlowPoint[];
  readonly containerWidth: number;
  readonly pointWidth: number;
}

const SERIES_CASH_FLOW = "Weekly Cash Flow";
const SERIES_12W_AVG = "12-Week Avg";
const SERIES_52W_AVG = "52-Week Avg";

interface LineDatum {
  weekIndex: number;
  weekLabel: string;
  value: number;
  isAnchored: boolean;
}

interface AvgDatum {
  weekIndex: number;
  weekLabel: string;
  value: number;
}

export function renderCashFlowChart(container: HTMLElement, options: CashFlowChartOptions): ChartResult {
  const { data, containerWidth, pointWidth } = options;

  if (data.length === 0) {
    container.textContent = "No cash flow data to chart.";
    return { weeks: [] };
  }

  const weeks: WeekEntry[] = data.map(d => ({ label: d.weekLabel, ms: d.weekMs }));
  const weekLabels = weeks.map(w => w.label);
  const weekCount = weeks.length;

  const lineData: LineDatum[] = data.map((d, i) => ({
    weekIndex: i,
    weekLabel: d.weekLabel,
    value: d.cashFlow,
    isAnchored: d.isStatementAnchored,
  }));

  const rawValues = lineData.map(d => d.value);
  const avg12Values = computeRollingAverage(rawValues, 12);
  const avg52Values = computeRollingAverage(rawValues, 52);

  const avg12Data: AvgDatum[] = lineData.map((d, i) => ({ weekIndex: d.weekIndex, weekLabel: d.weekLabel, value: avg12Values[i] }));
  const avg52Data: AvgDatum[] = lineData.map((d, i) => ({ weekIndex: d.weekIndex, weekLabel: d.weekLabel, value: avg52Values[i] }));

  const chartWidth = computeChartWidth(weekCount, pointWidth, containerWidth);
  const height = 200;

  const fg = getThemeFg(container);
  const sharedStyle = { background: "transparent", color: fg };

  let yMax = 0;
  let yMin = 0;
  for (const d of lineData) {
    yMax = Math.max(yMax, d.value);
    yMin = Math.min(yMin, d.value);
  }
  for (const d of avg12Data) {
    yMax = Math.max(yMax, d.value);
    yMin = Math.min(yMin, d.value);
  }
  for (const d of avg52Data) {
    yMax = Math.max(yMax, d.value);
    yMin = Math.min(yMin, d.value);
  }
  const margin = Math.max(Math.abs(yMax), Math.abs(yMin)) * 0.1 || 1;
  const yDomain: [number, number] = [yMin - margin, yMax + margin];

  const axisSvg = renderAxisSvg({ height, style: sharedStyle, yDomain });

  const colorPositive = "#26a69a";
  const colorNegative = "#ef5350";
  const color12w = "#42a5f5";
  const color52w = "#ab47bc";

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
        y1: 0,
        y2: (d: LineDatum) => Math.max(0, d.value),
        fill: colorPositive,
        fillOpacity: 0.15,
        curve: "monotone-x",
      }),
      Plot.areaY(lineData, {
        x: "weekIndex",
        y1: 0,
        y2: (d: LineDatum) => Math.min(0, d.value),
        fill: colorNegative,
        fillOpacity: 0.15,
        curve: "monotone-x",
      }),
      Plot.lineY(lineData, {
        x: "weekIndex",
        y: "value",
        stroke: fg,
        strokeWidth: 1.5,
        curve: "monotone-x",
      }),
      // Interpolated points — smaller, semi-transparent
      Plot.dot(lineData.filter(d => !d.isAnchored), {
        x: "weekIndex",
        y: "value",
        fill: (d: LineDatum) => d.value >= 0 ? colorPositive : colorNegative,
        r: 2,
        fillOpacity: 0.5,
      }),
      // Statement-anchored points — larger, solid, with ring
      Plot.dot(lineData.filter(d => d.isAnchored), {
        x: "weekIndex",
        y: "value",
        fill: (d: LineDatum) => d.value >= 0 ? colorPositive : colorNegative,
        r: 4,
        stroke: fg,
        strokeWidth: 1,
      }),
      Plot.lineY(avg12Data, {
        x: "weekIndex",
        y: "value",
        stroke: color12w,
        strokeWidth: 2,
        curve: "monotone-x",
      }),
      Plot.lineY(avg52Data, {
        x: "weekIndex",
        y: "value",
        stroke: color52w,
        strokeWidth: 2,
        strokeDasharray: "8,4",
        curve: "monotone-x",
      }),
      Plot.tip(lineData, Plot.pointer({
        x: "weekIndex",
        y: "value",
        title: (d: LineDatum) =>
          `${SERIES_CASH_FLOW}${d.isAnchored ? " (statement)" : ""}\nWeek: ${d.weekLabel}\n$${d.value.toFixed(2)}\n${SERIES_12W_AVG}: $${avg12Values[d.weekIndex].toFixed(2)}\n${SERIES_52W_AVG}: $${avg52Values[d.weekIndex].toFixed(2)}`,
      })),
    ],
  });

  chartSvg.style.width = `${chartWidth}px`;
  chartSvg.style.minWidth = `${chartWidth}px`;

  const { layout, wrapper } = assembleChartLayout(axisSvg, chartSvg);

  const legend = document.createElement("div");
  legend.className = "trend-legend";

  const legendEntries: { name: string; color: string; dash?: string }[] = [
    { name: SERIES_CASH_FLOW, color: fg },
    { name: SERIES_12W_AVG, color: color12w },
    { name: SERIES_52W_AVG, color: color52w, dash: "8,4" },
  ];
  for (const entry of legendEntries) {
    const item = document.createElement("div");
    item.className = "trend-legend-item";
    const line = document.createElement("span");
    line.className = "legend-line";
    if (entry.dash) {
      line.style.backgroundImage = `repeating-linear-gradient(90deg, ${entry.color} 0 4px, transparent 4px 7px)`;
      line.style.backgroundColor = "transparent";
    } else {
      line.style.backgroundColor = entry.color;
    }
    const label = document.createElement("span");
    label.textContent = entry.name;
    item.appendChild(line);
    item.appendChild(label);
    legend.appendChild(item);
  }

  container.replaceChildren(layout, legend);
  wrapper.scrollLeft = wrapper.scrollWidth;

  return { weeks };
}
