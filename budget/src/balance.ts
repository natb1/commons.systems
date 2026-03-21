import type { Timestamp } from "firebase/firestore";
import type { AllowancePeriod, Budget, BudgetId, BudgetOverride, BudgetPeriod, Rollover, Statement, Transaction, TransactionId } from "./firestore.js";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";

export const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
export const UNBUDGETED_SERIES = "Other";
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

function netAmount(t: Transaction): number {
  return computeNetAmount(t.amount, t.reimbursement);
}

/** Filter to timestamped credit transactions (negative net amount), excluding non-primary normalized duplicates. */
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

/**
 * Compute the allowance for a period based on the allowance period type.
 * Weekly: always returns the full allowance.
 * Monthly: returns the full allowance when the period crosses a UTC month boundary
 * (different month/year from the previous period), 0 otherwise.
 * Quarterly: returns the full allowance when the period crosses a UTC quarter boundary
 * (different quarter from the previous period), 0 otherwise.
 * The first period (no previous) always gets the full allowance.
 */
export function periodAllowance(
  allowance: number,
  allowancePeriod: AllowancePeriod,
  prevPeriodStartMs: number | null,
  currentPeriodStartMs: number,
): number {
  if (allowancePeriod === "weekly") return allowance;
  if (allowancePeriod === "quarterly") {
    if (prevPeriodStartMs === null) return allowance;
    const prev = new Date(prevPeriodStartMs);
    const curr = new Date(currentPeriodStartMs);
    if (prev.getUTCFullYear() !== curr.getUTCFullYear() ||
        Math.floor(prev.getUTCMonth() / 3) !== Math.floor(curr.getUTCMonth() / 3)) {
      return allowance;
    }
    return 0;
  }
  if (prevPeriodStartMs === null) return allowance;
  const prev = new Date(prevPeriodStartMs);
  const curr = new Date(currentPeriodStartMs);
  if (prev.getUTCFullYear() !== curr.getUTCFullYear() || prev.getUTCMonth() !== curr.getUTCMonth()) {
    return allowance;
  }
  return 0;
}

/** Convert an allowance to its weekly equivalent for apples-to-apples comparison. */
export function weeklyEquivalent(allowance: number, allowancePeriod: AllowancePeriod): number {
  if (allowancePeriod === "monthly") return allowance * 12 / 52;
  if (allowancePeriod === "quarterly") return allowance * 4 / 52;
  return allowance;
}

export function periodsForBudget(periods: BudgetPeriod[], budgetId: BudgetId): BudgetPeriod[] {
  return periods
    .filter((p) => p.budgetId === budgetId)
    .sort((a, b) => a.periodStart.toMillis() - b.periodStart.toMillis());
}

