import { Timestamp } from "firebase/firestore";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import type {
  Transaction,
  Statement,
  Budget,
  BudgetPeriod,
  Rule,
  NormalizationRule,
  WeeklyAggregate,
  TransactionId,
  StatementId,
  BudgetId,
  BudgetPeriodId,
  RuleId,
  NormalizationRuleId,
  GroupId,
  AllowancePeriod,
} from "./firestore.js";
import type { IdbTransaction, IdbStatement, IdbBudget, IdbBudgetPeriod, IdbRule, IdbNormalizationRule, IdbWeeklyAggregate } from "./idb.js";

export function toTransaction(row: IdbTransaction): Transaction {
  return {
    id: row.id as TransactionId,
    institution: row.institution,
    account: row.account,
    description: row.description,
    amount: row.amount,
    note: row.note,
    category: row.category,
    reimbursement: row.reimbursement,
    budget: (row.budget ?? null) as BudgetId | null,
    timestamp: row.timestampMs != null ? Timestamp.fromMillis(row.timestampMs) : null,
    statementId: (row.statementId ?? null) as StatementId | null,
    groupId: null as GroupId | null,
    normalizedId: row.normalizedId,
    normalizedPrimary: row.normalizedPrimary,
    normalizedDescription: row.normalizedDescription,
    virtual: row.virtual ?? false,
  };
}

function toAllowancePeriod(value: string | undefined): AllowancePeriod {
  if (value === "monthly") return "monthly";
  if (value === "quarterly") return "quarterly";
  if (value == null || value === "weekly") return "weekly";
  throw new DataIntegrityError(`Invalid allowancePeriod: ${value}`);
}

export function toBudget(row: IdbBudget): Budget {
  return {
    id: row.id as BudgetId,
    name: row.name,
    allowance: row.allowance,
    allowancePeriod: toAllowancePeriod(row.allowancePeriod),
    rollover: row.rollover,
    overrides: (row.overrides ?? []).map(o => ({
      date: Timestamp.fromMillis(o.dateMs),
      balance: o.balance,
    })),
    groupId: null as GroupId | null,
  };
}

export function toBudgetPeriod(row: IdbBudgetPeriod): BudgetPeriod {
  return {
    id: row.id as BudgetPeriodId,
    budgetId: row.budgetId as BudgetId,
    periodStart: Timestamp.fromMillis(row.periodStartMs),
    periodEnd: Timestamp.fromMillis(row.periodEndMs),
    total: row.total,
    count: row.count,
    categoryBreakdown: row.categoryBreakdown,
    groupId: null as GroupId | null,
  };
}

export function toRule(row: IdbRule): Rule {
  return {
    id: row.id as RuleId,
    type: row.type,
    pattern: row.pattern,
    target: row.target,
    priority: row.priority,
    institution: row.institution,
    account: row.account,
    minAmount: row.minAmount,
    maxAmount: row.maxAmount,
    excludeCategory: row.excludeCategory,
    matchCategory: row.matchCategory,
    groupId: null as GroupId | null,
  };
}

export function toStatement(row: IdbStatement): Statement {
  return {
    id: row.id,
    statementId: row.statementId as StatementId,
    institution: row.institution,
    account: row.account,
    balance: row.balance,
    period: row.period,
    balanceDate: row.balanceDate ?? null,
    lastTransactionDate: row.lastTransactionDateMs != null
      ? Timestamp.fromMillis(row.lastTransactionDateMs)
      : null,
    groupId: null as GroupId | null,
    virtual: row.virtual ?? false,
  };
}

export function toWeeklyAggregate(row: IdbWeeklyAggregate): WeeklyAggregate {
  return {
    id: row.id,
    weekStart: Timestamp.fromMillis(row.weekStartMs),
    creditTotal: row.creditTotal,
    unbudgetedTotal: row.unbudgetedTotal,
    groupId: null as GroupId | null,
  };
}

export function toNormalizationRule(row: IdbNormalizationRule): NormalizationRule {
  return {
    id: row.id as NormalizationRuleId,
    pattern: row.pattern,
    patternType: row.patternType,
    canonicalDescription: row.canonicalDescription,
    dateWindowDays: row.dateWindowDays,
    institution: row.institution,
    account: row.account,
    priority: row.priority,
    groupId: null as GroupId | null,
  };
}

export function filterByTimestamp<T extends { timestampMs: number | null }>(
  rows: T[], sinceMs: number | undefined, beforeMs: number | undefined,
): T[] {
  return rows.filter(row => {
    if (sinceMs !== undefined) {
      if (row.timestampMs === null) return false;
      if (row.timestampMs < sinceMs) return false;
    }
    if (beforeMs !== undefined) {
      if (row.timestampMs !== null && row.timestampMs >= beforeMs) return false;
      // When both since and before are set, exclude null-timestamp rows (the since block above handles since-only queries)
      if (row.timestampMs === null && sinceMs !== undefined) return false;
    }
    return true;
  });
}
