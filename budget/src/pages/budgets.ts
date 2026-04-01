import { escapeHtml } from "@commons-systems/htmlutil";
import { type RenderPageOptions, renderPageNotices, renderLoadError } from "./render-options.js";
import { type Budget, type BudgetOverride, type BudgetPeriod, type Rollover, type AllowancePeriod, type SerializedBudgetPeriod, type WeeklyAggregate } from "../firestore.js";
import { computeAverageWeeklyCredits, computeAverageWeeklySpending, computeBudgetDiffs, computePerBudgetTrend, weeklyEquivalent, periodEquivalent, type PerBudgetPoint, type PerBudgetStats } from "../balance.js";
import { formatCurrency } from "../format.js";
import { toISODate } from "./hydrate-util.js";

const rolloverOptions: { value: Rollover; label: string }[] = [
  { value: "none", label: "None" },
  { value: "debt", label: "Debt only" },
  { value: "balance", label: "Full balance" },
];

const periodOptions: { value: AllowancePeriod; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];

function renderPeriodCell(budget: Budget, editable: boolean): string {
  const dis = editable ? "" : " disabled";
  const options = periodOptions.map(o => {
    const sel = o.value === budget.allowancePeriod ? " selected" : "";
    return `<option value="${escapeHtml(o.value)}"${sel}>${escapeHtml(o.label)}</option>`;
  }).join("");
  return `<select class="edit-period" aria-label="Period"${dis}>${options}</select>`;
}

function renderRolloverCell(budget: Budget, editable: boolean): string {
  const dis = editable ? "" : " disabled";
  const options = rolloverOptions.map(o => {
    const sel = o.value === budget.rollover ? " selected" : "";
    return `<option value="${escapeHtml(o.value)}"${sel}>${escapeHtml(o.label)}</option>`;
  }).join("");
  return `<select class="edit-rollover" aria-label="Rollover"${dis}>${options}</select>`;
}

function diffStyle(value: number): string {
  return value >= 0 ? 'style="color: #4caf50"' : 'style="color: var(--error, #c00)"';
}

function renderRow(budget: Budget, editable: boolean, stats: PerBudgetStats | undefined): string {
  const idAttr = editable ? ` data-budget-id="${escapeHtml(budget.id)}"` : "";
  const dis = editable ? "" : " disabled";
  const nameCell = `<input type="text" class="edit-name" value="${escapeHtml(budget.name)}" aria-label="Name"${dis}>`;
  const allowanceCell = `<input type="number" class="edit-allowance" value="${escapeHtml(String(budget.allowance))}" min="0" aria-label="Allowance"${dis}>`;
  const periodCell = renderPeriodCell(budget, editable);
  const rolloverCell = renderRolloverCell(budget, editable);
  const diff12 = stats ? `<span ${diffStyle(stats.diff.diff12)}>${formatCurrency(stats.diff.diff12)}</span>` : `<span></span>`;
  const diff52 = stats ? `<span ${diffStyle(stats.diff.diff52)}>${formatCurrency(stats.diff.diff52)}</span>` : `<span></span>`;
  const avg12 = stats ? formatCurrency(periodEquivalent(stats.avg.avg12, budget.allowancePeriod)) : "$0";
  const avg52 = stats ? formatCurrency(periodEquivalent(stats.avg.avg52, budget.allowancePeriod)) : "$0";

  return `<div class="budget-row"${idAttr}>
    <span>${nameCell}</span>
    <span>${allowanceCell}</span>
    <span>${periodCell}</span>
    <span>${diff12}</span>
    <span>${diff52}</span>
    <span>${rolloverCell}</span>
    <span class="avg-col">${avg12}</span>
    <span class="avg-col">${avg52}</span>
  </div>`;
}

function renderBudgetTable(budgets: Budget[], authorized: boolean, stats: Map<Budget["id"], PerBudgetStats>): string {
  if (budgets.length === 0) {
    return "<p>No budgets found.</p>";
  }

  const sorted = [...budgets].sort((a, b) => a.name.localeCompare(b.name));
  const rows = sorted.map(b => renderRow(b, authorized, stats.get(b.id))).join("\n");

  return `<div id="budgets-table">
      <div class="budget-header">
        <span>Name</span>
        <span>Allowance</span>
        <span>Period</span>
        <span>12w Diff</span>
        <span>52w Diff</span>
        <span>Rollover</span>
        <span class="avg-col">12w Avg</span>
        <span class="avg-col">52w Avg</span>
      </div>
      ${rows}
    </div>`;
}

export interface SerializedBudgetOverride {
  readonly dateMs: number;
  readonly balance: number;
}

export interface SerializedBudget {
  readonly id: string;
  readonly name: string;
  readonly allowance: number;
  readonly allowancePeriod: AllowancePeriod;
  readonly rollover: Rollover;
  readonly overrides: SerializedBudgetOverride[];
}

function serializeBudgets(budgets: Budget[]): string {
  const data: SerializedBudget[] = budgets.map(b => ({
    id: b.id,
    name: b.name,
    allowance: b.allowance,
    allowancePeriod: b.allowancePeriod,
    rollover: b.rollover,
    overrides: b.overrides.map(o => ({ dateMs: o.date.toMillis(), balance: o.balance })),
  }));
  return escapeHtml(JSON.stringify(data));
}

function serializePeriods(periods: BudgetPeriod[]): string {
  const data: SerializedBudgetPeriod[] = periods.map(p => ({
    id: p.id,
    budgetId: p.budgetId,
    periodStartMs: p.periodStart.toMillis(),
    periodEndMs: p.periodEnd.toMillis(),
    total: p.total,
    count: p.count,
    categoryBreakdown: p.categoryBreakdown,
  }));
  return escapeHtml(JSON.stringify(data));
}

