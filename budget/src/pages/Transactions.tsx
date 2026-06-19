// The React /transactions page. Replaces the legacy renderHome string render +
// #transactions-table / #category-sankey hydration (App previously routed this
// through <LegacyRoute>). The markup is a faithful JSX port of renderHome /
// renderTransactionTable / renderTransactionRows / renderRow /
// renderNormalizedGroup / buildRowParts (home.ts), preserving every class name
// and data-* attribute so existing CSS and the Unit 4 table-interactivity
// hydration keep working.
//
// SCOPE: this unit ports markup → JSX and makes the chart a working island. It
// renders the editable inputs, the budget/category/period data attributes, and
// the #scroll-sentinel, but does NOT wire blur-save or IntersectionObserver
// infinite-scroll — those are Unit 4. The chart IS wired here via <CategorySankey>.
//
// The data-loading effect is the renderHome Promise.all pipeline moved UNCHANGED
// in behavior: per-source logError + rethrow, sort by compareByTimestampDesc,
// chart-serialization try/catch with classifyError rethrow of
// programmer/data-integrity/range (+ chart-error fallback), and the outer
// renderLoadError catch. Because Transactions has no <LegacyRoute> wrapper and a
// React error boundary cannot catch an async-effect throw, the hard-error path
// (renderLoadError's rethrow of programmer/data-integrity/range, then
// LegacyRoute's formatRouteError mapping) is reproduced inline as error state.
import { Component, Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Timestamp } from "firebase/firestore";
import { classifyError } from "@commons-systems/errorutil/classify";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import {
  type Transaction,
  type TransactionId,
  type Budget,
  type BudgetPeriod,
  type SerializedBudgetPeriod,
} from "../firestore.js";
import { computeAllBudgetBalances, computeNetAmount, MS_PER_WEEK, weekStart } from "../balance.js";
import type { TransactionQuery } from "../data-source.js";
import { type RenderPageOptions } from "./render-options.js";
import { uniqueSorted } from "./hydrate-util.js";
import {
  serializeChartTransactions,
  compareByTimestampDesc,
  formatTimestamp,
  SCROLL_BATCH_WEEKS,
} from "./home.js";
import type { SerializedChartTransaction } from "./home-chart.js";
import { CategorySankey } from "./CategorySankey.js";
import {
  useTableInteractivity,
  useInfiniteScroll,
  type ScrollAppend,
  type ScrollErrorKind,
} from "./use-transaction-table.js";

// formatCategory (home.ts:21-23) ported for JSX: the string form joined
// colon-segments with the HTML entity " &gt; "; the displayed text is " > ", so
// here we render the segments interleaved with " > " text nodes and let React
// escape each segment.
function formatCategory(category: string): ReactNode {
  // Fragment renders no element, so the output is text nodes only — matching the
  // legacy single text run inside the category <span> (no nested spans).
  return category.split(":").map((part, i) => (
    <Fragment key={i}>{i > 0 ? " > " : ""}{part}</Fragment>
  ));
}

// Resolve a transaction's budget name in the strict (editable) path: throws a
// DataIntegrityError on an unknown id, exactly as buildRowParts did (home.ts:56-60).
function resolveBudgetNameStrict(txn: Transaction, budgetIdToName: Map<string, string>): string {
  if (!txn.budget) return "";
  const resolved = budgetIdToName.get(txn.budget);
  if (resolved === undefined) {
    throw new DataIntegrityError(`Transaction ${txn.id} references unknown budget ID: ${txn.budget}`);
  }
  return resolved;
}

interface RowContext {
  editable: boolean;
  budgetIdToName: Map<string, string>;
  groupName: string;
  // txnIds whose balance was cleared to "--" by an in-place edit (budget/
  // reimbursement change) or a period-sync failure. The React-state equivalent of
  // the imperative clearBalanceDisplay: a cleared row renders "--" regardless of
  // the computed balance; recalculation happens on the next navigation re-mount.
  clearedBalances: Set<string>;
}

// Resolve what a row's Budget Balance <dd> should display: "--" when the balance
// was cleared by an edit, the formatted number when one is available, or null to
// omit the row entirely (the home.test.tsx "omits when null" parity assertion).
function balanceDisplay(txnId: string, balance: number | null, cleared: Set<string>): string | null {
  if (cleared.has(txnId)) return "--";
  if (balance !== null) return balance.toFixed(2);
  return null;
}

