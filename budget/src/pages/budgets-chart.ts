import * as Plot from "@observablehq/plot";
import type { Budget, BudgetId, BudgetPeriod } from "../firestore.js";
import { applyRollover, computePeriodBalances, type PeriodBalance } from "../balance.js";
import { getThemeFg, computePanelWidth } from "./chart-util.js";

export interface ChartOptions {
  budgets: Budget[];
  periods: BudgetPeriod[];
}

export interface WeekEntry {
  readonly label: string;
  readonly ms: number;
}

export interface ChartResult {
  /** Week entries sorted chronologically, one per unique week. */
  readonly weeks: readonly WeekEntry[];
}

interface BarDatum {
  week: string;
  budget: string;
  spent: number;
  allowance: number;
  balance: number;
}

function formatWeek(ts: { toDate(): Date }): string {
  const d = ts.toDate();
  if (isNaN(d.getTime())) throw new Error("formatWeek received an invalid Date from timestamp");
  // Normalize to the Sunday of the same week so labels stay consistent
  // regardless of which weekday the period happens to begin on.
  const sun = new Date(d);
  sun.setDate(sun.getDate() - sun.getDay());
  return `${sun.getMonth() + 1}/${sun.getDate()}`;
}

/** Collect ordered unique week entries across all budgets, deduplicating by timestamp. */
function allWeekEntries(balanceMap: Map<BudgetId, PeriodBalance[]>): { label: string; ms: number }[] {
  const seen = new Map<number, string>();
  for (const balances of balanceMap.values()) {
    for (const pb of balances) {
      const ms = pb.periodStart.toMillis();
      if (!seen.has(ms)) seen.set(ms, formatWeek(pb.periodStart));
    }
  }
  return [...seen.entries()].sort((a, b) => a[0] - b[0]).map(([ms, label]) => ({ label, ms }));
}

function buildChartData(
  budgets: Budget[],
  balanceMap: Map<BudgetId, PeriodBalance[]>,
): { data: BarDatum[]; weeks: WeekEntry[] } {
  const weeks = allWeekEntries(balanceMap);
  const data: BarDatum[] = [];

  for (const budget of budgets) {
    const balances = balanceMap.get(budget.id) ?? [];
    const byMs = new Map<number, PeriodBalance>();
    for (const pb of balances) byMs.set(pb.periodStart.toMillis(), pb);

    // Walk all weeks: fill missing periods (no period record for this budget at this timestamp) with zero-spend rollover entries
    let accumulated = 0;
    for (const entry of weeks) {
      const pb = byMs.get(entry.ms);
      const spent = pb ? pb.spent : 0;
      const balance = pb
        ? pb.runningBalance
        : applyRollover(accumulated, budget.weeklyAllowance, budget.rollover);
      data.push({
        week: entry.label,
        budget: budget.name,
        spent,
        allowance: budget.weeklyAllowance,
        balance,
      });
      accumulated = balance;
    }
  }

  return { data, weeks };
}

export function renderBudgetChart(container: HTMLElement, options: ChartOptions): ChartResult {
  const { budgets, periods } = options;
  const balanceMap = computePeriodBalances(budgets, periods);
  const { data, weeks } = buildChartData(budgets, balanceMap);
  const weekLabels = weeks.map(w => w.label);

  if (data.length === 0) {
    container.textContent = "No budget period data to chart.";
    return { weeks: [] };
  }
  const weekCount = weeks.length;
  const panelWidth = computePanelWidth(budgets.length);
  const axisWidth = 50;
  const marginRight = 20;
  const chartWidth = Math.max(weekCount * panelWidth + marginRight, (container.clientWidth || 640) - axisWidth);
  const height = 300;
  const marginBottom = 50;

  const fg = getThemeFg(container);

  // Compute shared Y domain so the fixed Y-axis and scrollable chart body use the same scale
  let yMax = -Infinity;
  let yMin = 0;
  for (const d of data) {
    yMax = Math.max(yMax, d.spent, d.allowance, d.balance);
    yMin = Math.min(yMin, d.balance);
  }
  const yDomain: [number, number] = [yMin, yMax];

  const sharedStyle = { background: "transparent", color: fg };

  // Fixed Y-axis (stays visible while scrolling)
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

  // Scrollable chart body (no Y-axis)
  const chartSvg = Plot.plot({
    width: chartWidth,
    height,
    marginBottom,
    marginLeft: 0,
    marginRight,
    style: sharedStyle,
    x: { label: null, tickRotate: -45, padding: 0.1 },
    y: { label: null, axis: null, grid: true, domain: yDomain },
    fx: { label: null, padding: 0.15, domain: weekLabels },
    color: { legend: false },
    marks: [
      Plot.tickY(data, {
        x: "budget",
        y: "allowance",
        fx: "week",
        stroke: fg,
        strokeOpacity: 0.5,
        strokeWidth: 2,
        strokeDasharray: "4,3",
      }),
      Plot.barY(data, {
        x: "budget",
        y: "spent",
        fx: "week",
        fill: (d: BarDatum) => d.balance < 0 ? "#e45858" : "#4caf50",
      }),
      Plot.dot(data, {
        x: "budget",
        y: "balance",
        fx: "week",
        fill: "#f0a030",
        r: 4,
      }),
      Plot.ruleY([0]),
      Plot.tip(data, Plot.pointer({
        x: "budget",
        y: "spent",
        fx: "week",
        title: (d: BarDatum) =>
          `${d.budget}\nWeek: ${d.week}\nAllowance: $${d.allowance.toFixed(2)}\nSpent: $${d.spent.toFixed(2)}\nBalance: $${d.balance.toFixed(2)}`,
      })),
    ],
  });

  chartSvg.style.width = `${chartWidth}px`;
  chartSvg.style.minWidth = `${chartWidth}px`;

  const layout = document.createElement("div");
  layout.className = "chart-layout";

  const axisDiv = document.createElement("div");
  axisDiv.className = "chart-y-axis";
  axisDiv.appendChild(axisSvg);

  const wrapper = document.createElement("div");
  wrapper.className = "chart-scroll-wrapper";
  wrapper.appendChild(chartSvg);

  layout.appendChild(axisDiv);
  layout.appendChild(wrapper);
  container.replaceChildren(layout);

  wrapper.scrollLeft = wrapper.scrollWidth;

  return { weeks };
}
