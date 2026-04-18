import { escapeHtml } from "@commons-systems/htmlutil";
import { type RenderPageOptions, renderPageNotices, renderLoadError } from "./render-options.js";
import type { StatementItem, Transaction, Statement, ReconciliationNote } from "../firestore.js";
import { formatCurrency } from "../format.js";
import { accountKey } from "../balance.js";
import {
  reconcile,
  isAged,
  type ReconciliationMatch,
  type UnmatchedStatementItem,
  type UnmatchedTransaction,
} from "../reconciliation.js";

const DEFAULT_TOLERANCE_DAYS = 3;
const MIN_TOLERANCE_DAYS = 0;
const MAX_TOLERANCE_DAYS = 30;

interface ReconcileQuery {
  institution: string | null;
  account: string | null;
  period: string | null;
  toleranceDays: number;
}

export function parseReconcileQuery(search: string): ReconcileQuery {
  const params = new URLSearchParams(search);
  const raw = params.get("tolerance");
  const parsed = raw === null ? Number.NaN : Number(raw);
  const toleranceDays = Number.isFinite(parsed) && parsed >= MIN_TOLERANCE_DAYS && parsed <= MAX_TOLERANCE_DAYS
    ? parsed
    : DEFAULT_TOLERANCE_DAYS;
  return {
    institution: params.get("institution"),
    account: params.get("account"),
    period: params.get("period"),
    toleranceDays,
  };
}

function availableAccounts(statements: Statement[]): Map<string, { institution: string; account: string }> {
  const result = new Map<string, { institution: string; account: string }>();
  for (const s of statements) {
    result.set(accountKey(s.institution, s.account), { institution: s.institution, account: s.account });
  }
  return result;
}

function availablePeriods(statements: Statement[], institution: string, account: string): string[] {
  const periods = new Set<string>();
  for (const s of statements) {
    if (s.institution === institution && s.account === account) periods.add(s.period);
  }
  return [...periods].sort().reverse();
}

function formatDateShort(ms: number): string {
  return new Date(ms).toLocaleDateString();
}

function renderControls(query: ReconcileQuery, statements: Statement[]): string {
  const accounts = [...availableAccounts(statements).values()].sort((a, b) => {
    const ak = `${a.institution}\t${a.account}`;
    const bk = `${b.institution}\t${b.account}`;
    return ak.localeCompare(bk);
  });

  const accountOptions = accounts.map((a) => {
    const value = `${a.institution}\t${a.account}`;
    const selected = a.institution === query.institution && a.account === query.account ? " selected" : "";
    return `<option value="${escapeHtml(value)}"${selected}>${escapeHtml(a.institution)} — ${escapeHtml(a.account)}</option>`;
  }).join("");

  const periods = query.institution && query.account
    ? availablePeriods(statements, query.institution, query.account)
    : [];
  const periodOptions = periods.map((p) => {
    const selected = p === query.period ? " selected" : "";
    return `<option value="${escapeHtml(p)}"${selected}>${escapeHtml(p)}</option>`;
  }).join("");

  return `<div id="reconcile-controls" class="reconcile-controls">
    <label>Account:
      <select id="reconcile-account-select">
        <option value=""${query.institution ? "" : " selected"}>Select account…</option>
        ${accountOptions}
      </select>
    </label>
    <label>Period:
      <select id="reconcile-period-select"${periods.length === 0 ? " disabled" : ""}>
        ${periods.length === 0 ? '<option value="">—</option>' : periodOptions}
      </select>
    </label>
    <label>Date tolerance (days):
      <input type="number"
             id="reconcile-tolerance-input"
             min="${MIN_TOLERANCE_DAYS}"
             max="${MAX_TOLERANCE_DAYS}"
             value="${query.toleranceDays}">
    </label>
  </div>`;
}

