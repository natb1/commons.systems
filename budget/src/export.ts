/** Serializes IndexedDB stores back to the upload JSON format. Inverse of the upload pipeline (parseUploadedJson + toParsedData in upload.ts). */
import { getAll, getMeta } from "./idb.js";
import type { IdbTransaction, IdbBudget, IdbBudgetPeriod, IdbRule, IdbNormalizationRule, IdbStatement, IdbStatementItem, IdbReconciliationNote } from "./idb.js";

function msToIso(ms: number | null): string {
  if (ms === null) return "";
  return new Date(ms).toISOString();
}

function nullToEmpty(value: string | null): string {
  return value ?? "";
}

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
    transactions: transactions.map((t) => ({
      id: t.id,
      institution: nullToEmpty(t.institution),
      account: nullToEmpty(t.account),
      description: t.description,
      amount: t.amount,
      timestamp: msToIso(t.timestampMs),
      statementId: nullToEmpty(t.statementId),
      statementItemId: t.statementItemId ?? null,
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
    statements: statements.map((s) => ({
      id: s.id,
      statementId: s.statementId,
      institution: s.institution,
      account: s.account,
      balance: s.balance,
      period: s.period,
      balanceDate: s.balanceDate ?? "",
      lastTransactionDate: s.lastTransactionDateMs != null
        ? msToIso(s.lastTransactionDateMs)
        : null,
    })),
    statementItems: statementItems.map((i) => ({
      id: i.id,
      statementItemId: i.statementItemId,
      statementId: i.statementId,
      institution: i.institution,
      account: i.account,
      period: i.period,
      amount: i.amount,
      timestamp: msToIso(i.timestampMs),
      description: i.description,
      fitid: i.fitid,
    })),
    reconciliationNotes: reconciliationNotes.map((n) => ({
      id: n.id,
      entityType: n.entityType,
      entityId: n.entityId,
      classification: n.classification,
      note: n.note,
      updatedAt: msToIso(n.updatedAtMs),
      updatedBy: n.updatedBy,
    })),
  };

  return JSON.stringify(output, null, 2) + "\n";
}
