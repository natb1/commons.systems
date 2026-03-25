import { escapeHtml } from "@commons-systems/htmlutil";
import { type RenderPageOptions, renderPageNotices, renderLoadError } from "./render-options.js";
import type { Transaction, Statement } from "../firestore.js";
import { formatCurrency } from "../format.js";
import { accountKey, splitAccountKey, computeAggregateTrend, computeNetWorth, computeCashFlow, computeDerivedBalances, type AggregatePoint, type NetWorthPoint, type CashFlowPoint, type DerivedAccountBalance } from "../balance.js";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";

interface AccountRow {
  institution: string;
  account: string;
  mostRecentTimestamp: number | null;
  balance: number | null;
  derivedBalance: number | null;
  hasDiscrepancy: boolean;
  virtual: boolean;
}

function buildAccountRows(
  transactions: Transaction[],
  statements: Statement[],
  derivedBalances: DerivedAccountBalance[],
): AccountRow[] {
  // Compute max transaction timestamp per account from transactions
  const txnMaxTs = new Map<string, number>();
  for (const txn of transactions) {
    const k = accountKey(txn.institution, txn.account);
    const ts = txn.timestamp?.toMillis() ?? 0;
    const existing = txnMaxTs.get(k);
    if (existing === undefined || ts > existing) {
      txnMaxTs.set(k, ts);
    }
  }

  // Find latest statement per (institution, account) by comparing period strings (YYYY-MM format, zero-padded, so lexicographic order equals chronological order)
  const latestStatements = new Map<string, Statement>();
  for (const stmt of statements) {
    const k = accountKey(stmt.institution, stmt.account);
    const existing = latestStatements.get(k);
    if (!existing || stmt.period > existing.period) {
      latestStatements.set(k, stmt);
    }
  }

  // Index derived balances by account key
  const derivedByAccount = new Map<string, DerivedAccountBalance>();
  for (const db of derivedBalances) {
    derivedByAccount.set(accountKey(db.institution, db.account), db);
  }

  // Detect virtual accounts: all statements for the account are virtual
  const virtualAccounts = new Set<string>();
  const accountStmtCounts = new Map<string, { total: number; virtual: number }>();
  for (const stmt of statements) {
    const k = accountKey(stmt.institution, stmt.account);
    const counts = accountStmtCounts.get(k) ?? { total: 0, virtual: 0 };
    counts.total++;
    if (stmt.virtual) counts.virtual++;
    accountStmtCounts.set(k, counts);
  }
  for (const [k, counts] of accountStmtCounts) {
    if (counts.total > 0 && counts.total === counts.virtual) virtualAccounts.add(k);
  }

  // Collect all account keys from both transactions and statements
  const allKeys = new Set<string>([...txnMaxTs.keys(), ...latestStatements.keys()]);

  const rows: AccountRow[] = [];
  for (const k of allKeys) {
    const stmt = latestStatements.get(k);
    const derived = derivedByAccount.get(k);
    const [institution, account] = splitAccountKey(k);
    // Use transaction max timestamp if available, otherwise fall back to statement lastTransactionDate
    const maxTs = txnMaxTs.get(k) ?? stmt?.lastTransactionDate?.toMillis() ?? null;
    rows.push({
      institution,
      account,
      mostRecentTimestamp: maxTs,
      balance: stmt ? stmt.balance : null,
      derivedBalance: derived ? derived.derivedBalance : null,
      hasDiscrepancy: derived ? Math.abs(derived.discrepancy) > 0.01 : false,
      virtual: virtualAccounts.has(k),
    });
  }

  rows.sort((a, b) => (a.mostRecentTimestamp ?? 0) - (b.mostRecentTimestamp ?? 0));
  return rows;
}

function formatDate(ms: number | null): string {
  if (ms === null) return "";
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
    const virtualBadge = row.virtual ? ' <span class="virtual-badge">virtual</span>' : "";
    return `<tr${rowClass}>
      <td>${escapeHtml(row.institution)}</td>
      <td>${escapeHtml(row.account)}${virtualBadge}</td>
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

function serializeData(data: readonly AggregatePoint[] | readonly NetWorthPoint[] | readonly CashFlowPoint[]): string {
  return escapeHtml(JSON.stringify(data));
}

function renderDivergenceWarning(derivedBalances: DerivedAccountBalance[]): string {
  const discrepancies = derivedBalances.filter(d => Math.abs(d.discrepancy) > 0.01);
  if (discrepancies.length === 0) return "";
  const rows = discrepancies.map(d =>
    `<li>${escapeHtml(d.institution)} ${escapeHtml(d.account)} (${escapeHtml(d.earliestPeriod)}\u2192${escapeHtml(d.latestPeriod)}): ${escapeHtml(formatCurrency(d.discrepancy))}</li>`
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
  const cashFlowPoints = computeCashFlow(netWorthPoints);
  return `${renderDivergenceWarning(derivedBalances)}
    <div id="accounts-chart-controls">
      <label>Jump to: <input type="date" id="accounts-date-picker"></label>
    </div>
    <div id="accounts-trend-chart" data-aggregate-trend="${serializeData(aggregateTrend)}"></div>
    <div id="accounts-net-worth-chart" data-net-worth="${serializeData(netWorthPoints)}"></div>
    <div id="accounts-cash-flow-chart" data-cash-flow="${serializeData(cashFlowPoints)}"></div>`;
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
      if (chartError instanceof TypeError || chartError instanceof ReferenceError
          || chartError instanceof DataIntegrityError || chartError instanceof RangeError) {
        throw chartError;
      }
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
