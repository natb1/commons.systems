import { Timestamp } from "firebase/firestore";
import { updateBudget, type Budget, type BudgetId, type BudgetPeriod, type BudgetPeriodId, type SerializedBudgetPeriod, type Rollover } from "../firestore.js";
import { showInputError, handleSaveError } from "./hydrate-util.js";
import { renderBudgetChart } from "./budgets-chart.js";

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
        await updateBudget(budgetId, { name: target.value });
      } else if (target.classList.contains("edit-allowance")) {
        const allowance = Number(target.value);
        if (!Number.isFinite(allowance) || allowance < 0) {
          showInputError(target, "Weekly allowance must be a non-negative number");
          return;
        }
        await updateBudget(budgetId, { weeklyAllowance: allowance });
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
      await updateBudget(budgetId, { rollover: value });
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
  const parsed = JSON.parse(raw) as Array<{ id: string; name: string; weeklyAllowance: number; rollover: string }>;
  return parsed.map(b => ({
    id: b.id as BudgetId,
    name: b.name,
    weeklyAllowance: b.weeklyAllowance,
    rollover: b.rollover as Rollover,
    groupId: null,
  }));
}

function deserializePeriods(raw: string): BudgetPeriod[] {
  const parsed = JSON.parse(raw) as SerializedBudgetPeriod[];
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

export function hydrateBudgetChart(container: HTMLElement): void {
  const budgetsRaw = container.dataset.budgets;
  const periodsRaw = container.dataset.periods;
  if (!budgetsRaw || !periodsRaw) return;

  const budgets = deserializeBudgets(budgetsRaw);
  const periods = deserializePeriods(periodsRaw);
  let windowWeeks = 12;

  function render(): void {
    renderBudgetChart(container, { budgets, periods, windowWeeks });
  }

  render();

  const windowSelect = document.getElementById("chart-window") as HTMLSelectElement | null;
  if (windowSelect) {
    windowSelect.addEventListener("change", () => {
      windowWeeks = Number(windowSelect.value);
      render();
    });
  }

  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  const observer = new ResizeObserver(() => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 150);
  });
  observer.observe(container);
}
