import type { User } from "firebase/auth";
import type { Timestamp } from "firebase/firestore";
import { escapeHtml } from "../escape-html.js";
import { isAuthorized } from "../is-authorized.js";
import { getTransactions, type Transaction } from "../firestore.js";

function formatTimestamp(ts: Timestamp | null): string {
  if (!ts) return "";
  return ts.toDate().toLocaleDateString();
}

function formatCategory(category: string): string {
  return category.split(":").map(escapeHtml).join(" &gt; ");
}

function renderReadOnlyRow(txn: Transaction): string {
  return `<details class="txn-row">
    <summary class="txn-summary">
      <div class="txn-summary-content">
        <span>${escapeHtml(txn.description)}</span>
        <span>${escapeHtml(txn.note)}</span>
        <span>${formatCategory(txn.category)}</span>
        <span class="amount">${escapeHtml(txn.amount.toFixed(2))}</span>
      </div>
    </summary>
    <div class="txn-details">
      <dl>
        <dt>Date</dt><dd>${formatTimestamp(txn.timestamp)}</dd>
        <dt>Institution</dt><dd>${escapeHtml(txn.institution)}</dd>
        <dt>Account</dt><dd>${escapeHtml(txn.account)}</dd>
        <dt>Reimbursement</dt><dd>${txn.reimbursement}%</dd>
        <dt>Budget</dt><dd>${escapeHtml(txn.budget ?? "")}</dd>
        <dt>Statement</dt><dd>${txn.statementId ? `<a href="#">statement</a>` : ""}</dd>
      </dl>
    </div>
  </details>`;
}

function renderEditableRow(txn: Transaction): string {
  return `<details class="txn-row" data-txn-id="${escapeHtml(txn.id)}">
    <summary class="txn-summary">
      <div class="txn-summary-content">
        <span>${escapeHtml(txn.description)}</span>
        <span><input type="text" class="edit-note" value="${escapeHtml(txn.note)}"></span>
        <span><input type="text" class="edit-category" value="${escapeHtml(txn.category)}"></span>
        <span class="amount">${escapeHtml(txn.amount.toFixed(2))}</span>
      </div>
    </summary>
    <div class="txn-details">
      <dl>
        <dt>Date</dt><dd>${formatTimestamp(txn.timestamp)}</dd>
        <dt>Institution</dt><dd>${escapeHtml(txn.institution)}</dd>
        <dt>Account</dt><dd>${escapeHtml(txn.account)}</dd>
        <dt>Reimbursement</dt><dd><input type="number" class="edit-reimbursement" value="${txn.reimbursement}" min="0" max="100"></dd>
        <dt>Budget</dt><dd><input type="text" class="edit-budget" value="${escapeHtml(txn.budget ?? "")}"></dd>
        <dt>Statement</dt><dd>${txn.statementId ? `<a href="#">statement</a>` : ""}</dd>
      </dl>
    </div>
  </details>`;
}

export async function renderHome(user?: User | null): Promise<string> {
  const currentUser = user ?? null;
  const authorized = isAuthorized(currentUser);

  let tableHtml: string;
  try {
    const transactions = await getTransactions(currentUser);
    transactions.sort((a, b) => {
      if (!a.timestamp && !b.timestamp) return 0;
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return b.timestamp.toMillis() - a.timestamp.toMillis();
    });
    if (transactions.length === 0) {
      tableHtml = "<p>No transactions found.</p>";
    } else {
      const rows = transactions
        .map((txn) => authorized ? renderEditableRow(txn) : renderReadOnlyRow(txn))
        .join("\n");
      tableHtml = `<div id="transactions-table">
      <div class="txn-header">
        <span>Description</span>
        <span>Note</span>
        <span>Category</span>
        <span class="amount">Amount</span>
      </div>
      ${rows}
    </div>`;
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