function renderMatchedColumn(matches: ReconciliationMatch[]): string {
  if (matches.length === 0) {
    return `<p class="reconcile-empty">No matches yet.</p>`;
  }
  const rows = matches.map((m) => {
    const itemDate = formatDateShort(m.item.timestamp.toMillis());
    const txnDate = m.txn.timestamp ? formatDateShort(m.txn.timestamp.toMillis()) : "";
    const confirmBtn = m.matchType === "suggested"
      ? `<button class="reconcile-confirm"
                 data-txn-id="${escapeHtml(m.txn.id)}"
                 data-statement-item-id="${escapeHtml(m.item.statementItemId)}">Confirm match</button>`
      : "";
    return `<li class="reconcile-match reconcile-match-${m.matchType}">
      <div class="reconcile-match-row">
        <span class="reconcile-match-badge">${m.matchType}</span>
        <div class="reconcile-match-item">
          <span class="reconcile-date">${escapeHtml(itemDate)}</span>
          <span class="reconcile-description">${escapeHtml(m.item.description)}</span>
          <span class="reconcile-amount">${escapeHtml(formatCurrency(m.item.amount))}</span>
        </div>
        <div class="reconcile-match-txn">
          <span class="reconcile-date">${escapeHtml(txnDate)}</span>
          <span class="reconcile-description">${escapeHtml(m.txn.description)}</span>
          <span class="reconcile-amount">${escapeHtml(formatCurrency(-m.txn.amount))}</span>
        </div>
        ${confirmBtn}
      </div>
    </li>`;
  }).join("");
  return `<ul class="reconcile-list">${rows}</ul>`;
}

function classificationSelect(entityType: "statementItem" | "transaction", entityId: string, existing?: ReconciliationNote): string {
  const current = existing?.classification ?? "";
  const opt = (value: string, label: string) =>
    `<option value="${value}"${current === value ? " selected" : ""}>${label}</option>`;
  return `<select class="reconcile-classification"
                  data-entity-type="${entityType}"
                  data-entity-id="${escapeHtml(entityId)}">
    <option value=""${current === "" ? " selected" : ""}>Uncategorized</option>
    ${opt("timing", "Timing")}
    ${opt("missing_entry", "Missing entry")}
    ${opt("discrepancy", "Discrepancy")}
  </select>`;
}

function noteInput(entityType: "statementItem" | "transaction", entityId: string, existing?: ReconciliationNote): string {
  const value = existing?.note ?? "";
  return `<input type="text"
                 class="reconcile-note"
                 data-entity-type="${entityType}"
                 data-entity-id="${escapeHtml(entityId)}"
                 placeholder="Note"
                 value="${escapeHtml(value)}">`;
}

function renderUnmatchedItemsColumn(items: UnmatchedStatementItem[], notes: Map<string, ReconciliationNote>): string {
  if (items.length === 0) {
    return `<p class="reconcile-empty">No unmatched statement items.</p>`;
  }
  const rows = items.map(({ item, ageDays }) => {
    const date = formatDateShort(item.timestamp.toMillis());
    const existing = notes.get(`statementItem_${item.statementItemId}`);
    const aging = isAged(ageDays)
      ? `<span class="reconcile-aging" data-age-days="${ageDays}">${ageDays}d</span>`
      : "";
    return `<li class="reconcile-unmatched" data-statement-item-id="${escapeHtml(item.statementItemId)}">
      <div class="reconcile-unmatched-row">
        <span class="reconcile-date">${escapeHtml(date)}</span>
        <span class="reconcile-description">${escapeHtml(item.description)}</span>
        <span class="reconcile-amount">${escapeHtml(formatCurrency(item.amount))}</span>
        ${aging}
      </div>
      <div class="reconcile-classification-row">
        ${classificationSelect("statementItem", item.statementItemId, existing)}
        ${noteInput("statementItem", item.statementItemId, existing)}
      </div>
    </li>`;
  }).join("");
  return `<ul class="reconcile-list">${rows}</ul>`;
}

