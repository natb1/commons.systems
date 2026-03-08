import type { Timestamp } from "firebase/firestore";
import type { Budget, BudgetPeriod, Rollover, Transaction } from "./firestore.js";

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
    .sort((a, b) => {
      const diff = a.timestamp!.toMillis() - b.timestamp!.toMillis();
      if (diff !== 0) return diff;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });

  for (const t of samePeriodTxns) {
    running -= t.amount;
    if (t.id === txn.id) break;
  }

  return running;
}
