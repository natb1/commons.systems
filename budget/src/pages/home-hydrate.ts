import { updateTransaction } from "../firestore.js";

export function hydrateTransactionTable(container: HTMLElement): void {
  // Prevent accordion toggle when clicking inputs inside summary
  container.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("summary") && target.closest("input")) {
      e.preventDefault();
    }
  });

  // Show datalist dropdown on focus for inputs with a list attribute
  container.addEventListener("focus", (e) => {
    const target = e.target as HTMLInputElement;
    if (target.tagName === "INPUT" && target.list && typeof target.showPicker === "function") {
      target.showPicker();
    }
  }, true);

  container.addEventListener("blur", async (e) => {
    const target = e.target as HTMLElement;
    const row = target.closest(".txn-row");
    const txnId = (row as HTMLElement)?.dataset.txnId;
    if (!txnId) return;

    if (target.classList.contains("edit-note")) {
      await updateTransaction(txnId, { note: (target as HTMLInputElement).value });
    } else if (target.classList.contains("edit-category")) {
      await updateTransaction(txnId, { category: (target as HTMLInputElement).value });
    } else if (target.classList.contains("edit-reimbursement")) {
      await updateTransaction(txnId, { reimbursement: Number((target as HTMLInputElement).value) });
    } else if (target.classList.contains("edit-budget")) {
      const value = (target as HTMLInputElement).value;
      await updateTransaction(txnId, { budget: value || null });
    }
  }, true);
}
