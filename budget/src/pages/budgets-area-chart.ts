import * as Plot from "@observablehq/plot";
import { schemeTableau10 } from "d3-scale-chromatic";
import { UNBUDGETED_SERIES, type PerBudgetPoint } from "../balance.js";
import type { ChartResult, WeekEntry } from "./budgets-chart.js";
import { getThemeFg, assembleChartLayout, MARGIN_RIGHT, MARGIN_BOTTOM, computeChartWidth, renderAxisSvg } from "./chart-util.js";

export interface AreaChartOptions {
  readonly data: PerBudgetPoint[];
  readonly containerWidth: number;
  readonly panelWidth: number;
}

interface AreaDatum {
  weekIndex: number;
  weekLabel: string;
  budget: string;
  value: number;
}

export function renderPerBudgetAreaChart(container: HTMLElement, options: AreaChartOptions): ChartResult {
  const { data, containerWidth, panelWidth } = options;

  if (data.length === 0) {
    container.textContent = "No per-budget trend data to chart.";
    return { weeks: [] };
  }

  const weekSet = new Map<number, string>();
  for (const d of data) {
    if (!weekSet.has(d.weekMs)) weekSet.set(d.weekMs, d.weekLabel);
  }
  const weekEntries = [...weekSet.entries()].sort((a, b) => a[0] - b[0]);
  const weeks: WeekEntry[] = weekEntries.map(([ms, label]) => ({ label, ms }));
  const weekLabels = weeks.map(w => w.label);
  const weekCount = weeks.length;

  const weekIndexMap = new Map<number, number>();
  weekEntries.forEach(([ms], i) => weekIndexMap.set(ms, i));

  const budgetNames = [...new Set(data.map(d => d.budget))];
  const sortedBudgets = budgetNames.filter(n => n !== UNBUDGETED_SERIES).sort();
  if (budgetNames.includes(UNBUDGETED_SERIES)) sortedBudgets.push(UNBUDGETED_SERIES);

  const areaData: AreaDatum[] = [];
  for (const d of data) {
    const weekIndex = weekIndexMap.get(d.weekMs);
    if (weekIndex === undefined) throw new Error(`Unknown weekMs: ${d.weekMs}`);
    areaData.push({
      weekIndex,
      weekLabel: d.weekLabel,
      budget: d.budget,
      value: d.avg3Spending,
    });
  }

  // Assign colors: budgets get Tableau10, UNBUDGETED_SERIES gets gray
  const colorDomain = sortedBudgets;
  const colorRange = sortedBudgets.map((name, i) =>
    name === UNBUDGETED_SERIES ? "#9e9e9e" : schemeTableau10[i % schemeTableau10.length],
  );

  const chartWidth = computeChartWidth(weekCount, panelWidth, containerWidth);
  const height = 400;

  const fg = getThemeFg(container);
  const sharedStyle = { background: "transparent", color: fg };

  // Compute y domain from stacked totals
  const weekTotals = new Map<number, number>();
  for (const d of areaData) {
    weekTotals.set(d.weekIndex, (weekTotals.get(d.weekIndex) ?? 0) + d.value);
  }
  let yMax = 0;
  for (const total of weekTotals.values()) yMax = Math.max(yMax, total);
  const yDomain: [number, number] = [0, yMax * 1.1 || 1];

  const axisSvg = renderAxisSvg({ height, style: sharedStyle, yDomain });

  // Sort data by budget order then week so stacking follows sortedBudgets order
  const budgetOrder = new Map(sortedBudgets.map((b, i) => [b, i]));
  areaData.sort((a, b) => {
    const aOrder = budgetOrder.get(a.budget);
    const bOrder = budgetOrder.get(b.budget);
    if (aOrder === undefined) throw new Error(`Unknown budget in sort: "${a.budget}"`);
    if (bOrder === undefined) throw new Error(`Unknown budget in sort: "${b.budget}"`);
    return aOrder - bOrder || a.weekIndex - b.weekIndex;
  });

  // Scrollable chart body with stacked areas
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
      domain: [-0.5, weekCount - 0.5],
      ticks: weekLabels.map((_, i) => i),
      tickFormat: (i: number) => {
        if (i < 0 || i >= weekLabels.length) throw new Error(`tickFormat index ${i} out of bounds [0, ${weekLabels.length})`);
        return weekLabels[i];
      },
    },
    y: { label: null, axis: null, grid: true, domain: yDomain },
    color: {
      domain: colorDomain,
      range: colorRange,
      legend: false,
    },
    marks: [
      Plot.areaY(areaData, Plot.stackY({
        x: "weekIndex",
        y: "value",
        z: "budget",
        fill: "budget",
        fillOpacity: 0.4,
        order: null,
        curve: "monotone-x",
      })),
      Plot.lineY(areaData, Plot.stackY({
        x: "weekIndex",
        y: "value",
        z: "budget",
        stroke: "budget",
        strokeWidth: 1.5,
        order: null,
        curve: "monotone-x",
      })),
      Plot.dot(areaData, Plot.stackY({
        x: "weekIndex",
        y: "value",
        z: "budget",
        r: 4,
        fill: "budget",
        order: null,
      })),
      Plot.tip(areaData, Plot.stackY(Plot.pointer({
        x: "weekIndex",
        y: "value",
        z: "budget",
        order: null,
        title: (d: AreaDatum) =>
          `${d.budget}\nWeek: ${d.weekLabel}\n$${d.value.toFixed(2)}`,
      }))),
      Plot.ruleY([0]),
    ],
  });

  chartSvg.style.width = `${chartWidth}px`;
  chartSvg.style.minWidth = `${chartWidth}px`;

  const { layout, wrapper } = assembleChartLayout(axisSvg, chartSvg);

  const legend = document.createElement("div");
  legend.className = "area-legend";
  for (let i = 0; i < sortedBudgets.length; i++) {
    const name = sortedBudgets[i];
    const item = document.createElement("div");
    item.className = "area-legend-item";

    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.backgroundColor = colorRange[i];

    const label = document.createElement("span");
    label.textContent = name;

    item.appendChild(swatch);
    item.appendChild(label);
    legend.appendChild(item);
  }

  container.replaceChildren(layout, legend);
  wrapper.scrollLeft = wrapper.scrollWidth;

  return { weeks };
}
