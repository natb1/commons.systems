import { escapeHtml } from "@commons-systems/htmlutil";
import { type RenderPageOptions, renderPageNotices, renderLoadError } from "./render-options.js";
import type { Account, JournalEntry, JournalLeg, ReconciliationEvent, Statement, StatementItem } from "../firestore.js";
import { formatCurrency } from "../format.js";
import { accountDocId } from "../entities/account.js";
import { buildReconcileRows, clearedBalance, isAged, ADJUSTMENT_SUSPENSE_ACCOUNT_ID } from "../reconciliation.js";
import { suggestClearedLegs, SUGGESTION_TOLERANCE_DAYS } from "../reconcile-hints.js";

interface ReconcileQuery {
  institution: string | null;
  account: string | null;
  period: string | null;
}

export function parseReconcileQuery(search: string): ReconcileQuery {
  const params = new URLSearchParams(search);
  return {
    institution: params.get("institution"),
    account: params.get("account"),
    period: params.get("period"),
  };
}

/** Parse and validate a `YYYY-MM` reconcile period into its year and 1-based month. */
export function parseReconcilePeriod(period: string): { year: number; month: number } {
  const [yearRaw, monthRaw] = period.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`Invalid reconcile period: ${period}`);
  }
  return { year, month };
}

/** Inclusive-start, exclusive-end UTC millisecond bounds for a `YYYY-MM` period. */
function periodBounds(period: string): { startMs: number; endMs: number } {
  const { year, month } = parseReconcilePeriod(period);
  return {
    startMs: Date.UTC(year, month - 1, 1),
    endMs: Date.UTC(year, month, 1),
  };
}

function availableAccounts(accounts: Account[]): { institution: string; account: string }[] {
  return accounts
    .map((a) => ({ institution: a.institution, account: a.account }))
    .sort((a, b) => {
      const ak = `${a.institution}\t${a.account}`;
      const bk = `${b.institution}\t${b.account}`;
      return ak.localeCompare(bk);
    });
}

