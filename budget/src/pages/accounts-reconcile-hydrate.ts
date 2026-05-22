import { getActiveDataSource } from "../active-data-source.js";
import type { ReconciliationEventFields } from "../data-source.js";
import { balancesMatch } from "../reconciliation.js";
import { formatCurrency } from "../format.js";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import { parseReconcileQuery, parseReconcilePeriod } from "./accounts-reconcile.js";

function replaceQueryParam(name: string, value: string | null): void {
  const url = new URL(location.href);
  if (value === null || value === "") url.searchParams.delete(name);
  else url.searchParams.set(name, value);
  history.replaceState(null, "", url);
}

function triggerReload(): void {
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/**
 * The last calendar day of a `YYYY-MM` period, as epoch milliseconds (UTC).
 * `Date.UTC(year, month, 0)` rolls back to the last day of the prior month —
 * with `month` already 1-based this lands on the last day of the selected month.
 */
function periodEndMs(period: string): number {
  const { year, month } = parseReconcilePeriod(period);
  return Date.UTC(year, month, 0);
}

/** Leg rows whose cleared checkbox is currently checked. */
function checkedLegRows(container: HTMLElement): HTMLElement[] {
  const rows: HTMLElement[] = [];
  for (const row of container.querySelectorAll<HTMLElement>(".reconcile-leg")) {
    const checkbox = row.querySelector<HTMLInputElement>(".reconcile-cleared-checkbox");
    if (checkbox?.checked) rows.push(row);
  }
  return rows;
}

/** Sum `data-signed-amount` over every checked leg row in the container. */
function clearedBalanceFromDom(container: HTMLElement): number {
  let total = 0;
  for (const row of checkedLegRows(container)) {
    const amount = Number(row.dataset.signedAmount);
    if (!Number.isFinite(amount)) {
      throw new Error(`Reconcile leg row has invalid data-signed-amount: ${row.dataset.signedAmount}`);
    }
    total += amount;
  }
  return total;
}

/** Leg ids of every currently-checked leg row. */
function clearedLegIds(container: HTMLElement): string[] {
  return checkedLegRows(container).map((row) => {
    const legId = row.dataset.legId;
    if (!legId) throw new Error("Reconcile leg row is missing data-leg-id");
    return legId;
  });
}

/**
 * The bank's statement-ending balance, from the `data-statement-balance`
 * attribute the renderer sets on the reconcile container. `null` when no
 * statement exists for the account+period.
 */
function statementEndingBalance(container: HTMLElement): number | null {
  const raw = container.dataset.statementBalance;
  if (raw === undefined || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

/** Recompute the header cleared-balance and difference in place — no full reload. */
function updateHeaderTotals(container: HTMLElement): void {
  const cleared = clearedBalanceFromDom(container);
  const clearedEl = container.querySelector<HTMLElement>(".reconcile-cleared-balance");
  if (clearedEl) {
    clearedEl.textContent = `Cleared balance: ${formatCurrency(cleared)}`;
  }
  const statementBalance = statementEndingBalance(container);
  const differenceEl = container.querySelector<HTMLElement>(".reconcile-difference");
  if (differenceEl && statementBalance !== null) {
    differenceEl.textContent = `Difference: ${formatCurrency(cleared - statementBalance)}`;
  }
}

export function hydrateAccountsReconcile(container: HTMLElement): void {
  const accountSelect = container.querySelector<HTMLSelectElement>("#reconcile-account-select");
  const periodSelect = container.querySelector<HTMLSelectElement>("#reconcile-period-select");

  if (accountSelect) {
    accountSelect.addEventListener("change", () => {
      const value = accountSelect.value;
      if (!value) {
        replaceQueryParam("institution", null);
        replaceQueryParam("account", null);
        replaceQueryParam("period", null);
      } else {
        const [institution, account] = value.split("\t");
        replaceQueryParam("institution", institution);
        replaceQueryParam("account", account);
        replaceQueryParam("period", null);
      }
      triggerReload();
    });
  }

  if (periodSelect) {
    periodSelect.addEventListener("change", () => {
      replaceQueryParam("period", periodSelect.value || null);
      triggerReload();
    });
  }

  // Cleared-checkbox toggle: persist the leg's cleared flag, then recompute the
  // header totals live. On a persist failure, revert the checkbox and log.
  container.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (!target.classList.contains("reconcile-cleared-checkbox")) return;
    const row = target.closest<HTMLElement>(".reconcile-leg");
    const legId = row?.dataset.legId;
    if (!legId || !row) return;
    const nextChecked = target.checked;
    updateHeaderTotals(container);
    delete row.dataset.clearedSaved;
    getActiveDataSource()
      .updateJournalLegCleared(legId, nextChecked)
      .then(() => {
        // Signal a settled write — lets tests wait for persistence deterministically.
        row.dataset.clearedSaved = String(nextChecked);
      })
      .catch((error: unknown) => {
        target.checked = !nextChecked;
        updateHeaderTotals(container);
        if (deferProgrammerError(error)) return;
        logError(error, { operation: "reconcile-toggle-cleared" });
      });
  });

  const dialog = container.querySelector<HTMLDialogElement>("#reconcile-dialog");

  // Reconcile button opens the dialog.
  const openButton = container.querySelector<HTMLButtonElement>("#reconcile-open-dialog");
  if (openButton && dialog) {
    openButton.addEventListener("click", () => {
      dialog.showModal();
    });
  }

  // Cancel button closes the dialog without reconciling.
  const cancelButton = container.querySelector<HTMLButtonElement>("#reconcile-cancel");
  if (cancelButton && dialog) {
    cancelButton.addEventListener("click", () => {
      dialog.close();
    });
  }

  // Dialog submit: compare entered bank balance to the cleared balance.
  const dialogForm = container.querySelector<HTMLFormElement>("#reconcile-dialog-form");
  if (dialogForm && dialog) {
    dialogForm.addEventListener("submit", (event) => {
      // The form is method="dialog"; submitting closes the dialog by default.
      // On mismatch we keep it open, so handle the submit explicitly.
      event.preventDefault();
      void handleReconcileSubmit(container, dialog);
    });
  }
}

async function handleReconcileSubmit(container: HTMLElement, dialog: HTMLDialogElement): Promise<void> {
  const bankInput = container.querySelector<HTMLInputElement>("#reconcile-bank-balance-input");
  const differenceDisplay = container.querySelector<HTMLElement>("#reconcile-difference-display");
  if (!bankInput) throw new Error("#reconcile-bank-balance-input not found");

  // Number("") is 0, not NaN — guard the empty input explicitly so an
  // un-filled dialog is rejected rather than reconciled against a zero balance.
  const bankInputRaw = bankInput.value.trim();
  const bankBalance = Number(bankInputRaw);
  if (bankInputRaw === "" || !Number.isFinite(bankBalance)) {
    if (differenceDisplay) differenceDisplay.textContent = "Enter a valid bank balance.";
    return;
  }

  const cleared = clearedBalanceFromDom(container);

  if (!balancesMatch(bankBalance, cleared)) {
    // Mismatch: surface the signed difference (cleared − bank) and keep the
    // dialog open. Mismatch-resolution UX is sibling issue #554.
    const difference = cleared - bankBalance;
    if (differenceDisplay) {
      differenceDisplay.textContent = `Difference: ${formatCurrency(difference)}`;
    }
    return;
  }

  const query = parseReconcileQuery(location.search);
  if (!query.institution || !query.account || !query.period) {
    throw new Error("Reconcile submit requires institution, account, and period query params");
  }

  const legIds = clearedLegIds(container);
  const fields: ReconciliationEventFields = {
    institution: query.institution,
    account: query.account,
    reconciledThroughDateMs: periodEndMs(query.period),
    bankBalance,
    clearedBalance: cleared,
    adjustment: 0,
    reconciledBy: "local",
    reconciledAtMs: Date.now(),
    adjustmentEntryId: null,
  };

  try {
    await getActiveDataSource().createReconciliationEvent(fields, legIds);
    dialog.close();
    triggerReload();
  } catch (error) {
    if (deferProgrammerError(error)) return;
    if (differenceDisplay) {
      differenceDisplay.textContent = "Reconcile failed — please try again.";
    }
    logError(error, { operation: "reconcile-finalize" });
  }
}
