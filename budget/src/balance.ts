import type { Timestamp } from "firebase/firestore";
import type { Budget, BudgetPeriod, Rollover, Transaction } from "./firestore.js";

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

function applyRollover(running: number, weeklyAllowance: number, rollover: Rollover): number {
  switch (rollover) {
    case "none":
      return weeklyAllowance;
    case "debt":
      return Math.min(running, 0) + weeklyAllowance;
    case "balance":
      return running + weeklyAllowance;
  }
}

function periodsForBudget(periods: BudgetPeriod[], budgetId: string): BudgetPeriod[] {
  return periods
    .filter((p) => p.budgetId === budgetId)
    .sort((a, b) => a.periodStart.toMillis() - b.periodStart.toMillis());
}

// Exclude non-primary normalized transactions to avoid double-counting duplicates
function transactionsForBudget(txns: Transaction[], budgetId: string): TimestampedTransaction[] {
  return txns
    .filter((t): t is TimestampedTransaction =>
      t.budget === budgetId
      && t.timestamp !== null
      && (t.normalizedId === null || t.normalizedPrimary))
    .sort(compareByTimestampThenId);
}

export function findPeriodForTimestamp(
  periods: BudgetPeriod[],
  budgetId: string,
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

export function computeAllBudgetBalances(
  allTransactions: Transaction[],
  budgets: Budget[],
  budgetPeriods: BudgetPeriod[],
): Map<string, number> {
  const result = new Map<string, number>();

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
