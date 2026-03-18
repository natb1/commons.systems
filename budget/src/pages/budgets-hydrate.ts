import { Timestamp } from "firebase/firestore";
import { updateBudget, type Budget, type BudgetId, type BudgetPeriod, type BudgetPeriodId, type SerializedBudgetPeriod } from "../firestore.js";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import { showInputError, handleSaveError } from "./hydrate-util.js";
import { renderBudgetChart, type ChartResult } from "./budgets-chart.js";
import { renderBudgetPieChart } from "./budgets-pie-chart.js";
import { renderAggregateTrendChart } from "./budgets-trend-chart.js";
import { renderPerBudgetAreaChart } from "./budgets-area-chart.js";
import type { AggregatePoint } from "../balance.js";
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

function deserializeAggregateTrend(raw: string): AggregatePoint[] {
  try { return JSON.parse(raw); } catch (e) {
    throw new DataIntegrityError(`Invalid aggregate trend data: ${e instanceof Error ? e.message : e}`);
  }
}

function deserializePerBudgetTrend(raw: string): PerBudgetPoint[] {
  try { return JSON.parse(raw); } catch (e) {
    throw new DataIntegrityError(`Invalid per-budget trend data: ${e instanceof Error ? e.message : e}`);
  }
}

function getAllScrollWrappers(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(".chart-scroll-wrapper"));
}

function setupScrollSync(): void {
  let syncing = false;
  function syncScroll(source: HTMLElement): void {
    if (syncing) return;
    syncing = true;
    const ratio = source.scrollWidth > 0 ? source.scrollLeft / source.scrollWidth : 0;
    for (const w of getAllScrollWrappers()) {
      if (w !== source) w.scrollLeft = ratio * w.scrollWidth;
    }
    syncing = false;
  }

  for (const w of getAllScrollWrappers()) {
    w.addEventListener("scroll", () => syncScroll(w));
  }
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

  const trendEl = document.getElementById("budgets-trend-chart");
  const areaEl = document.getElementById("budgets-area-chart");

  // Deserialize trend data
  const aggregateTrend = trendEl?.dataset.aggregateTrend
    ? deserializeAggregateTrend(trendEl.dataset.aggregateTrend)
    : [];
  const perBudgetTrend = areaEl?.dataset.perBudgetTrend
    ? deserializePerBudgetTrend(areaEl.dataset.perBudgetTrend)
    : [];

  // Compute panelWidth from bar chart logic for pixel alignment
  const panelWidth = Math.max(budgets.length * 60 + 40, 120);

  function render(): void {
    chartResult = renderBudgetChart(container, { budgets, periods });
    renderBudgetPieChart(pieEl, { budgets, periods, windowWeeks: 12 });

    const containerWidth = container.clientWidth || 640;
    if (trendEl && aggregateTrend.length > 0) {
      renderAggregateTrendChart(trendEl, { data: aggregateTrend, containerWidth, panelWidth });
    }
    if (areaEl && perBudgetTrend.length > 0) {
      renderPerBudgetAreaChart(areaEl, { data: perBudgetTrend, containerWidth, panelWidth });
    }
  }

  render();
  setupScrollSync();

  // Configure date picker min/max from period date range
  const datePicker = document.getElementById("chart-date-picker") as HTMLInputElement | null;
  if (datePicker && chartResult.weeks.length > 0) {
    datePicker.min = toISODate(chartResult.weeks[0].ms);
    datePicker.max = toISODate(chartResult.weeks[chartResult.weeks.length - 1].ms);

    datePicker.addEventListener("change", () => {
      if (!datePicker.value) return;

      const weeks = chartResult.weeks;
      const selectedMs = new Date(datePicker.value + "T00:00:00").getTime();
      // Find nearest period start date
      let nearestIdx = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < weeks.length; i++) {
        const dist = Math.abs(weeks[i].ms - selectedMs);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }

      const weekCount = chartResult.weeks.length;
      if (weekCount === 0) return;

      // Scroll all wrappers to the selected week
      for (const wrapper of getAllScrollWrappers()) {
        const scrollMax = wrapper.scrollWidth - wrapper.clientWidth;
        const left = weekCount <= 1 ? 0 : Math.round((nearestIdx / (weekCount - 1)) * scrollMax);
        wrapper.scrollTo({ left: Math.max(0, left - wrapper.clientWidth / 2), behavior: "smooth" });
      }
    });
  }

  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  const observer = new ResizeObserver(() => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Capture scroll ratio from any wrapper
      const wrappers = getAllScrollWrappers();
      const scrollRatio = wrappers.length > 0 && wrappers[0].scrollWidth > 0
        ? wrappers[0].scrollLeft / wrappers[0].scrollWidth
        : 1;
      try {
        render();
      } catch (error) {
        if (error instanceof TypeError || error instanceof ReferenceError
            || error instanceof RangeError || error instanceof DataIntegrityError) {
          setTimeout(() => { throw error; }, 0);
          return;
        }
        console.error("Chart re-render failed on resize:", error);
        setTimeout(() => { throw error; }, 0);
        return;
      }
      // Restore scroll position on all wrappers
      for (const w of getAllScrollWrappers()) {
        w.scrollLeft = scrollRatio * w.scrollWidth;
      }
    }, 150);
  });
  observer.observe(container);
}

function toISODate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
