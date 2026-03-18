import { type SerializedBudgetPeriod, type TransactionId, type BudgetId } from "../firestore.js";
import { getActiveDataSource } from "../active-data-source.js";
import { computeNetAmount } from "../balance.js";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import { removeDropdown, registerAutocompleteListeners, _resetForTest as _resetAutocomplete } from "@commons-systems/style/components/autocomplete";
import { showInputError, handleSaveError, parseJsonArray, addAutocompleteListeners } from "./hydrate-util.js";

/**
 * Parse the budget name-to-ID mapping from a data attribute.
 * Returns {} when the attribute is absent (seed data view).
 * Throws DataIntegrityError for non-empty values that are not valid JSON objects with string values.
 */
function parseBudgetMap(raw: string | undefined): Record<string, BudgetId> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new DataIntegrityError(`Budget map is not an object: ${typeof parsed}`);
    }
    if (!Object.values(parsed).every((v: unknown) => typeof v === "string")) {
      throw new DataIntegrityError("Budget map contains non-string value");
    }
    return parsed as Record<string, BudgetId>;
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

function findPeriod(periods: HydrationPeriod[], budgetId: BudgetId, timestampMs: number): HydrationPeriod | null {
  for (const p of periods) {
    if (p.budgetId === budgetId && p.periodStartMs <= timestampMs && timestampMs < p.periodEndMs) {
      return p;
    }
  }
  return null;
}

/**
 * Adjust stored period totals when a transaction's budget changes.
 * The two writes (decrement old period, increment new period) are not atomic.
 * If either write fails, totals drift until corrected (by ETL re-import for
 * server data, or re-uploading the data file for local data).
 * categoryBreakdown is not updated by client-side changes; it reflects the last ETL run.
 */
async function syncPeriodTotals(
  row: HTMLElement,
  oldBudgetId: BudgetId | null,
  newBudgetId: BudgetId | null,
  budgetPeriods: HydrationPeriod[],
): Promise<void> {
  const amount = Number(row.dataset.amount);
  const reimbursement = Number(row.dataset.reimbursement);
  const timestampMs = Number(row.dataset.timestamp);
  if (!Number.isFinite(amount) || !Number.isFinite(reimbursement) || !Number.isFinite(timestampMs)) {
    throw new DataIntegrityError(
      `Cannot update period totals: invalid data attributes ` +
      `(amount=${row.dataset.amount}, reimbursement=${row.dataset.reimbursement}, timestamp=${row.dataset.timestamp})`
    );
  }
  const net = computeNetAmount(amount, reimbursement);

  try {
    if (oldBudgetId) {
      const oldPeriod = findPeriod(budgetPeriods, oldBudgetId, timestampMs);
      if (oldPeriod) {
        await getActiveDataSource().adjustBudgetPeriodTotal(oldPeriod.id, -net);
        oldPeriod.total -= net;
      }
    }
    if (newBudgetId) {
      const newPeriod = findPeriod(budgetPeriods, newBudgetId, timestampMs);
      if (newPeriod) {
        await getActiveDataSource().adjustBudgetPeriodTotal(newPeriod.id, net);
        newPeriod.total += net;
      }
    }
  } catch (periodError) {
    if (periodError instanceof TypeError || periodError instanceof ReferenceError) {
      throw periodError;
    }
    console.error("Failed to update budget period totals:", periodError);
    clearBalanceDisplay(row);
    const balanceEl = row.querySelector(".budget-balance") as HTMLElement | null;
    if (balanceEl) balanceEl.title = "Budget totals may be incorrect. Reload to recalculate.";
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
  const budgetId = (row.dataset.budgetId || null) as BudgetId | null;
  if (!budgetId) return;
  const amount = Number(row.dataset.amount);
  const timestampMs = Number(row.dataset.timestamp);
  if (!Number.isFinite(amount) || !Number.isFinite(timestampMs)) {
    throw new DataIntegrityError(
      `Cannot update period totals: invalid data attributes ` +
      `(amount=${row.dataset.amount}, timestamp=${row.dataset.timestamp})`
    );
  }
  const oldNet = computeNetAmount(amount, oldReimbursement);
  const newNet = computeNetAmount(amount, newReimbursement);
  const delta = newNet - oldNet;
  if (delta === 0) return;

  try {
    const period = findPeriod(budgetPeriods, budgetId, timestampMs);
    if (period) {
      await getActiveDataSource().adjustBudgetPeriodTotal(period.id, delta);
      period.total += delta;
    }
  } catch (periodError) {
    if (periodError instanceof TypeError || periodError instanceof ReferenceError) {
      throw periodError;
    }
    console.error("Failed to update budget period totals:", periodError);
    clearBalanceDisplay(row);
    const balanceEl = row.querySelector(".budget-balance") as HTMLElement | null;
    if (balanceEl) balanceEl.title = "Budget totals may be incorrect. Reload to recalculate.";
  }
}

/** Replace the displayed balance with "--". Recalculation happens on next page load. */
function clearBalanceDisplay(row: HTMLElement): void {
  const balanceDd = row.querySelector(".budget-balance") as HTMLElement | null;
  if (balanceDd) {
    balanceDd.textContent = "--";
  }
}

export { _resetAutocomplete as _resetForTest };

export function hydrateTransactionTable(container: HTMLElement): void {
  registerAutocompleteListeners();

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

  addAutocompleteListeners(container, getOptionsForInput);

  container.addEventListener("blur", async (e) => {
    const target = e.target as HTMLElement;
    removeDropdown();

    const row = target.closest(".txn-row");
    if (!(row instanceof HTMLElement)) return;
    const txnId = row.dataset.txnId as TransactionId | undefined;
    if (!txnId) return;

    if (!(target instanceof HTMLInputElement)) return;
    const input = target;
    // Skip save if value hasn't changed (prevents double-save when selectItem dispatches synthetic blur followed by native blur)
    if (input.value === input.defaultValue) return;

    try {
      if (input.classList.contains("edit-note")) {
        await getActiveDataSource().updateTransaction(txnId, { note: input.value });
      } else if (input.classList.contains("edit-category")) {
        await getActiveDataSource().updateTransaction(txnId, { category: input.value });
      } else if (input.classList.contains("edit-reimbursement")) {
        const reimbursement = Number(input.value);
        if (!Number.isFinite(reimbursement)) {
          showInputError(input);
          return;
        }
        const oldReimbursement = Number(row.dataset.reimbursement);
        await getActiveDataSource().updateTransaction(txnId, { reimbursement });
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
        const oldBudgetId = (row.dataset.budgetId || null) as BudgetId | null;
        await getActiveDataSource().updateTransaction(txnId, { budget: newBudgetId });
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
      handleSaveError(input, error, "transaction");
    }
  }, true);
}
