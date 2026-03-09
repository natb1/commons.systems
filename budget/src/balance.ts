import type { Timestamp } from "firebase/firestore";
import type { Budget, BudgetPeriod, Rollover, Transaction } from "./firestore.js";

export function computeNetAmount(amount: number, reimbursement: number): number {
  return amount * (1 - reimbursement / 100);
}

function netAmount(t: Transaction): number {
  return computeNetAmount(t.amount, t.reimbursement);
}

function compareByTimestampThenId(a: Transaction, b: Transaction): number {
  const diff = a.timestamp!.toMillis() - b.timestamp!.toMillis();
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

  const budgetPeriodsForBudget = budgetPeriods
    .filter((p) => p.budgetId === budget.id)
    .sort((a, b) => a.periodStart.toMillis() - b.periodStart.toMillis());

  const txnMs = txn.timestamp.toMillis();
  const targetPeriodIndex = budgetPeriodsForBudget.findIndex(
    (p) => p.periodStart.toMillis() <= txnMs && txnMs < p.periodEnd.toMillis(),
  );
  if (targetPeriodIndex === -1) return null;

  const targetPeriod = budgetPeriodsForBudget[targetPeriodIndex];

  // Accumulate balance through prior periods
  let running = 0;
  for (let i = 0; i < targetPeriodIndex; i++) {
    running = applyRollover(running, budget.weeklyAllowance, budget.rollover);
    running -= budgetPeriodsForBudget[i].total;
  }

  // Apply rollover entering the target period
  running = applyRollover(running, budget.weeklyAllowance, budget.rollover);

  // Walk same-period transactions up to and including the target transaction
  const samePeriodTxns = allTransactions
    .filter(
      (t) =>
        t.budget === budget.id &&
        t.timestamp !== null &&
        t.timestamp.toMillis() >= targetPeriod.periodStart.toMillis() &&
        t.timestamp.toMillis() < targetPeriod.periodEnd.toMillis(),
    )
    .sort(compareByTimestampThenId);

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
    const periods = budgetPeriods
      .filter((p) => p.budgetId === budget.id)
      .sort((a, b) => a.periodStart.toMillis() - b.periodStart.toMillis());

    const txns = allTransactions
      .filter((t) => t.budget === budget.id && t.timestamp !== null)
      .sort(compareByTimestampThenId);

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
        const tMs = t.timestamp!.toMillis();
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
