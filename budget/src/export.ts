/** Serializes IndexedDB stores back to the upload JSON format. Inverse of the upload pipeline (parseUploadedJson + toParsedData in upload.ts). */
import { getAll, getMeta } from "./idb.js";
import type { IdbBudget, IdbBudgetPeriod, IdbRule, IdbNormalizationRule } from "./idb.js";
import type { IdbTransaction } from "./entities/transaction.js";
import { transactionToRawJson } from "./entities/transaction.js";
import type { IdbStatement } from "./entities/statement.js";
import { statementToRawJson } from "./entities/statement.js";
import type { IdbStatementItem } from "./entities/statement-item.js";
import { statementItemToRawJson } from "./entities/statement-item.js";
import type { IdbReconciliationNote } from "./entities/reconciliation-note.js";
import { reconciliationNoteToRawJson } from "./entities/reconciliation-note.js";
import { msToISO as msToIso, nullToEmpty } from "./entities/_helpers.js";

export async function exportToJson(): Promise<string> {
  const [transactions, budgets, budgetPeriods, rules, normalizationRules, statements, statementItems, reconciliationNotes, meta] = await Promise.all([
    getAll<IdbTransaction>("transactions"),
    getAll<IdbBudget>("budgets"),
    getAll<IdbBudgetPeriod>("budgetPeriods"),
    getAll<IdbRule>("rules"),
    getAll<IdbNormalizationRule>("normalizationRules"),
    getAll<IdbStatement>("statements"),
    getAll<IdbStatementItem>("statementItems"),
    getAll<IdbReconciliationNote>("reconciliationNotes"),
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
    budgets: budgets.map((b) => ({
      id: b.id,
      name: b.name,
      allowance: b.allowance,
      allowancePeriod: b.allowancePeriod,
      rollover: b.rollover,
      overrides: (b.overrides ?? []).map(o => ({
        date: msToIso(o.dateMs),
        balance: o.balance,
      })),
    })),
    budgetPeriods: budgetPeriods.map((p) => ({
      id: p.id,
      budgetId: p.budgetId,
      periodStart: msToIso(p.periodStartMs),
      periodEnd: msToIso(p.periodEndMs),
      total: p.total,
      count: p.count,
      categoryBreakdown: p.categoryBreakdown,
    })),
    rules: rules.map((r) => ({
      id: r.id,
      type: r.type,
      pattern: r.pattern,
      target: r.target,
      priority: r.priority,
      institution: nullToEmpty(r.institution),
      account: nullToEmpty(r.account),
      ...(r.minAmount != null ? { minAmount: r.minAmount } : {}),
      ...(r.maxAmount != null ? { maxAmount: r.maxAmount } : {}),
      ...(r.excludeCategory ? { excludeCategory: r.excludeCategory } : {}),
      ...(r.matchCategory ? { matchCategory: r.matchCategory } : {}),
    })),
    normalizationRules: normalizationRules.map((r) => ({
      id: r.id,
      pattern: r.pattern,
      patternType: nullToEmpty(r.patternType),
      canonicalDescription: r.canonicalDescription,
      dateWindowDays: r.dateWindowDays,
      institution: nullToEmpty(r.institution),
      account: nullToEmpty(r.account),
      priority: r.priority,
    })),
    statements: statements.map(statementToRawJson),
    statementItems: statementItems.map(statementItemToRawJson),
    reconciliationNotes: reconciliationNotes.map(reconciliationNoteToRawJson),
  };

  return JSON.stringify(output, null, 2) + "\n";
}
