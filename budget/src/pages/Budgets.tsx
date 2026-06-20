// The React /budgets page (Unit 2 of the #1876 migration). Replaces the legacy
// renderBudgets string render + the #budgets-chart / #budgets-table /
// #overrides-table hydration that App routed through <LegacyRoute>. The markup is
// a faithful JSX port of budgets.ts (renderBudgetsContent and its helpers),
// preserving every id/class and data-* attribute so the existing CSS, the
// e2e/smoke selectors, and hydrateBudgetChart all keep working.
//
// SCOPE (Unit 2): port markup → JSX and make the bar/pie/area chart family a
// working island (one <BudgetsChart> calling hydrateBudgetChart, which already
// orchestrates the three charts plus the date-picker / weeks / resize / scroll-
// sync controls — none of which write to the data source). The table and
// overrides markup is rendered with `defaultValue` inputs and the data-* blobs,
// but the blur-save / variance-toggle / override-CRUD wiring is Unit 3 — the
// table/overrides hydrators (which call dataSource writes) are NOT invoked here.
//
// The data-loading effect mirrors renderBudgets' Promise.all pipeline UNCHANGED
// in behavior: per-source logError + rethrow, then renderBudgetsContent's derived
// computations. Because Budgets has no <LegacyRoute> wrapper and a React error
// boundary cannot catch an async-effect throw, the hard-error path (renderLoadError
// rethrow of programmer/data-integrity/range, then LegacyRoute's formatRouteError
// mapping) is reproduced inline as error state — the same shift Transactions made.
import { useEffect, useRef, useState, type RefObject } from "react";
import { Metric } from "@commons-systems/ds";
import { classifyError } from "@commons-systems/errorutil/classify";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import {
  type Budget,
  type BudgetOverride,
  type BudgetPeriod,
  type Rollover,
  type AllowancePeriod,
  type SerializedBudgetPeriod,
  type WeeklyAggregate,
} from "../firestore.js";
import {
  computeAverageWeeklyCredits,
  computeAverageWeeklySpending,
  computeBudgetStatsAndVariances,
  computePerBudgetTrend,
  isFavorableDiff,
  weeklyEquivalent,
  periodEquivalent,
  type CategoryActualRow,
  type PerBudgetCategoryVariance,
  type PerBudgetPoint,
  type PerBudgetStats,
} from "../balance.js";
import { formatCurrency } from "../format.js";
import { toISODate } from "./hydrate-util.js";
import { type RenderPageOptions } from "./render-options.js";
import { type SerializedBudget } from "./budgets.js";
import { hydrateBudgetChart } from "./budgets-hydrate.js";
import { useBudgetTableInteractivity, useOverridesTableInteractivity } from "./use-budget-table.js";

const rolloverOptions: { value: Rollover; label: string }[] = [
  { value: "none", label: "None" },
  { value: "debt", label: "Debt only" },
  { value: "balance", label: "Full balance" },
];

const periodOptions: { value: AllowancePeriod; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];

