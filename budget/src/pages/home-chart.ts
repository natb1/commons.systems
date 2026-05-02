import { computeNetAmount, isCardPaymentCategory, MS_PER_WEEK, weekStart } from "../balance.js";
import { showDropdown, registerAutocompleteListeners } from "@commons-systems/style/components/autocomplete";
import { parseJsonArray, makeDebounced } from "./hydrate-util.js";
import { getThemeFg } from "./chart-util.js";
import { renderSankeySvg } from "./sankey-render.js";

export type ChartMode = "spending" | "credits";

/** Custom event name dispatched after scroll-loaded transactions are appended to the table. The chart listens for this to incorporate new data and re-apply filters. */
export const TRANSACTIONS_APPENDED_EVENT = "transactions-appended";

export interface SerializedChartTransaction {
  category: string;
  /** Dollars. Positive = spending/debit, negative = credit. Credits mode sign-flips to positive for display. */
  amount: number;
  reimbursement: number;
  timestampMs: number | null;
  budgetName: string | null;
}

export interface CategoryNode {
  name: string;
  fullPath: string;
  value: number;
  count: number;
  children: CategoryNode[];
}

/** Compute sorted distinct week-start timestamps from transactions. */
export function distinctWeeks(txns: SerializedChartTransaction[]): number[] {
  const set = new Set<number>();
  for (const t of txns) {
    if (t.timestampMs !== null) set.add(weekStart(t.timestampMs));
  }
  return [...set].sort((a, b) => a - b);
}

/**
 * Filter transactions to a window of `numWeeks` ending at `endWeekIdx`.
 * @param endWeekIdx - Index into the `weeks` array for the last week in the window
 */
export function filterByWeeks(
  txns: SerializedChartTransaction[],
  weeks: number[],
  numWeeks: number,
  endWeekIdx: number,
): SerializedChartTransaction[] {
  if (weeks.length === 0) return [];
  if (endWeekIdx < 0 || endWeekIdx >= weeks.length) {
    throw new RangeError(`endWeekIdx ${endWeekIdx} out of bounds for weeks array of length ${weeks.length}`);
  }
  const endMs = weeks[endWeekIdx];
  const startMs = endMs - (numWeeks - 1) * MS_PER_WEEK;
  return txns.filter(t => {
    if (t.timestampMs === null) return false;
    const ws = weekStart(t.timestampMs);
    return ws >= startMs && ws <= endMs;
  });
}

/**
 * Build a category tree from transactions.
 *
 * Filters transactions by mode. Spending mode includes transactions with
 * positive net amounts; credits mode includes transactions with negative net
 * amounts (sign-flipped to positive for display). Builds a hierarchy from
 * colon-separated category paths. Rolls up values and counts from leaves to
 * parents, then sorts children by value descending, name ascending. When
 * showCardPayment is false, Transfer:CardPayment categories (and subcategories)
 * are excluded in both spending and credits modes. When categoryFilter is non-empty, only
 * transactions whose category exactly matches the filter or starts with
 * categoryFilter + ":" (subcategories) are included.
 */
export interface CategoryTreeOptions {
  mode?: ChartMode;
  unbudgetedOnly?: boolean;
  showCardPayment?: boolean;
  categoryFilter?: string;
  budgetFilter?: string;
}

