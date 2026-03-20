/** Serializes IndexedDB stores back to the upload JSON format. Inverse of the upload pipeline (parseUploadedJson + toParsedData in upload.ts). */
import { getAll, getMeta } from "./idb.js";
import type { IdbTransaction, IdbBudget, IdbBudgetPeriod, IdbRule, IdbNormalizationRule, IdbStatement } from "./idb.js";

function msToIso(ms: number | null): string {
  if (ms === null) return "";
  return new Date(ms).toISOString();
}

function nullToEmpty(value: string | null): string {
  return value ?? "";
}

export async function exportToJson(): Promise<string> {
  const [transactions, budgets, budgetPeriods, rules, normalizationRules, statements, meta] = await Promise.all([
    getAll<IdbTransaction>("transactions"),
    getAll<IdbBudget>("budgets"),
    getAll<IdbBudgetPeriod>("budgetPeriods"),
    getAll<IdbRule>("rules"),
    getAll<IdbNormalizationRule>("normalizationRules"),
    getAll<IdbStatement>("statements"),
    getMeta(),
  ]);

  if (!meta) throw new Error("No local data to export. Upload a file first.");

  const output = {
    version: meta.version,
    exportedAt: new Date().toISOString(),
    // groupId is not stored locally; empty string for format compatibility
    groupId: "",
    groupName: meta.groupName,
    transactions: transactions.map((t) => ({
      id: t.id,
      institution: nullToEmpty(t.institution),
      account: nullToEmpty(t.account),
      description: t.description,
      amount: t.amount,
      timestamp: msToIso(t.timestampMs),
      statementId: nullToEmpty(t.statementId),
      category: t.category,
      budget: t.budget,
      note: t.note,
      reimbursement: t.reimbursement,
      normalizedId: t.normalizedId,
      normalizedPrimary: t.normalizedPrimary,
      normalizedDescription: t.normalizedDescription,
    })),
    budgets: budgets.map((b) => ({
      id: b.id,
      name: b.name,
      weeklyAllowance: b.weeklyAllowance,
      rollover: b.rollover,
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
    statements: statements.map((s) => ({
      id: s.id,
      statementId: s.statementId,
      institution: s.institution,
      account: s.account,
      balance: s.balance,
      period: s.period,
      lastTransactionDate: s.lastTransactionDateMs != null
        ? msToIso(s.lastTransactionDateMs)
        : null,
    })),
  };

  return JSON.stringify(output, null, 2) + "\n";
}
