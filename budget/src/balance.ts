import type { Timestamp } from "firebase/firestore";
import type { Budget, BudgetId, BudgetPeriod, Rollover, Transaction, TransactionId } from "./firestore.js";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";

export const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const INCOME_WEEKS = 12;

export function computeNetAmount(amount: number, reimbursement: number): number {
  if (reimbursement < 0 || reimbursement > 100) {
    throw new RangeError(`reimbursement must be between 0 and 100, got ${reimbursement}`);
  }
  return amount * (1 - reimbursement / 100);
}

interface TimestampedTransaction extends Transaction {
  readonly timestamp: Timestamp;
}

function netAmount(t: Transaction): number {
  return computeNetAmount(t.amount, t.reimbursement);
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
  readonly avg12Income: number;
  readonly avg12Spending: number;
  readonly avg3Spending: number;
}

export interface PerBudgetPoint {
  readonly weekLabel: string;
  readonly weekMs: number;
  readonly budget: string;
  readonly avg3Spending: number;
}

/** Compute trailing rolling average. For indices with fewer than `windowSize` prior values, averages over available values. */
export function computeRollingAverage(values: number[], windowSize: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = values.slice(start, i + 1);
    result.push(window.reduce((a, b) => a + b, 0) / window.length);
  }
  return result;
}

/** Normalize a Date to the Sunday of the same week, returning "M/D" label and ms timestamp. */
function toSundayEntry(d: Date): { label: string; ms: number } {
  const sun = new Date(d);
  sun.setDate(sun.getDate() - sun.getDay());
  const label = `${sun.getMonth() + 1}/${sun.getDate()}`;
  return { label, ms: sun.getTime() };
}

/** Build ordered unique week entries from period start dates, sorted chronologically. */
function weekEntriesFromPeriods(periods: BudgetPeriod[]): [number, string][] {
  const weekMap = new Map<number, string>();
  for (const p of periods) {
    const entry = toSundayEntry(p.periodStart.toDate());
    if (!weekMap.has(entry.ms)) weekMap.set(entry.ms, entry.label);
  }
  return [...weekMap.entries()].sort((a, b) => a[0] - b[0]);
}

/**
 * Compute aggregate trend data: rolling averages of income and spending per week.
 * Weeks are derived from budget periods. Income is computed from transactions.
 */
export function computeAggregateTrend(
  periods: BudgetPeriod[],
  transactions: Transaction[],
): AggregatePoint[] {
  const weeks = weekEntriesFromPeriods(periods);
  if (weeks.length === 0) return [];

  // Weekly spending: sum of all period totals per week (single pass)
  const weeklySpending = new Map<number, number>();
  for (const p of periods) {
    const entry = toSundayEntry(p.periodStart.toDate());
    weeklySpending.set(entry.ms, (weeklySpending.get(entry.ms) ?? 0) + p.total);
  }

  // Weekly income: sum income transactions per week
  const incomeTxns = transactions.filter(
    (t): t is Transaction & { timestamp: Timestamp } =>
      t.category.startsWith("Income")
      && t.timestamp !== null
      && (t.normalizedId === null || t.normalizedPrimary),
  );
  const weeklyIncome = new Map<number, number>();
  for (const t of incomeTxns) {
    const entry = toSundayEntry(t.timestamp.toDate());
    weeklyIncome.set(entry.ms, (weeklyIncome.get(entry.ms) ?? 0) + computeNetAmount(t.amount, t.reimbursement));
  }

  const spendingValues = weeks.map(([ms]) => weeklySpending.get(ms) ?? 0);
  const incomeValues = weeks.map(([ms]) => weeklyIncome.get(ms) ?? 0);

  const avg12Spending = computeRollingAverage(spendingValues, 12);
  const avg3Spending = computeRollingAverage(spendingValues, 3);
  const avg12Income = computeRollingAverage(incomeValues, 12);

  return weeks.map(([ms, label], i) => ({
    weekLabel: label,
    weekMs: ms,
    avg12Income: avg12Income[i],
    avg12Spending: avg12Spending[i],
    avg3Spending: avg3Spending[i],
  }));
}

/**
 * Compute per-budget 3-week rolling average of non-income spending.
 * Includes an "Other" series for transactions with no budget assignment.
 */
export function computePerBudgetTrend(
  budgets: Budget[],
  periods: BudgetPeriod[],
  transactions: Transaction[],
): PerBudgetPoint[] {
  const weekMap = new Map(weekEntriesFromPeriods(periods));

  // Also include weeks from unbudgeted transactions
  const unbudgetedTxns = transactions.filter(
    (t): t is Transaction & { timestamp: Timestamp } =>
      t.budget === null
      && t.timestamp !== null
      && (t.normalizedId === null || t.normalizedPrimary)
      && !t.category.startsWith("Income"),
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
  if (otherWeekly.size > 0) perBudgetWeekly.set("Other", otherWeekly);

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
  const weeks = weekEntriesFromPeriods(periods);
  if (weeks.length === 0) return 0;

  const weekTotals = new Map<number, number>();
  for (const p of periods) {
    const entry = toSundayEntry(p.periodStart.toDate());
    weekTotals.set(entry.ms, (weekTotals.get(entry.ms) ?? 0) + p.total);
  }

  const trailing = weeks.slice(-12);
  return trailing.reduce((sum, [ms]) => sum + (weekTotals.get(ms) ?? 0), 0) / trailing.length;
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
 * Compute average weekly income over the trailing 12-week window ending at the
 * Monday after the latest income transaction. Income transactions are identified
 * by categories starting with "Income". Non-primary normalized duplicates and
 * null-timestamp transactions are excluded. Returns 0 when no qualifying income
 * transactions exist. Amounts are absolute-valued before summing, so both
 * positive and negative income conventions produce a positive result.
 */
export function computeAverageWeeklyIncome(transactions: Transaction[]): number {
  const incomeTxns = transactions.filter(
    (t): t is Transaction & { timestamp: Timestamp } =>
      t.category.startsWith("Income")
      && t.timestamp !== null
      && (t.normalizedId === null || t.normalizedPrimary),
  );

  if (incomeTxns.length === 0) return 0;

  let latestMs = -Infinity;
  for (const t of incomeTxns) {
    const ms = t.timestamp.toMillis();
    if (ms > latestMs) latestMs = ms;
  }
  const windowEnd = endOfWeekMs(latestMs);
  const windowStart = windowEnd - INCOME_WEEKS * MS_PER_WEEK;

  let sum = 0;
  for (const t of incomeTxns) {
    const ms = t.timestamp.toMillis();
    if (ms >= windowStart && ms < windowEnd) {
      sum += Math.abs(computeNetAmount(t.amount, t.reimbursement));
    }
  }

  return sum / INCOME_WEEKS;
}
