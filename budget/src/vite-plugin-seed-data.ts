import type { Plugin } from "vite";
import { findCollection } from "../seeds/find-collection.js";
import type { SeedData } from "virtual:budget-seed-data";
import { serializeSeedTransaction } from "./entities/transaction.js";
import type { TransactionSeedData } from "../seeds/firestore.js";
import { serializeSeedStatement } from "./entities/statement.js";
import type { StatementSeedData } from "./entities/statement.js";
import { serializeSeedStatementItem } from "./entities/statement-item.js";
import type { StatementItemSeedData } from "./entities/statement-item.js";
import { serializeSeedReconciliationNote } from "./entities/reconciliation-note.js";
import type { ReconciliationNoteSeedData } from "./entities/reconciliation-note.js";
import { serializeSeedBudget } from "./entities/budget.js";
import type { BudgetSeedData } from "./entities/budget.js";
import { serializeSeedBudgetPeriod } from "./entities/budget-period.js";
import type { BudgetPeriodSeedData } from "./entities/budget-period.js";
import { serializeSeedRule } from "./entities/rule.js";
import type { RuleSeedData } from "./entities/rule.js";
import { serializeSeedNormalizationRule } from "./entities/normalization-rule.js";
import type { NormalizationRuleSeedData } from "./entities/normalization-rule.js";
import { serializeSeedWeeklyAggregate } from "./entities/weekly-aggregate.js";
import type { WeeklyAggregateSeedData } from "./entities/weekly-aggregate.js";

const VIRTUAL_MODULE_ID = "virtual:budget-seed-data";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

export function serializeSeedData(): SeedData {
  const transactions = findCollection("seed-transactions").map(({ id, data: raw }) =>
    serializeSeedTransaction(raw as unknown as TransactionSeedData, id)
  );

  const budgets = findCollection("seed-budgets").map(({ id, data: raw }) =>
    serializeSeedBudget(raw as unknown as BudgetSeedData, id)
  );

  const budgetPeriods = findCollection("seed-budget-periods").map(({ id, data: raw }) =>
    serializeSeedBudgetPeriod(raw as unknown as BudgetPeriodSeedData, id)
  );

  const rules = findCollection("seed-rules").map(({ id, data: raw }) =>
    serializeSeedRule(raw as unknown as RuleSeedData, id)
  );

  const normalizationRules = findCollection("seed-normalization-rules").map(({ id, data: raw }) =>
    serializeSeedNormalizationRule(raw as unknown as NormalizationRuleSeedData, id)
  );

  const statements = findCollection("seed-statements").map(({ id, data: raw }) =>
    serializeSeedStatement(raw as unknown as StatementSeedData, id)
  );

  const weeklyAggregates = findCollection("seed-weekly-aggregates").map(({ id, data: raw }) =>
    serializeSeedWeeklyAggregate(raw as unknown as WeeklyAggregateSeedData, id)
  );

  const statementItems = findCollection("seed-statement-items").map(({ id, data: raw }) =>
    serializeSeedStatementItem(raw as unknown as StatementItemSeedData, id)
  );

  const reconciliationNotes = findCollection("seed-reconciliation-notes").map(({ id, data: raw }) =>
    serializeSeedReconciliationNote(raw as unknown as ReconciliationNoteSeedData, id)
  );

  return {
    transactions,
    budgets,
    budgetPeriods,
    rules,
    normalizationRules,
    statements,
    statementItems,
    reconciliationNotes,
    weeklyAggregates,
  };
}

export function budgetSeedDataPlugin(): Plugin {
  let moduleCode: string;

  return {
    name: "budget-seed-data",
    buildStart() {
      const data = serializeSeedData();
      moduleCode = `export default ${JSON.stringify(data)};`;
    },
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID;
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) return moduleCode;
    },
  };
}
