import { updateTransaction, adjustBudgetPeriodTotal, type SerializedBudgetPeriod } from "../firestore.js";
import { computeNetAmount } from "../balance.js";
import { DataIntegrityError } from "../errors.js";

/**
 * Parse the JSON array from a data attribute.
 * Returns [] when the attribute is absent (unauthorized users).
 * Throws DataIntegrityError for non-empty values that are not valid JSON arrays.
 */
function parseJsonArray(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new DataIntegrityError(`Autocomplete options is not an array: ${typeof parsed}`);
    }
    if (!parsed.every((item: unknown) => typeof item === "string")) {
      throw new DataIntegrityError("Autocomplete options contains non-string element");
    }
    return parsed;
  } catch (error) {
    if (error instanceof DataIntegrityError) throw error;
    throw new DataIntegrityError(`Failed to parse autocomplete options: ${raw}`);
  }
}

/**
 * Parse the budget name-to-ID mapping from a data attribute.
 * Returns {} when the attribute is absent (unauthorized users).
 * Throws DataIntegrityError for non-empty values that are not valid JSON objects with string values.
 */
function parseBudgetMap(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new DataIntegrityError(`Budget map is not an object: ${typeof parsed}`);
    }
    if (!Object.values(parsed).every((v: unknown) => typeof v === "string")) {
      throw new DataIntegrityError("Budget map contains non-string value");
    }
    return parsed;
  } catch (error) {
    if (error instanceof DataIntegrityError) throw error;
    throw new DataIntegrityError(`Failed to parse budget map: ${raw}`);
  }
}

interface HydrationPeriod extends Omit<SerializedBudgetPeriod, "total"> {
  total: number; // mutable for local updates after adjustBudgetPeriodTotal
}

function parseBudgetPeriods(raw: string | undefined): HydrationPeriod[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new DataIntegrityError(`Budget periods is not an array: ${typeof parsed}`);
    }
    for (const item of parsed) {
      if (typeof item !== "object" || item === null) {
        throw new DataIntegrityError(`Budget period element is not an object: ${typeof item}`);
      }
      if (typeof item.id !== "string" || typeof item.budgetId !== "string") {
        throw new DataIntegrityError("Budget period missing string id or budgetId");
      }
      if (typeof item.periodStartMs !== "number" || typeof item.periodEndMs !== "number"
          || typeof item.total !== "number" || typeof item.count !== "number") {
        throw new DataIntegrityError("Budget period missing numeric periodStartMs, periodEndMs, total, or count");
      }
      if (typeof item.categoryBreakdown !== "object" || item.categoryBreakdown === null || Array.isArray(item.categoryBreakdown)) {
        throw new DataIntegrityError("Budget period categoryBreakdown is not an object");
      }
      if (item.periodStartMs >= item.periodEndMs) {
        throw new DataIntegrityError("Budget period has periodStartMs >= periodEndMs");
      }
    }
    return parsed as HydrationPeriod[];
  } catch (error) {
    if (error instanceof DataIntegrityError) throw error;
    throw new DataIntegrityError(`Failed to parse budget periods: ${raw}`);
  }
}

function findPeriod(periods: HydrationPeriod[], budgetId: string, timestampMs: number): HydrationPeriod | null {
  for (const p of periods) {
    if (p.budgetId === budgetId && p.periodStartMs <= timestampMs && timestampMs < p.periodEndMs) {
      return p;
    }
  }
  return null;
}

/**
 * Adjust stored period totals when a transaction's budget changes.
 * Each write uses Firestore increment for per-field atomicity, but the two
 * writes (decrement old period, increment new period) are not wrapped in a
 * transaction. If either write fails, totals drift until manual correction
 * (page loads read stored totals, not recomputed from transactions).
 */
async function syncPeriodTotals(
  row: HTMLElement,
  oldBudgetId: string | null,
  newBudgetId: string | null,
  budgetPeriods: HydrationPeriod[],
): Promise<void> {
  const amount = Number(row.dataset.amount);
  const reimbursement = Number(row.dataset.reimbursement);
  const timestampMs = Number(row.dataset.timestamp);
  if (!Number.isFinite(amount) || !Number.isFinite(reimbursement) || !Number.isFinite(timestampMs)) {
    console.error(
      `Cannot update period totals: invalid data attributes ` +
      `(amount=${row.dataset.amount}, reimbursement=${row.dataset.reimbursement}, timestamp=${row.dataset.timestamp})`
    );
    return;
  }
  const net = computeNetAmount(amount, reimbursement);

  try {
    if (oldBudgetId) {
      const oldPeriod = findPeriod(budgetPeriods, oldBudgetId, timestampMs);
      if (oldPeriod) {
        await adjustBudgetPeriodTotal(oldPeriod.id, -net);
        oldPeriod.total -= net;
      }
    }
    if (newBudgetId) {
      const newPeriod = findPeriod(budgetPeriods, newBudgetId, timestampMs);
      if (newPeriod) {
        await adjustBudgetPeriodTotal(newPeriod.id, net);
        newPeriod.total += net;
      }
    }
  } catch (periodError) {
    console.error("Failed to update budget period totals:", periodError);
  }
}

