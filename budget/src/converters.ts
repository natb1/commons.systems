import type {
  Rule,
  NormalizationRule,
  WeeklyAggregate,
  RuleId,
  NormalizationRuleId,
} from "./firestore.js";
import { Timestamp } from "firebase/firestore";
import type { IdbRule, IdbNormalizationRule, IdbWeeklyAggregate } from "./idb.js";
import { idbToTransaction } from "./entities/transaction.js";
import { idbToStatement } from "./entities/statement.js";
import { idbToStatementItem } from "./entities/statement-item.js";
import { idbToReconciliationNote } from "./entities/reconciliation-note.js";
import { idbToBudget } from "./entities/budget.js";
import type { Budget, IdbBudget } from "./entities/budget.js";
import { idbToBudgetPeriod } from "./entities/budget-period.js";
import type { BudgetPeriod, IdbBudgetPeriod } from "./entities/budget-period.js";
import type { GroupId } from "@commons-systems/authutil/groups";

export { idbToTransaction as toTransaction };
export { idbToStatement as toStatement };
export { idbToStatementItem as toStatementItem };
export { idbToReconciliationNote as toReconciliationNote };
export { idbToBudget as toBudget };
export { idbToBudgetPeriod as toBudgetPeriod };

// Re-export types used by data-source.ts and other consumers
export type { Budget, IdbBudget, BudgetPeriod, IdbBudgetPeriod };

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
    }
    return true;
  });
}
