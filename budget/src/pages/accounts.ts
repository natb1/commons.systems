import { escapeHtml } from "@commons-systems/htmlutil";
import { type RenderPageOptions, renderPageNotices, renderLoadError } from "./render-options.js";
import type { Transaction, Statement } from "../firestore.js";
import { formatCurrency } from "../format.js";
import { computeAggregateTrend, computeNetWorth, computeDerivedBalances, type AggregatePoint, type NetWorthPoint, type DerivedAccountBalance } from "../balance.js";

interface AccountRow {
  institution: string;
  account: string;
  mostRecentTimestamp: number;
  balance: number | null;
  derivedBalance: number | null;
  hasDiscrepancy: boolean;
}

function buildAccountRows(
  transactions: Transaction[],
  statements: Statement[],
  derivedBalances: DerivedAccountBalance[],
): AccountRow[] {
  const accountMap = new Map<string, { institution: string; account: string; maxTs: number }>();
  for (const txn of transactions) {
    const key = `${txn.institution}\0${txn.account}`;
    const ts = txn.timestamp?.toMillis() ?? 0;
    const existing = accountMap.get(key);
    if (!existing) {
      accountMap.set(key, { institution: txn.institution, account: txn.account, maxTs: ts });
    } else if (ts > existing.maxTs) {
      existing.maxTs = ts;
    }
  }

  // Find latest statement per (institution, account) by comparing period strings (YYYY-MM format, zero-padded, so lexicographic order equals chronological order)
  const latestStatements = new Map<string, Statement>();
  for (const stmt of statements) {
    const key = `${stmt.institution}\0${stmt.account}`;
    const existing = latestStatements.get(key);
    if (!existing || stmt.period > existing.period) {
      latestStatements.set(key, stmt);
    }
  }

  // Index derived balances by account key
  const derivedByAccount = new Map<string, DerivedAccountBalance>();
  for (const db of derivedBalances) {
    derivedByAccount.set(`${db.institution}\0${db.account}`, db);
  }

  const rows: AccountRow[] = [];
  for (const [key, { institution, account, maxTs }] of accountMap) {
    const stmt = latestStatements.get(key);
    const derived = derivedByAccount.get(key);
    rows.push({
      institution,
      account,
      mostRecentTimestamp: maxTs,
      balance: stmt ? stmt.balance : null,
      derivedBalance: derived ? derived.derivedBalance : null,
      hasDiscrepancy: derived ? Math.abs(derived.discrepancy) > 0.01 : false,
    });
  }

  rows.sort((a, b) => a.mostRecentTimestamp - b.mostRecentTimestamp);
  return rows;
}

function formatDate(ms: number): string {
  if (ms === 0) return "";
  return new Date(ms).toLocaleDateString();
}

function renderAccountsTable(rows: AccountRow[]): string {
  if (rows.length === 0) {
    return "<p>No accounts found.</p>";
  }

  const tableRows = rows.map((row) => {
    const balanceCell = row.balance !== null ? escapeHtml(formatCurrency(row.balance)) : "";
    const derivedCell = row.derivedBalance !== null ? escapeHtml(formatCurrency(row.derivedBalance)) : "";
    const rowClass = row.hasDiscrepancy ? ' class="discrepancy"' : "";
    return `<tr${rowClass}>
      <td>${escapeHtml(row.institution)}</td>
      <td>${escapeHtml(row.account)}</td>
      <td>${escapeHtml(formatDate(row.mostRecentTimestamp))}</td>
      <td>${balanceCell}</td>
      <td>${derivedCell}</td>
    </tr>`;
  }).join("\n");

  return `<table id="accounts-table">
    <thead>
      <tr>
        <th>Institution</th>
        <th>Account</th>
        <th>Most recent transaction</th>
        <th>Balance</th>
        <th>Derived</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>`;
}

function serializeData(data: readonly AggregatePoint[] | readonly NetWorthPoint[]): string {
  return escapeHtml(JSON.stringify(data));
}

function renderDivergenceWarning(derivedBalances: DerivedAccountBalance[]): string {
  const discrepancies = derivedBalances.filter(d => Math.abs(d.discrepancy) > 0.01);
  if (discrepancies.length === 0) return "";
  const rows = discrepancies.map(d =>
    `<li>${escapeHtml(d.institution)} ${escapeHtml(d.account)} (${escapeHtml(d.earliestPeriod)}\u2192${escapeHtml(d.latestPeriod)}): statement ${escapeHtml(formatCurrency(d.statementBalance))}, derived ${escapeHtml(formatCurrency(d.derivedBalance))}</li>`
  ).join("\n");
  return `<div id="balance-divergence-warning" class="divergence-warning">
    <p>Balance verification found discrepancies between statement balances and transaction-derived balances:</p>
    <ul>${rows}</ul>
  </div>`;
}

function renderChartContainers(
  aggregateTrend: AggregatePoint[],
  netWorthPoints: NetWorthPoint[],
  derivedBalances: DerivedAccountBalance[],
): string {
  return `${renderDivergenceWarning(derivedBalances)}
    <div id="accounts-chart-controls">
      <label>Jump to: <input type="date" id="accounts-date-picker"></label>
    </div>
    <div id="accounts-trend-chart" data-aggregate-trend="${serializeData(aggregateTrend)}"></div>
    <div id="accounts-net-worth-chart" data-net-worth="${serializeData(netWorthPoints)}"></div>`;
}

export async function renderAccounts(options: RenderPageOptions): Promise<string> {
  const { dataSource } = options;

  let tableHtml: string;
  let chartHtml = "";
  try {
    const [transactions, statements, periods] = await Promise.all([
      dataSource.getTransactions()
        .catch((e) => { console.error("Failed to load transactions:", e); throw e; }),
      dataSource.getStatements()
        .catch((e) => { console.error("Failed to load statements:", e); throw e; }),
      dataSource.getBudgetPeriods()
        .catch((e) => { console.error("Failed to load budget periods:", e); throw e; }),
    ]);
    const derivedBalances = computeDerivedBalances(transactions, statements);
    const rows = buildAccountRows(transactions, statements, derivedBalances);
    tableHtml = renderAccountsTable(rows);

    try {
      const aggregateTrend = computeAggregateTrend(periods, transactions);
      const trendWeeks = aggregateTrend.map(p => ({ label: p.weekLabel, ms: p.weekMs }));
      const { points: netWorthPoints } = computeNetWorth(transactions, statements, trendWeeks);
      chartHtml = renderChartContainers(aggregateTrend, netWorthPoints, derivedBalances);
    } catch (chartError) {
      console.error("Failed to compute chart data:", chartError);
      chartHtml = renderLoadError(chartError, "chart-error");
    }
  } catch (error) {
    tableHtml = renderLoadError(error, "accounts-error");
  }

  return `
    <h2>Accounts</h2>
    ${renderPageNotices(options, "accounts")}
    ${chartHtml}
    ${tableHtml}
  `;
}
