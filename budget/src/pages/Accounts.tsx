// The React /accounts page. Ports the legacy renderAccounts string render +
// hydrateAccountsCharts island wiring (accounts.ts / accounts-hydrate.ts) to
// React. This is a PORT, not a rewrite: every compute helper (buildAccountRows,
// computeIncomeStatementReport, computeAggregateTrend / computeNetWorth /
// computeCashFlow, computeDerivedBalances) is reused unchanged; only the
// rendering layer becomes React.
//
// SCOPE (Unit 2): the markup → JSX (DS Metric/Card/Badge for the headline
// figures, the virtual badge, and section grouping; the income-statement /
// cash-flow tables and the divergence warning ported as JSX with the same class
// names), and the charts as a working imperative island. The page is built and
// unit-tested but NOT yet routed (App.tsx still routes legacy renderAccounts);
// routing is Unit 4.
//
// The data-loading pipeline is renderAccounts' Promise.all moved into a
// mount-once useEffect, UNCHANGED in behavior: per-source logError + rethrow,
// the income-statement report (may be null), the soft/hard chart-compute split
// (programmer/data-integrity/range rethrow; else null → chart-error fallback),
// and the outer load-error catch. Because Accounts has no <LegacyRoute> wrapper
// and a React error boundary cannot catch an async-effect throw, the hard-error
// path is reproduced inline as error state (loadErrorMessage), mirroring
// Transactions.tsx.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Badge, Card, Metric } from "@commons-systems/ds";
import { classifyError } from "@commons-systems/errorutil/classify";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import { formatCurrency } from "../format.js";
import {
  computeAggregateTrend,
  computeNetWorth,
  computeCashFlow,
  computeDerivedBalances,
  type AggregatePoint,
  type NetWorthPoint,
  type CashFlowPoint,
  type DerivedAccountBalance,
} from "../balance.js";
import {
  computeIncomeStatementReport,
  type IncomeStatementReport,
  type PeriodVariance,
  type VarianceRow,
  type CashFlowSummary,
} from "../income-statement.js";
import { type RenderPageOptions } from "./render-options.js";
import {
  buildAccountRows,
  formatDate,
  formatSignedCurrency,
  formatSignedPercent,
  formatPercent,
  varianceClass,
  type AccountRow,
  type VarianceSide,
} from "./account-view-model.js";
import { renderAggregateTrendChart } from "./budgets-trend-chart.js";
import { renderNetWorthChart } from "./accounts-net-worth-chart.js";
import { renderCashFlowChart } from "./accounts-cash-flow-chart.js";
import type { ChartResult } from "./budgets-chart.js";
import { attachScrollSync, wireChartDatePicker, findNearestWeekMs } from "./hydrate-util.js";

const ACCOUNTS_POINT_WIDTH = 40;

// ---- Accounts table (renderAccountsTable → JSX) ----------------------------

