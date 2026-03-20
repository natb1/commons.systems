import { escapeHtml } from "@commons-systems/htmlutil";
import { type RenderPageOptions, renderPageNotices, renderLoadError } from "./render-options.js";
import type { Statement } from "../firestore.js";
import { formatCurrency } from "../format.js";
import { computeAggregateTrend, computeNetWorth, type AggregatePoint, type NetWorthPoint, type BalanceDivergence } from "../balance.js";

interface AccountRow {
  institution: string;
  account: string;
  mostRecentTimestamp: number;
  balance: number | null;
}

function buildAccountRows(statements: Statement[]): AccountRow[] {
  // Find latest statement per (institution, account) by comparing period strings (YYYY-MM format, zero-padded, so lexicographic order equals chronological order)
  const latestStatements = new Map<string, Statement>();
  for (const stmt of statements) {
    const key = `${stmt.institution}\0${stmt.account}`;
    const existing = latestStatements.get(key);
    if (!existing || stmt.period > existing.period) {
      latestStatements.set(key, stmt);
    }
  }

  const rows: AccountRow[] = [];
  for (const [, stmt] of latestStatements) {
    rows.push({
      institution: stmt.institution,
      account: stmt.account,
      mostRecentTimestamp: stmt.lastTransactionDate?.toMillis() ?? 0,
      balance: stmt.balance,
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
    return `<tr>
      <td>${escapeHtml(row.institution)}</td>
      <td>${escapeHtml(row.account)}</td>
      <td>${escapeHtml(formatDate(row.mostRecentTimestamp))}</td>
      <td>${balanceCell}</td>
    </tr>`;
  }).join("\n");

  return `<table id="accounts-table">
    <thead>
      <tr>
        <th>Institution</th>
        <th>Account</th>
        <th>Most recent transaction</th>
        <th>Balance</th>
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

function renderDivergenceWarning(divergences: BalanceDivergence[]): string {
  if (divergences.length === 0) return "";
  const rows = divergences.map(d =>
    `<li>${escapeHtml(d.institution)} ${escapeHtml(d.account)} (${escapeHtml(d.period)}): statement ${escapeHtml(formatCurrency(d.expected))}, derived ${escapeHtml(formatCurrency(d.derived))}</li>`
  ).join("\n");
  return `<div id="balance-divergence-warning" class="divergence-warning">
    <p>Balance verification found discrepancies between statement balances and transaction-derived balances:</p>
    <ul>${rows}</ul>
  </div>`;
}

function renderChartContainers(
  aggregateTrend: AggregatePoint[],
  netWorthPoints: NetWorthPoint[],
  divergences: BalanceDivergence[],
): string {
  return `${renderDivergenceWarning(divergences)}
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
    const rows = buildAccountRows(statements);
    tableHtml = renderAccountsTable(rows);

    try {
      const aggregateTrend = computeAggregateTrend(periods, transactions);
      const trendWeeks = aggregateTrend.map(p => ({ label: p.weekLabel, ms: p.weekMs }));
      const { points: netWorthPoints, divergences } = computeNetWorth(transactions, statements, trendWeeks);
      chartHtml = renderChartContainers(aggregateTrend, netWorthPoints, divergences);
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
