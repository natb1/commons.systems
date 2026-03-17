import { escapeHtml } from "@commons-systems/htmlutil";
import { type RenderPageOptions, renderPageNotices, renderLoadError } from "./render-options.js";
import { getBudgets, getBudgetPeriods, getTransactions, type Budget, type BudgetPeriod, type Rollover, type SerializedBudgetPeriod } from "../firestore.js";
import { computeAverageWeeklyIncome } from "../balance.js";

const rolloverOptions: { value: Rollover; label: string }[] = [
  { value: "none", label: "None" },
  { value: "debt", label: "Debt only" },
  { value: "balance", label: "Full balance" },
];

function renderRolloverCell(budget: Budget, editable: boolean): string {
  const dis = editable ? "" : " disabled";
  const options = rolloverOptions.map(o => {
    const sel = o.value === budget.rollover ? " selected" : "";
    return `<option value="${escapeHtml(o.value)}"${sel}>${escapeHtml(o.label)}</option>`;
  }).join("");
  return `<select class="edit-rollover" aria-label="Rollover"${dis}>${options}</select>`;
}

function renderRow(budget: Budget, editable: boolean): string {
  const idAttr = editable ? ` data-budget-id="${escapeHtml(budget.id)}"` : "";
  const dis = editable ? "" : " disabled";
  const nameCell = `<input type="text" class="edit-name" value="${escapeHtml(budget.name)}" aria-label="Name"${dis}>`;
  const allowanceCell = `<input type="number" class="edit-allowance" value="${escapeHtml(String(budget.weeklyAllowance))}" min="0" aria-label="Weekly allowance"${dis}>`;
  const rolloverCell = renderRolloverCell(budget, editable);

  return `<div class="budget-row"${idAttr}>
    <span>${nameCell}</span>
    <span>${allowanceCell}</span>
    <span>${rolloverCell}</span>
  </div>`;
}

function renderBudgetTable(budgets: Budget[], authorized: boolean): string {
  if (budgets.length === 0) {
    return "<p>No budgets found.</p>";
  }

  const sorted = [...budgets].sort((a, b) => a.name.localeCompare(b.name));
  const rows = sorted.map(b => renderRow(b, authorized)).join("\n");

  return `<div id="budgets-table">
      <div class="budget-header">
        <span>Name</span>
        <span>Weekly Allowance</span>
        <span>Rollover</span>
      </div>
      ${rows}
    </div>`;
}

interface SerializedBudget {
  readonly id: string;
  readonly name: string;
  readonly weeklyAllowance: number;
  readonly rollover: Rollover;
}

function serializeBudgets(budgets: Budget[]): string {
  const data: SerializedBudget[] = budgets.map(b => ({
    id: b.id,
    name: b.name,
    weeklyAllowance: b.weeklyAllowance,
    rollover: b.rollover,
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

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function renderMetrics(averageWeeklyIncome: number, totalWeeklyBudget: number): string {
  return `<div id="budget-metrics" class="budget-metrics">
      <dl>
        <div class="metric">
          <dt>12-Week Avg Weekly Income</dt>
          <dd>${formatCurrency(averageWeeklyIncome)}</dd>
        </div>
        <div class="metric">
          <dt>Total Weekly Budget</dt>
          <dd>${formatCurrency(totalWeeklyBudget)}</dd>
        </div>
      </dl>
    </div>`;
}

function renderChartContainer(budgets: Budget[], periods: BudgetPeriod[], metricsHtml: string): string {
  return `<div id="budgets-chart-controls">
      <label>Jump to: <input type="date" id="chart-date-picker"></label>
    </div>
    <div id="budgets-chart" data-budgets="${serializeBudgets(budgets)}" data-periods="${serializePeriods(periods)}"></div>
    <div class="below-bar-chart-row">
      ${metricsHtml}
      <div id="budgets-pie"></div>
    </div>`;
}

export async function renderBudgets(options: RenderPageOptions): Promise<string> {
  const { user, group } = options;
  const authorized = group !== null;

  let tableHtml: string;
  let chartHtml = "";
  try {
    const [budgets, periods, transactions] = await Promise.all([
      (group && user?.email ? getBudgets(group.id, user.email) : getBudgets(null))
        .catch((e) => { console.error("Failed to load budgets:", e); throw e; }),
      (group && user?.email ? getBudgetPeriods(group.id, user.email) : getBudgetPeriods(null))
        .catch((e) => { console.error("Failed to load budget periods:", e); throw e; }),
      (group && user?.email ? getTransactions(group.id, user.email) : getTransactions(null))
        .catch((e) => { console.error("Failed to load transactions:", e); throw e; }),
    ]);
    const averageWeeklyIncome = computeAverageWeeklyIncome(transactions);
    const totalWeeklyBudget = budgets.reduce((s, b) => s + b.weeklyAllowance, 0);
    const metricsHtml = renderMetrics(averageWeeklyIncome, totalWeeklyBudget);
    chartHtml = renderChartContainer(budgets, periods, metricsHtml);
    tableHtml = renderBudgetTable(budgets, authorized);
  } catch (error) {
    tableHtml = renderLoadError(error, "budgets-error");
  }

  return `
    <h2>Budgets</h2>
    ${renderPageNotices(options, "budgets")}
    ${chartHtml}
    ${tableHtml}
  `;
}
