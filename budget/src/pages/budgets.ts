import { escapeHtml } from "@commons-systems/htmlutil";
import { type RenderPageOptions, renderPageNotices, renderLoadError } from "./render-options.js";
import { type Budget, type BudgetOverride, type BudgetPeriod, type Rollover, type AllowancePeriod, type SerializedBudgetPeriod } from "../firestore.js";
import { computeAverageWeeklyCredits, computeAverageWeeklySpending, computePerBudgetTrend, computePerBudgetAverageSpending, weeklyEquivalent, type PerBudgetPoint, type PerBudgetAverage } from "../balance.js";
import { formatCurrency } from "../format.js";

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

function renderRow(budget: Budget, editable: boolean, avg: PerBudgetAverage | undefined): string {
  const idAttr = editable ? ` data-budget-id="${escapeHtml(budget.id)}"` : "";
  const dis = editable ? "" : " disabled";
  const nameCell = `<input type="text" class="edit-name" value="${escapeHtml(budget.name)}" aria-label="Name"${dis}>`;
  const allowanceCell = `<input type="number" class="edit-allowance" value="${escapeHtml(String(budget.weeklyAllowance))}" min="0" aria-label="Allowance"${dis}>`;
  const periodCell = renderPeriodCell(budget, editable);
  const rolloverCell = renderRolloverCell(budget, editable);
  const periodScale = budget.allowancePeriod === "monthly" ? 52 / 12
    : budget.allowancePeriod === "quarterly" ? 52 / 4
    : 1;
  const avg12 = avg ? formatCurrency(avg.avg12 * periodScale) : "$0";
  const avg52 = avg ? formatCurrency(avg.avg52 * periodScale) : "$0";

  return `<div class="budget-row"${idAttr}>
    <span>${nameCell}</span>
    <span>${allowanceCell}</span>
    <span>${periodCell}</span>
    <span>${rolloverCell}</span>
    <span class="avg-col">${avg12}</span>
    <span class="avg-col">${avg52}</span>
  </div>`;
}

function renderBudgetTable(budgets: Budget[], authorized: boolean, averages: Map<string, PerBudgetAverage>): string {
  if (budgets.length === 0) {
    return "<p>No budgets found.</p>";
  }

  const sorted = [...budgets].sort((a, b) => a.name.localeCompare(b.name));
  const rows = sorted.map(b => renderRow(b, authorized, averages.get(b.id))).join("\n");

  return `<div id="budgets-table">
      <div class="budget-header">
        <span>Name</span>
        <span>Allowance</span>
        <span>Period</span>
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
  readonly weeklyAllowance: number;
  readonly allowancePeriod: AllowancePeriod;
  readonly rollover: Rollover;
  readonly overrides: SerializedBudgetOverride[];
}

function serializeBudgets(budgets: Budget[]): string {
  const data: SerializedBudget[] = budgets.map(b => ({
    id: b.id,
    name: b.name,
    weeklyAllowance: b.weeklyAllowance,
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

function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function renderOverrideRow(
  budgetId: string,
  budgetName: string,
  override: BudgetOverride,
  index: number,
  editable: boolean,
): string {
  const dis = editable ? "" : " disabled";
  const dateStr = formatDate(override.date.toDate());
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

export async function renderBudgets(options: RenderPageOptions): Promise<string> {
  const { authorized, dataSource } = options;

  let tableHtml: string;
  let overridesHtml = "";
  let chartHtml = "";
  try {
    const [budgets, periods, weeklyAggregates] = await Promise.all([
      dataSource.getBudgets()
        .catch((e) => { console.error("Failed to load budgets:", e); throw e; }),
      dataSource.getBudgetPeriods()
        .catch((e) => { console.error("Failed to load budget periods:", e); throw e; }),
      dataSource.getWeeklyAggregates()
        .catch((e) => { console.error("Failed to load weekly aggregates:", e); throw e; }),
    ]);
    const averageWeeklyCredits = computeAverageWeeklyCredits(weeklyAggregates);
    const totalWeeklyBudget = budgets.reduce((s, b) => s + weeklyEquivalent(b.weeklyAllowance, b.allowancePeriod), 0);
    const averageWeeklySpending = computeAverageWeeklySpending(periods);
    const metricsHtml = renderMetrics(averageWeeklyCredits, totalWeeklyBudget, averageWeeklySpending);
    const perBudgetTrend = computePerBudgetTrend(budgets, periods, weeklyAggregates);
    const perBudgetAverages = computePerBudgetAverageSpending(budgets, periods);
    chartHtml = renderChartContainer(budgets, periods, metricsHtml, perBudgetTrend, averageWeeklyCredits);
    tableHtml = renderBudgetTable(budgets, authorized, perBudgetAverages);
    if (budgets.length > 0) {
      overridesHtml = renderOverridesTable(budgets, authorized);
    }
  } catch (error) {
    tableHtml = renderLoadError(error, "budgets-error");
  }

  return `
    <h2>Budgets</h2>
    ${renderPageNotices(options, "budgets")}
    ${chartHtml}
    ${tableHtml}
    ${overridesHtml}
  `;
}
