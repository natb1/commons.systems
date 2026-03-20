import { Timestamp } from "firebase/firestore";
import { type Budget, type BudgetId, type BudgetOverride, type BudgetPeriod, type BudgetPeriodId, type SerializedBudgetPeriod } from "../firestore.js";
import { getActiveDataSource } from "../active-data-source.js";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import { showInputError, handleSaveError, deserializeJSON, attachScrollSync, wireChartDatePicker, wireChartResize } from "./hydrate-util.js";
import { renderBudgetChart } from "./budgets-chart.js";
import { renderBudgetPieChart } from "./budgets-pie-chart.js";
import { renderPerBudgetAreaChart } from "./budgets-area-chart.js";
import { computePanelWidth, filterToWindow } from "./chart-util.js";
import { toSundayEntry, type PerBudgetPoint } from "../balance.js";
import type { SerializedBudget, SerializedBudgetOverride } from "./budgets.js";

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
  let parsed: Array<Omit<SerializedBudget, "rollover" | "overrides"> & { rollover: string; overrides?: SerializedBudgetOverride[] }>;
  try { parsed = JSON.parse(raw); } catch (e) { throw new DataIntegrityError(`Invalid budget chart data: ${e instanceof Error ? e.message : e}`); }
  return parsed.map(b => {
    if (b.rollover !== "none" && b.rollover !== "debt" && b.rollover !== "balance")
      throw new DataIntegrityError(`Invalid rollover value: ${b.rollover}`);
    return {
      id: b.id as BudgetId,
      name: b.name,
      weeklyAllowance: b.weeklyAllowance,
      rollover: b.rollover,
      overrides: (b.overrides ?? []).map(o => ({
        date: Timestamp.fromMillis(o.dateMs),
        balance: o.balance,
      })),
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

/** Collect all unique week timestamps from periods and per-budget trend data, sorted chronologically. */
function collectAllWeeks(periods: BudgetPeriod[], perBudgetTrend: PerBudgetPoint[]): { label: string; ms: number }[] {
  const seen = new Map<number, string>();
  for (const p of periods) {
    const entry = toSundayEntry(p.periodStart.toDate());
    if (!seen.has(entry.ms)) seen.set(entry.ms, entry.label);
  }
  for (const d of perBudgetTrend) {
    if (!seen.has(d.weekMs)) seen.set(d.weekMs, d.weekLabel);
  }
  return [...seen.entries()].sort((a, b) => a[0] - b[0]).map(([ms, label]) => ({ label, ms }));
}

export function hydrateBudgetChart(container: HTMLElement): void {
  const budgetsRaw = container.dataset.budgets;
  const periodsRaw = container.dataset.periods;
  if (!budgetsRaw || !periodsRaw)
    throw new DataIntegrityError("budgets-chart missing required data-budgets or data-periods attribute");

  const budgets = deserializeBudgets(budgetsRaw);
  const periods = deserializePeriods(periodsRaw);

  const pieElOrNull = document.getElementById("budgets-pie");
  if (!pieElOrNull) throw new DataIntegrityError("budgets-pie container not found in page markup");
  const pieEl: HTMLElement = pieElOrNull;
  const creditsRaw = pieEl.dataset.averageWeeklyCredits;
  if (creditsRaw === undefined) throw new DataIntegrityError("budgets-pie missing required data-average-weekly-credits attribute");
  const averageWeeklyCredits = Number(creditsRaw);
  if (!Number.isFinite(averageWeeklyCredits)) throw new DataIntegrityError(`Invalid average weekly credits value: ${creditsRaw}`);

  const areaElOrNull = document.getElementById("budgets-area-chart");
  if (!areaElOrNull) throw new DataIntegrityError("budgets-area-chart container not found in page markup");
  const areaEl: HTMLElement = areaElOrNull;

  const perBudgetRaw = areaEl.dataset.perBudgetTrend;
  if (perBudgetRaw === undefined) throw new DataIntegrityError("budgets-area-chart missing required data-per-budget-trend attribute");
  const perBudgetTrend = deserializePerBudgetTrend(perBudgetRaw);

  // Match the bar chart's per-week column width so scroll sync aligns weeks.
  const panelWidth = computePanelWidth(budgets.length);

  const allWeeks = collectAllWeeks(periods, perBudgetTrend);
  const allWeekMs = allWeeks.map(w => w.ms);
  let anchorMs = allWeeks.length > 0 ? allWeeks[allWeeks.length - 1].ms : 0;

  function render(): void {
    const windowSet = filterToWindow(allWeekMs, anchorMs);
    const windowedPeriods = periods.filter(p => windowSet.has(toSundayEntry(p.periodStart.toDate()).ms));
    const windowedTrend = perBudgetTrend.filter(d => windowSet.has(d.weekMs));

    renderBudgetChart(container, { budgets, periods: windowedPeriods });
    renderBudgetPieChart(pieEl, { budgets, averageWeeklyCredits });

    const containerWidth = container.clientWidth || 640;
    renderPerBudgetAreaChart(areaEl, { data: windowedTrend, containerWidth, panelWidth });
  }

  render();
  reattachScrollSync();
  wireChartDatePicker("chart-date-picker", allWeeks, (newAnchorMs) => {
    anchorMs = newAnchorMs;
    render();
    reattachScrollSync();
  });
  wireChartResize(container, render, getAllScrollWrappers, [container, areaEl], reattachScrollSync);
}

function collectOverridesForBudget(container: HTMLElement, budgetId: string): BudgetOverride[] {
  const rows = container.querySelectorAll<HTMLElement>(`.override-row[data-budget-id="${budgetId}"]`);
  const overrides: BudgetOverride[] = [];
  for (const row of rows) {
    const dateInput = row.querySelector<HTMLInputElement>(".edit-override-date");
    const balanceInput = row.querySelector<HTMLInputElement>(".edit-override-balance");
    if (!dateInput || !balanceInput) continue;
    const dateMs = new Date(dateInput.value + "T00:00:00Z").getTime();
    if (isNaN(dateMs)) continue;
    const balance = Number(balanceInput.value);
    if (!Number.isFinite(balance)) continue;
    overrides.push({ date: Timestamp.fromMillis(dateMs), balance });
  }
  overrides.sort((a, b) => a.date.toMillis() - b.date.toMillis());
  return overrides;
}

export function hydrateOverridesTable(container: HTMLElement): void {
  container.addEventListener("blur", async (e) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    const row = target.closest(".override-row");
    if (!(row instanceof HTMLElement)) return;
    const budgetId = row.dataset.budgetId as BudgetId | undefined;
    if (!budgetId) return;

    if (target.value === target.defaultValue) return;

    try {
      const overrides = collectOverridesForBudget(container, budgetId);
      await getActiveDataSource().updateBudgetOverrides(budgetId, overrides);
      target.defaultValue = target.value;
    } catch (error) {
      handleSaveError(target, error, "override");
    }
  }, true);

  container.addEventListener("click", async (e) => {
    const target = e.target;

    // Delete override
    if (target instanceof HTMLButtonElement && target.classList.contains("delete-override")) {
      const row = target.closest(".override-row");
      if (!(row instanceof HTMLElement)) return;
      const budgetId = row.dataset.budgetId as BudgetId | undefined;
      if (!budgetId) return;
      row.remove();
      try {
        const overrides = collectOverridesForBudget(container, budgetId);
        await getActiveDataSource().updateBudgetOverrides(budgetId, overrides);
      } catch (error) {
        handleSaveError(target, error, "override");
      }
      return;
    }

    // Add override
    if (target instanceof HTMLButtonElement && target.id === "add-override") {
      const budgetsRaw = target.dataset.budgets;
      if (!budgetsRaw) return;
      const budgets = deserializeBudgets(budgetsRaw);
      if (budgets.length === 0) return;

      const firstBudget = budgets[0];
      const today = new Date();
      const dateStr = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;

      const newRow = document.createElement("div");
      newRow.className = "override-row";
      newRow.dataset.budgetId = firstBudget.id;
      newRow.dataset.overrideIndex = "new";

      const budgetOptions = budgets.map(b =>
        `<option value="${b.id}">${b.name}</option>`
      ).join("");

      newRow.innerHTML = `
        <span><select class="edit-override-budget" aria-label="Budget">${budgetOptions}</select></span>
        <span><input type="date" class="edit-override-date" value="${dateStr}" aria-label="Override date"></span>
        <span><input type="number" class="edit-override-balance" value="0" step="0.01" aria-label="Override balance"></span>
        <span><button class="delete-override" aria-label="Delete override">Delete</button></span>
      `;

      target.before(newRow);

      // Wire budget select change
      const select = newRow.querySelector<HTMLSelectElement>(".edit-override-budget");
      if (select) {
        select.addEventListener("change", () => {
          newRow.dataset.budgetId = select.value;
        });
      }

      // Save immediately
      try {
        const overrides = collectOverridesForBudget(container, firstBudget.id);
        await getActiveDataSource().updateBudgetOverrides(firstBudget.id as BudgetId, overrides);
      } catch (error) {
        handleSaveError(target, error, "override");
      }
    }
  });
}
