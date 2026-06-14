/** Serializes IndexedDB stores back to the upload JSON format. Inverse of the upload pipeline (parseUploadedJson + toParsedData in upload.ts). */
import { getAll, getMeta } from "./idb.js";
import type { IdbTransaction } from "./entities/transaction.js";
import { transactionToRawJson } from "./entities/transaction.js";
import type { IdbStatement } from "./entities/statement.js";
import { statementToRawJson } from "./entities/statement.js";
import type { IdbStatementItem } from "./entities/statement-item.js";
import { statementItemToRawJson } from "./entities/statement-item.js";
import type { IdbReconciliationNote } from "./entities/reconciliation-note.js";
import { reconciliationNoteToRawJson } from "./entities/reconciliation-note.js";
import type { IdbAccount } from "./entities/account.js";
import { accountToRawJson } from "./entities/account.js";
import type { IdbJournalEntry } from "./entities/journal-entry.js";
import { journalEntryToRawJson } from "./entities/journal-entry.js";
import type { IdbJournalLeg } from "./entities/journal-leg.js";
import { journalLegToRawJson } from "./entities/journal-leg.js";
import type { IdbReconciliationEvent } from "./entities/reconciliation-event.js";
import { reconciliationEventToRawJson } from "./entities/reconciliation-event.js";
import type { IdbBudget } from "./entities/budget.js";
import { budgetToRawJson } from "./entities/budget.js";
import type { IdbBudgetPeriod } from "./entities/budget-period.js";
import { budgetPeriodToRawJson } from "./entities/budget-period.js";
import type { IdbRule } from "./entities/rule.js";
import { ruleToRawJson } from "./entities/rule.js";
import type { IdbNormalizationRule } from "./entities/normalization-rule.js";
import { normalizationRuleToRawJson } from "./entities/normalization-rule.js";
import type { IdbWeeklyAggregate } from "./entities/weekly-aggregate.js";
import { weeklyAggregateToRawJson } from "./entities/weekly-aggregate.js";

export async function exportToJson(): Promise<string> {
  const [transactions, budgets, budgetPeriods, rules, normalizationRules, statements, statementItems, reconciliationNotes, accounts, journalEntries, journalLegs, reconciliationEvents, weeklyAggregates, meta] = await Promise.all([
    getAll<IdbTransaction>("transactions"),
    getAll<IdbBudget>("budgets"),
    getAll<IdbBudgetPeriod>("budgetPeriods"),
    getAll<IdbRule>("rules"),
    getAll<IdbNormalizationRule>("normalizationRules"),
    getAll<IdbStatement>("statements"),
    getAll<IdbStatementItem>("statementItems"),
    getAll<IdbReconciliationNote>("reconciliationNotes"),
    getAll<IdbAccount>("accounts"),
    getAll<IdbJournalEntry>("journalEntries"),
    getAll<IdbJournalLeg>("journalLegs"),
    getAll<IdbReconciliationEvent>("reconciliationEvents"),
    getAll<IdbWeeklyAggregate>("weeklyAggregates"),
    getMeta(),
  ]);

  if (!meta) throw new Error("No local data to export. Upload a file first.");

  const output = {
    version: meta.version,
    exportedAt: new Date().toISOString(),
    // groupId is not stored locally; empty string for format compatibility
    groupId: "",
    groupName: meta.groupName,
    transactions: transactions.map(transactionToRawJson),
    budgets: budgets.map(budgetToRawJson),
    budgetPeriods: budgetPeriods.map(budgetPeriodToRawJson),
    rules: rules.map(ruleToRawJson),
    normalizationRules: normalizationRules.map(normalizationRuleToRawJson),
    statements: statements.map(statementToRawJson),
    statementItems: statementItems.map(statementItemToRawJson),
    reconciliationNotes: reconciliationNotes.map(reconciliationNoteToRawJson),
    accounts: accounts.map(accountToRawJson),
    journalEntries: journalEntries.map(journalEntryToRawJson),
    journalLegs: journalLegs.map(journalLegToRawJson),
    reconciliationEvents: reconciliationEvents.map(reconciliationEventToRawJson),
    weeklyAggregates: weeklyAggregates.map(weeklyAggregateToRawJson),
  };

  return JSON.stringify(output, null, 2) + "\n";
}
