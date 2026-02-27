import type { User } from "firebase/auth";
import { escapeHtml } from "../escape-html.js";
import { isAuthorized } from "../is-authorized.js";
import { getTransactions, type Transaction } from "../firestore.js";

function formatCategory(category: string): string {
  return category.split(":").map(escapeHtml).join(" &gt; ");
}

function renderReadOnlyRow(txn: Transaction): string {
  return `<tr>
    <td>${escapeHtml(txn.institution)}</td>
    <td>${escapeHtml(txn.account)}</td>
    <td>${escapeHtml(txn.description)}</td>
    <td class="amount">${escapeHtml(txn.amount.toFixed(2))}</td>
    <td>${escapeHtml(txn.note)}</td>
    <td>${formatCategory(txn.category)}</td>
    <td class="amount">${escapeHtml(txn.reimbursement.toString())}</td>
    <td>${txn.vacation ? "Yes" : "No"}</td>
  </tr>`;
}

function renderEditableRow(txn: Transaction): string {
  return `<tr data-txn-id="${escapeHtml(txn.id)}">
    <td>${escapeHtml(txn.institution)}</td>
    <td>${escapeHtml(txn.account)}</td>
    <td>${escapeHtml(txn.description)}</td>
    <td class="amount">${escapeHtml(txn.amount.toFixed(2))}</td>
    <td><input type="text" class="edit-note" value="${escapeHtml(txn.note)}"></td>
    <td><input type="text" class="edit-category" value="${escapeHtml(txn.category)}"></td>
    <td><input type="number" class="edit-reimbursement" value="${txn.reimbursement}" min="0" max="100"></td>
    <td><input type="checkbox" class="edit-vacation" ${txn.vacation ? "checked" : ""}></td>
  </tr>`;
}

export async function renderHome(user?: User | null): Promise<string> {
  const currentUser = user ?? null;
  const authorized = isAuthorized(currentUser);

  let tableHtml: string;
  try {
    const transactions = await getTransactions(currentUser);
    if (transactions.length === 0) {
      tableHtml = "<p>No transactions found.</p>";
    } else {
      const rows = transactions
        .map((txn) => authorized ? renderEditableRow(txn) : renderReadOnlyRow(txn))
        .join("\n");
      tableHtml = `<table id="transactions-table">
      <thead>
        <tr>
          <th>Institution</th>
          <th>Account</th>
          <th>Description</th>
          <th>Amount</th>
          <th>Note</th>
          <th>Category</th>
          <th>Reimbursement</th>
          <th>Vacation</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>`;
    }
  } catch (error) {
    console.error("Failed to load transactions:", error);
    tableHtml = '<p id="transactions-error">Could not load transactions</p>';
  }

  const seedNotice = !authorized
    ? '<p id="seed-data-notice">Viewing example data. Sign in to see your transactions.</p>'
    : "";

  return `
    <h2>Transactions</h2>
    ${seedNotice}
    ${tableHtml}
  `;
}