export function buildCategoryTree(
  txns: SerializedChartTransaction[],
  opts: CategoryTreeOptions = {},
): CategoryNode {
  const { mode = "spending", unbudgetedOnly = false, showCardPayment = false, categoryFilter = "", budgetFilter = "" } = opts;
  const root: CategoryNode = { name: "All", fullPath: "", value: 0, count: 0, children: [] };

  for (const t of txns) {
    const parts = t.category.split(":");
    const raw = computeNetAmount(t.amount, t.reimbursement);
    if (unbudgetedOnly && t.budgetName !== null) continue;
    if (!showCardPayment && isCardPaymentCategory(t.category)) continue;
    if (mode === "spending") {
      if (raw <= 0) continue;
    } else if (mode === "credits") {
      if (raw >= 0) continue;
    } else {
      throw new Error(`Unhandled chart mode: ${mode}`);
    }
    if (budgetFilter && t.budgetName !== budgetFilter) continue;
    if (categoryFilter && t.category !== categoryFilter && !t.category.startsWith(categoryFilter + ":")) continue;
    const net = mode === "credits" ? -raw : raw;
    let node = root;
    let path = "";
    for (const part of parts) {
      path = path ? `${path}:${part}` : part;
      let child = node.children.find(c => c.name === part);
      if (!child) {
        child = { name: part, fullPath: path, value: 0, count: 0, children: [] };
        node.children.push(child);
      }
      node = child;
    }
    node.value += net;
    node.count += 1;
  }

  // Roll up values and counts: parent totals = sum of children + own direct value
  function rollUp(n: CategoryNode): void {
    for (const c of n.children) {
      rollUp(c);
      n.value += c.value;
      n.count += c.count;
    }
  }
  rollUp(root);

  function sortChildren(n: CategoryNode): void {
    n.children.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
    n.children.forEach(sortChildren);
  }
  sortChildren(root);

  return root;
}

/** Divide all values in a category tree by a divisor (for per-week averages). */
export function divideTreeValues(node: CategoryNode, divisor: number): void {
  if (divisor <= 0 || !Number.isFinite(divisor)) {
    throw new RangeError(`divideTreeValues: divisor must be a positive finite number, got ${divisor}`);
  }
  node.value /= divisor;
  for (const c of node.children) divideTreeValues(c, divisor);
}

function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
}

interface FilterTableOptions {
  mode: ChartMode;
  showCardPayment: boolean;
  unbudgetedOnly: boolean;
  categoryFilter: string;
  budgetFilter: string;
}

function filterTable(opts: FilterTableOptions): void {
  const rows = document.querySelectorAll<HTMLElement>("#transactions-table .txn-row");
  for (const row of rows) {
    const category = row.dataset.category ?? "";
    const hasBudget = (row.dataset.budgetName ?? "") !== "";
    const isCardPayment = isCardPaymentCategory(category);
    const rawNetAmount = row.dataset.netAmount;
    if (rawNetAmount === undefined) throw new Error(`Transaction row missing data-net-amount`);
    const netAmount = parseFloat(rawNetAmount);
    if (!Number.isFinite(netAmount)) throw new Error(`Transaction row has invalid data-net-amount: "${rawNetAmount}"`);
    const isSpending = netAmount > 0;
    const isCredit = netAmount < 0;

    let visible: boolean;
    if (opts.mode === "credits") {
      visible = isCredit && (opts.showCardPayment || !isCardPayment);
    } else {
      visible = isSpending && (!opts.unbudgetedOnly || !hasBudget) && (opts.showCardPayment || !isCardPayment);
    }
    if (visible && opts.categoryFilter) {
      visible = category === opts.categoryFilter || category.startsWith(opts.categoryFilter + ":");
    }
    if (visible && opts.budgetFilter) {
      const budgetName = row.dataset.budgetName ?? "";
      visible = budgetName === opts.budgetFilter;
    }
    row.style.display = visible ? "" : "none";
  }
}

function attachFilterListeners(input: HTMLInputElement, options: string[], onBlur: (value: string) => void): void {
  input.addEventListener("focus", () => showDropdown(input, options, ""));
  input.addEventListener("input", () => showDropdown(input, options));
  input.addEventListener("blur", () => {
    if (input.value && !options.includes(input.value) && !options.some(o => o.startsWith(input.value + ":"))) input.value = "";
    onBlur(input.value);
  });
}

function assertChartTransactions(data: unknown): asserts data is SerializedChartTransaction[] {
  if (!Array.isArray(data)) throw new Error("Expected array of chart transactions");
  for (const item of data) {
    if (typeof item !== "object" || item === null) throw new Error("Invalid chart transaction entry");
    const rec = item as Record<string, unknown>;
    if (typeof rec.category !== "string") throw new Error("Chart transaction missing category string");
    if (typeof rec.amount !== "number" || !Number.isFinite(rec.amount)) throw new Error("Chart transaction amount must be finite number");
    if (typeof rec.reimbursement !== "number" || !Number.isFinite(rec.reimbursement)) throw new Error("Chart transaction reimbursement must be finite number");
    if (rec.timestampMs !== null && (typeof rec.timestampMs !== "number" || !Number.isFinite(rec.timestampMs))) throw new Error("Chart transaction timestampMs must be finite number or null");
    if (rec.budgetName !== null && typeof rec.budgetName !== "string") throw new Error("Chart transaction budgetName must be string or null");
  }
}

