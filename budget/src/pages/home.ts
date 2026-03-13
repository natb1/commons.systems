import type { Timestamp } from "firebase/firestore";
import { escapeHtml } from "@commons-systems/htmlutil";
import { type RenderPageOptions, renderPageNotices, renderLoadError } from "./render-options.js";
import { getTransactions, getBudgets, getBudgetPeriods, type Transaction, type Budget, type BudgetPeriod, type SerializedBudgetPeriod } from "../firestore.js";
import { computeAllBudgetBalances } from "../balance.js";
import { DataIntegrityError } from "../errors.js";
import { uniqueSorted } from "./hydrate-util.js";

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
    ? `<input type="text" class="edit-category" value="${escapeHtml(txn.category)}" aria-label="Category" data-autocomplete>`
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
    ? `<input type="text" class="edit-budget" value="${escapeHtml(budgetName)}" aria-label="Budget" data-autocomplete>`
    : escapeHtml(budgetName);

  const balanceRow = balance !== null
    ? `<dt>Budget Balance</dt><dd class="budget-balance">${balance.toFixed(2)}</dd>`
    : "";

  // Data attributes consumed by syncPeriodTotals / syncPeriodOnReimbursementChange in home-hydrate.ts
  const amountAttr = editable ? ` data-amount="${txn.amount}"` : "";
  const budgetIdAttr = editable && txn.budget ? ` data-budget-id="${escapeHtml(txn.budget)}"` : "";
  const timestampAttr = editable && txn.timestamp ? ` data-timestamp="${txn.timestamp.toMillis()}"` : "";
  const reimbursementAttr = editable ? ` data-reimbursement="${txn.reimbursement}"` : "";

  return `<details class="expand-row txn-row"${txnIdAttr}${amountAttr}${budgetIdAttr}${timestampAttr}${reimbursementAttr}>
    <summary class="txn-summary">
      <div class="txn-summary-content">
        <span>${escapeHtml(txn.description)}</span>
        <span>${noteCell}</span>
        <span>${categoryCell}</span>
        <span class="amount">${escapeHtml(txn.amount.toFixed(2))}</span>
      </div>
    </summary>
    <div class="expand-details txn-details">
      <dl>
        <dt>Date</dt><dd>${formatTimestamp(txn.timestamp)}</dd>
        <dt>Institution</dt><dd>${escapeHtml(txn.institution)}</dd>
        <dt>Account</dt><dd>${escapeHtml(txn.account)}</dd>
        <dt>Reimbursement</dt><dd>${reimbursementCell}</dd>
        <dt>Budget</dt><dd>${budgetCell}</dd>
        ${balanceRow}
        <dt>Group</dt><dd>${escapeHtml(groupName)}</dd>
        <dt>Statement</dt><dd>${txn.statementId ? `<a href="#">statement</a>` : ""}</dd>
      </dl>
    </div>
  </details>`;
}

interface RenderGroupOptions {
  primary: Transaction;
  members: Transaction[];
  groupName: string;
  editable: boolean;
  budgetIdToName: Map<string, string>;
  balance: number | null;
}

