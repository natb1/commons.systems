import { Timestamp } from "firebase/firestore";
import { type Budget, type BudgetId, type BudgetPeriod, type BudgetPeriodId, type SerializedBudgetPeriod } from "../firestore.js";
import { getActiveDataSource } from "../active-data-source.js";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import { showInputError, handleSaveError, deserializeJSON, attachScrollSync, wireChartDatePicker, wireChartResize } from "./hydrate-util.js";
import { renderBudgetChart, type ChartResult } from "./budgets-chart.js";
import { renderBudgetPieChart } from "./budgets-pie-chart.js";
import { renderPerBudgetAreaChart } from "./budgets-area-chart.js";
import { computePanelWidth } from "./chart-util.js";
import type { PerBudgetPoint } from "../balance.js";
import type { SerializedBudget } from "./budgets.js";

function rowBudgetId(el: HTMLElement): BudgetId | null {
  const row = el.closest(".budget-row");
  if (!(row instanceof HTMLElement)) return null;
  return (row.dataset.budgetId ?? null) as BudgetId | null;
}

export function hydrateBudgetTable(container: HTMLElement): void {
  container.addEventListener("blur", async (e) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    const budgetId = rowBudgetId(target);
    if (!budgetId) return;

    if (target.value === target.defaultValue) return;

    try {
      if (target.classList.contains("edit-name")) {
        if (!target.value) {
          showInputError(target, "Budget name cannot be empty");
          return;
        }
        await getActiveDataSource().updateBudget(budgetId, { name: target.value });
      } else if (target.classList.contains("edit-allowance")) {
        const allowance = Number(target.value);
        if (!Number.isFinite(allowance) || allowance < 0) {
          showInputError(target, "Weekly allowance must be a non-negative number");
          return;
        }
        await getActiveDataSource().updateBudget(budgetId, { weeklyAllowance: allowance });
      } else {
        return;
      }
      target.defaultValue = target.value;
    } catch (error) {
      handleSaveError(target, error, "budget");
    }
  }, true);

  container.addEventListener("change", async (e) => {
    const target = e.target;
    if (!(target instanceof HTMLSelectElement)) return;
    if (!target.classList.contains("edit-rollover")) return;
    const budgetId = rowBudgetId(target);
    if (!budgetId) return;

    const saved = target.querySelector("option[selected]") as HTMLOptionElement | null;
    if (saved && target.value === saved.value) return;

    try {
      const value = target.value;
      if (value !== "none" && value !== "debt" && value !== "balance") {
        showInputError(target, "Invalid rollover value");
        return;
      }
      await getActiveDataSource().updateBudget(budgetId, { rollover: value });
      // Update the selected attribute (not just .value) so showInputError can
      // revert to the last-saved value via option[selected].
      if (saved) saved.removeAttribute("selected");
      const newSelected = Array.from(target.options).find(o => o.value === value) ?? null;
      if (newSelected) newSelected.setAttribute("selected", "");
    } catch (error) {
      handleSaveError(target, error, "budget");
    }
  });
}

function deserializeBudgets(raw: string): Budget[] {
  let parsed: Array<Omit<SerializedBudget, "rollover"> & { rollover: string }>;
  try { parsed = JSON.parse(raw); } catch (e) { throw new DataIntegrityError(`Invalid budget chart data: ${e instanceof Error ? e.message : e}`); }
  return parsed.map(b => {
    if (b.rollover !== "none" && b.rollover !== "debt" && b.rollover !== "balance")
      throw new DataIntegrityError(`Invalid rollover value: ${b.rollover}`);
    return {
      id: b.id as BudgetId,
      name: b.name,
      weeklyAllowance: b.weeklyAllowance,
      rollover: b.rollover,
      groupId: null,
    };
  });
}

