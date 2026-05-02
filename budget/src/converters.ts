/** Re-exports entity idb→domain converters under the legacy `toX` names used by data-source.ts. */
import { idbToTransaction } from "./entities/transaction.js";
import { idbToStatement } from "./entities/statement.js";
import { idbToStatementItem } from "./entities/statement-item.js";
import { idbToReconciliationNote } from "./entities/reconciliation-note.js";
import { idbToBudget } from "./entities/budget.js";
import type { Budget, IdbBudget } from "./entities/budget.js";
import { idbToBudgetPeriod } from "./entities/budget-period.js";
import type { BudgetPeriod, IdbBudgetPeriod } from "./entities/budget-period.js";
import { idbToRule } from "./entities/rule.js";
import { idbToNormalizationRule } from "./entities/normalization-rule.js";
import { idbToWeeklyAggregate } from "./entities/weekly-aggregate.js";

export { idbToTransaction as toTransaction };
export { idbToStatement as toStatement };
export { idbToStatementItem as toStatementItem };
export { idbToReconciliationNote as toReconciliationNote };
export { idbToBudget as toBudget };
export { idbToBudgetPeriod as toBudgetPeriod };
export { idbToRule as toRule };
export { idbToNormalizationRule as toNormalizationRule };
export { idbToWeeklyAggregate as toWeeklyAggregate };

// Re-export types used by data-source.ts and other consumers
export type { Budget, IdbBudget, BudgetPeriod, IdbBudgetPeriod };

export { filterByTimestamp } from "./entities/_helpers.js";
