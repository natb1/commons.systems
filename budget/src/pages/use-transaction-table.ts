// Table-interactivity effects for the React <Transactions> page (Unit 4). This is
// the imperative hydrateTransactionTable (formerly home-hydrate.ts) converted into
// effect hooks that attach event-delegation listeners and an IntersectionObserver
// to the table container ref. The blur-save / period-sync / clear-balance /
// autocomplete / accordion-suppression logic is preserved EXACTLY — it reads the
// per-row data-* attributes that <Transactions> still renders (data-amount,
// data-reimbursement, data-timestamp, data-budget-id, data-budget-name) and the
// container data-* attributes (data-budget-map, data-budget-periods,
// data-budget-options, data-category-options, data-group-name, data-editable),
// and calls the same data-source methods in the same order.
//
// Two behaviors change shape (not effect):
//  - Scroll-loaded rows are NOT inserted via insertAdjacentHTML; the fetched
//    Transaction[] is handed to React (onAppend) which renders them through the
//    same JSX rows + #1266 orphan suppression. The cursor / final-batch / error
//    UI / sentinel-removal are tracked in React state via the callbacks below.
//  - The chart update on append no longer dispatches TRANSACTIONS_APPENDED_EVENT;
//    React feeds the combined transactions to the <CategorySankey> island as a
//    prop (and re-keys it so buildCategorySankey re-runs) — see Transactions.tsx.
//    home-chart.ts's event machinery is left intact (other suites depend on it).
import { useLayoutEffect, type RefObject } from "react";
import { Timestamp } from "firebase/firestore";
import {
  type SerializedBudgetPeriod,
  type TransactionId,
  type BudgetId,
  type Transaction,
} from "../firestore.js";
import { getActiveDataSource } from "../active-data-source.js";
import { computeNetAmount, MS_PER_WEEK, weekStart } from "../balance.js";
import { classifyError } from "@commons-systems/errorutil/classify";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import {
  removeDropdown,
  registerAutocompleteListeners,
} from "@commons-systems/components/autocomplete";
import { showInputError, handleSaveError, parseJsonArray, addAutocompleteListeners } from "./hydrate-util.js";
import { compareByTimestampDesc, SCROLL_BATCH_WEEKS } from "./home.js";
import { openStatementSource } from "./statement-source-view.js";

/**
 * Parse the budget name-to-ID mapping from a data attribute.
 * Returns {} when the attribute is absent.
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
 * If either write fails, totals drift until corrected by re-uploading the data file.
 * categoryBreakdown is not updated by client-side changes; it reflects the
 * original data source snapshot.
 */
async function syncPeriodTotals(
  row: HTMLElement,
  oldBudgetId: BudgetId | null,
  newBudgetId: BudgetId | null,
  budgetPeriods: HydrationPeriod[],
  clearBalance: () => void,
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
    const ds = getActiveDataSource();
    if (oldBudgetId) {
      const oldPeriod = findPeriod(budgetPeriods, oldBudgetId, timestampMs);
      if (oldPeriod) {
        await ds.adjustBudgetPeriodTotal(oldPeriod.id, -net);
        oldPeriod.total -= net;
      }
    }
    if (newBudgetId) {
      const newPeriod = findPeriod(budgetPeriods, newBudgetId, timestampMs);
      if (newPeriod) {
        await ds.adjustBudgetPeriodTotal(newPeriod.id, net);
        newPeriod.total += net;
      }
    }
  } catch (periodError) {
    handlePeriodSyncError(row, periodError, clearBalance);
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
  clearBalance: () => void,
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
    handlePeriodSyncError(row, periodError, clearBalance);
  }
}

/**
 * Handle an error from adjustBudgetPeriodTotal: defer programmer errors, log
 * others, clear the balance display, and set the "totals may be incorrect"
 * tooltip. The clear is React-state driven (clearBalance); the tooltip is a
 * best-effort DOM mutation on the just-rendered balance element if present.
 */
function handlePeriodSyncError(row: HTMLElement, error: unknown, clearBalance: () => void): void {
  if (deferProgrammerError(error)) return;
  logError(error, { operation: "update-period-totals" });
  clearBalance();
  const balanceEl = row.querySelector(".budget-balance") as HTMLElement | null;
  if (balanceEl) balanceEl.title = "Budget totals may be incorrect. Re-upload your data file to correct them.";
}

/**
 * Result of a successful scroll batch fetch handed back to React: the
 * transactions to append and the new cursor (null when the sentinel should be
 * removed — the final batch was loaded).
 */
export interface ScrollAppend {
  transactions: Transaction[];
  nextBefore: number | null;
}

export type ScrollErrorKind = "transient" | "data-integrity";

export interface TransactionTableHandlers {
  /** Append a fetched batch and advance (or retire) the scroll cursor. */
  onAppend: (append: ScrollAppend) => void;
  /** Surface a scroll error; "data-integrity" also stops observing (sentinel removed). */
  onScrollError: (kind: ScrollErrorKind) => void;
  /** Toggle the loading indicator. */
  onScrollLoading: (loading: boolean) => void;
}

