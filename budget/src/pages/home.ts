import type { User } from "firebase/auth";
import type { Timestamp } from "firebase/firestore";
import { escapeHtml } from "../escape-html.js";
import { getTransactions, type Group, type Transaction } from "../firestore.js";
import { DataIntegrityError } from "../errors.js";

function formatTimestamp(ts: Timestamp | null): string {
  if (!ts) return "";
  return ts.toDate().toLocaleDateString();
}

function formatCategory(category: string): string {
  return category.split(":").map(escapeHtml).join(" &gt; ");
}

function renderReadOnlyRow(txn: Transaction, groupName: string): string {
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
        <dt>Reimbursement</dt><dd>${String(txn.reimbursement)}%</dd>
        <dt>Budget</dt><dd>${escapeHtml(txn.budget ?? "")}</dd>
        <dt>Group</dt><dd>${escapeHtml(groupName)}</dd>
        <dt>Statement</dt><dd>${txn.statementId ? `<a href="#">statement</a>` : ""}</dd>
      </dl>
    </div>
  </details>`;
}

function renderEditableRow(txn: Transaction, groupName: string): string {
  return `<details class="txn-row" data-txn-id="${escapeHtml(txn.id)}">
    <summary class="txn-summary">
      <div class="txn-summary-content">
        <span>${escapeHtml(txn.description)}</span>
        <span><input type="text" class="edit-note" value="${escapeHtml(txn.note)}" aria-label="Note"></span>
        <span><input type="text" class="edit-category" value="${escapeHtml(txn.category)}" aria-label="Category"></span>
        <span class="amount">${escapeHtml(txn.amount.toFixed(2))}</span>
      </div>
    </summary>
    <div class="txn-details">
      <dl>
        <dt>Date</dt><dd>${formatTimestamp(txn.timestamp)}</dd>
        <dt>Institution</dt><dd>${escapeHtml(txn.institution)}</dd>
        <dt>Account</dt><dd>${escapeHtml(txn.account)}</dd>
        <dt>Reimbursement</dt><dd><input type="number" class="edit-reimbursement" value="${String(txn.reimbursement)}" min="0" max="100" aria-label="Reimbursement"></dd>
        <dt>Budget</dt><dd><input type="text" class="edit-budget" value="${escapeHtml(txn.budget ?? "")}" aria-label="Budget"></dd>
        <dt>Group</dt><dd>${escapeHtml(groupName)}</dd>
        <dt>Statement</dt><dd>${txn.statementId ? `<a href="#">statement</a>` : ""}</dd>
      </dl>
    </div>
  </details>`;
}

function compareByTimestampDesc(a: Transaction, b: Transaction): number {
  if (!a.timestamp && !b.timestamp) return 0;
  if (!a.timestamp) return 1;
  if (!b.timestamp) return -1;
  return b.timestamp.toMillis() - a.timestamp.toMillis();
}

function uniqueSorted(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => v != null))].sort();
}

function renderTransactionTable(transactions: Transaction[], authorized: boolean, groupName: string): string {
  if (transactions.length === 0) {
    return "<p>No transactions found.</p>";
  }

  const renderRow = authorized ? renderEditableRow : renderReadOnlyRow;
  const rows = transactions
    .map((txn) => renderRow(txn, groupName))
    .join("\n");

  let dataAttrs = "";
  if (authorized) {
    const budgetOpts = escapeHtml(JSON.stringify(uniqueSorted(transactions.map(t => t.budget))));
    const categoryOpts = escapeHtml(JSON.stringify(uniqueSorted(transactions.map(t => t.category))));
    dataAttrs = ` data-budget-options="${budgetOpts}" data-category-options="${categoryOpts}"`;
  }

  return `<div id="transactions-table"${dataAttrs}>
      <div class="txn-header">
        <span>Description</span>
        <span>Note</span>
        <span>Category</span>
        <span class="amount">Amount</span>
      </div>
      ${rows}
    </div>`;
}

/**
 * Valid state combinations:
 * - `{}` — unauthenticated, no group (shows seed data)
 * - `{ user, groupError: true }` — authenticated but group fetch failed
 * - `{ user, group }` — authenticated with group (shows real data, editable)
 * - `{ user }` — authenticated, no groups exist (shows seed data)
 */
export interface RenderHomeOptions {
  user?: User | null;
  group?: Group | null;
  groupError?: boolean;
}

export async function renderHome(options: RenderHomeOptions = {}): Promise<string> {
  const { user = null, group = null, groupError = false } = options;
  const authorized = group !== null;
  const groupName = group?.name ?? "";

  let tableHtml: string;
  try {
    const transactions = await getTransactions(group?.id ?? null, user?.uid);
    transactions.sort(compareByTimestampDesc);
    tableHtml = renderTransactionTable(transactions, authorized, groupName);
  } catch (error) {
    if (error instanceof RangeError || error instanceof DataIntegrityError) {
      throw error;
    }
    console.error("Failed to load transactions:", error);
    tableHtml = '<p id="transactions-error">Could not load transactions</p>';
  }

  const groupErrorNotice = groupError && user
    ? '<p id="group-error" class="auth-error">Could not verify group membership. Showing example data.</p>'
    : "";

  const seedNotice = !authorized && !groupError
    ? '<p id="seed-data-notice">Viewing example data. Sign in to see your transactions.</p>'
    : "";

  return `
    <h2>Transactions</h2>
    ${groupErrorNotice}
    ${seedNotice}
    ${tableHtml}
  `;
}
