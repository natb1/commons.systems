import { escapeHtml } from "@commons-systems/htmlutil";
import { type RenderPageOptions, renderPageNotices, renderLoadError } from "./render-options.js";
import type { Transaction, Statement } from "../firestore.js";
import { formatCurrency } from "../format.js";
import { accountKey, splitAccountKey, computeAggregateTrend, computeNetWorth, computeCashFlow, computeDerivedBalances, type AggregatePoint, type NetWorthPoint, type CashFlowPoint, type DerivedAccountBalance } from "../balance.js";
import { computeIncomeStatementReport, type IncomeStatementReport, type PeriodVariance, type VarianceRow, type CashFlowSummary } from "../income-statement.js";
import { classifyError } from "@commons-systems/errorutil/classify";
import { logError } from "@commons-systems/errorutil/log";

interface AccountRow {
  institution: string;
  account: string;
  mostRecentTimestamp: number | null;
  balance: number | null;
  derivedBalance: number | null;
  hasDiscrepancy: boolean;
  virtual: boolean;
  latestPeriod: string | null;
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
      latestPeriod: stmt ? stmt.period : null,
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
    const reconcileCell = row.latestPeriod !== null
      ? `<a class="reconcile-link" href="/accounts/reconcile?institution=${encodeURIComponent(row.institution)}&account=${encodeURIComponent(row.account)}&period=${encodeURIComponent(row.latestPeriod)}">Reconcile</a>`
      : "";
    return `<tr${rowClass}>
      <td>${escapeHtml(row.institution)}</td>
      <td>${escapeHtml(row.account)}${virtualBadge}</td>
      <td>${escapeHtml(formatDate(row.mostRecentTimestamp))}</td>
      <td>${balanceCell}</td>
      <td>${derivedCell}</td>
      <td>${reconcileCell}</td>
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
        <th>Reconcile</th>
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

function formatSignedCurrency(n: number): string {
  if (n === 0) return formatCurrency(0);
  if (n > 0) return `+${formatCurrency(n)}`;
  return `\u2212${formatCurrency(-n)}`;
}

function formatSignedPercent(p: number): string {
  const rounded = Math.round(p * 10) / 10;
  if (rounded === 0) return "0.0%";
  if (rounded > 0) return `+${rounded.toFixed(1)}%`;
  return `\u2212${Math.abs(rounded).toFixed(1)}%`;
}

function formatPercent(ratio: number | null): string {
  if (ratio === null) return "—";
  return `${(ratio * 100).toFixed(1)}%`;
}

type VarianceSide = "income" | "expense";

interface PeriodLabels {
  readonly currentLabel: string;
  readonly priorLabel: string;
  readonly yoYLabel: string;
}

function varianceClass(value: number | null, side: VarianceSide = "income"): string {
  if (value === null || value === 0) return "variance-neutral";
  const isPositive = side === "expense" ? value < 0 : value > 0;
  return isPositive ? "variance-positive" : "variance-negative";
}

function renderAmountCell(n: number | null): string {
  if (n === null) return `<td class="num">—</td>`;
  return `<td class="num">${escapeHtml(formatCurrency(n))}</td>`;
}

function renderVarianceCell(value: number | null, format: (n: number) => string, side: VarianceSide): string {
  if (value === null) return `<td class="num variance-neutral">—</td>`;
  return `<td class="num ${varianceClass(value, side)}">${escapeHtml(format(value))}</td>`;
}

function renderVarianceRow(
  label: string,
  variance: PeriodVariance,
  side: VarianceSide,
  labelClass = "",
  rowClass = "",
): string {
  const labelAttr = labelClass ? ` class="${labelClass}"` : "";
  const rowAttr = rowClass ? ` class="${rowClass}"` : "";
  return `<tr${rowAttr}>
    <td${labelAttr}>${escapeHtml(label)}</td>
    ${renderAmountCell(variance.current)}
    ${renderAmountCell(variance.prior)}
    ${renderVarianceCell(variance.priorVarianceAbs, formatSignedCurrency, side)}
    ${renderVarianceCell(variance.priorVariancePct, formatSignedPercent, side)}
    ${renderAmountCell(variance.yoY)}
    ${renderVarianceCell(variance.yoYVarianceAbs, formatSignedCurrency, side)}
    ${renderVarianceCell(variance.yoYVariancePct, formatSignedPercent, side)}
  </tr>`;
}

function renderIncomeStatementTable(
  title: string,
  tableId: string,
  rows: readonly VarianceRow[],
  totalLabel: string,
  totalVariance: PeriodVariance,
  labels: PeriodLabels,
  side: VarianceSide,
): string {
  const bodyRows = rows.length > 0
    ? rows.map((row) => renderVarianceRow(row.category, row.variance, side)).join("\n")
    : `<tr><td colspan="8" class="empty-row">No ${title.toLowerCase()} this period.</td></tr>`;
  return `<table id="${tableId}" class="income-statement-table">
    <caption>${escapeHtml(title)}</caption>
    <thead>
      <tr>
        <th>Category</th>
        <th class="num">${escapeHtml(labels.currentLabel)}</th>
        <th class="num">${escapeHtml(labels.priorLabel)}</th>
        <th class="num">Δ$</th>
        <th class="num">Δ%</th>
        <th class="num">${escapeHtml(labels.yoYLabel)}</th>
        <th class="num">Δ$</th>
        <th class="num">Δ%</th>
      </tr>
    </thead>
    <tbody>
      ${bodyRows}
      ${renderVarianceRow(totalLabel, totalVariance, side, "total-label", "total-row")}
    </tbody>
  </table>`;
}

function renderIncomeStatement(report: IncomeStatementReport): string {
  const labels: PeriodLabels = {
    currentLabel: report.currentLabel,
    priorLabel: report.priorLabel,
    yoYLabel: report.yoYLabel,
  };
  const incomeTable = renderIncomeStatementTable(
    "Income",
    "accounts-income-table",
    report.incomeRows,
    "Total income",
    report.totalIncome,
    labels,
    "income",
  );
  const expenseTable = renderIncomeStatementTable(
    "Expenses",
    "accounts-expenses-table",
    report.expenseRows,
    "Total expenses",
    report.totalExpenses,
    labels,
    "expense",
  );
  const emDashCell = `<td class="num variance-neutral">—</td>`;
  const netTable = `<table id="accounts-net-income-table" class="income-statement-table">
    <tbody>
      ${renderVarianceRow("Net income", report.netIncome, "income", "total-label", "total-row")}
      <tr class="savings-rate-row">
        <td class="total-label">Savings rate</td>
        <td class="num">${escapeHtml(formatPercent(report.savingsRate.current))}</td>
        <td class="num">${escapeHtml(formatPercent(report.savingsRate.prior))}</td>
        ${emDashCell}
        ${emDashCell}
        <td class="num">${escapeHtml(formatPercent(report.savingsRate.yoY))}</td>
        ${emDashCell}
        ${emDashCell}
      </tr>
    </tbody>
  </table>`;
  return `<section id="accounts-income-statement">
    <h3>Income statement</h3>
    ${incomeTable}
    ${expenseTable}
    ${netTable}
  </section>`;
}

function renderCashFlowRow(label: string, field: keyof CashFlowSummary, report: IncomeStatementReport): string {
  const neutral = field === "transfers";
  const renderCell = (summary: CashFlowSummary | null): string => {
    if (summary === null) return `<td class="num">—</td>`;
    const value = summary[field];
    const cls = neutral ? "" : ` ${varianceClass(value)}`;
    return `<td class="num${cls}">${escapeHtml(formatSignedCurrency(value))}</td>`;
  };
  return `<tr>
    <td>${escapeHtml(label)}</td>
    ${renderCell(report.cashFlow.current)}
    ${renderCell(report.cashFlow.prior)}
    ${renderCell(report.cashFlow.yoY)}
  </tr>`;
}

function renderCashFlowSummary(report: IncomeStatementReport): string {
  return `<section id="accounts-cash-flow-summary">
    <h3>Cash flow summary</h3>
    <table id="accounts-cash-flow-table" class="cash-flow-summary-table">
      <thead>
        <tr>
          <th>Activity</th>
          <th class="num">${escapeHtml(report.currentLabel)}</th>
          <th class="num">${escapeHtml(report.priorLabel)}</th>
          <th class="num">${escapeHtml(report.yoYLabel)}</th>
        </tr>
      </thead>
      <tbody>
        ${renderCashFlowRow("Operating", "operating", report)}
        ${renderCashFlowRow("Transfers", "transfers", report)}
        ${renderCashFlowRow("Net change", "netChange", report)}
      </tbody>
    </table>
  </section>`;
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
  let incomeStatementHtml = "";
  let cashFlowSummaryHtml = "";
  try {
    const [transactions, statements, periods] = await Promise.all([
      dataSource.getTransactions()
        .catch((e) => { logError(e, { operation: "load-transactions" }); throw e; }),
      dataSource.getStatements()
        .catch((e) => { logError(e, { operation: "load-statements" }); throw e; }),
      dataSource.getBudgetPeriods()
        .catch((e) => { logError(e, { operation: "load-periods" }); throw e; }),
    ]);
    const derivedBalances = computeDerivedBalances(transactions, statements);
    const rows = buildAccountRows(transactions, statements, derivedBalances);
    tableHtml = renderAccountsTable(rows);

    const report = computeIncomeStatementReport(transactions, Date.now());
    if (report !== null) {
      incomeStatementHtml = renderIncomeStatement(report);
      cashFlowSummaryHtml = renderCashFlowSummary(report);
    }

    try {
      const aggregateTrend = computeAggregateTrend(periods, transactions);
      const trendWeeks = aggregateTrend.map(p => ({ label: p.weekLabel, ms: p.weekMs }));
      const { points: netWorthPoints } = computeNetWorth(transactions, statements, trendWeeks);
      chartHtml = renderChartContainers(aggregateTrend, netWorthPoints, derivedBalances);
    } catch (chartError) {
      const kind = classifyError(chartError);
      if (kind === "programmer" || kind === "data-integrity" || kind === "range") {
        throw chartError;
      }
      reportError(chartError);
      logError(chartError, { operation: "compute-chart" });
      chartHtml = renderLoadError(chartError, "chart-error");
    }
  } catch (error) {
    tableHtml = renderLoadError(error, "accounts-error");
  }

  return `
    <h2>Accounts</h2>
    ${renderPageNotices(options, "accounts")}
    ${incomeStatementHtml}
    ${cashFlowSummaryHtml}
    ${chartHtml}
    ${tableHtml}
  `;
}