function deserializePeriods(raw: string): BudgetPeriod[] {
  let parsed: SerializedBudgetPeriod[];
  try { parsed = JSON.parse(raw); } catch (e) { throw new DataIntegrityError(`Invalid budget period chart data: ${e instanceof Error ? e.message : e}`); }
  return parsed.map(p => ({
    id: p.id as BudgetPeriodId,
    budgetId: p.budgetId as BudgetId,
    periodStart: Timestamp.fromMillis(p.periodStartMs),
    periodEnd: Timestamp.fromMillis(p.periodEndMs),
    total: p.total,
    count: p.count,
    categoryBreakdown: p.categoryBreakdown,
    groupId: null,
  }));
}

function deserializePerBudgetTrend(raw: string): PerBudgetPoint[] {
  const parsed = deserializeJSON(raw, "per-budget trend data");
  if (!Array.isArray(parsed)) throw new DataIntegrityError("Per-budget trend data is not an array");
  for (let i = 0; i < parsed.length; i++) {
    const el = parsed[i];
    if (typeof el.weekLabel !== "string" || typeof el.weekMs !== "number"
      || typeof el.budget !== "string" || typeof el.avg3Spending !== "number") {
      throw new DataIntegrityError(`Per-budget trend element ${i} missing or invalid fields: expected weekLabel(string), weekMs(number), budget(string), avg3Spending(number)`);
    }
  }
  return parsed as PerBudgetPoint[];
}

function getAllScrollWrappers(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(".chart-scroll-wrapper"));
}

let scrollAbort: AbortController | null = null;
function reattachScrollSync(): void {
  if (scrollAbort) scrollAbort.abort();
  const result = attachScrollSync(getAllScrollWrappers);
  scrollAbort = result.abort;
}

export function hydrateBudgetChart(container: HTMLElement): void {
  const budgetsRaw = container.dataset.budgets;
  const periodsRaw = container.dataset.periods;
  if (!budgetsRaw || !periodsRaw)
    throw new DataIntegrityError("budgets-chart missing required data-budgets or data-periods attribute");

  const budgets = deserializeBudgets(budgetsRaw);
  const periods = deserializePeriods(periodsRaw);
  let chartResult: ChartResult = { weeks: [] };

  const pieElOrNull = document.getElementById("budgets-pie");
  if (!pieElOrNull) throw new DataIntegrityError("budgets-pie container not found in page markup");
  const pieEl: HTMLElement = pieElOrNull;
  const incomeRaw = pieEl.dataset.averageWeeklyIncome;
  if (incomeRaw === undefined) throw new DataIntegrityError("budgets-pie missing required data-average-weekly-income attribute");
  const averageWeeklyIncome = Number(incomeRaw);
  if (!Number.isFinite(averageWeeklyIncome)) throw new DataIntegrityError(`Invalid average weekly income value: ${incomeRaw}`);

  const areaElOrNull = document.getElementById("budgets-area-chart");
  if (!areaElOrNull) throw new DataIntegrityError("budgets-area-chart container not found in page markup");
  const areaEl: HTMLElement = areaElOrNull;

  const perBudgetRaw = areaEl.dataset.perBudgetTrend;
  if (perBudgetRaw === undefined) throw new DataIntegrityError("budgets-area-chart missing required data-per-budget-trend attribute");
  const perBudgetTrend = deserializePerBudgetTrend(perBudgetRaw);

  // Match the bar chart's per-week column width so scroll sync aligns weeks.
  const panelWidth = computePanelWidth(budgets.length);

  function render(): void {
    chartResult = renderBudgetChart(container, { budgets, periods });
    renderBudgetPieChart(pieEl, { budgets, averageWeeklyIncome });

    const containerWidth = container.clientWidth || 640;
    renderPerBudgetAreaChart(areaEl, { data: perBudgetTrend, containerWidth, panelWidth });
  }

  render();
  reattachScrollSync();
  wireChartDatePicker("chart-date-picker", () => chartResult, getAllScrollWrappers);
  wireChartResize(container, render, getAllScrollWrappers, [container, areaEl], reattachScrollSync);
}
