import { Timestamp } from "firebase/firestore";
import { escapeHtml } from "@commons-systems/htmlutil";
import { type Transaction } from "../firestore.js";
import { computeNetAmount } from "../balance.js";

import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import type { SerializedChartTransaction } from "./home-chart.js";

/** Number of weeks loaded per scroll batch (initial load and each subsequent fetch). */
export const SCROLL_BATCH_WEEKS = 12;

export function formatTimestamp(ts: Timestamp | null): string {
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
  categoryAttr: string;
  netAmountAttr: string;
  budgetNameAttr: string;
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
  const categoryAttr = ` data-category="${escapeHtml(txn.category)}"`;
  const netAmountAttr = ` data-net-amount="${computeNetAmount(txn.amount, txn.reimbursement)}"`;
  const budgetNameAttr = ` data-budget-name="${escapeHtml(budgetName)}"`;
  const detailDl = `<dl>
        <dt>Date</dt><dd>${formatTimestamp(txn.timestamp)}</dd>
        <dt>Institution</dt><dd>${escapeHtml(txn.institution)}</dd>
        <dt>Account</dt><dd>${escapeHtml(txn.account)}</dd>
        <dt>Reimbursement</dt><dd>${reimbursementCell}</dd>
        <dt>Budget</dt><dd>${budgetCell}</dd>
        ${balanceRow}
        <dt>Group</dt><dd>${escapeHtml(groupName)}</dd>
        <dt>Statement</dt><dd>${txn.statementId ? `<button type="button" class="statement-source-link" data-statement-id="${escapeHtml(txn.statementId)}">view source</button>` : ""}</dd>
      </dl>`;
  return { txnIdAttr, noteCell, categoryCell, reimbursementCell, budgetCell, balanceRow, amountAttr, budgetIdAttr, timestampAttr, reimbursementAttr, categoryAttr, netAmountAttr, budgetNameAttr, detailDl };
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

  const virtualClass = txn.virtual ? " virtual-txn" : "";
  const virtualBadge = txn.virtual ? '<span class="virtual-badge">virtual</span>' : "";

  return `<details class="expand-row txn-row${virtualClass}"${p.txnIdAttr}${p.amountAttr}${p.budgetIdAttr}${p.timestampAttr}${p.reimbursementAttr}${p.categoryAttr}${p.netAmountAttr}${p.budgetNameAttr}>
    <summary class="txn-summary">
      <div class="expand-summary txn-summary-content">
        <span>${virtualBadge}${escapeHtml(txn.description)}</span>
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

  return `<details class="expand-row txn-row normalized-group"${p.txnIdAttr}${p.amountAttr}${p.budgetIdAttr}${p.timestampAttr}${p.reimbursementAttr}${p.categoryAttr}${p.netAmountAttr}${p.budgetNameAttr}>
    <summary class="txn-summary">
      <div class="expand-summary txn-summary-content">
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

/**
 * Resolve a budget id to its name for chart serialization, degrading an unknown
 * id to `null` rather than throwing.
 *
 * A scroll-loaded transaction can reference a budget added after the
 * hydration-time `budgetIdToName` map was built. The chart is a derived view,
 * so it treats such a transaction as unbudgeted instead of aborting
 * serialization (#578). The editable table path (`buildRowParts`) stays strict
 * and still throws on an unknown id: silently degrading it to unbudgeted there
 * would misrepresent a transaction the user edits.
 */
function resolveBudgetName(budgetId: string | null, budgetIdToName: Map<string, string>): string | null {
  if (budgetId === null) return null;
  return budgetIdToName.get(budgetId) ?? null;
}

export function serializeChartTransactions(transactions: Transaction[], budgetIdToName: Map<string, string>): SerializedChartTransaction[] {
  return transactions
    .filter(t => t.normalizedId === null || t.normalizedPrimary)
    .map(t => ({
      category: t.category,
      amount: t.amount,
      reimbursement: t.reimbursement,
      timestampMs: t.timestamp ? t.timestamp.toMillis() : null,
      budgetName: resolveBudgetName(t.budget, budgetIdToName),
    }));
}

/**
 * Render a list of transactions as HTML row strings, grouping normalized transactions.
 * `getBalance` returns the budget balance for a transaction ID, or null if unavailable.
 */
export function renderTransactionRows(
  transactions: Transaction[],
  groupName: string,
  editable: boolean,
  budgetIdToName: Map<string, string>,
  getBalance: (id: string) => number | null = () => null,
): string {
  const normalizedGroups = new Map<string, Transaction[]>();
  for (const txn of transactions) {
    if (txn.normalizedId !== null) {
      const group = normalizedGroups.get(txn.normalizedId);
      if (group) group.push(txn);
      else normalizedGroups.set(txn.normalizedId, [txn]);
    }
  }

  const seenGroups = new Set<string>();
  return transactions
    .flatMap((txn) => {
      if (txn.normalizedId === null) {
        return renderRow({ txn, groupName, editable, budgetIdToName, balance: getBalance(txn.id) });
      }
      if (seenGroups.has(txn.normalizedId)) return [];
      seenGroups.add(txn.normalizedId);
      const members = normalizedGroups.get(txn.normalizedId)!;
      const primary = members.find(t => t.normalizedPrimary);
      if (!primary) {
        // The group's single primary is in another scroll batch; that batch renders
        // the canonical group row. Non-primary duplicates are hidden everywhere else
        // (chart, balance, income), so suppress these orphan members here rather than
        // throwing a fatal DataIntegrityError that kills the table / disconnects
        // infinite scroll (#1266).
        return [];
      }
      return renderNormalizedGroup({ primary, members, groupName, editable, budgetIdToName, balance: getBalance(primary.id) });
    })
    .join("\n");
}

export function compareByTimestampDesc(a: Transaction, b: Transaction): number {
  if (!a.timestamp && !b.timestamp) return 0;
  if (!a.timestamp) return 1;
  if (!b.timestamp) return -1;
  return b.timestamp.toMillis() - a.timestamp.toMillis();
}