function renderNormalizedGroup(opts: RenderGroupOptions): string {
  const { primary, members, groupName, editable, budgetIdToName, balance } = opts;
  const description = primary.normalizedDescription ?? primary.description;
  const txnIdAttr = editable ? ` data-txn-id="${escapeHtml(primary.id)}"` : "";
  const noteCell = editable
    ? `<input type="text" class="edit-note" value="${escapeHtml(primary.note)}" aria-label="Note">`
    : escapeHtml(primary.note);
  const categoryCell = editable
    ? `<input type="text" class="edit-category" value="${escapeHtml(primary.category)}" aria-label="Category" data-autocomplete>`
    : formatCategory(primary.category);
  const reimbursementCell = editable
    ? `<input type="number" class="edit-reimbursement" value="${String(primary.reimbursement)}" min="0" max="100" aria-label="Reimbursement">`
    : `${String(primary.reimbursement)}%`;
  let budgetName = "";
  if (primary.budget) {
    const resolved = budgetIdToName.get(primary.budget);
    if (resolved === undefined) {
      throw new DataIntegrityError(`Transaction ${primary.id} references unknown budget ID: ${primary.budget}`);
    }
    budgetName = resolved;
  }
  const budgetCell = editable
    ? `<input type="text" class="edit-budget" value="${escapeHtml(budgetName)}" aria-label="Budget" data-autocomplete>`
    : escapeHtml(budgetName);
  const balanceRow = balance !== null
    ? `<dt>Budget Balance</dt><dd class="budget-balance">${balance.toFixed(2)}</dd>`
    : "";
  const amountAttr = editable ? ` data-amount="${primary.amount}"` : "";
  const budgetIdAttr = editable && primary.budget ? ` data-budget-id="${escapeHtml(primary.budget)}"` : "";
  const timestampAttr = editable && primary.timestamp ? ` data-timestamp="${primary.timestamp.toMillis()}"` : "";
  const reimbursementAttr = editable ? ` data-reimbursement="${primary.reimbursement}"` : "";

  const originalRows = members.map(txn =>
    `<div class="normalized-original">
      <span>${escapeHtml(txn.description)}</span>
      <span>${formatTimestamp(txn.timestamp)}</span>
      <span>${txn.statementId ? escapeHtml(txn.statementId) : ""}</span>
      <span class="amount">${escapeHtml(txn.amount.toFixed(2))}</span>
    </div>`
  ).join("\n");

  return `<details class="expand-row txn-row normalized-group"${txnIdAttr}${amountAttr}${budgetIdAttr}${timestampAttr}${reimbursementAttr}>
    <summary class="txn-summary">
      <div class="txn-summary-content">
        <span>${escapeHtml(description)}</span>
        <span>${noteCell}</span>
        <span>${categoryCell}</span>
        <span class="amount">${escapeHtml(primary.amount.toFixed(2))}</span>
      </div>
    </summary>
    <div class="expand-details txn-details">
      <dl>
        <dt>Date</dt><dd>${formatTimestamp(primary.timestamp)}</dd>
        <dt>Institution</dt><dd>${escapeHtml(primary.institution)}</dd>
        <dt>Account</dt><dd>${escapeHtml(primary.account)}</dd>
        <dt>Reimbursement</dt><dd>${reimbursementCell}</dd>
        <dt>Budget</dt><dd>${budgetCell}</dd>
        ${balanceRow}
        <dt>Group</dt><dd>${escapeHtml(groupName)}</dd>
        <dt>Statement</dt><dd>${primary.statementId ? `<a href="#">statement</a>` : ""}</dd>
      </dl>
      <div class="normalized-originals">
        <h4>Original Transactions</h4>
        ${originalRows}
      </div>
    </div>
  </details>`;
}

function compareByTimestampDesc(a: Transaction, b: Transaction): number {
  if (!a.timestamp && !b.timestamp) return 0;
  if (!a.timestamp) return 1;
  if (!b.timestamp) return -1;
  return b.timestamp.toMillis() - a.timestamp.toMillis();
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

  // Group normalized transactions by normalizedId
  const normalizedGroups = new Map<string, Transaction[]>();
  for (const txn of transactions) {
    if (txn.normalizedId !== null) {
      const group = normalizedGroups.get(txn.normalizedId);
      if (group) group.push(txn);
      else normalizedGroups.set(txn.normalizedId, [txn]);
    }
  }

  const seenGroups = new Set<string>();
  const rows = transactions
    .map((txn) => {
      if (txn.normalizedId === null) {
        return renderRow({
          txn,
          groupName,
          editable: authorized,
          budgetIdToName,
          balance: balances.get(txn.id) ?? null,
        });
      }
      if (seenGroups.has(txn.normalizedId)) return "";
      seenGroups.add(txn.normalizedId);
      const members = normalizedGroups.get(txn.normalizedId)!;
      const primary = members.find(t => t.normalizedPrimary) ?? members[0];
      return renderNormalizedGroup({
        primary,
        members,
        groupName,
        editable: authorized,
        budgetIdToName,
        balance: balances.get(primary.id) ?? null,
      });
    })
    .filter(row => row !== "")
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
    const periodsData: SerializedBudgetPeriod[] = budgetPeriods.map((p) => ({
      id: p.id,
      budgetId: p.budgetId,
      periodStartMs: p.periodStart.toMillis(),
      periodEndMs: p.periodEnd.toMillis(),
      total: p.total,
      count: p.count,
      categoryBreakdown: p.categoryBreakdown,
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
  const { user, group } = options;
  const authorized = group !== null;
  const groupName = group?.name ?? "";

  let tableHtml: string;
  try {
    const [transactions, budgets, budgetPeriods] = await Promise.all([
      (group && user?.email ? getTransactions(group.id, user.email) : getTransactions(null))
        .catch((e) => { console.error("Failed to load transactions:", e); throw e; }),
      (group && user?.email ? getBudgets(group.id, user.email) : getBudgets(null))
        .catch((e) => { console.error("Failed to load budgets:", e); throw e; }),
      (group && user?.email ? getBudgetPeriods(group.id, user.email) : getBudgetPeriods(null))
        .catch((e) => { console.error("Failed to load budget periods:", e); throw e; }),
    ]);
    transactions.sort(compareByTimestampDesc);
    tableHtml = renderTransactionTable(transactions, authorized, groupName, budgets, budgetPeriods);
  } catch (error) {
    tableHtml = renderLoadError(error, "transactions-error");
  }

  return `
    <h2>Transactions</h2>
    ${renderPageNotices(options, "transactions")}
    ${tableHtml}
  `;
}
