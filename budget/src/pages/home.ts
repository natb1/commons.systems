import type { Timestamp } from "firebase/firestore";
import { escapeHtml } from "@commons-systems/htmlutil";
import type { RenderPageOptions } from "./render-options.js";
import { getTransactions, getBudgets, getBudgetPeriods, type Transaction, type Budget, type BudgetPeriod } from "../firestore.js";
import { computeAllBudgetBalances } from "../balance.js";
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

interface RenderRowOptions {
  txn: Transaction;
  groupName: string;
  editable: boolean;
  budgetIdToName: Map<string, string>;
  balance: number | null;
}

function renderRow(opts: RenderRowOptions): string {
  const { txn, groupName, editable, budgetIdToName, balance } = opts;
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
  let budgetName = "";
  if (txn.budget) {
    const resolved = budgetIdToName.get(txn.budget);
    if (resolved === undefined) {
      throw new DataIntegrityError(`Transaction ${txn.id} references unknown budget ID: ${txn.budget}`);
    }
    budgetName = resolved;
  }
  const budgetCell = editable
    ? `<input type="text" class="edit-budget" value="${escapeHtml(budgetName)}" aria-label="Budget">`
    : escapeHtml(budgetName);

  const balanceDisplay = balance !== null ? balance.toFixed(2) : "";

  // Data attributes for hydration
  const amountAttr = editable ? ` data-amount="${txn.amount}"` : "";
  const budgetIdAttr = editable && txn.budget ? ` data-budget-id="${escapeHtml(txn.budget)}"` : "";
  const timestampAttr = editable && txn.timestamp ? ` data-timestamp="${txn.timestamp.toMillis()}"` : "";
  const reimbursementAttr = editable ? ` data-reimbursement="${txn.reimbursement}"` : "";

  return `<details class="txn-row"${txnIdAttr}${amountAttr}${budgetIdAttr}${timestampAttr}${reimbursementAttr}>
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
        <dt>Budget Balance</dt><dd class="budget-balance">${balanceDisplay}</dd>
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

function renderTransactionTable(
  transactions: Transaction[],
  authorized: boolean,
  groupName: string,
  budgets: Budget[],
  budgetPeriods: BudgetPeriod[],
): string {
  if (transactions.length === 0) {
    return "<p>No transactions found.</p>";
  }

  const budgetIdToName = new Map(budgets.map(b => [b.id, b.name]));
  const balances = computeAllBudgetBalances(transactions, budgets, budgetPeriods);
  const rows = transactions
    .map((txn) => renderRow({ txn, groupName, editable: authorized, budgetIdToName, balance: balances.get(txn.id) ?? null }))
    .join("\n");

  let dataAttrs = "";
  if (authorized) {
    const budgetNames = budgets.map(b => b.name).sort();
    const budgetOpts = escapeHtml(JSON.stringify(budgetNames));
    const budgetNameToId: Record<string, string> = {};
    for (const b of budgets) {
      if (budgetNameToId[b.name] !== undefined) {
        throw new DataIntegrityError(`Duplicate budget name: ${b.name}`);
      }
      budgetNameToId[b.name] = b.id;
    }
    const budgetMapAttr = escapeHtml(JSON.stringify(budgetNameToId));
    const categoryOpts = escapeHtml(JSON.stringify(uniqueSorted(transactions.map(t => t.category))));
    const periodsData = budgetPeriods.map((p) => ({
      id: p.id,
      budgetId: p.budgetId,
      periodStartMs: p.periodStart.toMillis(),
      periodEndMs: p.periodEnd.toMillis(),
      total: p.total,
    }));
    const periodsAttr = escapeHtml(JSON.stringify(periodsData));
    dataAttrs = [
      ` data-budget-options="${budgetOpts}"`,
      ` data-budget-map="${budgetMapAttr}"`,
      ` data-category-options="${categoryOpts}"`,
      ` data-budget-periods="${periodsAttr}"`,
    ].join("");
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

export async function renderHome(options: RenderPageOptions): Promise<string> {
  const { user, group, groupError } = options;
  const authorized = group !== null;
  const groupName = group?.name ?? "";

  let tableHtml: string;
  try {
    const [transactions, budgets, budgetPeriods] = await Promise.all([
      (group && user ? getTransactions(group.id, user.uid) : getTransactions(null))
        .catch((e) => { console.error("Failed to load transactions:", e); throw e; }),
      (group && user ? getBudgets(group.id, user.uid) : getBudgets(null))
        .catch((e) => { console.error("Failed to load budgets:", e); throw e; }),
      (group && user ? getBudgetPeriods(group.id, user.uid) : getBudgetPeriods(null))
        .catch((e) => { console.error("Failed to load budget periods:", e); throw e; }),
    ]);
    transactions.sort(compareByTimestampDesc);
    tableHtml = renderTransactionTable(transactions, authorized, groupName, budgets, budgetPeriods);
  } catch (error) {
    if (error instanceof RangeError || error instanceof DataIntegrityError
        || error instanceof TypeError || error instanceof ReferenceError) {
      throw error;
    }
    // Source-specific error already logged above
    const code = (error as { code?: string })?.code;
    const message = code === "permission-denied"
      ? "Access denied. Please contact support."
      : "Could not load data. Try refreshing the page.";
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
