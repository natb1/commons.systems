import { Timestamp } from "firebase/firestore";
import { type Budget, type BudgetId, type BudgetOverride, type BudgetPeriod, type BudgetPeriodId, type SerializedBudgetPeriod } from "../firestore.js";
import { getActiveDataSource } from "../active-data-source.js";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import { escapeHtml } from "@commons-systems/htmlutil";
import { showInputError, handleSaveError, deserializeJSON, attachScrollSync, wireChartDatePicker, wireChartResize, makeDebounced, toISODate } from "./hydrate-util.js";
import { renderBudgetChart } from "./budgets-chart.js";
import { renderBudgetPieChart } from "./budgets-pie-chart.js";
import { renderPerBudgetAreaChart } from "./budgets-area-chart.js";
import { renderVarianceWaterfall } from "./budgets-waterfall-chart.js";
import { computePanelWidth, filterToWindow } from "./chart-util.js";
import { toSundayEntry, computeRollingAverage, type CategoryActualRow, type PerBudgetPoint, type VarianceWindow } from "../balance.js";
import { formatCurrency } from "../format.js";
import type { SerializedBudget, SerializedBudgetOverride } from "./budgets.js";

function rowBudgetId(el: HTMLElement): BudgetId | null {
  const row = el.closest(".budget-row");
  if (!(row instanceof HTMLElement)) return null;
  return (row.dataset.budgetId ?? null) as BudgetId | null;
}

function deserializeCategoryRows(raw: string, field: string): CategoryActualRow[] {
  const parsed = deserializeJSON(raw, field);
  if (!Array.isArray(parsed)) throw new DataIntegrityError(`${field} is not an array`);
  const result: CategoryActualRow[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const el = parsed[i];
    if (typeof el !== "object" || el === null) {
      throw new DataIntegrityError(`${field}[${i}] is not an object`);
    }
    const row = el as Record<string, unknown>;
    if (typeof row.avgWeekly !== "number" || !Number.isFinite(row.avgWeekly)) {
      throw new DataIntegrityError(`${field}[${i}].avgWeekly must be a finite number`);
    }
    if (row.kind === "category") {
      if (typeof row.category !== "string") {
        throw new DataIntegrityError(`${field}[${i}].category must be a string`);
      }
      result.push({ kind: "category", category: row.category, avgWeekly: row.avgWeekly });
    } else if (row.kind === "other") {
      if (typeof row.groupedCount !== "number" || !Number.isInteger(row.groupedCount) || row.groupedCount < 1) {
        throw new DataIntegrityError(`${field}[${i}].groupedCount must be a positive integer`);
      }
      result.push({ kind: "other", avgWeekly: row.avgWeekly, groupedCount: row.groupedCount });
    } else {
      throw new DataIntegrityError(`${field}[${i}].kind must be "category" or "other"`);
    }
  }
  return result;
}

function renderCategoryList(list: HTMLElement, categories: readonly CategoryActualRow[]): void {
  const absTotal = categories.reduce((s, c) => s + Math.abs(c.avgWeekly), 0);
  const dl = document.createElement("dl");
  dl.className = "variance-breakdown";
  for (const c of categories) {
    const dt = document.createElement("dt");
    if (c.kind === "other") {
      dt.textContent = "Other";
      dt.classList.add("variance-other");
    } else {
      dt.textContent = c.category;
    }
    const dd = document.createElement("dd");
    const pct = absTotal === 0 ? 0 : (Math.abs(c.avgWeekly) / absTotal) * 100;
    dd.textContent = `${formatCurrency(c.avgWeekly)}/week · ${pct.toFixed(1)}%`;
    dl.append(dt, dd);
  }
  list.replaceChildren(dl);
}

function buildWindowToggle(budgetId: string): HTMLFieldSetElement {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "variance-toggle";

  const legend = document.createElement("legend");
  legend.textContent = "Window";
  fieldset.appendChild(legend);

  // Radio name is budget-scoped so two simultaneously-expanded rows don't
  // share a document-wide radio group (which would cause toggling one row to
  // uncheck the other's radio).
  const radioName = `variance-window-${budgetId}`;
  for (const value of ["12", "52"] as const) {
    const label = document.createElement("label");
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = radioName;
    radio.value = value;
    if (value === "12") radio.checked = true;
    label.append(radio, document.createTextNode(` ${value}w`));
    fieldset.appendChild(label);
  }
  return fieldset;
}