// The shared row "parts" — the summary cells, the data-* attributes for the
// <details> element, and the detail <dl>. Mirrors buildRowParts (home.ts:42-89).
function rowDataAttrs(txn: Transaction, budgetName: string, ctx: RowContext): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (ctx.editable) {
    attrs["data-txn-id"] = txn.id;
    attrs["data-amount"] = String(txn.amount);
    if (txn.budget) attrs["data-budget-id"] = txn.budget;
    if (txn.timestamp) attrs["data-timestamp"] = String(txn.timestamp.toMillis());
    attrs["data-reimbursement"] = String(txn.reimbursement);
  }
  attrs["data-category"] = txn.category;
  attrs["data-net-amount"] = String(computeNetAmount(txn.amount, txn.reimbursement));
  attrs["data-budget-name"] = budgetName;
  return attrs;
}

function NoteCell({ txn, editable }: { txn: Transaction; editable: boolean }) {
  return editable
    ? <input type="text" className="edit-note" defaultValue={txn.note} aria-label="Note" />
    : <>{txn.note}</>;
}

function CategoryCell({ txn, editable }: { txn: Transaction; editable: boolean }) {
  return editable
    ? <input type="text" className="edit-category" defaultValue={txn.category} aria-label="Category" data-autocomplete="" />
    : <>{formatCategory(txn.category)}</>;
}

function ReimbursementCell({ txn, editable }: { txn: Transaction; editable: boolean }) {
  return editable
    ? <input type="number" className="edit-reimbursement" defaultValue={String(txn.reimbursement)} min="0" max="100" aria-label="Reimbursement" />
    : <>{`${String(txn.reimbursement)}%`}</>;
}

function BudgetCell({ budgetName, editable }: { budgetName: string; editable: boolean }) {
  return editable
    ? <input type="text" className="edit-budget" defaultValue={budgetName} aria-label="Budget" data-autocomplete="" />
    : <>{budgetName}</>;
}

// The detail <dl> shared by single rows and normalized groups (home.ts:74-83).
function DetailDl({ txn, budgetName, balance, ctx }: { txn: Transaction; budgetName: string; balance: number | null; ctx: RowContext }) {
  const balanceText = balanceDisplay(txn.id, balance, ctx.clearedBalances);
  return (
    <dl>
      <dt>Date</dt><dd>{formatTimestamp(txn.timestamp)}</dd>
      <dt>Institution</dt><dd>{txn.institution}</dd>
      <dt>Account</dt><dd>{txn.account}</dd>
      <dt>Reimbursement</dt><dd><ReimbursementCell txn={txn} editable={ctx.editable} /></dd>
      <dt>Budget</dt><dd><BudgetCell budgetName={budgetName} editable={ctx.editable} /></dd>
      {balanceText !== null ? (<><dt>Budget Balance</dt><dd className="budget-balance">{balanceText}</dd></>) : null}
      <dt>Group</dt><dd>{ctx.groupName}</dd>
      <dt>Statement</dt>
      <dd>
        {txn.statementId
          ? <button type="button" className="statement-source-link" data-statement-id={txn.statementId}>view source</button>
          : null}
      </dd>
    </dl>
  );
}

// renderRow (home.ts:95-115) → JSX.
function TxnRow({ txn, balance, ctx }: { txn: Transaction; balance: number | null; ctx: RowContext }) {
  const budgetName = resolveBudgetNameStrict(txn, ctx.budgetIdToName);
  const className = `expand-row txn-row${txn.virtual ? " virtual-txn" : ""}`;
  return (
    <details className={className} {...rowDataAttrs(txn, budgetName, ctx)}>
      <summary className="txn-summary">
        <div className="expand-summary txn-summary-content">
          <span>{txn.virtual ? <span className="virtual-badge">virtual</span> : null}{txn.description}</span>
          <span><NoteCell txn={txn} editable={ctx.editable} /></span>
          <span><CategoryCell txn={txn} editable={ctx.editable} /></span>
          <span className="amount">{txn.amount.toFixed(2)}</span>
        </div>
      </summary>
      <div className="expand-details txn-details">
        <DetailDl txn={txn} budgetName={budgetName} balance={balance} ctx={ctx} />
      </div>
    </details>
  );
}

