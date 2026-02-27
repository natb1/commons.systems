import { updateTransaction } from "../firestore.js";

export function hydrateTransactionTable(table: HTMLTableElement): void {
  table.addEventListener("blur", async (e) => {
    const target = e.target as HTMLElement;
    const row = target.closest("tr");
    const txnId = row?.dataset.txnId;
    if (!txnId) return;

    if (target.classList.contains("edit-note")) {
      await updateTransaction(txnId, { note: (target as HTMLInputElement).value });
    } else if (target.classList.contains("edit-category")) {
      await updateTransaction(txnId, { category: (target as HTMLInputElement).value });
    } else if (target.classList.contains("edit-reimbursement")) {
      await updateTransaction(txnId, { reimbursement: Number((target as HTMLInputElement).value) });
    }
  }, true);

  table.addEventListener("change", async (e) => {
    const target = e.target as HTMLElement;
    const row = target.closest("tr");
    const txnId = row?.dataset.txnId;
    if (!txnId) return;

    if (target.classList.contains("edit-vacation")) {
      await updateTransaction(txnId, { vacation: (target as HTMLInputElement).checked });
    }
  });
}