/**
 * Wire the blur-save / accordion-suppression / statement-source / autocomplete
 * delegation onto the table container. Attaches once per mount (event delegation),
 * so React reconciling individual inputs does not detach the listeners.
 */
export function useTableInteractivity(
  containerRef: RefObject<HTMLElement>,
  authorized: boolean,
  onClearBalance: (txnId: string) => void,
): void {
  useLayoutEffect(() => {
    if (!authorized) return;
    const container = containerRef.current;
    if (!container) return;

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

    // Prevent accordion toggle when clicking inputs inside summary, and route the
    // statement-source link to the read-only viewer.
    const onClick = (e: Event): void => {
      const target = e.target as HTMLElement;
      if (target.closest("summary") && target.closest("input")) {
        e.preventDefault();
      }

      const sourceLink = target.closest(".statement-source-link");
      if (sourceLink instanceof HTMLElement) {
        e.preventDefault();
        e.stopPropagation();
        const statementId = sourceLink.dataset.statementId;
        if (statementId) {
          void openStatementSource(statementId);
        }
      }
    };
    // Capture phase: the accordion <details> toggle is the click's default action.
    // preventDefault() must run before that default fires. A bubble-phase listener
    // is too late in environments that evaluate the toggle during the target/bubble
    // phase (and is semantically identical to capture for cancelling the default).
    container.addEventListener("click", onClick, true);

    addAutocompleteListeners(container, getOptionsForInput);

    const onBlur = async (e: Event): Promise<void> => {
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

      const clearBalance = (): void => onClearBalance(txnId);

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
          await syncPeriodOnReimbursementChange(row, oldReimbursement, reimbursement, budgetPeriods, clearBalance);
          row.dataset.reimbursement = String(reimbursement);
          clearBalance();
        } else if (input.classList.contains("edit-budget")) {
          const value = input.value || null;
          if (value !== null && !(value in budgetNameToId)) {
            showInputError(input, `Unknown budget: "${value}"`);
            return;
          }
          const newBudgetId = value ? budgetNameToId[value] : null;
          const oldBudgetId = (row.dataset.budgetId || null) as BudgetId | null;
          await getActiveDataSource().updateTransaction(txnId, { budget: newBudgetId });
          await syncPeriodTotals(row, oldBudgetId, newBudgetId, budgetPeriods, clearBalance);

          if (newBudgetId) {
            row.dataset.budgetId = newBudgetId;
          } else {
            delete row.dataset.budgetId;
          }
          row.dataset.budgetName = newBudgetId ? (value ?? "") : "";

          clearBalance();
        } else {
          return;
        }
        input.defaultValue = input.value;
      } catch (error) {
        handleSaveError(input, error, "transaction");
      }
    };
    container.addEventListener("blur", onBlur, true);

    return () => {
      container.removeEventListener("click", onClick, true);
      container.removeEventListener("blur", onBlur, true);
    };
    // budgetMap/periods/options are stable for a mount (re-keyed per navEpoch).
  }, [authorized]);
}

/**
 * Wire the infinite-scroll IntersectionObserver onto the sentinel. On intersect
 * (guarded against a concurrent load) it fetches the next windowed batch; an empty
 * batch triggers the final unbounded {before} fetch and retires the sentinel.
 * Fetched transactions and the advanced cursor flow back through `handlers`
 * (React owns the rows / cursor / error UI). The chart-update on append is the
 * caller's responsibility (prop-driven re-render).
 */
export function useInfiniteScroll(
  sentinelRef: RefObject<HTMLElement>,
  nextBefore: number | null,
  handlers: TransactionTableHandlers,
): void {
  const { onAppend, onScrollError, onScrollLoading } = handlers;
  useLayoutEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || nextBefore === null) return;

    let loading = false;
    const observer = new IntersectionObserver(async (entries) => {
      if (!entries[0].isIntersecting || loading) return;
      loading = true;
      onScrollLoading(true);

      try {
        const beforeMs = nextBefore;
        const sinceMs = weekStart(beforeMs - SCROLL_BATCH_WEEKS * MS_PER_WEEK);

        const transactions = await getActiveDataSource().getTransactions({
          since: Timestamp.fromMillis(sinceMs),
          before: Timestamp.fromMillis(beforeMs),
        });
        transactions.sort(compareByTimestampDesc);

        if (transactions.length > 0) {
          onAppend({ transactions, nextBefore: sinceMs });
        } else {
          // Final batch: omit since to include null-timestamp transactions and any older than the earliest window boundary
          const finalBatch = await getActiveDataSource().getTransactions({
            before: Timestamp.fromMillis(beforeMs),
          });
          finalBatch.sort(compareByTimestampDesc);
          onAppend({ transactions: finalBatch, nextBefore: null });
        }
      } catch (error) {
        if (deferProgrammerError(error)) return;
        logError(error, { operation: "load-older-transactions" });
        onScrollError(classifyError(error) === "data-integrity" ? "data-integrity" : "transient");
      } finally {
        onScrollLoading(false);
        loading = false;
      }
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [nextBefore]);
}