export function hydrateCategorySankey(container: HTMLElement): void {
  const scriptEl = container.querySelector('script[type="application/json"]');
  if (!scriptEl?.textContent) {
    throw new Error("category-sankey container is missing transaction data");
  }
  const parsed: unknown = JSON.parse(scriptEl.textContent);
  assertChartTransactions(parsed);
  const allTxns = parsed;
  if (allTxns.length === 0) {
    container.textContent = "No transaction data to chart.";
    return;
  }

  let weeks = distinctWeeks(allTxns);
  if (weeks.length === 0) {
    container.textContent = "No dated transactions to chart.";
    return;
  }

  const collapsedPaths = new Set<string>();
  let currentNumWeeks = 12;
  let currentEndWeekIdx = weeks.length - 1;
  let currentMode: ChartMode = "spending";
  let currentUnbudgetedOnly = false;
  let currentShowCardPayment = false;
  let currentCategoryFilter = "";
  let currentBudgetFilter = "";

  const controlsDiv = document.getElementById("sankey-controls");
  if (!controlsDiv) throw new Error("sankey-controls element not found");
  const weeksInput = controlsDiv.querySelector("#sankey-weeks") as HTMLInputElement | null;
  const endSlider = controlsDiv.querySelector("#sankey-end-week") as HTMLInputElement | null;
  const endLabel = controlsDiv.querySelector("#sankey-end-label") as HTMLElement | null;
  const modeRadios = controlsDiv.querySelectorAll<HTMLInputElement>('input[name="sankey-mode"]');
  const unbudgetedToggle = controlsDiv.querySelector("#unbudgeted-toggle") as HTMLElement | null;
  const unbudgetedCheckbox = controlsDiv.querySelector("#sankey-unbudgeted") as HTMLInputElement | null;
  const cardPaymentToggle = controlsDiv.querySelector("#card-payment-toggle") as HTMLElement | null;
  const cardPaymentCheckbox = controlsDiv.querySelector("#sankey-card-payment") as HTMLInputElement | null;
  const categoryFilterInputEl = controlsDiv.querySelector("#sankey-category-filter") as HTMLInputElement | null;
  const budgetFilterInputEl = controlsDiv.querySelector("#sankey-budget-filter") as HTMLInputElement | null;
  if (!weeksInput || !endSlider || !endLabel || modeRadios.length === 0 || !unbudgetedToggle || !unbudgetedCheckbox || !cardPaymentToggle || !cardPaymentCheckbox || !categoryFilterInputEl || !budgetFilterInputEl) {
    throw new Error("sankey control elements missing");
  }
  const categoryFilterInput = categoryFilterInputEl;
  const budgetFilterInput = budgetFilterInputEl;
  const categoryOptions = parseJsonArray(controlsDiv.dataset.categoryOptions);
  const budgetOptions = parseJsonArray(controlsDiv.dataset.budgetOptions);

  endSlider.min = "0";
  endSlider.max = String(weeks.length - 1);
  endSlider.value = String(currentEndWeekIdx);
  endLabel.textContent = formatDate(weeks[currentEndWeekIdx]);
  const fg = getThemeFg(container);

  function render(): void {
    const containerWidth = container.clientWidth;
    if (containerWidth === 0) return;

    const filtered = filterByWeeks(allTxns, weeks, currentNumWeeks, currentEndWeekIdx);
    const rootData = buildCategoryTree(filtered, {
      mode: currentMode,
      unbudgetedOnly: currentUnbudgetedOnly,
      showCardPayment: currentShowCardPayment,
      categoryFilter: currentCategoryFilter,
      budgetFilter: currentBudgetFilter,
    });
    divideTreeValues(rootData, currentNumWeeks);

    if (rootData.value === 0) {
      container.textContent = currentMode === "credits"
        ? "No credits in selected window."
        : "No spending in selected window.";
      return;
    }

    const svg = renderSankeySvg({
      rootData,
      collapsedPaths,
      containerWidth,
      fg,
      onToggleCollapse: (fullPath) => {
        if (collapsedPaths.has(fullPath)) collapsedPaths.delete(fullPath);
        else collapsedPaths.add(fullPath);
        update();
      },
      onSelectCategory: (fullPath) => {
        categoryFilterInput.value = fullPath;
        currentCategoryFilter = fullPath;
        update();
      },
    });
    container.replaceChildren(svg);
  }

  function update(): void {
    try { render(); } catch (error) {
      container.textContent = "Chart rendering failed. Try refreshing the page.";
      setTimeout(() => { throw error; }, 0);
      return;
    }
    try {
      filterTable({ mode: currentMode, showCardPayment: currentShowCardPayment, unbudgetedOnly: currentUnbudgetedOnly, categoryFilter: currentCategoryFilter, budgetFilter: currentBudgetFilter });
    } catch (error) {
      setTimeout(() => { throw error; }, 0);
    }
  }

  update();

  document.addEventListener(TRANSACTIONS_APPENDED_EVENT, ((e: CustomEvent<SerializedChartTransaction[]>) => {
    if (!container.isConnected) return;
    try {
      const newTxns = e.detail;
      assertChartTransactions(newTxns);
      const targetWeekMs = weeks[currentEndWeekIdx];
      allTxns.push(...newTxns);
      weeks = distinctWeeks(allTxns);
      endSlider.max = String(weeks.length - 1);
      currentEndWeekIdx = weeks.indexOf(targetWeekMs);
      if (currentEndWeekIdx === -1) currentEndWeekIdx = weeks.length - 1;
      endSlider.value = String(currentEndWeekIdx);
      endLabel.textContent = formatDate(weeks[currentEndWeekIdx]);
      update();
    } catch (error) {
      container.textContent = "Chart update failed after loading new transactions.";
      setTimeout(() => { throw error; }, 0);
    }
  }) as EventListener);

  const debounced = makeDebounced();

  weeksInput.addEventListener("input", () => {
    const v = parseInt(weeksInput.value, 10);
    if (Number.isFinite(v) && v >= 1) {
      currentNumWeeks = v;
      debounced(update, 100);
    }
  });

  endSlider.addEventListener("input", () => {
    const v = parseInt(endSlider.value, 10);
    if (Number.isFinite(v) && v >= 0 && v < weeks.length) {
      currentEndWeekIdx = v;
      endLabel.textContent = formatDate(weeks[currentEndWeekIdx]);
      debounced(update, 100);
    }
  });

  modeRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      if (radio.checked) {
        const mode = radio.value;
        if (mode !== "spending" && mode !== "credits") throw new Error(`Invalid chart mode: ${mode}`);
        currentMode = mode;
        collapsedPaths.clear();
        if (mode === "credits") {
          currentUnbudgetedOnly = false;
          unbudgetedCheckbox.checked = false;
          unbudgetedToggle.hidden = true;
          currentShowCardPayment = false;
          cardPaymentCheckbox.checked = false;
          cardPaymentToggle.hidden = true;
        } else {
          unbudgetedToggle.hidden = false;
          cardPaymentToggle.hidden = false;
        }
        update();
      }
    });
  });

  unbudgetedCheckbox.addEventListener("change", () => {
    currentUnbudgetedOnly = unbudgetedCheckbox.checked;
    update();
  });

  cardPaymentCheckbox.addEventListener("change", () => {
    currentShowCardPayment = cardPaymentCheckbox.checked;
    update();
  });

  registerAutocompleteListeners();

  attachFilterListeners(categoryFilterInput, categoryOptions, (value) => {
    currentCategoryFilter = value;
    update();
  });
  attachFilterListeners(budgetFilterInput, budgetOptions, (value) => {
    currentBudgetFilter = value;
    update();
  });

  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  const observer = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(update, 150);
  });
  observer.observe(container);
}