/**
 * Adjust stored period total when a transaction's reimbursement changes.
 * The net amount changes, so the period total must be adjusted by the delta.
 */
async function syncPeriodOnReimbursementChange(
  row: HTMLElement,
  oldReimbursement: number,
  newReimbursement: number,
  budgetPeriods: HydrationPeriod[],
): Promise<void> {
  const budgetId = row.dataset.budgetId || null;
  if (!budgetId) return;
  const amount = Number(row.dataset.amount);
  const timestampMs = Number(row.dataset.timestamp);
  if (!Number.isFinite(amount) || !Number.isFinite(timestampMs)) {
    console.error(
      `Cannot update period totals: invalid data attributes ` +
      `(amount=${row.dataset.amount}, timestamp=${row.dataset.timestamp})`
    );
    return;
  }
  const oldNet = computeNetAmount(amount, oldReimbursement);
  const newNet = computeNetAmount(amount, newReimbursement);
  const delta = newNet - oldNet;
  if (delta === 0) return;

  try {
    const period = findPeriod(budgetPeriods, budgetId, timestampMs);
    if (period) {
      await adjustBudgetPeriodTotal(period.id, delta);
      period.total += delta;
    }
  } catch (periodError) {
    console.error("Failed to update budget period totals:", periodError);
  }
}

/** Replace the displayed balance with "--". Recalculation happens on next page load. */
function clearBalanceDisplay(row: HTMLElement): void {
  const balanceDd = row.querySelector(".budget-balance") as HTMLElement | null;
  if (balanceDd) {
    balanceDd.textContent = "--";
  }
}

let dropdownController: AbortController | null = null;
let activeInput: HTMLInputElement | null = null;

function clearAriaAutocomplete(el: HTMLInputElement): void {
  el.removeAttribute("aria-activedescendant");
  el.removeAttribute("aria-controls");
  el.removeAttribute("aria-autocomplete");
}

function removeDropdown(): void {
  dropdownController?.abort();
  dropdownController = null;
  document.querySelector(".autocomplete-dropdown")?.remove();
  if (activeInput) {
    clearAriaAutocomplete(activeInput);
    activeInput = null;
  }
}

function handleOutsideClick(e: Event): void {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.closest(".autocomplete-dropdown, .edit-budget, .edit-category")) return;
  removeDropdown();
}

let listenersRegistered = false;

const errorTimers = new WeakMap<HTMLInputElement, ReturnType<typeof setTimeout>>();

function showInputError(input: HTMLInputElement, title = "Save failed \u2014 value reverted"): void {
  const existing = errorTimers.get(input);
  if (existing) clearTimeout(existing);
  input.value = input.defaultValue;
  input.classList.add("save-error");
  input.title = title;
  errorTimers.set(input, setTimeout(() => {
    input.classList.remove("save-error");
    input.title = "";
    errorTimers.delete(input);
  }, 30000));
}

function selectItem(input: HTMLInputElement, value: string): void {
  input.value = value;
  removeDropdown();
  input.dispatchEvent(new Event("blur", { bubbles: true }));
}

function showDropdown(input: HTMLInputElement, options: string[], filterOverride?: string): void {
  removeDropdown();
  const filter = filterOverride !== undefined ? filterOverride : input.value.toLowerCase();
  const matches = options.filter(o => {
    const lower = o.toLowerCase();
    if (lower === filter) return false;
    if (filter === "") return true;
    return lower.includes(filter);
  });
  if (matches.length === 0) {
    clearAriaAutocomplete(input);
    return;
  }

  let selectedIndex = -1;
  const dropdown = document.createElement("div");
  dropdown.className = "autocomplete-dropdown";
  dropdown.setAttribute("role", "listbox");
  dropdown.id = "autocomplete-listbox";

  const items = matches.map((opt, i) => {
    const item = document.createElement("div");
    item.className = "autocomplete-item";
    item.setAttribute("role", "option");
    item.id = `autocomplete-option-${i}`;
    item.textContent = opt;
    item.addEventListener("mousedown", (e) => {
      e.preventDefault(); // prevent blur before value is set
      selectItem(input, opt);
    });
    dropdown.appendChild(item);
    return item;
  });

  function updateSelection(index: number): void {
    items.forEach((el) => el.classList.remove("selected"));
    selectedIndex = index;
    if (index >= 0 && index < items.length) {
      items[index].classList.add("selected");
      input.setAttribute("aria-activedescendant", items[index].id);
    } else {
      input.removeAttribute("aria-activedescendant");
    }
  }

  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", "autocomplete-listbox");

  activeInput = input;
  dropdownController = new AbortController();
  input.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      updateSelection(selectedIndex < items.length - 1 ? selectedIndex + 1 : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      updateSelection(selectedIndex > 0 ? selectedIndex - 1 : items.length - 1);
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      selectItem(input, matches[selectedIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      removeDropdown();
    }
  }, { signal: dropdownController.signal });

  const rect = input.getBoundingClientRect();
  dropdown.style.top = `${rect.bottom + window.scrollY}px`;
  dropdown.style.left = `${rect.left + window.scrollX}px`;
  dropdown.style.width = `${rect.width}px`;
  document.body.appendChild(dropdown);
}