function renderUnmatchedTxnsColumn(txns: UnmatchedTransaction[], notes: Map<string, ReconciliationNote>): string {
  if (txns.length === 0) {
    return `<p class="reconcile-empty">No unmatched transactions.</p>`;
  }
  const rows = txns.map(({ txn, ageDays }) => {
    const date = txn.timestamp ? formatDateShort(txn.timestamp.toMillis()) : "";
    const existing = notes.get(`transaction_${txn.id}`);
    const aging = txn.timestamp && isAged(ageDays)
      ? `<span class="reconcile-aging" data-age-days="${ageDays}">${ageDays}d</span>`
      : "";
    return `<li class="reconcile-unmatched" data-txn-id="${escapeHtml(txn.id)}">
      <div class="reconcile-unmatched-row">
        <span class="reconcile-date">${escapeHtml(date)}</span>
        <span class="reconcile-description">${escapeHtml(txn.description)}</span>
        <span class="reconcile-amount">${escapeHtml(formatCurrency(-txn.amount))}</span>
        ${aging}
      </div>
      <div class="reconcile-classification-row">
        ${classificationSelect("transaction", txn.id, existing)}
        ${noteInput("transaction", txn.id, existing)}
      </div>
    </li>`;
  }).join("");
  return `<ul class="reconcile-list">${rows}</ul>`;
}

function filterByAccountAndPeriod<T extends { institution: string; account: string; period?: string; timestamp?: { toMillis(): number } | null }>(
  records: T[],
  institution: string,
  account: string,
  period: string,
): T[] {
  return records.filter((r) => {
    if (r.institution !== institution || r.account !== account) return false;
    if (r.period !== undefined) return r.period === period;
    return true;
  });
}

function transactionsForAccountPeriod(
  txns: Transaction[],
  institution: string,
  account: string,
  period: string,
): Transaction[] {
  return txns.filter((t) => {
    if (t.institution !== institution || t.account !== account) return false;
    if (t.timestamp === null) return false;
    const d = t.timestamp.toDate();
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    return key === period;
  });
}

export interface RenderReconcileContext {
  statementItems: StatementItem[];
  transactions: Transaction[];
  statements: Statement[];
  notes: ReconciliationNote[];
  query: ReconcileQuery;
  nowMs?: number;
}

/** Pure HTML renderer, extracted for testability. */
export function renderReconcileHtml(ctx: RenderReconcileContext): string {
  const { statementItems, transactions, statements, notes, query } = ctx;

  const controls = renderControls(query, statements);

  if (!query.institution || !query.account || !query.period) {
    return `<div id="reconcile-container">
      ${controls}
      <p class="reconcile-empty">Select an account and period to reconcile.</p>
    </div>`;
  }

  const scopedItems = filterByAccountAndPeriod(statementItems, query.institution, query.account, query.period);
  const scopedTxns = transactionsForAccountPeriod(transactions, query.institution, query.account, query.period);
  const result = reconcile(scopedItems, scopedTxns, query.toleranceDays, ctx.nowMs);

  const notesMap = new Map<string, ReconciliationNote>();
  for (const n of notes) notesMap.set(`${n.entityType}_${n.entityId}`, n);

  return `<div id="reconcile-container">
    ${controls}
    <section class="reconcile-columns">
      <div class="reconcile-column reconcile-column-matched">
        <h3>Matched (${result.matched.length})</h3>
        ${renderMatchedColumn(result.matched)}
      </div>
      <div class="reconcile-column reconcile-column-unmatched-items">
        <h3>Unmatched statement items (${result.unmatchedItems.length})</h3>
        ${renderUnmatchedItemsColumn(result.unmatchedItems, notesMap)}
      </div>
      <div class="reconcile-column reconcile-column-unmatched-txns">
        <h3>Unmatched transactions (${result.unmatchedTransactions.length})</h3>
        ${renderUnmatchedTxnsColumn(result.unmatchedTransactions, notesMap)}
      </div>
    </section>
  </div>`;
}

export async function renderAccountsReconcile(options: RenderPageOptions): Promise<string> {
  const { dataSource } = options;
  const query = parseReconcileQuery(typeof location !== "undefined" ? location.search : "");

  let body: string;
  try {
    const [statementItems, transactions, statements, notes] = await Promise.all([
      dataSource.getStatementItems(),
      dataSource.getTransactions(),
      dataSource.getStatements(),
      dataSource.getReconciliationNotes(),
    ]);
    body = renderReconcileHtml({
      statementItems,
      transactions,
      statements,
      notes,
      query,
    });
  } catch (error) {
    body = renderLoadError(error, "reconcile-error");
  }

  return `
    <h2>Reconcile account</h2>
    ${renderPageNotices(options, "reconciliation")}
    ${body}
  `;
}
