import { Timestamp } from "firebase/firestore";
import { updateBudget, type Budget, type BudgetId, type BudgetPeriod, type BudgetPeriodId, type SerializedBudgetPeriod } from "../firestore.js";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import { showInputError, handleSaveError } from "./hydrate-util.js";
import { renderBudgetChart, type ChartResult } from "./budgets-chart.js";
import { renderBudgetPieChart } from "./budgets-pie-chart.js";
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
  let parsed: Array<Omit<SerializedBudget, "rollover"> & { rollover: string }>;
  try { parsed = JSON.parse(raw); } catch { throw new DataIntegrityError("Invalid budget chart data"); }
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
  try { parsed = JSON.parse(raw); } catch { throw new DataIntegrityError("Invalid budget period chart data"); }
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
  if (!budgetsRaw || !periodsRaw)
    throw new DataIntegrityError("budgets-chart missing required data-budgets or data-periods attribute");

  const budgets = deserializeBudgets(budgetsRaw);
  const periods = deserializePeriods(periodsRaw);
  let chartResult: ChartResult = { weekLabels: [], periodStartMs: [] };

  const pieContainer = document.getElementById("budgets-pie");
  if (!pieContainer) throw new DataIntegrityError("budgets-pie container missing after successful chart render");

  function render(): void {
    chartResult = renderBudgetChart(container, { budgets, periods });
    renderBudgetPieChart(pieContainer, { budgets, periods, windowWeeks: 12 });
  }

  render();

  // Configure date picker min/max from period date range
  const datePicker = document.getElementById("chart-date-picker") as HTMLInputElement | null;
  if (datePicker && chartResult.periodStartMs.length > 0) {
    datePicker.min = toISODate(chartResult.periodStartMs[0]);
    datePicker.max = toISODate(chartResult.periodStartMs[chartResult.periodStartMs.length - 1]);

    datePicker.addEventListener("change", () => {
      const wrapper = container.querySelector(".chart-scroll-wrapper");
      if (!(wrapper instanceof HTMLElement) || !datePicker.value) return;

      const startMs = chartResult.periodStartMs;
      const selectedMs = new Date(datePicker.value + "T00:00:00").getTime();
      // Find nearest period start date
      let nearestIdx = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < startMs.length; i++) {
        const dist = Math.abs(startMs[i] - selectedMs);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }

      const weekCount = chartResult.weekLabels.length;
      if (weekCount === 0) return;

      const scrollMax = wrapper.scrollWidth - wrapper.clientWidth;
      const left = weekCount <= 1 ? 0 : Math.round((nearestIdx / (weekCount - 1)) * scrollMax);
      wrapper.scrollTo({ left: Math.max(0, left - wrapper.clientWidth / 2), behavior: "smooth" });
    });
  }

  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  const observer = new ResizeObserver(() => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const wrapper = container.querySelector(".chart-scroll-wrapper");
      const scrollRatio = wrapper instanceof HTMLElement && wrapper.scrollWidth > 0
        ? wrapper.scrollLeft / wrapper.scrollWidth
        : 1;
      try {
        render();
      } catch (error) {
        console.error("Chart re-render failed on resize:", error);
        return;
      }
      const newWrapper = container.querySelector(".chart-scroll-wrapper");
      if (newWrapper instanceof HTMLElement) {
        newWrapper.scrollLeft = scrollRatio * newWrapper.scrollWidth;
      }
    }, 150);
  });
  observer.observe(container);
}

function toISODate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