export function _resetForTest(): void {
  if (listenersRegistered) {
    window.removeEventListener("scroll", removeDropdown, true);
    window.removeEventListener("resize", removeDropdown);
    document.removeEventListener("click", handleOutsideClick);
    listenersRegistered = false;
  }
  removeDropdown();
  activeInput = null;
}

export function hydrateTransactionTable(container: HTMLElement): void {
  if (!listenersRegistered) {
    listenersRegistered = true;
    // Capture phase: dismiss dropdown before child scroll handlers run
    window.addEventListener("scroll", removeDropdown, true);
    window.addEventListener("resize", removeDropdown);
    document.addEventListener("click", handleOutsideClick);
  }

  const budgetOptions = parseJsonArray(container.dataset.budgetOptions);
  const budgetNameToId = parseBudgetMap(container.dataset.budgetMap);
  const categoryOptions = parseJsonArray(container.dataset.categoryOptions);
  const budgetPeriods = parseBudgetPeriods(container.dataset.budgetPeriods);

  function getOptionsForInput(input: HTMLInputElement): string[] {
    if (input.classList.contains("edit-budget")) return budgetOptions;
    if (input.classList.contains("edit-category")) return categoryOptions;
    return [];
  }

  // Prevent accordion toggle when clicking inputs inside summary
  container.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("summary") && target.closest("input")) {
      e.preventDefault();
    }
  });

  // Show all options on focus; filter as user types
  container.addEventListener("focus", (e: Event) => {
    if (!(e.target instanceof HTMLInputElement)) return;
    const options = getOptionsForInput(e.target);
    if (options.length > 0) showDropdown(e.target, options, "");
  }, true);

  container.addEventListener("input", (e: Event) => {
    if (!(e.target instanceof HTMLInputElement)) return;
    const options = getOptionsForInput(e.target);
    if (options.length > 0) showDropdown(e.target, options);
  });

  container.addEventListener("blur", async (e) => {
    const target = e.target as HTMLElement;
    removeDropdown();

    const row = target.closest(".txn-row");
    if (!(row instanceof HTMLElement)) return;
    const txnId = row.dataset.txnId;
    if (!txnId) return;

    if (!(target instanceof HTMLInputElement)) return;
    const input = target;
    // Skip save if value hasn't changed (prevents double-save when selectItem dispatches synthetic blur followed by native blur)
    if (input.value === input.defaultValue) return;

    try {
      if (input.classList.contains("edit-note")) {
        await updateTransaction(txnId, { note: input.value });
      } else if (input.classList.contains("edit-category")) {
        await updateTransaction(txnId, { category: input.value });
      } else if (input.classList.contains("edit-reimbursement")) {
        const reimbursement = Number(input.value);
        if (!Number.isFinite(reimbursement)) {
          showInputError(input);
          return;
        }
        const oldReimbursement = Number(row.dataset.reimbursement);
        await updateTransaction(txnId, { reimbursement });
        await syncPeriodOnReimbursementChange(row, oldReimbursement, reimbursement, budgetPeriods);
        row.dataset.reimbursement = String(reimbursement);
        clearBalanceDisplay(row);
      } else if (input.classList.contains("edit-budget")) {
        const value = input.value || null;
        if (value !== null && !(value in budgetNameToId)) {
          showInputError(input, `Unknown budget: "${value}"`);
          return;
        }
        const newBudgetId = value ? budgetNameToId[value] : null;
        const oldBudgetId = row.dataset.budgetId || null;
        await updateTransaction(txnId, { budget: newBudgetId });
        await syncPeriodTotals(row, oldBudgetId, newBudgetId, budgetPeriods);

        if (newBudgetId) {
          row.dataset.budgetId = newBudgetId;
        } else {
          delete row.dataset.budgetId;
        }

        clearBalanceDisplay(row);
      } else {
        return;
      }
      input.defaultValue = input.value;
    } catch (error) {
      if (error instanceof TypeError || error instanceof ReferenceError) {
        setTimeout(() => { throw error; }, 0);
        return;
      }
      if (error instanceof DataIntegrityError) {
        console.error("Data integrity error:", error);
        showInputError(input, "Data error \u2014 please reload");
        return;
      }
      console.error("Failed to save transaction:", error);
      const code = (error as { code?: string })?.code;
      if (code === "permission-denied") {
        showInputError(input, "Access denied. Please contact support.");
      } else if (error instanceof RangeError) {
        showInputError(input, "Value out of range");
      } else {
        showInputError(input);
      }
    }
  }, true);
}
