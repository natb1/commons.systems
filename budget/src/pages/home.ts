import type { User } from "firebase/auth";
import type { Timestamp } from "firebase/firestore";
import { escapeHtml } from "@commons-systems/htmlutil";
import type { Group } from "@commons-systems/authutil/groups";
import { getTransactions, getBudgets, type Transaction, type Budget } from "../firestore.js";
import { DataIntegrityError } from "../errors.js";

function formatTimestamp(ts: Timestamp | null): string {
  if (!ts) return "";
  const date = ts.toDate();
  if (isNaN(date.getTime())) {
    throw new DataIntegrityError(`Invalid Date from Timestamp: ${String(ts)}`);
  }
  return date.toLocaleDateString();
}

function formatCategory(category: string): string {
  return category.split(":").map(escapeHtml).join(" &gt; ");
}

function renderRow(txn: Transaction, groupName: string, editable: boolean, budgetIdToName: Map<string, string>): string {
  const txnIdAttr = editable ? ` data-txn-id="${escapeHtml(txn.id)}"` : "";
  const noteCell = editable
    ? `<input type="text" class="edit-note" value="${escapeHtml(txn.note)}" aria-label="Note">`
    : escapeHtml(txn.note);
  const categoryCell = editable
    ? `<input type="text" class="edit-category" value="${escapeHtml(txn.category)}" aria-label="Category">`
    : formatCategory(txn.category);
  const reimbursementCell = editable
    ? `<input type="number" class="edit-reimbursement" value="${String(txn.reimbursement)}" min="0" max="100" aria-label="Reimbursement">`
    : `${String(txn.reimbursement)}%`;
  const budgetName = txn.budget ? (budgetIdToName.get(txn.budget) ?? txn.budget) : "";
  const budgetCell = editable
    ? `<input type="text" class="edit-budget" value="${escapeHtml(budgetName)}" aria-label="Budget">`
    : escapeHtml(budgetName);

  return `<details class="txn-row"${txnIdAttr}>
    <summary class="txn-summary">
      <div class="txn-summary-content">
        <span>${escapeHtml(txn.description)}</span>
        <span>${noteCell}</span>
        <span>${categoryCell}</span>
        <span class="amount">${escapeHtml(txn.amount.toFixed(2))}</span>
      </div>
    </summary>
    <div class="txn-details">
      <dl>
        <dt>Date</dt><dd>${formatTimestamp(txn.timestamp)}</dd>
        <dt>Institution</dt><dd>${escapeHtml(txn.institution)}</dd>
        <dt>Account</dt><dd>${escapeHtml(txn.account)}</dd>
        <dt>Reimbursement</dt><dd>${reimbursementCell}</dd>
        <dt>Budget</dt><dd>${budgetCell}</dd>
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

function renderTransactionTable(transactions: Transaction[], authorized: boolean, groupName: string, budgets: Budget[]): string {
  if (transactions.length === 0) {
    return "<p>No transactions found.</p>";
  }

  const budgetIdToName = new Map(budgets.map(b => [b.id, b.name]));
  const rows = transactions
    .map((txn) => renderRow(txn, groupName, authorized, budgetIdToName))
    .join("\n");

  let dataAttrs = "";
  if (authorized) {
    const budgetNames = budgets.map(b => b.name).sort();
    const budgetOpts = escapeHtml(JSON.stringify(budgetNames));
    const budgetNameToId = Object.fromEntries(budgets.map(b => [b.name, b.id]));
    const budgetMapAttr = escapeHtml(JSON.stringify(budgetNameToId));
    const categoryOpts = escapeHtml(JSON.stringify(uniqueSorted(transactions.map(t => t.category))));
    dataAttrs = ` data-budget-options="${budgetOpts}" data-budget-map="${budgetMapAttr}" data-category-options="${categoryOpts}"`;
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
 * Render-time options after resolving the active group from AppState.
 * Valid state combinations:
 * - { user: null, group: null, groupError: false } — unauthenticated (shows seed data)
 * - { user: User, group: Group, groupError: false } — authenticated with group (editable)
 * - { user: User, group: null, groupError: boolean } — authenticated, no group (error or none exist)
 */
export type RenderHomeOptions =
  | { user: null; group: null; groupError: false }
  | { user: User; group: Group; groupError: false }
  | { user: User; group: null; groupError: boolean };

export async function renderHome(options: RenderHomeOptions): Promise<string> {
  const { user, group, groupError } = options;
  const authorized = group !== null;
  const groupName = group?.name ?? "";

  let tableHtml: string;
  try {
    const [transactions, budgets] = await Promise.all([
      group && user
        ? getTransactions(group.id, user.uid)
        : getTransactions(null),
      group && user
        ? getBudgets(group.id, user.uid)
        : getBudgets(null),
    ]);
    transactions.sort(compareByTimestampDesc);
    tableHtml = renderTransactionTable(transactions, authorized, groupName, budgets);
  } catch (error) {
    if (error instanceof RangeError || error instanceof DataIntegrityError
        || error instanceof TypeError || error instanceof ReferenceError) {
      throw error;
    }
    console.error("Failed to load transactions:", error);
    const code = (error as { code?: string })?.code;
    const message = code === "permission-denied"
      ? "Access denied. Please contact support."
      : "Could not load transactions. Try refreshing the page.";
    tableHtml = `<p id="transactions-error">${message}</p>`;
  }

  const groupErrorNotice = groupError && user
    ? '<p id="group-error" class="auth-error">Could not load group data. Showing example data. Try refreshing the page.</p>'
    : "";

  let seedNotice = "";
  if (!authorized && !groupError) {
    seedNotice = user
      ? '<p id="seed-data-notice">Viewing example data. You are not a member of any groups.</p>'
      : '<p id="seed-data-notice">Viewing example data. Sign in to see your transactions.</p>';
  }

  return `
    <h2>Transactions</h2>
    ${groupErrorNotice}
    ${seedNotice}
    ${tableHtml}
  `;
}
