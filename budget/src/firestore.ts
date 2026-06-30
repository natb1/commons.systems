import type { JournalLeg } from "./entities/journal-leg.js";
export type { JournalLeg } from "./entities/journal-leg.js";
export type { Account } from "./entities/account.js";
export type { JournalEntry } from "./entities/journal-entry.js";
export type { ReconciliationEvent } from "./entities/reconciliation-event.js";
export type { Transaction, IdbTransaction, TransactionId } from "./entities/transaction.js";
export type { Statement, IdbStatement, StatementId } from "./entities/statement.js";
export type { StatementItem, IdbStatementItem, StatementItemId } from "./entities/statement-item.js";
export type { ReconciliationNote, IdbReconciliationNote } from "./entities/reconciliation-note.js";
import type { BudgetId } from "./entities/budget.js";
export type { Budget, BudgetOverride, IdbBudget, BudgetId } from "./entities/budget.js";
import type { BudgetPeriodId } from "./entities/budget-period.js";
export type { BudgetPeriod, IdbBudgetPeriod, BudgetPeriodId } from "./entities/budget-period.js";
export type { Rule, IdbRule, RuleId } from "./entities/rule.js";
export type { NormalizationRule, IdbNormalizationRule, NormalizationRuleId } from "./entities/normalization-rule.js";
export type { WeeklyAggregate, IdbWeeklyAggregate } from "./entities/weekly-aggregate.js";

/** Classification applied to unmatched statement items or transactions during reconciliation. */
export type { ReconciliationClassification, ReconciliationEntityType, Rollover, AllowancePeriod, RuleType, AccountType } from "./schema/enums.js";

export type { GroupId } from "@commons-systems/authutil/groups";

/** Serialized form of BudgetPeriod for HTML data attributes. Serialized by page renderers and deserialized by their hydration counterparts. */
export interface SerializedBudgetPeriod {
  readonly id: BudgetPeriodId;
  readonly budgetId: BudgetId;
  readonly periodStartMs: number;
  readonly periodEndMs: number;
  readonly total: number;
  readonly count: number;
  readonly categoryBreakdown: Record<string, number>;
}

/**
 * Guard for the journal-leg cleared/reconciled state model.
 *
 * A leg moves uncleared → cleared → reconciled. The uncleared/cleared
 * transition is free in either direction. `reconciled` (`reconciledAt != null`)
 * is terminal: any change to `cleared` on a reconciled leg is rejected.
 */
export function assertLegStateTransition(
  leg: Pick<JournalLeg, "cleared" | "reconciledAt">,
  nextCleared: boolean,
): void {
  if (leg.reconciledAt != null) {
    throw new Error(
      `Cannot change cleared state to ${nextCleared}: leg is reconciled (reconciled state is terminal)`,
    );
  }
}