/** Return the latest override with date <= beforeMs, or null. Assumes overrides are sorted by date ascending. */
export function findLatestOverride(overrides: BudgetOverride[], beforeMs: number): BudgetOverride | null {
  let result: BudgetOverride | null = null;
  for (const o of overrides) {
    if (o.date.toMillis() <= beforeMs) result = o;
    else break;
  }
  return result;
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

  // Check for override that applies at or before the target period start
  const targetStartMs = targetPeriod.periodStart.toMillis();
  const override = findLatestOverride(budget.overrides, targetStartMs);

  // Determine which period to start accumulating from
  let startIdx = 0;
  let running = 0;

  if (override) {
    const overrideMs = override.date.toMillis();
    // Find the period containing the override date
    const overridePeriodIdx = periods.findIndex(
      (p) => p.periodStart.toMillis() <= overrideMs && overrideMs < p.periodEnd.toMillis(),
    );
    if (overridePeriodIdx !== -1 && overridePeriodIdx <= targetPeriodIndex) {
      // Start from the override: set balance to override value, subtract the override period's total, then continue
      startIdx = overridePeriodIdx + 1;
      running = override.balance - periods[overridePeriodIdx].total;
    }
  }

  if (!override) {
    // No override: accumulate through all prior periods
    for (let i = 0; i < targetPeriodIndex; i++) {
      const prevMs = i > 0 ? periods[i - 1].periodStart.toMillis() : null;
      const allow = periodAllowance(budget.weeklyAllowance, budget.allowancePeriod, prevMs, periods[i].periodStart.toMillis());
      running = applyRollover(running, allow, budget.rollover);
      running -= periods[i].total;
    }
  } else if (startIdx <= targetPeriodIndex) {
    // Override was in a prior period; continue accumulating from after override period
    for (let i = startIdx; i < targetPeriodIndex; i++) {
      const prevMs = i > 0 ? periods[i - 1].periodStart.toMillis() : null;
      const allow = periodAllowance(budget.weeklyAllowance, budget.allowancePeriod, prevMs, periods[i].periodStart.toMillis());
      running = applyRollover(running, allow, budget.rollover);
      running -= periods[i].total;
    }
  }

  // Apply rollover entering the target period (unless override is in this period)
  if (override && periods.findIndex(
    (p) => p.periodStart.toMillis() <= override.date.toMillis() && override.date.toMillis() < p.periodEnd.toMillis(),
  ) === targetPeriodIndex) {
    // Override is in the target period: running starts at override balance
    running = override.balance;
  } else {
    const prevMs = targetPeriodIndex > 0 ? periods[targetPeriodIndex - 1].periodStart.toMillis() : null;
    const allow = periodAllowance(budget.weeklyAllowance, budget.allowancePeriod, prevMs, targetPeriod.periodStart.toMillis());
    running = applyRollover(running, allow, budget.rollover);
  }

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
    for (let idx = 0; idx < sorted.length; idx++) {
      const period = sorted[idx];
      const periodStartMs = period.periodStart.toMillis();
      const periodEndMs = period.periodEnd.toMillis();
      const override = findLatestOverride(budget.overrides, periodStartMs);
      const prevMs = idx > 0 ? sorted[idx - 1].periodStart.toMillis() : null;
      const allow = periodAllowance(budget.weeklyAllowance, budget.allowancePeriod, prevMs, periodStartMs);

      let running: number;
      if (override && override.date.toMillis() >= periodStartMs && override.date.toMillis() < periodEndMs) {
        // Override is in this period: replaces rollover
        running = override.balance;
      } else {
        running = applyRollover(accumulated, allow, budget.rollover);
      }
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

    for (let pIdx = 0; pIdx < periods.length; pIdx++) {
      const period = periods[pIdx];
      const periodStartMs = period.periodStart.toMillis();
      const periodEndMs = period.periodEnd.toMillis();

      const override = findLatestOverride(budget.overrides, periodStartMs);
      const prevMs = pIdx > 0 ? periods[pIdx - 1].periodStart.toMillis() : null;
      const allow = periodAllowance(budget.weeklyAllowance, budget.allowancePeriod, prevMs, periodStartMs);
      let running: number;
      if (override && override.date.toMillis() >= periodStartMs && override.date.toMillis() < periodEndMs) {
        accumulated = override.balance;
        running = accumulated;
      } else {
        accumulated = applyRollover(accumulated, allow, budget.rollover);
        running = accumulated;
      }

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
  readonly avg3Spending: number;
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

/** Normalize a Date to the Sunday of the same week, returning "M/D" label and ms timestamp. */
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
 * Compute per-budget 3-week rolling average of non-credit spending.
 * Includes an "Other" series when qualifying unbudgeted transactions exist.
 */
export function computePerBudgetTrend(
  budgets: Budget[],
  periods: BudgetPeriod[],
  transactions: Transaction[],
): PerBudgetPoint[] {
  const { weeks: periodsWeeks } = indexPeriodsByWeek(periods);
  const weekMap = new Map(periodsWeeks);

  // Also include weeks from unbudgeted transactions
  const unbudgetedTxns = transactions.filter(
    (t): t is Transaction & { timestamp: Timestamp } =>
      t.budget === null
      && t.timestamp !== null
      && (t.normalizedId === null || t.normalizedPrimary)
      && computeNetAmount(t.amount, t.reimbursement) > 0,
  );
  for (const t of unbudgetedTxns) {
    const entry = toSundayEntry(t.timestamp.toDate());
    if (!weekMap.has(entry.ms)) weekMap.set(entry.ms, entry.label);
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

  // "Other" spending from unbudgeted transactions
  const otherWeekly = new Map<number, number>();
  for (const t of unbudgetedTxns) {
    const entry = toSundayEntry(t.timestamp.toDate());
    otherWeekly.set(entry.ms, (otherWeekly.get(entry.ms) ?? 0) + computeNetAmount(t.amount, t.reimbursement));
  }
  if (otherWeekly.size > 0) perBudgetWeekly.set(UNBUDGETED_SERIES, otherWeekly);

  const result: PerBudgetPoint[] = [];
  for (const [budgetName, weeklyMap] of perBudgetWeekly) {
    const values = weeks.map(([ms]) => weeklyMap.get(ms) ?? 0);
    const avg3 = computeRollingAverage(values, 3);
    for (let i = 0; i < weeks.length; i++) {
      result.push({
        weekLabel: weeks[i][1],
        weekMs: weeks[i][0],
        budget: budgetName,
        avg3Spending: avg3[i],
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

/** Return the start of the next Monday 00:00 UTC from a millisecond timestamp. A Monday input advances to the following Monday. */
function endOfWeekMs(timestampMs: number): number {
  const d = new Date(timestampMs);
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, ...
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const nextMonday = new Date(Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() + daysUntilMonday,
  ));
  return nextMonday.getTime();
}

/**
 * Compute average weekly credits over the trailing 12-week window ending at the
 * Monday after the latest credit transaction. Credit transactions are identified
 * by negative net amount. Transfer:CardPayment transactions are excluded even
 * when negative, to avoid double-counting card payment flows. Non-primary
 * normalized duplicates and null-timestamp transactions are excluded. Returns 0
 * when no qualifying credit transactions exist. Values are negated before
 * summing to produce positive display amounts.
 */
export function computeAverageWeeklyCredits(transactions: Transaction[]): number {
  const creditTxns = filterCreditTransactions(transactions);

  if (creditTxns.length === 0) return 0;

  let latestMs = -Infinity;
  for (const t of creditTxns) {
    const ms = t.timestamp.toMillis();
    if (ms > latestMs) latestMs = ms;
  }
  const windowEnd = endOfWeekMs(latestMs);
  const windowStart = windowEnd - CREDIT_WEEKS * MS_PER_WEEK;

  let sum = 0;
  for (const t of creditTxns) {
    const ms = t.timestamp.toMillis();
    if (ms >= windowStart && ms < windowEnd) {
      sum += -netAmount(t);
    }
  }

  return sum / CREDIT_WEEKS;
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
  readonly expected: number;
  readonly derived: number;
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
  // Date.UTC with 1-based month gives first of next month (month param is 0-based)
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

  type AccountKey = string;
  const key = (inst: string, acct: string): AccountKey => `${inst}\0${acct}`;

  // Group statements by account, keep latest per account
  const latestStmts = new Map<AccountKey, Statement>();
  const allStmts = new Map<AccountKey, Statement[]>();
  for (const s of validStatements) {
    const k = key(s.institution, s.account);
    if (!allStmts.has(k)) allStmts.set(k, []);
    allStmts.get(k)!.push(s);
    const existing = latestStmts.get(k);
    if (!existing || s.period > existing.period) {
      latestStmts.set(k, s);
    }
  }

  // Group non-duplicate timestamped transactions by account
  const accountTxns = new Map<AccountKey, TimestampedTransaction[]>();
  for (const t of transactions) {
    if (t.timestamp === null) continue;
    if (t.normalizedId !== null && !t.normalizedPrimary) continue;
    const k = key(t.institution, t.account);
    if (!accountTxns.has(k)) accountTxns.set(k, []);
    accountTxns.get(k)!.push(t as TimestampedTransaction);
  }

  // For each account, compute balance at each week and verify against statements
  const accountWeekBalances = new Map<AccountKey, number[]>();
  const divergences: BalanceDivergence[] = [];

  for (const [k, anchor] of latestStmts) {
    const anchorMs = periodToAnchorMs(anchor.period);
    const anchorBalance = anchor.balance;

    const txns = accountTxns.get(k) ?? [];
    txns.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());

    // Cache transaction timestamps and net amounts for cumSumBefore lookups
    const txnTimes = txns.map(t => t.timestamp.toMillis());
    const txnNets = txns.map(t => computeNetAmount(t.amount, t.reimbursement));

    // cumSumBefore: cumulative net amount for txns before timestamp T. Uses sorted txnTimes with early break. Retained for non-sequential lookups (divergence verification) where the advancing pointer cannot be used.
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
      const stmtMs = periodToAnchorMs(stmt.period);
      const stmtCum = cumSumBefore(stmtMs);
      const derived = anchorBalance - (stmtCum - anchorCum);
      if (Math.abs(derived - stmt.balance) > 0.01) {
        const [inst, acct] = k.split("\0");
        divergences.push({
          institution: inst,
          account: acct,
          period: stmt.period,
          expected: stmt.balance,
          derived,
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