function availablePeriods(legs: JournalLeg[], accountId: string): string[] {
  const periods = new Set<string>();
  for (const leg of legs) {
    if (leg.accountId !== accountId) continue;
    const d = leg.timestamp.toDate();
    periods.add(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return [...periods].sort().reverse();
}

function formatDateShort(ms: number): string {
  return new Date(ms).toLocaleDateString();
}

function renderControls(query: ReconcileQuery, accounts: Account[], journalLegs: JournalLeg[]): string {
  const accountOptions = availableAccounts(accounts).map((a) => {
    const value = `${a.institution}\t${a.account}`;
    const selected = a.institution === query.institution && a.account === query.account ? " selected" : "";
    return `<option value="${escapeHtml(value)}"${selected}>${escapeHtml(a.institution)} — ${escapeHtml(a.account)}</option>`;
  }).join("");

  const periods = query.institution && query.account
    ? availablePeriods(journalLegs, accountDocId(query.institution, query.account))
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
  </div>`;
}

/**
 * The most recent `Statement` for the account+period, by `balanceDate` then `period`.
 * Returns `null` when no statement exists — an expected optional, not an error.
 */
function statementEndingBalance(
  statements: Statement[],
  institution: string,
  account: string,
  period: string,
): number | null {
  const matching = statements.filter(
    (s) => s.institution === institution && s.account === account && s.period === period,
  );
  if (matching.length === 0) return null;
  const mostRecent = matching.reduce((best, s) =>
    (s.balanceDate ?? "") > (best.balanceDate ?? "") ? s : best,
  );
  return mostRecent.balance;
}

function renderLegList(rows: ReturnType<typeof buildReconcileRows>, suggestedIds: Set<string>): string {
  if (rows.length === 0) {
    return `<p class="reconcile-empty">No journal legs for this account and period.</p>`;
  }
  const items = rows.map((row) => {
    const { leg } = row;
    const reconciled = leg.reconciledEventId !== null || leg.reconciledAt !== null;
    const suggested = !leg.cleared && !reconciled && suggestedIds.has(leg.id);
    const checkedAttr = leg.cleared ? " checked" : "";
    const disabledAttr = reconciled ? " disabled" : "";
    const aging = !leg.cleared && isAged(row.ageDays)
      ? ` <span class="reconcile-aging" data-age-days="${Math.floor(row.ageDays)}">${Math.floor(row.ageDays)}d</span>`
      : "";
    const suggestedBadge = suggested
      ? ` <span class="reconcile-suggested-badge">Bank reported</span>`
      : "";
    const suggestedClass = suggested ? " reconcile-suggested" : "";
    const suggestedAttr = suggested ? " data-suggested" : "";
    return `<li class="reconcile-leg${suggestedClass}" data-leg-id="${escapeHtml(leg.id)}" data-signed-amount="${row.signedAmount}"${suggestedAttr}>
      <label class="reconcile-cleared">
        <input type="checkbox" class="reconcile-cleared-checkbox"${checkedAttr}${disabledAttr}>
      </label>
      <span class="reconcile-date">${escapeHtml(formatDateShort(leg.timestamp.toMillis()))}</span>
      <span class="reconcile-description">${escapeHtml(row.description)}${aging}${suggestedBadge}</span>
      <span class="reconcile-amount">${escapeHtml(formatCurrency(row.signedAmount))}</span>
      <span class="reconcile-running-balance">${escapeHtml(formatCurrency(row.runningBalance))}</span>
    </li>`;
  }).join("");
  return `<ul id="reconcile-leg-list" class="reconcile-list">${items}</ul>`;
}

function renderHeader(cleared: number, statementBalance: number | null, hasSuggestions: boolean): string {
  const statementRow = statementBalance !== null
    ? `<span class="reconcile-statement-balance">Statement-ending balance: ${escapeHtml(formatCurrency(statementBalance))}</span>`
    : "";
  const difference = statementBalance !== null
    ? `<span class="reconcile-difference">Difference: ${escapeHtml(formatCurrency(cleared - statementBalance))}</span>`
    : "";
  const confirmAllButton = hasSuggestions
    ? `<button id="reconcile-confirm-all" type="button">Confirm all suggestions</button>`
    : "";
  return `<div id="reconcile-header" class="reconcile-header">
    <span class="reconcile-cleared-balance">Cleared balance: ${escapeHtml(formatCurrency(cleared))}</span>
    ${statementRow}
    ${difference}
    ${confirmAllButton}
    <button id="reconcile-open-dialog" type="button">Reconcile</button>
  </div>`;
}

function renderDialog(statementBalance: number | null): string {
  const defaultValue = statementBalance !== null ? String(statementBalance) : "";
  return `<dialog id="reconcile-dialog">
    <form method="dialog" id="reconcile-dialog-form">
      <label>Bank's cleared balance:
        <input type="number"
               id="reconcile-bank-balance-input"
               step="0.01"
               value="${escapeHtml(defaultValue)}">
      </label>
      <p id="reconcile-difference-display" class="reconcile-difference-display"></p>
      <div id="reconcile-mismatch-actions" hidden>
        <button type="button" id="reconcile-adjust-selections">Adjust cleared selections</button>
        <button type="button" id="reconcile-create-adjustment">Create adjustment entry</button>
        <small class="reconcile-escape-hatch-note">Use only for small, unexplained differences.</small>
      </div>
      <div class="reconcile-dialog-actions">
        <button type="submit" id="reconcile-submit">Reconcile</button>
        <button type="button" id="reconcile-cancel">Cancel</button>
      </div>
    </form>
  </dialog>`;
}

function renderPastReconciliations(events: ReconciliationEvent[], institution: string, account: string): string {
  const matching = events
    .filter((e) => e.institution === institution && e.account === account)
    .sort((a, b) => b.reconciledThroughDate.toMillis() - a.reconciledThroughDate.toMillis());
  if (matching.length === 0) {
    return `<section id="reconcile-past" class="reconcile-past">
      <h3>Past reconciliations</h3>
      <p class="reconcile-empty">No past reconciliations.</p>
    </section>`;
  }
  const rows = matching.map((e) => {
    const through = formatDateShort(e.reconciledThroughDate.toMillis());
    const adjustmentIndicator = Math.round(e.adjustment * 100) !== 0
      ? `<span class="reconcile-adjustment-indicator" data-adjustment-entry-id="${escapeHtml(e.adjustmentEntryId ?? "")}">${escapeHtml(formatCurrency(e.adjustment))}</span>`
      : "";
    return `<li class="reconcile-past-event" data-event-id="${escapeHtml(e.id)}">
      <span class="reconcile-date">${escapeHtml(through)}</span>
      <span class="reconcile-amount">${escapeHtml(formatCurrency(e.clearedBalance))}</span>
      ${adjustmentIndicator}
    </li>`;
  }).join("");
  return `<section id="reconcile-past" class="reconcile-past">
    <h3>Past reconciliations</h3>
    <ul class="reconcile-list">${rows}</ul>
  </section>`;
}

export interface RenderReconcileContext {
  journalLegs: JournalLeg[];
  journalEntries: JournalEntry[];
  reconciliationEvents: ReconciliationEvent[];
  accounts: Account[];
  statements: Statement[];
  statementItems: StatementItem[];
  query: ReconcileQuery;
  nowMs?: number;
}

/** Pure HTML renderer, extracted for testability. */
export function renderReconcileHtml(ctx: RenderReconcileContext): string {
  const { journalLegs, journalEntries, reconciliationEvents, accounts, statements, statementItems, query } = ctx;

  const controls = renderControls(query, accounts, journalLegs);

  if (!query.institution || !query.account || !query.period) {
    return `<div id="reconcile-container">
      ${controls}
      <p class="reconcile-empty">Select an account and period to reconcile.</p>
    </div>`;
  }

  const accountId = accountDocId(query.institution, query.account);
  const account = accounts.find((a) => a.id === accountId);
  if (account === undefined) {
    throw new Error(`Reconcile account ${accountId} not found`);
  }

  const { startMs, endMs } = periodBounds(query.period);
  const filteredLegs = journalLegs.filter((leg) => {
    if (leg.accountId !== accountId) return false;
    const ms = leg.timestamp.toMillis();
    return ms >= startMs && ms < endMs;
  });

  const filteredStatementItems = statementItems.filter(
    (item) =>
      item.institution === query.institution &&
      item.account === query.account &&
      item.period === query.period,
  );

  const suggestedIds = suggestClearedLegs(filteredLegs, filteredStatementItems, SUGGESTION_TOLERANCE_DAYS);

  const entriesById = new Map<string, JournalEntry>();
  for (const entry of journalEntries) entriesById.set(entry.id, entry);

  const rows = buildReconcileRows(filteredLegs, entriesById, account.accountType, ctx.nowMs);
  const cleared = clearedBalance(filteredLegs, account.accountType);
  const statementBalance = statementEndingBalance(statements, query.institution, query.account, query.period);
  const statementAttr = statementBalance !== null ? ` data-statement-balance="${statementBalance}"` : "";
  const accountTypeAttr = ` data-account-type="${escapeHtml(account.accountType)}"`;
  const suspenseAttr = accounts.some((a) => a.id === ADJUSTMENT_SUSPENSE_ACCOUNT_ID)
    ? ` data-suspense-account-id="${escapeHtml(ADJUSTMENT_SUSPENSE_ACCOUNT_ID)}"`
    : "";

  return `<div id="reconcile-container"${statementAttr}${accountTypeAttr}${suspenseAttr}>
    ${controls}
    ${renderHeader(cleared, statementBalance, suggestedIds.size > 0)}
    ${renderLegList(rows, suggestedIds)}
    ${renderDialog(statementBalance)}
    ${renderPastReconciliations(reconciliationEvents, query.institution, query.account)}
  </div>`;
}

export async function renderAccountsReconcile(options: RenderPageOptions): Promise<string> {
  const { dataSource } = options;
  const query = parseReconcileQuery(typeof location !== "undefined" ? location.search : "");

  let body: string;
  try {
    const [journalLegs, journalEntries, reconciliationEvents, accounts, statements, statementItems] = await Promise.all([
      dataSource.getJournalLegs(),
      dataSource.getJournalEntries(),
      dataSource.getReconciliationEvents(),
      dataSource.getAccounts(),
      dataSource.getStatements(),
      dataSource.getStatementItems(),
    ]);
    body = renderReconcileHtml({
      journalLegs,
      journalEntries,
      reconciliationEvents,
      accounts,
      statements,
      statementItems,
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