// renderNormalizedGroup (home.ts:122-152) → JSX.
function NormalizedGroup({ primary, members, balance, ctx }: { primary: Transaction; members: Transaction[]; balance: number | null; ctx: RowContext }) {
  const budgetName = resolveBudgetNameStrict(primary, ctx.budgetIdToName);
  const description = primary.normalizedDescription ?? primary.description;
  return (
    <details className="expand-row txn-row normalized-group" {...rowDataAttrs(primary, budgetName, ctx)}>
      <summary className="txn-summary">
        <div className="expand-summary txn-summary-content">
          <span>{description}</span>
          <span><NoteCell txn={primary} editable={ctx.editable} /></span>
          <span><CategoryCell txn={primary} editable={ctx.editable} /></span>
          <span className="amount">{primary.amount.toFixed(2)}</span>
        </div>
      </summary>
      <div className="expand-details txn-details">
        <DetailDl txn={primary} budgetName={budgetName} balance={balance} ctx={ctx} />
        <div className="normalized-originals">
          <h4>Original Transactions</h4>
          {members.map((txn, i) => (
            <div className="normalized-original" key={i}>
              <span>{txn.description}</span>
              <span>{formatTimestamp(txn.timestamp)}</span>
              <span>{txn.statementId ? txn.statementId : ""}</span>
              <span className="amount">{txn.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}

// renderTransactionRows grouping (home.ts:184-227) → JSX nodes. Preserves the
// #1266 orphan-member suppression: a normalized group whose primary lives in
// another (not-yet-loaded) scroll batch is skipped rather than throwing.
function TransactionRows({ transactions, ctx, getBalance }: {
  transactions: Transaction[];
  ctx: RowContext;
  getBalance: (id: string) => number | null;
}) {
  const normalizedGroups = new Map<string, Transaction[]>();
  for (const txn of transactions) {
    if (txn.normalizedId !== null) {
      const group = normalizedGroups.get(txn.normalizedId);
      if (group) group.push(txn);
      else normalizedGroups.set(txn.normalizedId, [txn]);
    }
  }

  const seenGroups = new Set<string>();
  const nodes: ReactNode[] = [];
  for (const txn of transactions) {
    if (txn.normalizedId === null) {
      nodes.push(<TxnRow key={txn.id} txn={txn} balance={getBalance(txn.id)} ctx={ctx} />);
      continue;
    }
    if (seenGroups.has(txn.normalizedId)) continue;
    seenGroups.add(txn.normalizedId);
    const members = normalizedGroups.get(txn.normalizedId)!;
    const primary = members.find(t => t.normalizedPrimary);
    if (!primary) {
      // Orphan members — the group's primary is in another scroll batch; that
      // batch renders the canonical group row. Suppress rather than throw (#1266).
      continue;
    }
    nodes.push(
      <NormalizedGroup key={primary.id} primary={primary} members={members} balance={getBalance(primary.id)} ctx={ctx} />,
    );
  }
  return <>{nodes}</>;
}

// A React error boundary so a SYNCHRONOUS render-throw inside TransactionTable
// (resolveBudgetNameStrict's unknown-budget-id, or the duplicate-budget-name
// guard) surfaces a #transactions-error data-error region instead of crashing the
// whole tree. The legacy router (LegacyRoute/formatRouteError) mapped these
// DataIntegrityError throws to the same user-facing support message; the budget
// app had no React boundary, so Unit 3 crashed here — this closes that gap.
class TableErrorBoundary extends Component<{ children: ReactNode }, { error: unknown }> {
  state: { error: unknown } = { error: null };
  static getDerivedStateFromError(error: unknown) { return { error }; }
  componentDidCatch(error: unknown) {
    if (!deferProgrammerError(error)) logError(error, { operation: "transactions-table-render" });
  }
  render() {
    if (this.state.error !== null) {
      return <p id="transactions-error">{loadErrorMessage(this.state.error)}</p>;
    }
    return this.props.children;
  }
}

// renderTransactionTable (home.ts:228-282) → JSX. Builds the #transactions-table
// container with the data-* attributes the table-interactivity effects read.
// `initialTransactions` feeds the container data attributes (the options/periods
// parsed once at mount); `transactions` is the combined (initial + scroll-appended)
// set rendered as rows. The container/sentinel refs and scroll UI drive the
// IntersectionObserver wired by the caller.
function TransactionTable({
  transactions,
  initialTransactions,
  authorized,
  groupName,
  budgets,
  budgetPeriods,
  sinceMs,
  containerRef,
  sentinelRef,
  scrollLoading,
  scrollError,
  clearedBalances,
}: {
  transactions: Transaction[];
  initialTransactions: Transaction[];
  authorized: boolean;
  groupName: string;
  budgets: Budget[];
  budgetPeriods: BudgetPeriod[];
  sinceMs: number | null;
  containerRef: React.RefObject<HTMLDivElement>;
  sentinelRef: React.RefObject<HTMLDivElement>;
  scrollLoading: boolean;
  scrollError: ScrollErrorKind | null;
  clearedBalances: Set<string>;
}) {
  if (transactions.length === 0 && sinceMs === null) {
    return <p>No transactions found.</p>;
  }

  const budgetIdToName = new Map(budgets.map(b => [b.id, b.name]));
  const balances = computeAllBudgetBalances(transactions, budgets, budgetPeriods);
  const getBalance = (id: string) => balances.get(id as TransactionId) ?? null;
  const ctx: RowContext = { editable: authorized, budgetIdToName, groupName, clearedBalances };

  // Budget map is always needed for scroll hydration (rendering budget names on
  // appended rows). Throws on a duplicate budget name (home.ts:255-259).
  const budgetNameToId: Record<string, string> = {};
  for (const b of budgets) {
    if (budgetNameToId[b.name] !== undefined) {
      throw new DataIntegrityError(`Duplicate budget name: ${b.name}`);
    }
    budgetNameToId[b.name] = b.id;
  }

  // Authorized-only data attributes — JSON-encoded; React escapes the attribute
  // value, matching the legacy escapeHtml(JSON.stringify(...)) output. Computed
  // from the initial load (the effect parses them once at mount).
  const editableAttrs: Record<string, string> = {};
  if (authorized) {
    const budgetNames = budgets.map(b => b.name).sort();
    const periodsData: SerializedBudgetPeriod[] = budgetPeriods.map((p) => ({
      id: p.id,
      budgetId: p.budgetId,
      periodStartMs: p.periodStart.toMillis(),
      periodEndMs: p.periodEnd.toMillis(),
      total: p.total,
      count: p.count,
      categoryBreakdown: p.categoryBreakdown,
    }));
    editableAttrs["data-budget-options"] = JSON.stringify(budgetNames);
    editableAttrs["data-category-options"] = JSON.stringify(uniqueSorted(initialTransactions.map(t => t.category)));
    editableAttrs["data-budget-periods"] = JSON.stringify(periodsData);
  }

  const scrollErrorText = scrollError === "transient"
    ? "Failed to load older transactions. Scroll down to retry."
    : "Data error — please re-upload your file.";

  return (
    <div
      id="transactions-table"
      ref={containerRef}
      data-group-name={groupName}
      data-editable={String(authorized)}
      data-budget-map={JSON.stringify(budgetNameToId)}
      {...editableAttrs}
    >
      <div className="txn-header">
        <span>Description</span>
        <span>Note</span>
        <span>Category</span>
        <span className="amount">Amount</span>
      </div>
      <TransactionRows transactions={transactions} ctx={ctx} getBalance={getBalance} />
      {scrollLoading ? <div className="scroll-loading">Loading older transactions...</div> : null}
      {scrollError !== null ? <div className="scroll-error">{scrollErrorText}</div> : null}
      {sinceMs !== null ? <div id="scroll-sentinel" ref={sentinelRef} data-next-before={String(sinceMs)} aria-hidden="true"></div> : null}
    </div>
  );
}

// Stateful orchestrator for the loaded /transactions surface: owns the scroll
// cursor, the scroll-appended batches, and the scroll loading/error UI, wires the
// blur-save + infinite-scroll effects, and feeds the combined transactions to the
// chart island. Lives under TableErrorBoundary so a synchronous render-throw
// (unknown budget id / duplicate name) surfaces a data-error region.
function LoadedTransactions({ data, options }: { data: LoadedData; options: RenderPageOptions }) {
  const { authorized, groupName } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // The scroll cursor (data-next-before). null once retired (final batch loaded,
  // or a data-integrity error stopped scrolling) — which also hides the sentinel.
  const [nextBefore, setNextBefore] = useState<number | null>(data.sinceMs);
  const [appended, setAppended] = useState<Transaction[]>([]);
  const [scrollLoading, setScrollLoading] = useState(false);
  const [scrollError, setScrollError] = useState<ScrollErrorKind | null>(null);
  // txnIds whose Budget Balance was cleared to "--" by an in-place edit — the
  // React-state clearBalanceDisplay. The imperative blur handler calls
  // onClearBalance(txnId), which adds the id here and re-renders the row as "--".
  const [clearedBalances, setClearedBalances] = useState<Set<string>>(() => new Set());
  const onClearBalance = (txnId: string): void => {
    setClearedBalances((prev) => {
      if (prev.has(txnId)) return prev;
      const next = new Set(prev);
      next.add(txnId);
      return next;
    });
  };

  const onAppend = (append: ScrollAppend): void => {
    setScrollError(null);
    if (append.transactions.length > 0) {
      setAppended((prev) => [...prev, ...append.transactions]);
    }
    setNextBefore(append.nextBefore);
  };
  const onScrollError = (kind: ScrollErrorKind): void => {
    setScrollError(kind);
    // A data-integrity error stops scrolling (sentinel retired); transient keeps it.
    if (kind === "data-integrity") setNextBefore(null);
  };

  useTableInteractivity(containerRef, authorized, onClearBalance);
  useInfiniteScroll(sentinelRef, nextBefore, {
    onAppend,
    onScrollError,
    onScrollLoading: setScrollLoading,
  });

  // Combined initial + scroll-appended transactions, re-sorted descending so the
  // grouping/orphan-suppression sees the same ordering the legacy table did.
  const allTransactions = useMemo(() => {
    const merged = [...data.transactions, ...appended];
    merged.sort(compareByTimestampDesc);
    return merged;
  }, [data.transactions, appended]);

  // #578: feed the chart the combined transactions and re-key on append so the
  // island remounts and buildCategorySankey re-runs with the larger data set
  // (replacing the legacy TRANSACTIONS_APPENDED_EVENT dispatch from scroll).
  const budgetIdToName = useMemo(() => new Map(data.budgets.map(b => [b.id, b.name])), [data.budgets]);
  const chartData = useMemo<SerializedChartTransaction[] | null>(() => {
    if (data.chartData === null) return null;
    try {
      return serializeChartTransactions(allTransactions, budgetIdToName);
    } catch (chartError) {
      // resolveBudgetName degrades unknown ids, so serialization should not throw
      // for appended rows (#578); fall back to the originally-loaded chart data.
      logError(chartError, { operation: "chart-serialization-append" });
      return data.chartData;
    }
  }, [allTransactions, budgetIdToName, data.chartData]);

  return (
    <>
      {chartData === null ? (
        <p className="chart-error">Chart unavailable.</p>
      ) : (
        <CategorySankey
          key={appended.length}
          chartData={chartData}
          categoryOptions={data.chartCategoryOptions}
          budgetOptions={data.chartBudgetOptions}
        />
      )}
      <TableErrorBoundary>
        <TransactionTable
          transactions={allTransactions}
          initialTransactions={data.transactions}
          authorized={authorized}
          groupName={groupName}
          budgets={data.budgets}
          budgetPeriods={data.budgetPeriods}
          sinceMs={nextBefore}
          containerRef={containerRef}
          sentinelRef={sentinelRef}
          scrollLoading={scrollLoading}
          scrollError={scrollError}
          clearedBalances={clearedBalances}
        />
      </TableErrorBoundary>
    </>
  );
}

// What the data-loading pipeline resolves to. Mirrors renderHome's locals
// (transactions/budgets/budgetPeriods + chart inputs), plus the soft chart-error
// flag and the (rethrown-and-caught) load error.
interface LoadedData {
  transactions: Transaction[];
  budgets: Budget[];
  budgetPeriods: BudgetPeriod[];
  sinceMs: number | null;
  chartData: SerializedChartTransaction[] | null; // null → render chart-error fallback
  chartCategoryOptions: string[];
  chartBudgetOptions: string[];
}

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; data: LoadedData }
  | { status: "error"; message: string };

// Mirror renderLoadError's classification (render-options.ts:20-27): rethrow
// programmer/data-integrity/range; permission-denied → access-denied; else soft.
// The rethrown kinds then map through LegacyRoute's formatRouteError
// (LegacyRoute.tsx:21-26): data-integrity/range → support message; else generic.
function loadErrorMessage(error: unknown): string {
  const kind = classifyError(error);
  if (kind === "programmer") {
    // renderLoadError rethrows; LegacyRoute.formatRouteError mapped a non-
    // data/range kind to the generic terminal message.
    return "Something went wrong. Please try again.";
  }
  if (kind === "data-integrity" || kind === "range") {
    return "A data error occurred. Please contact support.";
  }
  if (kind === "permission-denied") {
    return "Access denied. Please contact support.";
  }
  return "Could not load data. Try refreshing the page.";
}

// The renderHome data pipeline (home.ts:295-327) moved into an effect, UNCHANGED
// in behavior. Runs once per mount; the page is re-keyed per navEpoch by App so a
// data transition re-mounts and re-resolves.
function useTransactionsData(options: RenderPageOptions): LoadState {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    const { authorized, dataSource } = options;

    // Seed data (unauthorized) loads all transactions; authorized data uses a
    // 12-week initial window with infinite scroll for older batches.
    const sinceMs = authorized ? weekStart(Date.now() - SCROLL_BATCH_WEEKS * MS_PER_WEEK) : null;
    const txnQuery: TransactionQuery = sinceMs !== null ? { since: Timestamp.fromMillis(sinceMs) } : {};

    (async () => {
      try {
        const [transactions, budgets, budgetPeriods] = await Promise.all([
          dataSource.getTransactions(txnQuery)
            .catch((e) => { logError(e, { operation: "load-transactions" }); throw e; }),
          dataSource.getBudgets()
            .catch((e) => { logError(e, { operation: "load-budgets" }); throw e; }),
          dataSource.getBudgetPeriods()
            .catch((e) => { logError(e, { operation: "load-budget-periods" }); throw e; }),
        ]);
        transactions.sort(compareByTimestampDesc);

        const budgetIdToName = new Map(budgets.map(b => [b.id, b.name]));
        let chartData: SerializedChartTransaction[] | null;
        try {
          chartData = serializeChartTransactions(transactions, budgetIdToName);
        } catch (chartError) {
          const kind = classifyError(chartError);
          if (kind === "programmer" || kind === "data-integrity" || kind === "range") throw chartError;
          reportError(chartError);
          logError(chartError, { operation: "chart-serialization" });
          chartData = null; // → <p class="chart-error">Chart unavailable.</p>
        }

        if (cancelled) return;
        setState({
          status: "loaded",
          data: {
            transactions,
            budgets,
            budgetPeriods,
            sinceMs,
            chartData,
            chartCategoryOptions: uniqueSorted(transactions.map(t => t.category)),
            chartBudgetOptions: uniqueSorted(budgets.map(b => b.name)),
          },
        });
      } catch (error) {
        if (cancelled) return;
        // Mirror renderLoadError + LegacyRoute.formatRouteError: log non-
        // programmer errors, then render a classified message scoped to the route
        // region (the React error-boundary path can't catch async throws).
        if (!deferProgrammerError(error)) logError(error, { operation: "router-render" });
        setState({ status: "error", message: loadErrorMessage(error) });
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return state;
}

export function Transactions({ options }: { options: RenderPageOptions }) {
  const load = useTransactionsData(options);

  return (
    <>
      <h2>Transactions</h2>
      {options.authorized ? null : (
        <p id="seed-data-notice">Viewing example data. Load a data file to see your transactions.</p>
      )}
      {load.status === "error" ? (
        <p id="transactions-error">{load.message}</p>
      ) : load.status === "loaded" ? (
        <LoadedTransactions data={load.data} options={options} />
      ) : null}
    </>
  );
}