function renderVarianceDetails(
  container: HTMLElement,
  budgetId: string,
  weeklyAllowance: number,
  w12: readonly CategoryActualRow[],
  w52: readonly CategoryActualRow[],
): void {
  const wrapper = document.createElement("div");
  wrapper.className = "variance-wrapper";

  const toggle = buildWindowToggle(budgetId);

  const chart = document.createElement("div");
  chart.className = "variance-chart";

  const list = document.createElement("div");
  list.className = "variance-list";

  wrapper.append(toggle, chart, list);
  container.replaceChildren(wrapper);

  function draw(win: VarianceWindow): void {
    const categories = win === 12 ? w12 : w52;
    if (categories.length === 0) {
      chart.replaceChildren();
      const msg = document.createElement("p");
      msg.className = "variance-empty";
      msg.textContent = "No category data in this window.";
      list.replaceChildren(msg);
      return;
    }
    renderVarianceWaterfall(chart, { weeklyAllowance, categories, window: win });
    renderCategoryList(list, categories);
  }

  toggle.addEventListener("change", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.value !== "12" && target.value !== "52") {
      throw new DataIntegrityError(`Unexpected variance-window value: ${target.value}`);
    }
    const value: VarianceWindow = target.value === "52" ? 52 : 12;
    draw(value);
  });

  draw(12);
}

function hydrateVarianceDetails(row: HTMLDetailsElement): void {
  const varianceEl = row.querySelector<HTMLElement>(".budget-variance");
  if (!varianceEl) throw new DataIntegrityError(".budget-variance element missing from expanded budget row");
  if (varianceEl.dataset.hydrated === "true") return;

  const budgetId = row.dataset.budgetId;
  if (!budgetId) throw new DataIntegrityError("budget-row missing data-budget-id");

  const allowRaw = varianceEl.dataset.weeklyAllowance;
  const w12Raw = varianceEl.dataset.window12;
  const w52Raw = varianceEl.dataset.window52;
  if (allowRaw === undefined || w12Raw === undefined || w52Raw === undefined) {
    throw new DataIntegrityError("budget-variance missing required data attributes");
  }
  const weeklyAllowance = Number(allowRaw);
  if (!Number.isFinite(weeklyAllowance)) {
    throw new DataIntegrityError(`Invalid data-weekly-allowance: ${allowRaw}`);
  }
  const w12 = deserializeCategoryRows(w12Raw, "data-window12");
  const w52 = deserializeCategoryRows(w52Raw, "data-window52");

  renderVarianceDetails(varianceEl, budgetId, weeklyAllowance, w12, w52);
  varianceEl.dataset.hydrated = "true";
}

export function hydrateBudgetTable(container: HTMLElement): void {
  // `toggle` events on <details> do not bubble; use capture-phase delegation
  // so a single listener can handle every expanded row.
  container.addEventListener("toggle", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLDetailsElement)) return;
    if (!target.classList.contains("budget-row")) return;
    if (!target.open) return;
    hydrateVarianceDetails(target);
  }, true);

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
          showInputError(target, "Allowance must be a non-negative number");
          return;
        }
        await getActiveDataSource().updateBudget(budgetId, { allowance: allowance });
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
    const budgetId = rowBudgetId(target);
    if (!budgetId) return;

    const saved = target.querySelector("option[selected]") as HTMLOptionElement | null;
    if (saved && target.value === saved.value) return;

    try {
      if (target.classList.contains("edit-rollover")) {
        const value = target.value;
        if (value !== "none" && value !== "debt" && value !== "balance") {
          showInputError(target, "Invalid rollover value");
          return;
        }
        await getActiveDataSource().updateBudget(budgetId, { rollover: value });
      } else if (target.classList.contains("edit-period")) {
        const value = target.value;
        if (value !== "weekly" && value !== "monthly" && value !== "quarterly") {
          showInputError(target, "Invalid period value");
          return;
        }
        await getActiveDataSource().updateBudget(budgetId, { allowancePeriod: value });
      } else {
        return;
      }
      // Update the selected attribute (not just .value) so showInputError can
      // revert to the last-saved value via option[selected].
      if (saved) saved.removeAttribute("selected");
      const newSelected = Array.from(target.options).find(o => o.value === target.value) ?? null;
      if (newSelected) newSelected.setAttribute("selected", "");
    } catch (error) {
      handleSaveError(target, error, "budget");
    }
  });
}

