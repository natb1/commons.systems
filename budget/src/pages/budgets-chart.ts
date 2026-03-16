import * as Plot from "@observablehq/plot";
import type { Budget, BudgetId, BudgetPeriod } from "../firestore.js";
import { computePeriodBalances, type PeriodBalance } from "../balance.js";

export interface ChartOptions {
  budgets: Budget[];
  periods: BudgetPeriod[];
  windowWeeks: number;
}

interface BarDatum {
  week: string;
  budget: string;
  value: number;
  type: "allowance" | "spent";
  overBudget: boolean;
}

interface LineDatum {
  week: string;
  budget: string;
  balance: number;
}

interface TipDatum {
  week: string;
  budget: string;
  allowance: number;
  spent: number;
  balance: number;
}

function formatWeek(ts: { toDate(): Date }): string {
  const d = ts.toDate();
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function buildChartData(
  budgets: Budget[],
  balanceMap: Map<BudgetId, PeriodBalance[]>,
  windowWeeks: number,
): { bars: BarDatum[]; lines: LineDatum[]; tips: TipDatum[] } {
  // Find the latest periodStart across all budgets to determine the window
  let latestMs = 0;
  for (const balances of balanceMap.values()) {
    for (const b of balances) {
      const ms = b.periodStart.toMillis();
      if (ms > latestMs) latestMs = ms;
    }
  }

  const bars: BarDatum[] = [];
  const lines: LineDatum[] = [];
  const tips: TipDatum[] = [];

  for (const budget of budgets) {
    const balances = balanceMap.get(budget.id) ?? [];
    // Filter to most recent windowWeeks periods
    const filtered = latestMs === 0
      ? balances
      : balances.filter((_, i) => i >= balances.length - windowWeeks);

    for (const pb of filtered) {
      const week = formatWeek(pb.periodStart);
      const overBudget = pb.spent > budget.weeklyAllowance;

      bars.push({
        week,
        budget: budget.name,
        value: budget.weeklyAllowance,
        type: "allowance",
        overBudget: false,
      });
      bars.push({
        week,
        budget: budget.name,
        value: pb.spent,
        type: "spent",
        overBudget,
      });
      lines.push({
        week,
        budget: budget.name,
        balance: pb.balance,
      });
      tips.push({
        week,
        budget: budget.name,
        allowance: budget.weeklyAllowance,
        spent: pb.spent,
        balance: pb.balance,
      });
    }
  }

  return { bars, lines, tips };
}

function getThemeColors(container: HTMLElement): { fg: string; surface: string; border: string } {
  const styles = getComputedStyle(container);
  return {
    fg: styles.getPropertyValue("--fg").trim() || "#e0e0e0",
    surface: styles.getPropertyValue("--surface").trim() || "#1a1a1a",
    border: styles.getPropertyValue("--border").trim() || "#333",
  };
}

export function renderBudgetChart(container: HTMLElement, options: ChartOptions): void {
  const { budgets, periods, windowWeeks } = options;
  const balanceMap = computePeriodBalances(budgets, periods);
  const { bars, lines, tips } = buildChartData(budgets, balanceMap, windowWeeks);

  if (bars.length === 0) {
    container.textContent = "No budget period data to chart.";
    return;
  }

  const colors = getThemeColors(container);
  const allowanceBars = bars.filter(d => d.type === "allowance");
  const spentBars = bars.filter(d => d.type === "spent");

  const plot = Plot.plot({
    width: container.clientWidth || 640,
    height: 300,
    style: {
      background: "transparent",
      color: colors.fg,
    },
    x: { label: null, tickRotate: -45 },
    y: { label: "$", grid: true },
    fx: { label: null, padding: 0.15 },
    color: { legend: false },
    marks: [
      Plot.barY(allowanceBars, {
        x: "budget",
        y: "value",
        fx: "week",
        fill: colors.border,
        fillOpacity: 0.3,
      }),
      Plot.barY(spentBars, {
        x: "budget",
        y: "value",
        fx: "week",
        fill: d => (d as BarDatum).overBudget ? "#e45858" : "#4caf50",
      }),
      Plot.lineY(lines, {
        x: "week",
        y: "balance",
        stroke: "budget",
        strokeWidth: 2,
        marker: "dot",
      }),
      Plot.tip(tips, Plot.pointer({
        x: "week",
        y: "spent",
        title: (d: TipDatum) =>
          `${d.budget}\nWeek: ${d.week}\nAllowance: $${d.allowance.toFixed(2)}\nSpent: $${d.spent.toFixed(2)}\nBalance: $${d.balance.toFixed(2)}`,
      })),
    ],
  });

  container.replaceChildren(plot);
}
