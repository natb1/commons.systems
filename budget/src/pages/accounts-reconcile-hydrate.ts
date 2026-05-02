import { getActiveDataSource } from "../active-data-source.js";
import type {
  ReconciliationClassification,
  ReconciliationEntityType,
  StatementItemId,
  TransactionId,
} from "../firestore.js";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";

function replaceQueryParam(name: string, value: string | null): void {
  const url = new URL(location.href);
  if (value === null || value === "") url.searchParams.delete(name);
  else url.searchParams.set(name, value);
  history.replaceState(null, "", url);
}

function triggerReload(): void {
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function parseClassification(raw: string): ReconciliationClassification | "" {
  if (raw === "timing" || raw === "missing_entry" || raw === "discrepancy") return raw;
  return "";
}

function parseEntityType(raw: string): ReconciliationEntityType | null {
  if (raw === "transaction" || raw === "statementItem") return raw;
  return null;
}

export function hydrateAccountsReconcile(container: HTMLElement): void {
  const accountSelect = container.querySelector<HTMLSelectElement>("#reconcile-account-select");
  const periodSelect = container.querySelector<HTMLSelectElement>("#reconcile-period-select");
  const toleranceInput = container.querySelector<HTMLInputElement>("#reconcile-tolerance-input");

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

  if (toleranceInput) {
    toleranceInput.addEventListener("change", () => {
      replaceQueryParam("tolerance", toleranceInput.value || null);
      triggerReload();
    });
  }

  container.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    if (!target.classList.contains("reconcile-confirm")) return;
    const txnId = target.dataset.txnId as TransactionId | undefined;
    const statementItemId = target.dataset.statementItemId as StatementItemId | undefined;
    if (!txnId || !statementItemId) return;
    target.disabled = true;
    getActiveDataSource()
      .updateTransactionStatementItemLink(txnId, statementItemId)
      .then(() => triggerReload())
      .catch((error) => {
        target.disabled = false;
        if (deferProgrammerError(error)) return;
        logError(error, { operation: "reconcile-confirm-match" });
      });
  });

  container.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    if (!target.classList.contains("reconcile-classification")) return;
    void persistClassification(target);
  });

  container.addEventListener("blur", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (!target.classList.contains("reconcile-note")) return;
    void persistNote(target);
  }, true);
}

async function persistClassification(select: HTMLSelectElement): Promise<void> {
  const entityType = parseEntityType(select.dataset.entityType ?? "");
  const entityId = select.dataset.entityId ?? "";
  if (!entityType || !entityId) return;

  const classification = parseClassification(select.value);
  try {
    if (classification === "") {
      await getActiveDataSource().deleteReconciliationNote(entityType, entityId);
      return;
    }
    const noteInput = select
      .closest(".reconcile-classification-row")
      ?.querySelector<HTMLInputElement>(".reconcile-note");
    await getActiveDataSource().upsertReconciliationNote({
      entityType,
      entityId,
      classification,
      note: noteInput?.value ?? "",
    });
  } catch (error) {
    if (deferProgrammerError(error)) return;
    logError(error, { operation: "reconcile-classify" });
  }
}

async function persistNote(input: HTMLInputElement): Promise<void> {
  const entityType = parseEntityType(input.dataset.entityType ?? "");
  const entityId = input.dataset.entityId ?? "";
  if (!entityType || !entityId) return;

  const select = input
    .closest(".reconcile-classification-row")
    ?.querySelector<HTMLSelectElement>(".reconcile-classification");
  const classification = parseClassification(select?.value ?? "");
  if (classification === "") return;

  try {
    await getActiveDataSource().upsertReconciliationNote({
      entityType,
      entityId,
      classification,
      note: input.value,
    });
  } catch (error) {
    if (deferProgrammerError(error)) return;
    logError(error, { operation: "reconcile-note" });
  }
}
