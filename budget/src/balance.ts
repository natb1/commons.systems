import type { Timestamp } from "firebase/firestore";
import type { Budget, BudgetId, BudgetPeriod, Rollover, Statement, Transaction, TransactionId, WeeklyAggregate } from "./firestore.js";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";

export const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
export const UNBUDGETED_SERIES = "Other";
const BALANCE_TOLERANCE_DOLLARS = 0.01;

/** Return the Monday 00:00 UTC for the week containing `ms`. */
export function weekStart(ms: number): number {
  const d = new Date(ms);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

const CREDIT_WEEKS = 12;

export function computeNetAmount(amount: number, reimbursement: number): number {
  if (reimbursement < 0 || reimbursement > 100) {
    throw new RangeError(`reimbursement must be between 0 and 100, got ${reimbursement}`);
  }
  return amount * (1 - reimbursement / 100);
}

interface TimestampedTransaction extends Transaction {
  readonly timestamp: Timestamp;
}

export function isCardPaymentCategory(category: string): boolean {
  return category === "Transfer:CardPayment" || category.startsWith("Transfer:CardPayment:");
}

/** Composite map key for an (institution, account) pair. Uses null byte separator (cannot appear in institution/account strings). */
export function accountKey(institution: string, account: string): string {
  return `${institution}\0${account}`;
}

/** Split a composite account key back into [institution, account]. */
export function splitAccountKey(key: string): [string, string] {
  const idx = key.indexOf("\0");
  if (idx === -1) throw new DataIntegrityError(`Invalid account key: missing separator`);
  return [key.substring(0, idx), key.substring(idx + 1)];
}

function netAmount(t: Transaction): number {
  return computeNetAmount(t.amount, t.reimbursement);
}

/** Filter to timestamped credit transactions (negative net amount), excluding non-primary normalized duplicates and card payment transfers. */
function filterCreditTransactions(transactions: Transaction[]): TimestampedTransaction[] {
  return transactions.filter(
    (t): t is TimestampedTransaction =>
      computeNetAmount(t.amount, t.reimbursement) < 0
      && t.timestamp !== null
      && (t.normalizedId === null || t.normalizedPrimary)
      && !isCardPaymentCategory(t.category),
  );
}

function compareByTimestampThenId(a: TimestampedTransaction, b: TimestampedTransaction): number {
  const diff = a.timestamp.toMillis() - b.timestamp.toMillis();
  if (diff !== 0) return diff;
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

export function applyRollover(running: number, weeklyAllowance: number, rollover: Rollover): number {
  switch (rollover) {
    case "none":
      return weeklyAllowance;
    case "debt":
      return Math.min(running, 0) + weeklyAllowance;
    case "balance":
      return running + weeklyAllowance;
  }
}

export function periodsForBudget(periods: BudgetPeriod[], budgetId: BudgetId): BudgetPeriod[] {
  return periods
    .filter((p) => p.budgetId === budgetId)
    .sort((a, b) => a.periodStart.toMillis() - b.periodStart.toMillis());
}

// Exclude non-primary normalized transactions to avoid double-counting duplicates
function transactionsForBudget(txns: Transaction[], budgetId: BudgetId): TimestampedTransaction[] {
  return txns
    .filter((t): t is TimestampedTransaction =>
      t.budget === budgetId
      && t.timestamp !== null
      && (t.normalizedId === null || t.normalizedPrimary))
    .sort(compareByTimestampThenId);
}

export function findPeriodForTimestamp(
  periods: BudgetPeriod[],
  budgetId: BudgetId,
  timestamp: Timestamp,
): BudgetPeriod | null {
  const ms = timestamp.toMillis();
  for (const p of periods) {
    if (p.budgetId === budgetId && p.periodStart.toMillis() <= ms && ms < p.periodEnd.toMillis()) {
      return p;
    }
  }
  return null;
}

export function computeBudgetBalance(
  txn: Transaction,
  allTransactions: Transaction[],
  budget: Budget,
  budgetPeriods: BudgetPeriod[],
): number | null {
  if (txn.budget === null || txn.timestamp === null) return null;

  const periods = periodsForBudget(budgetPeriods, budget.id);

  const txnMs = txn.timestamp.toMillis();
  const targetPeriodIndex = periods.findIndex(
    (p) => p.periodStart.toMillis() <= txnMs && txnMs < p.periodEnd.toMillis(),
  );
  if (targetPeriodIndex === -1) return null;

  const targetPeriod = periods[targetPeriodIndex];

  // Accumulate balance through prior periods
  let running = 0;
  for (let i = 0; i < targetPeriodIndex; i++) {
    running = applyRollover(running, budget.weeklyAllowance, budget.rollover);
    running -= periods[i].total;
  }

  // Apply rollover entering the target period
  running = applyRollover(running, budget.weeklyAllowance, budget.rollover);

  // Walk same-period transactions up to and including the target transaction
  const periodStartMs = targetPeriod.periodStart.toMillis();
  const periodEndMs = targetPeriod.periodEnd.toMillis();
  const samePeriodTxns = transactionsForBudget(allTransactions, budget.id)
    .filter(
      (t) =>
        t.timestamp.toMillis() >= periodStartMs &&
        t.timestamp.toMillis() < periodEndMs,
    );

  let found = false;
  for (const t of samePeriodTxns) {
    running -= netAmount(t);
    if (t.id === txn.id) {
      found = true;
      break;
    }
  }
  if (!found) return null;

  return running;
}

export interface PeriodBalance {
  readonly periodStart: Timestamp;
  /** Net transaction total for this period. May be negative when credits/refunds exceed debits. */
  readonly spent: number;
  readonly runningBalance: number;
}

export function computePeriodBalances(
  budgets: Budget[],
  periods: BudgetPeriod[],
): Map<BudgetId, PeriodBalance[]> {
  const result = new Map<BudgetId, PeriodBalance[]>();
  for (const budget of budgets) {
    const sorted = periodsForBudget(periods, budget.id);
    const balances: PeriodBalance[] = [];
    let accumulated = 0;
    for (const period of sorted) {
      const running = applyRollover(accumulated, budget.weeklyAllowance, budget.rollover);
      accumulated = running - period.total;
      balances.push({
        periodStart: period.periodStart,
        spent: period.total,
        runningBalance: accumulated,
      });
    }
    result.set(budget.id, balances);
  }
  return result;
}

export function computeAllBudgetBalances(
  allTransactions: Transaction[],
  budgets: Budget[],
  budgetPeriods: BudgetPeriod[],
): Map<TransactionId, number> {
  const result = new Map<TransactionId, number>();

  for (const budget of budgets) {
    const periods = periodsForBudget(budgetPeriods, budget.id);
    const txns = transactionsForBudget(allTransactions, budget.id);

    let accumulated = 0;
    let txnIdx = 0;

    for (const period of periods) {
      const periodStartMs = period.periodStart.toMillis();
      const periodEndMs = period.periodEnd.toMillis();

      accumulated = applyRollover(accumulated, budget.weeklyAllowance, budget.rollover);
      let running = accumulated;

      // Walk transactions that fall within this period
      while (txnIdx < txns.length) {
        const t = txns[txnIdx];
        const tMs = t.timestamp.toMillis();
        if (tMs >= periodEndMs) break;
        if (tMs >= periodStartMs) {
          running -= netAmount(t);
          result.set(t.id, running);
        }
        txnIdx++;
      }

      // Advance accumulated using period total for next period's rollover
      accumulated -= period.total;
    }
  }

  return result;
}

export interface AggregatePoint {
  readonly weekLabel: string;
  readonly weekMs: number;
  readonly avg12Credits: number;
  readonly avg12Spending: number;
  readonly avg3Spending: number;
  /** Equals `avg12Credits - avg12Spending`. */
  readonly avg12NetCredits: number;
}

export interface PerBudgetPoint {
  readonly weekLabel: string;
  readonly weekMs: number;
  readonly budget: string;
  /** Raw (un-averaged) weekly spending for this budget. */
  readonly spending: number;
}

/** Compute trailing rolling average over a window of `windowSize` values including the current index. For indices with fewer than `windowSize` preceding values, averages over available values. */
export function computeRollingAverage(values: number[], windowSize: number): number[] {
  if (windowSize < 1) throw new RangeError(`windowSize must be >= 1, got ${windowSize}`);
  const result: number[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= windowSize) sum -= values[i - windowSize];
    const count = Math.min(i + 1, windowSize);
    result.push(sum / count);
  }
  return result;
}

/** Normalize a Date to the preceding Sunday 00:00 UTC (start of its Sun–Sat week), returning "M/D" label and ms timestamp. */
export function toSundayEntry(d: Date): { label: string; ms: number } {
  if (isNaN(d.getTime())) throw new DataIntegrityError("toSundayEntry received an invalid Date");
  const sun = new Date(d);
  sun.setUTCDate(sun.getUTCDate() - sun.getUTCDay());
  const label = `${sun.getUTCMonth() + 1}/${sun.getUTCDate()}`;
  return { label, ms: sun.getTime() };
}

/** Build ordered unique week entries and sum totals per week. Returns weeks sorted chronologically. */
function indexPeriodsByWeek(periods: BudgetPeriod[]): {
  weeks: [number, string][];
  weeklySpending: Map<number, number>;
} {
  const weekLabels = new Map<number, string>();
  const weeklySpending = new Map<number, number>();
  for (const p of periods) {
    const entry = toSundayEntry(p.periodStart.toDate());
    if (!weekLabels.has(entry.ms)) weekLabels.set(entry.ms, entry.label);
    weeklySpending.set(entry.ms, (weeklySpending.get(entry.ms) ?? 0) + p.total);
  }
  const weeks: [number, string][] = [...weekLabels.entries()].sort((a, b) => a[0] - b[0]);
  return { weeks, weeklySpending };
}

/**
 * Compute aggregate trend data: rolling averages of credits and spending per week.
 * Weeks are derived from budget periods. Credits are transactions with negative net amounts.
 */
export function computeAggregateTrend(
  periods: BudgetPeriod[],
  transactions: Transaction[],
): AggregatePoint[] {
  const { weeks, weeklySpending } = indexPeriodsByWeek(periods);
  if (weeks.length === 0) return [];

  // Weekly credits: sum credit transactions (negative net) per week, negated to positive.
  const creditTxns = filterCreditTransactions(transactions);
  const weeklyCredits = new Map<number, number>();
  for (const t of creditTxns) {
    const entry = toSundayEntry(t.timestamp.toDate());
    weeklyCredits.set(entry.ms, (weeklyCredits.get(entry.ms) ?? 0) + (-netAmount(t)));
  }

  const spendingValues = weeks.map(([ms]) => weeklySpending.get(ms) ?? 0);
  const creditValues = weeks.map(([ms]) => weeklyCredits.get(ms) ?? 0);

  const avg12Spending = computeRollingAverage(spendingValues, 12);
  const avg3Spending = computeRollingAverage(spendingValues, 3);
  const avg12Credits = computeRollingAverage(creditValues, 12);

  return weeks.map(([ms, label], i) => ({
    weekLabel: label,
    weekMs: ms,
    avg12Credits: avg12Credits[i],
    avg12Spending: avg12Spending[i],
    avg3Spending: avg3Spending[i],
    avg12NetCredits: avg12Credits[i] - avg12Spending[i],
  }));
}

/**
 * Compute per-budget raw weekly non-credit spending.
 * Includes an "Other" series from pre-aggregated unbudgeted spending totals.
 */
export function computePerBudgetTrend(
  budgets: Budget[],
  periods: BudgetPeriod[],
  aggregates: WeeklyAggregate[],
): PerBudgetPoint[] {
  const { weeks: periodsWeeks } = indexPeriodsByWeek(periods);
  const weekMap = new Map(periodsWeeks);

  // Build "Other" weekly spending and register weeks in a single pass
  const otherWeekly = new Map<number, number>();
  for (const a of aggregates) {
    if (a.unbudgetedTotal > 0) {
      const entry = toSundayEntry(a.weekStart.toDate());
      if (!weekMap.has(entry.ms)) weekMap.set(entry.ms, entry.label);
      otherWeekly.set(entry.ms, (otherWeekly.get(entry.ms) ?? 0) + a.unbudgetedTotal);
    }
  }

  const weeks = [...weekMap.entries()].sort((a, b) => a[0] - b[0]);
  if (weeks.length === 0) return [];

  const budgetIdToName = new Map<string, string>();
  for (const b of budgets) budgetIdToName.set(b.id, b.name);

  // Per-budget weekly spending from periods
  const perBudgetWeekly = new Map<string, Map<number, number>>();
  for (const b of budgets) perBudgetWeekly.set(b.name, new Map());

  for (const p of periods) {
    const entry = toSundayEntry(p.periodStart.toDate());
    const name = budgetIdToName.get(p.budgetId);
    if (name === undefined) throw new DataIntegrityError(`Budget period references unknown budget ID "${p.budgetId}"`);
    if (!perBudgetWeekly.has(name)) perBudgetWeekly.set(name, new Map());
    const m = perBudgetWeekly.get(name)!;
    m.set(entry.ms, (m.get(entry.ms) ?? 0) + p.total);
  }

  if (otherWeekly.size > 0) perBudgetWeekly.set(UNBUDGETED_SERIES, otherWeekly);

  const result: PerBudgetPoint[] = [];
  for (const [budgetName, weeklyMap] of perBudgetWeekly) {
    const values = weeks.map(([ms]) => weeklyMap.get(ms) ?? 0);
    for (let i = 0; i < weeks.length; i++) {
      result.push({
        weekLabel: weeks[i][1],
        weekMs: weeks[i][0],
        budget: budgetName,
        spending: values[i],
      });
    }
  }

  return result;
}

/**
 * Compute average weekly spending over the trailing 12 weeks (or all available weeks if fewer than 12 exist).
 * Uses the same week set as the bar chart (from budget periods).
 */
export function computeAverageWeeklySpending(periods: BudgetPeriod[]): number {
  const { weeks, weeklySpending } = indexPeriodsByWeek(periods);
  if (weeks.length === 0) return 0;

  const trailing = weeks.slice(-12);
  return trailing.reduce((sum, [ms]) => sum + (weeklySpending.get(ms) ?? 0), 0) / trailing.length;
}

/**
 * Compute average weekly credits over the trailing CREDIT_WEEKS-week window ending at the
 * Monday following the latest aggregate's weekStart (i.e., weekStart + 7 days).
 * Uses pre-aggregated WeeklyAggregate data (creditTotal per Monday-aligned week).
 * Returns 0 when no weeks have credits.
 */
export function computeAverageWeeklyCredits(aggregates: WeeklyAggregate[]): number {
  const withCredits = aggregates.filter(a => a.creditTotal > 0);
  if (withCredits.length === 0) return 0;

  let latestWeekStartMs = -Infinity;
  for (const a of withCredits) {
    const ms = a.weekStart.toMillis();
    if (ms > latestWeekStartMs) latestWeekStartMs = ms;
  }
  // Window end is next Monday (weekStart + 1 week)
  const windowEnd = latestWeekStartMs + MS_PER_WEEK;
  const windowStart = windowEnd - CREDIT_WEEKS * MS_PER_WEEK;

  let sum = 0;
  for (const a of withCredits) {
    const ms = a.weekStart.toMillis();
    if (ms >= windowStart && ms < windowEnd) {
      sum += a.creditTotal;
    }
  }

  return sum / CREDIT_WEEKS;
}

export interface DerivedAccountBalance {
  readonly institution: string;
  readonly account: string;
  readonly earliestPeriod: string;
  readonly latestPeriod: string;
  readonly derivedBalance: number;
  readonly statementBalance: number;
  readonly discrepancy: number;
}

/**
 * Return the effective timestamp for a statement's balance snapshot.
 * If balanceDate is present (from OFX DTASOF), use midnight UTC on that date.
 * Otherwise fall back to first-of-next-month from the YYYY-MM period.
 */
function statementEffectiveMs(s: Statement): number {
  if (s.balanceDate) {
    const ms = Date.parse(s.balanceDate + "T00:00:00Z");
    if (isNaN(ms)) throw new DataIntegrityError(`Invalid balanceDate: "${s.balanceDate}"`);
    return ms;
  }
  return periodToAnchorMs(s.period);
}

/** Group statements by account key into a Map. */
function groupStatementsByAccount(stmts: Statement[]): Map<string, Statement[]> {
  const result = new Map<string, Statement[]>();
  for (const s of stmts) {
    const k = accountKey(s.institution, s.account);
    if (!result.has(k)) result.set(k, []);
    result.get(k)!.push(s);
  }
  return result;
}

/** Group primary (non-duplicate) timestamped transactions by account as sorted {ms, net} arrays. */
function groupPrimaryTxnsByAccount(transactions: Transaction[]): Map<string, { ms: number; net: number }[]> {
  const result = new Map<string, { ms: number; net: number }[]>();
  for (const t of transactions) {
    if (t.timestamp === null) continue;
    if (t.normalizedId !== null && !t.normalizedPrimary) continue;
    const k = accountKey(t.institution, t.account);
    if (!result.has(k)) result.set(k, []);
    result.get(k)!.push({
      ms: t.timestamp.toMillis(),
      net: computeNetAmount(t.amount, t.reimbursement),
    });
  }
  for (const txns of result.values()) {
    txns.sort((a, b) => a.ms - b.ms);
  }
  return result;
}

/**
 * Compute one derived-balance discrepancy per account: earliest statement balance
 * minus all primary transactions in the window vs latest statement balance.
 *
 * This single-span approach tolerates intermediate OFX noise (pending charges,
 * missing card payments) that causes false positives in per-period checking.
 *
 * Non-primary normalized transactions are excluded.
 */
export function computeDerivedBalances(
  transactions: Transaction[],
  statements: Statement[],
): DerivedAccountBalance[] {
  const validStatements = statements.filter(s => isValidPeriod(s.period));
  if (validStatements.length === 0) return [];

  const stmtsByAccount = groupStatementsByAccount(validStatements);
  const txnsByAccount = groupPrimaryTxnsByAccount(transactions);

  const results: DerivedAccountBalance[] = [];

  for (const [k, stmts] of stmtsByAccount) {
    if (stmts.length < 2) continue;

    // Sort by effectiveMs to find earliest and latest
    stmts.sort((a, b) => statementEffectiveMs(a) - statementEffectiveMs(b));
    const earliest = stmts[0];
    const latest = stmts[stmts.length - 1];

    const earliestMs = statementEffectiveMs(earliest);
    const latestMs = statementEffectiveMs(latest);

    // Sum all primary transactions in (earliestMs, latestMs] — earliest boundary is exclusive
    // because the earliest statement balance already accounts for transactions up to that point
    const txns = txnsByAccount.get(k) ?? [];
    let txnSum = 0;
    for (const txn of txns) {
      if (txn.ms <= earliestMs) continue;
      if (txn.ms > latestMs) break;
      txnSum += txn.net;
    }

    const derivedBalance = earliest.balance - txnSum;
    const discrepancy = Math.round((derivedBalance - latest.balance) * 100) / 100;

    const [inst, acct] = splitAccountKey(k);
    results.push({
      institution: inst,
      account: acct,
      earliestPeriod: earliest.period,
      latestPeriod: latest.period,
      derivedBalance,
      statementBalance: latest.balance,
      discrepancy,
    });
  }

  return results;
}

export interface NetWorthPoint {
  readonly weekLabel: string;
  readonly weekMs: number;
  readonly netWorth: number;
}

export interface BalanceDivergence {
  readonly institution: string;
  readonly account: string;
  readonly period: string;
  readonly statementBalance: number;
  readonly derivedBalance: number;
}

export interface NetWorthResult {
  readonly points: NetWorthPoint[];
  readonly divergences: BalanceDivergence[];
}

/** Return true when the period string matches YYYY-MM format (the only format periodToAnchorMs can convert). */
function isValidPeriod(period: string): boolean {
  return /^\d{4}-\d{2}$/.test(period);
}

/** Convert statement period "YYYY-MM" to first-of-next-month UTC timestamp (anchor boundary). */
function periodToAnchorMs(period: string): number {
  const [yearStr, monthStr] = period.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (isNaN(year) || isNaN(month)) throw new DataIntegrityError(`Invalid statement period: ${period}`);
  // Anchor at first of next month: a "2025-01" statement covers through January,
  // so the boundary is Feb 1. Date.UTC month param is 0-based, so 1-based input works directly.
  return Date.UTC(year, month, 1);
}

/**
 * Compute weekly liquid net worth from transactions and statement balances.
 *
 * For each account, anchors at the latest statement balance and uses cumulative
 * transaction sums relative to the anchor to derive balance at each week boundary. Net worth at each week
 * is the sum of all account balances.
 *
 * Transaction sign convention: positive = spending (reduces balance), negative = credit (increases balance).
 * Statement balance: raw signed from bank (positive = asset, negative = liability).
 *
 * Note: computeDerivedBalances anchors on the earliest statement (forward);
 * this function anchors on the latest (backward interpolation).
 */
export function computeNetWorth(
  transactions: Transaction[],
  statements: Statement[],
  weeks: readonly { label: string; ms: number }[],
): NetWorthResult {
  // Only statements with YYYY-MM periods can be converted to timestamps for balance derivation.
  // Non-YYYY-MM periods (e.g. bank export filenames like "accountActivityExport(3)") are skipped.
  const validStatements = statements.filter(s => isValidPeriod(s.period));
  if (weeks.length === 0 || validStatements.length === 0) return { points: [], divergences: [] };

  const allStmts = groupStatementsByAccount(validStatements);

  // Find latest statement per account
  const latestStmts = new Map<string, Statement>();
  for (const [k, stmts] of allStmts) {
    let latest = stmts[0];
    for (let i = 1; i < stmts.length; i++) {
      if (statementEffectiveMs(stmts[i]) > statementEffectiveMs(latest)) latest = stmts[i];
    }
    latestStmts.set(k, latest);
  }

  // Group primary transactions by account (sorted by ms)
  const txnsByAccount = groupPrimaryTxnsByAccount(transactions);

  // For each account, compute balance at each week and verify against statements
  const accountWeekBalances = new Map<string, number[]>();
  const divergences: BalanceDivergence[] = [];

  for (const [k, anchor] of latestStmts) {
    const anchorMs = statementEffectiveMs(anchor);
    const anchorBalance = anchor.balance;

    const txnData = txnsByAccount.get(k) ?? [];
    const txnTimes = txnData.map(t => t.ms);
    const txnNets = txnData.map(t => t.net);

    // cumSumBefore: cumulative net amount for txns before timestamp T.
    // Uses sorted txnTimes with early break. Retained for non-sequential
    // lookups (divergence verification) where the advancing pointer cannot be used.
    function cumSumBefore(T: number): number {
      let sum = 0;
      for (let i = 0; i < txnTimes.length; i++) {
        if (txnTimes[i] >= T) break;
        sum += txnNets[i];
      }
      return sum;
    }

    const anchorCum = cumSumBefore(anchorMs);

    // Compute balance at each week using an advancing pointer (weeks are sorted chronologically)
    const balances: number[] = [];
    let txnPtr = 0;
    let runningCum = 0;
    for (const week of weeks) {
      while (txnPtr < txnTimes.length && txnTimes[txnPtr] < week.ms) {
        runningCum += txnNets[txnPtr];
        txnPtr++;
      }
      balances.push(anchorBalance - (runningCum - anchorCum));
    }
    accountWeekBalances.set(k, balances);

    // Verify against non-anchor statements (unordered access, use cumSumBefore)
    const stmts = allStmts.get(k) ?? [];
    for (const stmt of stmts) {
      if (stmt.period === anchor.period) continue;
      const stmtMs = statementEffectiveMs(stmt);
      const stmtCum = cumSumBefore(stmtMs);
      const derived = anchorBalance - (stmtCum - anchorCum);
      if (Math.abs(derived - stmt.balance) > BALANCE_TOLERANCE_DOLLARS) {
        const [inst, acct] = splitAccountKey(k);
        divergences.push({
          institution: inst,
          account: acct,
          period: stmt.period,
          statementBalance: stmt.balance,
          derivedBalance: derived,
        });
      }
    }
  }

  // Sum all account balances per week
  const points: NetWorthPoint[] = weeks.map((week, i) => {
    let netWorth = 0;
    for (const balances of accountWeekBalances.values()) {
      netWorth += balances[i];
    }
    return { weekLabel: week.label, weekMs: week.ms, netWorth };
  });

  return { points, divergences };
}