function renderMetrics(averageWeeklyCredits: number, totalWeeklyBudget: number, averageWeeklySpending: number): string {
  return `<div id="budget-metrics" class="budget-metrics">
      <dl>
        <div class="metric">
          <dt>12-Week Avg Weekly Credits</dt>
          <dd>${formatCurrency(averageWeeklyCredits)}</dd>
        </div>
        <div class="metric">
          <dt>Total Weekly Budget</dt>
          <dd>${formatCurrency(totalWeeklyBudget)}</dd>
        </div>
        <div class="metric">
          <dt>12-Week Avg Weekly Spending</dt>
          <dd>${formatCurrency(averageWeeklySpending)}</dd>
        </div>
      </dl>
    </div>`;
}

function serializeTrendData(data: readonly PerBudgetPoint[]): string {
  return escapeHtml(JSON.stringify(data));
}

function renderChartContainer(
  budgets: Budget[],
  periods: BudgetPeriod[],
  metricsHtml: string,
  perBudgetTrend: PerBudgetPoint[],
  averageWeeklyCredits: number,
): string {
  return `<div id="budgets-chart-controls">
      <label>Jump to: <input type="date" id="chart-date-picker"></label>
      <label>Weeks: <input type="number" id="area-chart-weeks" value="3" min="1" max="104"></label>
    </div>
    <div id="budgets-area-chart" data-per-budget-trend="${serializeTrendData(perBudgetTrend)}"></div>
    <div id="budgets-chart" data-budgets="${serializeBudgets(budgets)}" data-periods="${serializePeriods(periods)}"></div>
    <div class="below-bar-chart-row">
      ${metricsHtml}
      <div id="budgets-pie" data-average-weekly-credits="${escapeHtml(String(averageWeeklyCredits))}"></div>
    </div>`;
}


function renderOverrideRow(
  budgetId: string,
  budgetName: string,
  override: BudgetOverride,
  index: number,
  editable: boolean,
): string {
  const dis = editable ? "" : " disabled";
  const dateStr = toISODate(override.date.toMillis());
  return `<div class="override-row" data-budget-id="${escapeHtml(budgetId)}" data-override-index="${index}">
    <span>${escapeHtml(budgetName)}</span>
    <span><input type="date" class="edit-override-date" value="${escapeHtml(dateStr)}" aria-label="Override date"${dis}></span>
    <span><input type="number" class="edit-override-balance" value="${escapeHtml(String(override.balance))}" step="0.01" aria-label="Override balance"${dis}></span>
    <span>${editable ? `<button class="delete-override" aria-label="Delete override">Delete</button>` : ""}</span>
  </div>`;
}

function renderOverridesTable(budgets: Budget[], authorized: boolean): string {
  const allOverrides: { budgetId: string; budgetName: string; override: BudgetOverride; index: number }[] = [];
  for (const b of budgets) {
    for (let i = 0; i < b.overrides.length; i++) {
      allOverrides.push({ budgetId: b.id, budgetName: b.name, override: b.overrides[i], index: i });
    }
  }

  const rows = allOverrides
    .sort((a, b) => a.override.date.toMillis() - b.override.date.toMillis())
    .map(o => renderOverrideRow(o.budgetId, o.budgetName, o.override, o.index, authorized))
    .join("\n");

  const addButton = authorized
    ? `<button id="add-override" data-budgets="${serializeBudgets(budgets)}">Add Override</button>`
    : "";

  return `<div id="overrides-table">
    <h3>Balance Overrides</h3>
    <div class="override-header">
      <span>Budget</span>
      <span>Date</span>
      <span>Balance</span>
      <span></span>
    </div>
    ${rows}
    ${addButton}
  </div>`;
}

export function renderBudgetsContent(
  budgets: Budget[], periods: BudgetPeriod[], weeklyAggregates: WeeklyAggregate[],
  authorized: boolean,
): string {
  const averageWeeklyCredits = computeAverageWeeklyCredits(weeklyAggregates);
  const totalWeeklyBudget = budgets.reduce((s, b) => s + weeklyEquivalent(b.allowance, b.allowancePeriod), 0);
  const averageWeeklySpending = computeAverageWeeklySpending(periods);
  const metricsHtml = renderMetrics(averageWeeklyCredits, totalWeeklyBudget, averageWeeklySpending);
  const perBudgetTrend = computePerBudgetTrend(budgets, periods, weeklyAggregates);
  const chartHtml = renderChartContainer(budgets, periods, metricsHtml, perBudgetTrend, averageWeeklyCredits);
  const budgetStats = computeBudgetDiffs(budgets, periods);
  const tableHtml = renderBudgetTable(budgets, authorized, budgetStats);
  const overridesHtml = budgets.length > 0 ? renderOverridesTable(budgets, authorized) : "";
  const noticeHtml = renderPageNotices({ authorized }, "budgets");

  return `
    <h2>Budgets</h2>
    ${noticeHtml}
    ${chartHtml}
    ${tableHtml}
    ${overridesHtml}
  `;
}

export async function renderBudgets(options: RenderPageOptions): Promise<string> {
  const { authorized, dataSource } = options;
  try {
    const [budgets, periods, weeklyAggregates] = await Promise.all([
      dataSource.getBudgets(),
      dataSource.getBudgetPeriods(),
      dataSource.getWeeklyAggregates(),
    ]);
    return renderBudgetsContent(budgets, periods, weeklyAggregates, authorized);
  } catch (error) {
    return `
    <h2>Budgets</h2>
    ${renderPageNotices(options, "budgets")}
    ${renderLoadError(error, "budgets-error")}
  `;
  }
}