function AccountsTable({ rows }: { rows: AccountRow[] }) {
  if (rows.length === 0) {
    return <p>No accounts found.</p>;
  }
  return (
    <table id="accounts-table">
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
        {rows.map((row, i) => {
          const reconcileHref = row.latestPeriod !== null
            ? `/accounts/reconcile?institution=${encodeURIComponent(row.institution)}&account=${encodeURIComponent(row.account)}&period=${encodeURIComponent(row.latestPeriod)}`
            : null;
          return (
            <tr key={i} className={row.hasDiscrepancy ? "discrepancy" : undefined}>
              <td>{row.institution}</td>
              <td>
                {row.account}
                {row.virtual ? <> <Badge variant="neutral">virtual</Badge></> : null}
              </td>
              <td>{formatDate(row.mostRecentTimestamp)}</td>
              <td>{row.balance !== null ? formatCurrency(row.balance) : ""}</td>
              <td>{row.derivedBalance !== null ? formatCurrency(row.derivedBalance) : ""}</td>
              <td>
                {reconcileHref !== null
                  ? <a className="reconcile-link" href={reconcileHref}>Reconcile</a>
                  : ""}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ---- Income statement (renderIncomeStatement → JSX) ------------------------

interface PeriodLabels {
  readonly currentLabel: string;
  readonly priorLabel: string;
  readonly yoYLabel: string;
}

function AmountCell({ value }: { value: number | null }) {
  return <td className="num">{value === null ? "—" : formatCurrency(value)}</td>;
}

function VarianceCell({ value, format, side }: { value: number | null; format: (n: number) => string; side: VarianceSide }) {
  if (value === null) return <td className="num variance-neutral">—</td>;
  return <td className={`num ${varianceClass(value, side)}`}>{format(value)}</td>;
}

function VarianceRowCells({ variance, side }: { variance: PeriodVariance; side: VarianceSide }) {
  return (
    <>
      <AmountCell value={variance.current} />
      <AmountCell value={variance.prior} />
      <VarianceCell value={variance.priorVarianceAbs} format={formatSignedCurrency} side={side} />
      <VarianceCell value={variance.priorVariancePct} format={formatSignedPercent} side={side} />
      <AmountCell value={variance.yoY} />
      <VarianceCell value={variance.yoYVarianceAbs} format={formatSignedCurrency} side={side} />
      <VarianceCell value={variance.yoYVariancePct} format={formatSignedPercent} side={side} />
    </>
  );
}

function IncomeStatementTable({ title, tableId, rows, totalLabel, totalVariance, labels, side }: {
  title: string;
  tableId: string;
  rows: readonly VarianceRow[];
  totalLabel: string;
  totalVariance: PeriodVariance;
  labels: PeriodLabels;
  side: VarianceSide;
}) {
  return (
    <table id={tableId} className="income-statement-table">
      <caption>{title}</caption>
      <thead>
        <tr>
          <th>Category</th>
          <th className="num">{labels.currentLabel}</th>
          <th className="num">{labels.priorLabel}</th>
          <th className="num">Δ$</th>
          <th className="num">Δ%</th>
          <th className="num">{labels.yoYLabel}</th>
          <th className="num">Δ$</th>
          <th className="num">Δ%</th>
        </tr>
      </thead>
      <tbody>
        {rows.length > 0
          ? rows.map((row, i) => (
              <tr key={i}>
                <td>{row.category}</td>
                <VarianceRowCells variance={row.variance} side={side} />
              </tr>
            ))
          : <tr><td colSpan={8} className="empty-row">No {title.toLowerCase()} this period.</td></tr>}
        <tr className="total-row">
          <td className="total-label">{totalLabel}</td>
          <VarianceRowCells variance={totalVariance} side={side} />
        </tr>
      </tbody>
    </table>
  );
}

function IncomeStatement({ report }: { report: IncomeStatementReport }) {
  const labels: PeriodLabels = {
    currentLabel: report.currentLabel,
    priorLabel: report.priorLabel,
    yoYLabel: report.yoYLabel,
  };
  return (
    <section id="accounts-income-statement">
      <h3>Income statement</h3>
      <IncomeStatementTable
        title="Income"
        tableId="accounts-income-table"
        rows={report.incomeRows}
        totalLabel="Total income"
        totalVariance={report.totalIncome}
        labels={labels}
        side="income"
      />
      <IncomeStatementTable
        title="Expenses"
        tableId="accounts-expenses-table"
        rows={report.expenseRows}
        totalLabel="Total expenses"
        totalVariance={report.totalExpenses}
        labels={labels}
        side="expense"
      />
      <table id="accounts-net-income-table" className="income-statement-table">
        <tbody>
          <tr className="total-row">
            <td className="total-label">Net income</td>
            <VarianceRowCells variance={report.netIncome} side="income" />
          </tr>
          <tr className="savings-rate-row">
            <td className="total-label">Savings rate</td>
            <td className="num">{formatPercent(report.savingsRate.current)}</td>
            <td className="num">{formatPercent(report.savingsRate.prior)}</td>
            <td className="num variance-neutral">—</td>
            <td className="num variance-neutral">—</td>
            <td className="num">{formatPercent(report.savingsRate.yoY)}</td>
            <td className="num variance-neutral">—</td>
            <td className="num variance-neutral">—</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

// ---- Cash flow summary (renderCashFlowSummary → JSX) -----------------------

function CashFlowCell({ summary, field, neutral }: { summary: CashFlowSummary | null; field: keyof CashFlowSummary; neutral: boolean }) {
  if (summary === null) return <td className="num">—</td>;
  const value = summary[field];
  const cls = neutral ? "num" : `num ${varianceClass(value)}`;
  return <td className={cls}>{formatSignedCurrency(value)}</td>;
}

function CashFlowRow({ label, field, report, neutral }: { label: string; field: keyof CashFlowSummary; report: IncomeStatementReport; neutral: boolean }) {
  return (
    <tr>
      <td>{label}</td>
      <CashFlowCell summary={report.cashFlow.current} field={field} neutral={neutral} />
      <CashFlowCell summary={report.cashFlow.prior} field={field} neutral={neutral} />
      <CashFlowCell summary={report.cashFlow.yoY} field={field} neutral={neutral} />
    </tr>
  );
}

function CashFlowSummaryTable({ report }: { report: IncomeStatementReport }) {
  return (
    <section id="accounts-cash-flow-summary">
      <h3>Cash flow summary</h3>
      <table id="accounts-cash-flow-table" className="cash-flow-summary-table">
        <thead>
          <tr>
            <th>Activity</th>
            <th className="num">{report.currentLabel}</th>
            <th className="num">{report.priorLabel}</th>
            <th className="num">{report.yoYLabel}</th>
          </tr>
        </thead>
        <tbody>
          <CashFlowRow label="Operating" field="operating" report={report} neutral={false} />
          <CashFlowRow label="Transfers" field="transfers" report={report} neutral={true} />
          <CashFlowRow label="Net change" field="netChange" report={report} neutral={false} />
        </tbody>
      </table>
    </section>
  );
}

// ---- Headline Metric cards -------------------------------------------------

// deltaTone for a higher-is-better figure: favorable when positive, unfavorable
// when negative, undefined (muted) when zero.
function tone(n: number): "favorable" | "unfavorable" | undefined {
  if (n > 0) return "favorable";
  if (n < 0) return "unfavorable";
  return undefined;
}

function HeadlineMetrics({ report }: { report: IncomeStatementReport }) {
  const net = report.netIncome.current;
  const netChange = report.cashFlow.current.netChange;
  return (
    <Card style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)", marginBlock: "1.5rem" }}>
      <Metric label="Net income" value={formatCurrency(net)} delta={report.currentLabel} deltaTone={tone(net)} />
      <Metric label="Savings rate" value={formatPercent(report.savingsRate.current)} delta={report.currentLabel} />
      <Metric label="Net change" value={formatSignedCurrency(netChange)} delta={report.currentLabel} deltaTone={tone(netChange)} />
    </Card>
  );
}

// ---- Divergence warning (renderDivergenceWarning → JSX) --------------------

function DivergenceWarning({ derivedBalances }: { derivedBalances: DerivedAccountBalance[] }) {
  const discrepancies = derivedBalances.filter(d => Math.abs(d.discrepancy) > 0.01);
  if (discrepancies.length === 0) return null;
  return (
    <div id="balance-divergence-warning" className="divergence-warning">
      <p>Balance verification found discrepancies between statement balances and transaction-derived balances:</p>
      <ul>
        {discrepancies.map((d, i) => (
          <li key={i}>
            {d.institution} {d.account} ({d.earliestPeriod}→{d.latestPeriod}): {formatCurrency(d.discrepancy)}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---- Chart island (hydrateAccountsCharts → React effect) -------------------

interface ChartData {
  aggregateTrend: AggregatePoint[];
  netWorthPoints: NetWorthPoint[];
  cashFlowPoints: CashFlowPoint[];
}

// The imperative chart island. Ports hydrateAccountsCharts: render the three
// charts into refs inside an effect, wire scroll-sync / date-picker / resize,
// and return a teardown so React removes the listeners/observer before re-running
// or on unmount (the #1267 stale-listener precedent). The legacy module-level
// scrollAbort / getElementById state becomes effect-local closure state + refs.
function AccountsCharts({ data }: { data: ChartData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trendRef = useRef<HTMLDivElement>(null);
  const nwRef = useRef<HTMLDivElement>(null);
  const cfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const trendEl = trendRef.current;
    const nwEl = nwRef.current;
    const cfEl = cfRef.current;
    if (!container || !trendEl || !nwEl || !cfEl) return;

    const getScrollWrappers = (): HTMLElement[] => {
      const wrappers: HTMLElement[] = [];
      for (const el of [trendEl, nwEl, cfEl]) {
        const w = el.querySelector<HTMLElement>(".chart-scroll-wrapper");
        if (w) wrappers.push(w);
      }
      return wrappers;
    };

    let chartResult: ChartResult = { weeks: [] };
    function render(): void {
      const containerWidth = container!.clientWidth || 640;
      chartResult = renderAggregateTrendChart(trendEl!, { data: data.aggregateTrend, containerWidth, panelWidth: ACCOUNTS_POINT_WIDTH });
      renderNetWorthChart(nwEl!, { data: data.netWorthPoints, containerWidth, pointWidth: ACCOUNTS_POINT_WIDTH });
      renderCashFlowChart(cfEl!, { data: data.cashFlowPoints, containerWidth, pointWidth: ACCOUNTS_POINT_WIDTH });
    }

    let scrollAbort: AbortController | null = null;
    function reattachScrollSync(): void {
      if (scrollAbort) scrollAbort.abort();
      scrollAbort = attachScrollSync(getScrollWrappers).abort;
    }

    render();
    reattachScrollSync();

    const allWeeks = chartResult.weeks;
    // wireChartDatePicker attaches a "change" listener to #accounts-date-picker;
    // it is torn down by removing the picker node, which React owns and unmounts.
    wireChartDatePicker("accounts-date-picker", allWeeks, (anchorMs) => {
      const weeks = chartResult.weeks;
      if (weeks.length === 0) return;
      const nearestMs = findNearestWeekMs(weeks, anchorMs);
      const nearestIdx = weeks.findIndex(w => w.ms === nearestMs);
      const weekCount = weeks.length;
      for (const wrapper of getScrollWrappers()) {
        const scrollMax = wrapper.scrollWidth - wrapper.clientWidth;
        const left = weekCount <= 1 ? 0 : Math.round((nearestIdx / (weekCount - 1)) * scrollMax);
        wrapper.scrollTo({ left: Math.max(0, left - wrapper.clientWidth / 2), behavior: "smooth" });
      }
    });

    // Resize handling, inlined from wireChartResize so this effect can return a
    // teardown that disconnects the observer (the shared helper returns void and
    // is still used by legacy accounts-hydrate.ts, removed in Unit 4).
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const observer = new ResizeObserver(() => {
      if (!container.isConnected) { observer.disconnect(); return; }
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!container.isConnected) { observer.disconnect(); return; }
        const wrappers = getScrollWrappers();
        const scrollRatio = wrappers.length > 0 && wrappers[0].scrollWidth > 0
          ? wrappers[0].scrollLeft / wrappers[0].scrollWidth
          : 1;
        try {
          render();
        } catch (error) {
          const msg = "Chart rendering failed on resize. Try refreshing the page.";
          for (const el of [trendEl, nwEl, cfEl]) el.textContent = msg;
          logError(error, { operation: "chart-resize" });
          if (!deferProgrammerError(error)) reportError(error);
          return;
        }
        reattachScrollSync();
        for (const w of getScrollWrappers()) {
          w.scrollLeft = scrollRatio * w.scrollWidth;
        }
      }, 150);
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      if (resizeTimer) clearTimeout(resizeTimer);
      if (scrollAbort) scrollAbort.abort();
    };
  }, [data]);

  return (
    <div ref={containerRef}>
      <div id="accounts-chart-controls">
        <label>Jump to: <input type="date" id="accounts-date-picker" /></label>
      </div>
      <div id="accounts-trend-chart" ref={trendRef}></div>
      <div id="accounts-net-worth-chart" ref={nwRef}></div>
      <div id="accounts-cash-flow-chart" ref={cfRef}></div>
    </div>
  );
}

// ---- Load pipeline (renderAccounts → effect) -------------------------------

interface LoadedData {
  rows: AccountRow[];
  derivedBalances: DerivedAccountBalance[];
  report: IncomeStatementReport | null;
  chartData: ChartData | null; // null → render chart-error fallback
}

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; data: LoadedData }
  | { status: "error"; message: string };

// Mirror renderLoadError's classification (render-options.ts:20-27) +
// LegacyRoute.formatRouteError, reproduced inline because an async effect throw
// cannot reach a React error boundary. Identical to Transactions.loadErrorMessage.
function loadErrorMessage(error: unknown): string {
  const kind = classifyError(error);
  if (kind === "programmer") return "Something went wrong. Please try again.";
  if (kind === "data-integrity" || kind === "range") return "A data error occurred. Please contact support.";
  if (kind === "permission-denied") return "Access denied. Please contact support.";
  return "Could not load data. Try refreshing the page.";
}

// The renderAccounts data pipeline moved into an effect, UNCHANGED in behavior.
// Runs once per mount; App re-keys the page per navEpoch so a data transition
// re-mounts and re-resolves.
function useAccountsData(options: RenderPageOptions): LoadState {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    const { dataSource } = options;

    (async () => {
      try {
        const [transactions, statements, periods] = await Promise.all([
          dataSource.getTransactions()
            .catch((e: unknown) => { logError(e, { operation: "load-transactions" }); throw e; }),
          dataSource.getStatements()
            .catch((e: unknown) => { logError(e, { operation: "load-statements" }); throw e; }),
          dataSource.getBudgetPeriods()
            .catch((e: unknown) => { logError(e, { operation: "load-periods" }); throw e; }),
        ]);

        const derivedBalances = computeDerivedBalances(transactions, statements);
        const rows = buildAccountRows(transactions, statements, derivedBalances);
        const report = computeIncomeStatementReport(transactions, Date.now());

        let chartData: ChartData | null;
        try {
          const aggregateTrend = computeAggregateTrend(periods, transactions);
          const trendWeeks = aggregateTrend.map(p => ({ label: p.weekLabel, ms: p.weekMs }));
          const { points: netWorthPoints } = computeNetWorth(transactions, statements, trendWeeks);
          const cashFlowPoints = computeCashFlow(netWorthPoints);
          chartData = { aggregateTrend, netWorthPoints, cashFlowPoints };
        } catch (chartError) {
          const kind = classifyError(chartError);
          if (kind === "programmer" || kind === "data-integrity" || kind === "range") throw chartError;
          reportError(chartError);
          logError(chartError, { operation: "compute-chart" });
          chartData = null; // → <p className="chart-error">Chart unavailable.</p>
        }

        if (cancelled) return;
        setState({ status: "loaded", data: { rows, derivedBalances, report, chartData } });
      } catch (error) {
        if (cancelled) return;
        if (!deferProgrammerError(error)) logError(error, { operation: "router-render" });
        setState({ status: "error", message: loadErrorMessage(error) });
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return state;
}

function LoadedAccounts({ data }: { data: LoadedData }) {
  return (
    <>
      {data.report !== null ? <HeadlineMetrics report={data.report} /> : null}
      {data.report !== null ? <IncomeStatement report={data.report} /> : null}
      {data.report !== null ? <CashFlowSummaryTable report={data.report} /> : null}
      <DivergenceWarning derivedBalances={data.derivedBalances} />
      {data.chartData === null
        ? <p className="chart-error">Chart unavailable.</p>
        : <AccountsCharts data={data.chartData} />}
      <AccountsTable rows={data.rows} />
    </>
  );
}

export function Accounts({ options }: { options: RenderPageOptions }): ReactNode {
  const load = useAccountsData(options);

  return (
    <main id="app">
      <h2>Accounts</h2>
      {options.authorized ? null : (
        <p id="seed-data-notice">Viewing example data. Load a data file to see your accounts.</p>
      )}
      {load.status === "error" ? (
        <p id="accounts-error">{load.message}</p>
      ) : load.status === "loaded" ? (
        <LoadedAccounts data={load.data} />
      ) : null}
    </main>
  );
}