// renderPeriodCell / renderRolloverCell (budgets.ts:22-38) → JSX. The legacy
// renderer emitted the matched <option ... selected> HTML attribute; the React
// equivalent is `defaultValue` on the <select>, which sets the select's `.value`
// and the matching option's `.selected` PROPERTY. (Setting `selected` directly on
// each <option> via a prop is unreliable — happy-dom + React resolve the
// per-option booleans in the wrong order and land on the wrong option; the
// `defaultValue` path resolves the value atomically and is correct in both
// happy-dom and real browsers.)
//
// UNIT 3 REQUIREMENT: React sets only the option's `.selected` PROPERTY and the
// select's `.value`, NOT the `selected` HTML attribute — verified empirically.
// So `target.querySelector("option[selected]")` (the attribute selector used in
// hydrateBudgetTable's change handler and hydrate-util.showInputError) returns
// null against a React-rendered select. When Unit 3 ports the blur-save/change
// wiring into React, it must read the last-saved value from `target.value` (or
// track it in component state) instead of `option[selected]`.
function PeriodCell({ budget, editable }: { budget: Budget; editable: boolean }) {
  return (
    <select className="edit-period" aria-label="Period" disabled={!editable} defaultValue={budget.allowancePeriod}>
      {periodOptions.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function RolloverCell({ budget, editable }: { budget: Budget; editable: boolean }) {
  return (
    <select className="edit-rollover" aria-label="Rollover" disabled={!editable} defaultValue={budget.rollover}>
      {rolloverOptions.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// renderDiffCell (budgets.ts:40-46) → JSX.
function DiffCell({ value }: { value: number }) {
  const favorable = isFavorableDiff(value);
  const arrow = favorable ? "▼" : "▲";
  const label = favorable ? "favorable" : "unfavorable";
  const cls = favorable ? "variance-favorable" : "variance-unfavorable";
  return (
    <span className={cls}>
      <span className="variance-indicator" aria-label={label}>{arrow}</span> {formatCurrency(value)}
    </span>
  );
}

// renderRow (budgets.ts:52-92) → JSX. data-budget-id is on every row regardless
// of edit permission so the variance hydrator can scope its radio-group name.
// Inputs use defaultValue so Unit 3 can attach blur-save listeners.
function BudgetRow({ budget, editable, stats, variance }: {
  budget: Budget;
  editable: boolean;
  stats: PerBudgetStats | undefined;
  variance: PerBudgetCategoryVariance;
}) {
  const avg12 = stats ? formatCurrency(periodEquivalent(stats.avg.avg12, budget.allowancePeriod)) : "$0";
  const avg52 = stats ? formatCurrency(periodEquivalent(stats.avg.avg52, budget.allowancePeriod)) : "$0";
  const weeklyAllow = weeklyEquivalent(budget.allowance, budget.allowancePeriod);

  return (
    <details className="expand-row budget-row" data-budget-id={budget.id}>
      <summary>
        <div className="expand-summary budget-summary-content">
          <span><input type="text" className="edit-name" defaultValue={budget.name} aria-label="Name" disabled={!editable} /></span>
          <span><input type="number" className="edit-allowance" defaultValue={String(budget.allowance)} min="0" aria-label="Allowance" disabled={!editable} /></span>
          <span><PeriodCell budget={budget} editable={editable} /></span>
          <span>{stats ? <DiffCell value={stats.diff.diff12} /> : <span></span>}</span>
          <span>{stats ? <DiffCell value={stats.diff.diff52} /> : <span></span>}</span>
          <span><RolloverCell budget={budget} editable={editable} /></span>
          <span className="avg-col">{avg12}</span>
          <span className="avg-col">{avg52}</span>
        </div>
      </summary>
      <div
        className="budget-variance"
        data-weekly-allowance={String(weeklyAllow)}
        data-window12={serializeCategoryRows(variance[12])}
        data-window52={serializeCategoryRows(variance[52])}
      ></div>
    </details>
  );
}

// The data-* blobs were escapeHtml(JSON.stringify(...)) in the string renderer;
// in JSX React escapes the attribute value itself, so the source value is the
// raw JSON string (matching the Transactions data-budget-periods idiom).
function serializeCategoryRows(rows: readonly CategoryActualRow[]): string {
  return JSON.stringify(rows);
}

// renderBudgetTable (budgets.ts:94-124) → JSX. The containerRef is the host for
// useBudgetTableInteractivity (toggle/blur/change delegation).
function BudgetTable({ budgets, authorized, stats, variances, containerRef }: {
  budgets: Budget[];
  authorized: boolean;
  stats: Map<Budget["id"], PerBudgetStats>;
  variances: Map<Budget["id"], PerBudgetCategoryVariance>;
  containerRef: RefObject<HTMLDivElement>;
}) {
  if (budgets.length === 0) {
    return <p>No budgets found.</p>;
  }

  const sorted = [...budgets].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div id="budgets-table" ref={containerRef}>
      <div className="budget-header">
        <span>Name</span>
        <span>Allowance</span>
        <span>Period</span>
        <span>12w Diff</span>
        <span>52w Diff</span>
        <span>Rollover</span>
        <span className="avg-col">12w Avg</span>
        <span className="avg-col">52w Avg</span>
      </div>
      {sorted.map((b) => {
        const variance = variances.get(b.id);
        if (!variance) throw new DataIntegrityError(`Missing variance for budget ${b.id}`);
        return <BudgetRow key={b.id} budget={b} editable={authorized} stats={stats.get(b.id)} variance={variance} />;
      })}
    </div>
  );
}

// serializeBudgets (budgets.ts:140-150) — used for the budget-row blobs AND the
// #add-override data-budgets blob the Unit-3 override hydrator reads.
function serializeBudgets(budgets: Budget[]): string {
  const data: SerializedBudget[] = budgets.map((b) => ({
    id: b.id,
    name: b.name,
    allowance: b.allowance,
    allowancePeriod: b.allowancePeriod,
    rollover: b.rollover,
    overrides: b.overrides.map((o) => ({ dateMs: o.date.toMillis(), balance: o.balance })),
  }));
  return JSON.stringify(data);
}

function serializePeriods(periods: BudgetPeriod[]): string {
  const data: SerializedBudgetPeriod[] = periods.map((p) => ({
    id: p.id,
    budgetId: p.budgetId,
    periodStartMs: p.periodStart.toMillis(),
    periodEndMs: p.periodEnd.toMillis(),
    total: p.total,
    count: p.count,
    categoryBreakdown: p.categoryBreakdown,
  }));
  return JSON.stringify(data);
}

function serializeTrendData(data: readonly PerBudgetPoint[]): string {
  return JSON.stringify(data);
}

// renderMetrics (budgets.ts:165-182) → DS Metric cards. The bespoke <dl>/.metric
// markup mapped to <Metric label value> (which renders the same label-over-value
// shape with the --radius-lg surface). The #budget-metrics wrapper id is kept —
// e2e queries its text. Currency text is unchanged so the "$"/label assertions
// hold.
function BudgetMetrics({ averageWeeklyCredits, totalWeeklyBudget, averageWeeklySpending }: {
  averageWeeklyCredits: number;
  totalWeeklyBudget: number;
  averageWeeklySpending: number;
}) {
  return (
    <div id="budget-metrics" className="budget-metrics">
      <Metric label="12-Week Avg Weekly Credits" value={formatCurrency(averageWeeklyCredits)} />
      <Metric label="Total Weekly Budget" value={formatCurrency(totalWeeklyBudget)} />
      <Metric label="12-Week Avg Weekly Spending" value={formatCurrency(averageWeeklySpending)} />
    </div>
  );
}

// renderChartContainer (budgets.ts:188-205) → JSX. The containers carry the
// data-* blobs hydrateBudgetChart reads; the effect in BudgetsChart wires the
// three charts + controls and returns a teardown.
function ChartContainers({ budgets, periods, perBudgetTrend, averageWeeklyCredits, averageWeeklySpending, totalWeeklyBudget }: {
  budgets: Budget[];
  periods: BudgetPeriod[];
  perBudgetTrend: PerBudgetPoint[];
  averageWeeklyCredits: number;
  averageWeeklySpending: number;
  totalWeeklyBudget: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // hydrateBudgetChart reads #budgets-chart's data-* blobs and the sibling
  // #budgets-pie / #budgets-area-chart / control elements via getElementById; all
  // are rendered below, so they exist by the time this effect runs. The returned
  // teardown disconnects the ResizeObserver and aborts scroll-sync so a remount
  // (App re-keys per navEpoch) does not leak listeners (#1267 class of bug).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    return hydrateBudgetChart(container);
  }, [budgets, periods, perBudgetTrend, averageWeeklyCredits]);

  return (
    <>
      <div id="budgets-chart-controls">
        <label>Jump to: <input type="date" id="chart-date-picker" /></label>
        <label>Weeks: <input type="number" id="area-chart-weeks" defaultValue="3" min="1" max="104" /></label>
      </div>
      <div id="budgets-area-chart" data-per-budget-trend={serializeTrendData(perBudgetTrend)}></div>
      <div id="budgets-chart" ref={containerRef} data-budgets={serializeBudgets(budgets)} data-periods={serializePeriods(periods)}></div>
      <div className="below-bar-chart-row">
        <BudgetMetrics
          averageWeeklyCredits={averageWeeklyCredits}
          totalWeeklyBudget={totalWeeklyBudget}
          averageWeeklySpending={averageWeeklySpending}
        />
        <div id="budgets-pie" data-average-weekly-credits={String(averageWeeklyCredits)}></div>
      </div>
    </>
  );
}

// renderOverrideRow (budgets.ts:208-223) → JSX. Inputs use defaultValue; the
// blur-save / delete wiring is Unit 3.
function OverrideRow({ budgetId, budgetName, override, index, editable }: {
  budgetId: string;
  budgetName: string;
  override: BudgetOverride;
  index: number;
  editable: boolean;
}) {
  const dateStr = toISODate(override.date.toMillis());
  return (
    <div className="override-row" data-budget-id={budgetId} data-override-index={index}>
      <span>{budgetName}</span>
      <span><input type="date" className="edit-override-date" defaultValue={dateStr} aria-label="Override date" disabled={!editable} /></span>
      <span><input type="number" className="edit-override-balance" defaultValue={String(override.balance)} step="0.01" aria-label="Override balance" disabled={!editable} /></span>
      <span>{editable ? <button className="delete-override" aria-label="Delete override">Delete</button> : null}</span>
    </div>
  );
}

// renderOverridesTable (budgets.ts:225-253) → JSX. The containerRef is the host
// for useOverridesTableInteractivity (blur/click delegation + add/delete CRUD).
function OverridesTable({ budgets, authorized, containerRef }: { budgets: Budget[]; authorized: boolean; containerRef: RefObject<HTMLDivElement> }) {
  const allOverrides: { budgetId: string; budgetName: string; override: BudgetOverride; index: number }[] = [];
  for (const b of budgets) {
    for (let i = 0; i < b.overrides.length; i++) {
      allOverrides.push({ budgetId: b.id, budgetName: b.name, override: b.overrides[i], index: i });
    }
  }
  allOverrides.sort((a, b) => a.override.date.toMillis() - b.override.date.toMillis());

  return (
    <div id="overrides-table" ref={containerRef}>
      <h3>Balance Overrides</h3>
      <div className="override-header">
        <span>Budget</span>
        <span>Date</span>
        <span>Balance</span>
        <span></span>
      </div>
      {allOverrides.map((o) => (
        <OverrideRow key={`${o.budgetId}-${o.index}`} budgetId={o.budgetId} budgetName={o.budgetName} override={o.override} index={o.index} editable={authorized} />
      ))}
      {authorized ? (
        <button id="add-override" data-budgets={serializeBudgets(budgets)}>Add Override</button>
      ) : null}
    </div>
  );
}

// What the data-loading pipeline resolves to. Mirrors renderBudgetsContent's
// derived locals.
interface LoadedData {
  budgets: Budget[];
  periods: BudgetPeriod[];
  averageWeeklyCredits: number;
  totalWeeklyBudget: number;
  averageWeeklySpending: number;
  perBudgetTrend: PerBudgetPoint[];
  budgetStats: Map<Budget["id"], PerBudgetStats>;
  budgetVariances: Map<Budget["id"], PerBudgetCategoryVariance>;
}

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; data: LoadedData }
  | { status: "error"; message: string };

// Mirror renderLoadError's classification (render-options.ts:20-27) →
// LegacyRoute.formatRouteError mapping, reproduced inline because an async effect
// cannot rethrow into a React error boundary (same as Transactions).
function loadErrorMessage(error: unknown): string {
  const kind = classifyError(error);
  if (kind === "programmer") {
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

// The renderBudgets data pipeline (budgets.ts:279-298) moved into an effect,
// UNCHANGED in behavior: parallel getBudgets/getBudgetPeriods/getWeeklyAggregates
// with per-source logError + rethrow, then renderBudgetsContent's derived
// computations.
function useBudgetsData(options: RenderPageOptions): LoadState {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    const { dataSource } = options;

    (async () => {
      try {
        const [budgets, periods, weeklyAggregates]: [Budget[], BudgetPeriod[], WeeklyAggregate[]] = await Promise.all([
          dataSource.getBudgets()
            .catch((e) => { logError(e, { operation: "load-budgets" }); throw e; }),
          dataSource.getBudgetPeriods()
            .catch((e) => { logError(e, { operation: "load-budget-periods" }); throw e; }),
          dataSource.getWeeklyAggregates()
            .catch((e) => { logError(e, { operation: "load-aggregates" }); throw e; }),
        ]);

        const averageWeeklyCredits = computeAverageWeeklyCredits(weeklyAggregates);
        const totalWeeklyBudget = budgets.reduce((s, b) => s + weeklyEquivalent(b.allowance, b.allowancePeriod), 0);
        const averageWeeklySpending = computeAverageWeeklySpending(periods);
        const perBudgetTrend = computePerBudgetTrend(budgets, periods, weeklyAggregates);
        const { stats: budgetStats, variances: budgetVariances } = computeBudgetStatsAndVariances(budgets, periods);

        if (cancelled) return;
        setState({
          status: "loaded",
          data: {
            budgets,
            periods,
            averageWeeklyCredits,
            totalWeeklyBudget,
            averageWeeklySpending,
            perBudgetTrend,
            budgetStats,
            budgetVariances,
          },
        });
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

function LoadedBudgets({ data, authorized }: { data: LoadedData; authorized: boolean }) {
  // Two sibling containers (not nested): #budgets-table and #overrides-table.
  // Each interactivity hook delegates onto its own container ref, mirroring the
  // legacy hydrateBudgetTable / hydrateOverridesTable being called separately.
  const tableRef = useRef<HTMLDivElement>(null);
  const overridesRef = useRef<HTMLDivElement>(null);

  useBudgetTableInteractivity(tableRef, authorized);
  useOverridesTableInteractivity(overridesRef, authorized);

  return (
    <>
      <ChartContainers
        budgets={data.budgets}
        periods={data.periods}
        perBudgetTrend={data.perBudgetTrend}
        averageWeeklyCredits={data.averageWeeklyCredits}
        averageWeeklySpending={data.averageWeeklySpending}
        totalWeeklyBudget={data.totalWeeklyBudget}
      />
      <BudgetTable
        budgets={data.budgets}
        authorized={authorized}
        stats={data.budgetStats}
        variances={data.budgetVariances}
        containerRef={tableRef}
      />
      {data.budgets.length > 0 ? <OverridesTable budgets={data.budgets} authorized={authorized} containerRef={overridesRef} /> : null}
    </>
  );
}

export function Budgets({ options }: { options: RenderPageOptions }) {
  const load = useBudgetsData(options);

  return (
    <main id="app">
      <h2>Budgets</h2>
      {options.authorized ? null : (
        <p id="seed-data-notice">Viewing example data. Load a data file to see your budgets.</p>
      )}
      {load.status === "error" ? (
        <p id="budgets-error">{load.message}</p>
      ) : load.status === "loaded" ? (
        <LoadedBudgets data={load.data} authorized={options.authorized} />
      ) : null}
    </main>
  );
}
