import type { Timestamp } from "firebase/firestore";
import { escapeHtml } from "@commons-systems/htmlutil";
import { type RenderPageOptions, renderPageNotices, renderLoadError } from "./render-options.js";
import { getTransactions, getBudgets, getBudgetPeriods, type Transaction, type Budget, type BudgetPeriod, type SerializedBudgetPeriod } from "../firestore.js";
import { computeAllBudgetBalances } from "../balance.js";
import { DataIntegrityError } from "../errors.js";
import { uniqueSorted } from "./hydrate-util.js";
import type { SerializedChartTransaction } from "./home-chart.js";

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

interface RowParts {
  txnIdAttr: string;
  noteCell: string;
  categoryCell: string;
  reimbursementCell: string;
  budgetCell: string;
  balanceRow: string;
  amountAttr: string;
  budgetIdAttr: string;
  timestampAttr: string;
  reimbursementAttr: string;
  detailDl: string;
}

function buildRowParts(txn: Transaction, editable: boolean, budgetIdToName: Map<string, string>, balance: number | null, groupName: string): RowParts {
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
  const amountAttr = editable ? ` data-amount="${txn.amount}"` : "";
  const budgetIdAttr = editable && txn.budget ? ` data-budget-id="${escapeHtml(txn.budget)}"` : "";
  const timestampAttr = editable && txn.timestamp ? ` data-timestamp="${txn.timestamp.toMillis()}"` : "";
  const reimbursementAttr = editable ? ` data-reimbursement="${txn.reimbursement}"` : "";
  const detailDl = `<dl>
        <dt>Date</dt><dd>${formatTimestamp(txn.timestamp)}</dd>
        <dt>Institution</dt><dd>${escapeHtml(txn.institution)}</dd>
        <dt>Account</dt><dd>${escapeHtml(txn.account)}</dd>
        <dt>Reimbursement</dt><dd>${reimbursementCell}</dd>
        <dt>Budget</dt><dd>${budgetCell}</dd>
        ${balanceRow}
        <dt>Group</dt><dd>${escapeHtml(groupName)}</dd>
        <dt>Statement</dt><dd>${txn.statementId ? `<a href="#">statement</a>` : ""}</dd>
      </dl>`;
  return { txnIdAttr, noteCell, categoryCell, reimbursementCell, budgetCell, balanceRow, amountAttr, budgetIdAttr, timestampAttr, reimbursementAttr, detailDl };
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
  const p = buildRowParts(txn, editable, budgetIdToName, balance, groupName);

  return `<details class="expand-row txn-row"${p.txnIdAttr}${p.amountAttr}${p.budgetIdAttr}${p.timestampAttr}${p.reimbursementAttr}>
    <summary class="txn-summary">
      <div class="txn-summary-content">
        <span>${escapeHtml(txn.description)}</span>
        <span>${p.noteCell}</span>
        <span>${p.categoryCell}</span>
        <span class="amount">${escapeHtml(txn.amount.toFixed(2))}</span>
      </div>
    </summary>
    <div class="expand-details txn-details">
      ${p.detailDl}
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
  const p = buildRowParts(primary, editable, budgetIdToName, balance, groupName);

  const originalRows = members.map(txn =>
    `<div class="normalized-original">
      <span>${escapeHtml(txn.description)}</span>
      <span>${formatTimestamp(txn.timestamp)}</span>
      <span>${txn.statementId ? escapeHtml(txn.statementId) : ""}</span>
      <span class="amount">${escapeHtml(txn.amount.toFixed(2))}</span>
    </div>`
  ).join("\n");

  return `<details class="expand-row txn-row normalized-group"${p.txnIdAttr}${p.amountAttr}${p.budgetIdAttr}${p.timestampAttr}${p.reimbursementAttr}>
    <summary class="txn-summary">
      <div class="txn-summary-content">
        <span>${escapeHtml(description)}</span>
        <span>${p.noteCell}</span>
        <span>${p.categoryCell}</span>
        <span class="amount">${escapeHtml(primary.amount.toFixed(2))}</span>
      </div>
    </summary>
    <div class="expand-details txn-details">
      ${p.detailDl}
      <div class="normalized-originals">
        <h4>Original Transactions</h4>
        ${originalRows}
      </div>
    </div>
  </details>`;
}

function serializeChartTransactions(transactions: Transaction[]): SerializedChartTransaction[] {
  return transactions
    .filter(t => t.normalizedId === null || t.normalizedPrimary)
    .map(t => ({
      category: t.category,
      amount: t.amount,
      reimbursement: t.reimbursement,
      timestampMs: t.timestamp ? t.timestamp.toMillis() : null,
    }));
}

function renderCategorySankey(transactions: Transaction[]): string {
  const chartData = serializeChartTransactions(transactions);
  const json = JSON.stringify(chartData);
  return `<div id="sankey-controls">
      <fieldset id="sankey-mode">
        <label><input type="radio" name="sankey-mode" value="spending" checked> Spending</label>
        <label><input type="radio" name="sankey-mode" value="income"> Income</label>
      </fieldset>
      <label>Weeks: <input type="number" id="sankey-weeks" value="12" min="1" max="104"></label>
      <label>Ending week: <input type="range" id="sankey-end-week"> <span id="sankey-end-label"></span></label>
    </div>
    <div id="category-sankey"><script type="application/json" id="sankey-data">${json}</script></div>`;
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
    .flatMap((txn) => {
      if (txn.normalizedId === null) {
        return renderRow({
          txn,
          groupName,
          editable: authorized,
          budgetIdToName,
          balance: balances.get(txn.id) ?? null,
        });
      }
      if (seenGroups.has(txn.normalizedId)) return [];
      seenGroups.add(txn.normalizedId);
      const members = normalizedGroups.get(txn.normalizedId)!;
      const primary = members.find(t => t.normalizedPrimary);
      if (!primary) {
        throw new DataIntegrityError(`Normalized group ${txn.normalizedId} has no primary transaction`);
      }
      return renderNormalizedGroup({
        primary,
        members,
        groupName,
        editable: authorized,
        budgetIdToName,
        balance: balances.get(primary.id) ?? null,
      });
    })
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
  let chartHtml = "";
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
    chartHtml = renderCategorySankey(transactions);
    tableHtml = renderTransactionTable(transactions, authorized, groupName, budgets, budgetPeriods);
  } catch (error) {
    tableHtml = renderLoadError(error, "transactions-error");
  }

  return `
    <h2>Transactions</h2>
    ${renderPageNotices(options, "transactions")}
    ${chartHtml}
    ${tableHtml}
  `;
}