function deserializeBudgets(raw: string): Budget[] {
  let parsed: Array<Omit<SerializedBudget, "rollover" | "allowancePeriod" | "overrides"> & { rollover: string; allowancePeriod?: string; overrides?: SerializedBudgetOverride[] }>;
  try { parsed = JSON.parse(raw); } catch (e) { throw new DataIntegrityError(`Invalid budget chart data: ${e instanceof Error ? e.message : e}`); }
  return parsed.map(b => {
    if (b.rollover !== "none" && b.rollover !== "debt" && b.rollover !== "balance")
      throw new DataIntegrityError(`Invalid rollover value: ${b.rollover}`);
    const allowancePeriod = b.allowancePeriod === "monthly" ? "monthly" as const
      : b.allowancePeriod === "quarterly" ? "quarterly" as const
      : b.allowancePeriod === "weekly" || b.allowancePeriod == null ? "weekly" as const
      : (() => { throw new DataIntegrityError(`Invalid allowancePeriod: ${b.allowancePeriod}`); })();
    return {
      id: b.id as BudgetId,
      name: b.name,
      allowance: b.allowance,
      allowancePeriod,
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
      || typeof el.budget !== "string" || typeof el.spending !== "number") {
      throw new DataIntegrityError(`Per-budget trend element ${i} missing or invalid fields: expected weekLabel(string), weekMs(number), budget(string), spending(number)`);
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

/** Apply a trailing rolling average to raw spending values independently per budget series. Returns new points where the spending field contains averaged values. */
export function applyRollingAverage(data: PerBudgetPoint[], windowSize: number): PerBudgetPoint[] {
  if (!Number.isInteger(windowSize) || windowSize < 1) throw new RangeError(`windowSize must be a positive integer, got ${windowSize}`);
  const groups = new Map<string, PerBudgetPoint[]>();
  for (const d of data) {
    let arr = groups.get(d.budget);
    if (!arr) { arr = []; groups.set(d.budget, arr); }
    arr.push(d);
  }
  const result: PerBudgetPoint[] = [];
  for (const [, points] of groups) {
    points.sort((a, b) => a.weekMs - b.weekMs);
    const averaged = computeRollingAverage(points.map(p => p.spending), windowSize);
    for (let i = 0; i < points.length; i++) {
      result.push({ ...points[i], spending: averaged[i] });
    }
  }
  return result;
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
  let currentWindowSize = 3;
  let cachedAveraged = applyRollingAverage(perBudgetTrend, currentWindowSize);

  const excludedBudgets = new Set<string>();

  function render(): void {
    const windowSet = filterToWindow(allWeekMs, anchorMs);
    const windowedPeriods = periods.filter(p => windowSet.has(toSundayEntry(p.periodStart.toDate()).ms));
    const windowedTrend = cachedAveraged.filter(d => windowSet.has(d.weekMs));

    renderBudgetChart(container, { budgets, periods: windowedPeriods });
    renderBudgetPieChart(pieEl, { budgets, averageWeeklyCredits });

    const containerWidth = container.clientWidth || 640;
    renderPerBudgetAreaChart(areaEl, {
      data: windowedTrend,
      containerWidth,
      panelWidth,
      excludedBudgets,
      onToggleBudget(budgetName: string) {
        if (excludedBudgets.has(budgetName)) excludedBudgets.delete(budgetName);
        else excludedBudgets.add(budgetName);
        render();
        reattachScrollSync();
      },
    });
  }

  render();
  reattachScrollSync();
  wireChartDatePicker("chart-date-picker", allWeeks, (newAnchorMs) => {
    anchorMs = newAnchorMs;
    render();
    reattachScrollSync();
  });
  wireChartResize(container, render, getAllScrollWrappers, [container, areaEl], reattachScrollSync);

  const weeksInput = document.getElementById("area-chart-weeks") as HTMLInputElement | null;
  if (!weeksInput) throw new DataIntegrityError("area-chart-weeks input not found in page markup");
  const debounced = makeDebounced();
  weeksInput.addEventListener("input", () => {
    const v = parseInt(weeksInput.value, 10);
    if (Number.isFinite(v) && v >= 1 && v <= 104) {
      currentWindowSize = v;
      debounced(() => {
        cachedAveraged = applyRollingAverage(perBudgetTrend, currentWindowSize);
        render();
        reattachScrollSync();
      }, 100);
    }
  });
}

function collectOverridesForBudget(container: HTMLElement, budgetId: string): BudgetOverride[] | null {
  const rows = container.querySelectorAll<HTMLElement>(`.override-row[data-budget-id="${budgetId}"]`);
  const overrides: BudgetOverride[] = [];
  for (const row of rows) {
    const dateInput = row.querySelector<HTMLInputElement>(".edit-override-date");
    const balanceInput = row.querySelector<HTMLInputElement>(".edit-override-balance");
    if (!dateInput || !balanceInput) throw new DataIntegrityError(`Override row missing input elements for budget ${budgetId}`);
    const dateMs = new Date(dateInput.value + "T00:00:00Z").getTime();
    if (isNaN(dateMs)) {
      showInputError(dateInput, "Invalid date");
      return null;
    }
    const balance = Number(balanceInput.value);
    if (!Number.isFinite(balance)) {
      showInputError(balanceInput, "Balance must be a finite number");
      return null;
    }
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
      if (overrides) {
        await getActiveDataSource().updateBudgetOverrides(budgetId, overrides);
        target.defaultValue = target.value;
      }
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
      const addBtn = container.querySelector("#add-override");
      row.style.opacity = "0.5";
      try {
        row.remove();
        const overrides = collectOverridesForBudget(container, budgetId);
        if (overrides) {
          await getActiveDataSource().updateBudgetOverrides(budgetId, overrides);
        } else {
          if (!row.parentElement && addBtn) addBtn.before(row);
          row.style.opacity = "";
        }
      } catch (error) {
        if (!row.parentElement && addBtn) addBtn.before(row);
        row.style.opacity = "";
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
      const dateStr = toISODate(Date.now());

      const newRow = document.createElement("div");
      newRow.className = "override-row";
      newRow.dataset.budgetId = firstBudget.id;
      newRow.dataset.overrideIndex = "new";

      const budgetOptions = budgets.map(b =>
        `<option value="${escapeHtml(b.id)}">${escapeHtml(b.name)}</option>`
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
        select.addEventListener("change", async () => {
          const oldBudgetId = newRow.dataset.budgetId as BudgetId | undefined;
          newRow.dataset.budgetId = select.value;
          try {
            const newBudgetId = select.value as BudgetId;
            const newOverrides = collectOverridesForBudget(container, newBudgetId);
            if (newOverrides) await getActiveDataSource().updateBudgetOverrides(newBudgetId, newOverrides);
            if (oldBudgetId && oldBudgetId !== newBudgetId) {
              const oldOverrides = collectOverridesForBudget(container, oldBudgetId);
              if (oldOverrides) await getActiveDataSource().updateBudgetOverrides(oldBudgetId, oldOverrides);
            }
          } catch (error) {
            handleSaveError(select, error, "override");
          }
        });
      }

      // Save immediately
      try {
        const overrides = collectOverridesForBudget(container, firstBudget.id);
        if (overrides) await getActiveDataSource().updateBudgetOverrides(firstBudget.id as BudgetId, overrides);
      } catch (error) {
        handleSaveError(target, error, "override");
      }
    }
  });
}
