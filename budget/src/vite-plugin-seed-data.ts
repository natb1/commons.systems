import type { Plugin } from "vite";
import { findCollection } from "../seeds/find-collection.js";
import type {
  TransactionSeedData,
  BudgetSeedData,
  BudgetPeriodSeedData,
  RuleSeedData,
  NormalizationRuleSeedData,
  StatementSeedData,
  WeeklyAggregateSeedData,
} from "../seeds/firestore.js";
import type {
  SeedData,
  SeedTransaction,
  SeedBudget,
  SeedBudgetOverride,
  SeedBudgetPeriod,
  SeedRule,
  SeedNormalizationRule,
  SeedStatement,
  SeedWeeklyAggregate,
} from "virtual:budget-seed-data";

const VIRTUAL_MODULE_ID = "virtual:budget-seed-data";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

function toMs(d: unknown): number | null {
  if (d instanceof Date) return d.getTime();
  if (d != null && typeof d === "object" && "toMillis" in d) return (d as { toMillis(): number }).toMillis();
  return null;
}

function requireMs(d: unknown, field: string): number {
  const ms = toMs(d);
  if (ms === null) throw new Error(`Expected Date or Timestamp for ${field}, got ${d}`);
  return ms;
}

export function serializeSeedData(): SeedData {
  const transactions: SeedTransaction[] = findCollection("seed-transactions").map(({ id, data: raw }) => {
    const d = raw as unknown as TransactionSeedData;
    return {
      id,
      institution: d.institution,
      account: d.account,
      description: d.description,
      amount: d.amount,
      note: d.note,
      category: d.category,
      reimbursement: d.reimbursement,
      budget: d.budget ?? null,
      timestampMs: toMs(d.timestamp),
      statementId: d.statementId ?? null,
      normalizedId: d.normalizedId,
      normalizedPrimary: d.normalizedPrimary,
      normalizedDescription: d.normalizedDescription,
      virtual: d.virtual,
    };
  });

  const budgets: SeedBudget[] = findCollection("seed-budgets").map(({ id, data: raw }) => {
    const d = raw as unknown as BudgetSeedData;
    const overrides: SeedBudgetOverride[] = Array.isArray(raw.overrides)
      ? (raw.overrides as { date: unknown; balance: number }[]).map((o) => ({
          dateMs: requireMs(o.date, "overrides.date"),
          balance: o.balance,
        }))
      : [];
    return {
      id,
      name: d.name,
      allowance: d.allowance,
      allowancePeriod: d.allowancePeriod,
      rollover: d.rollover,
      overrides,
    };
  });

  const budgetPeriods: SeedBudgetPeriod[] = findCollection("seed-budget-periods").map(({ id, data: raw }) => {
    const d = raw as unknown as BudgetPeriodSeedData;
    return {
      id,
      budgetId: d.budgetId,
      periodStartMs: requireMs(d.periodStart, "periodStart"),
      periodEndMs: requireMs(d.periodEnd, "periodEnd"),
      total: d.total,
      count: d.count,
      categoryBreakdown: d.categoryBreakdown,
    };
  });

  const rules: SeedRule[] = findCollection("seed-rules").map(({ id, data: raw }) => {
    const d = raw as unknown as RuleSeedData;
    return {
      id,
      type: d.type,
      pattern: d.pattern,
      target: d.target,
      priority: d.priority,
      institution: d.institution,
      account: d.account,
      minAmount: d.minAmount,
      maxAmount: d.maxAmount,
      excludeCategory: d.excludeCategory,
      matchCategory: d.matchCategory,
    };
  });

  const normalizationRules: SeedNormalizationRule[] = findCollection("seed-normalization-rules").map(({ id, data: raw }) => {
    const d = raw as unknown as NormalizationRuleSeedData;
    return {
      id,
      pattern: d.pattern,
      patternType: d.patternType,
      canonicalDescription: d.canonicalDescription,
      dateWindowDays: d.dateWindowDays,
      institution: d.institution,
      account: d.account,
      priority: d.priority,
    };
  });

  const statements: SeedStatement[] = findCollection("seed-statements").map(({ id, data: raw }) => {
    const d = raw as unknown as StatementSeedData;
    return {
      id,
      statementId: d.statementId,
      institution: d.institution,
      account: d.account,
      balance: d.balance,
      period: d.period,
      balanceDate: d.balanceDate ?? null,
      lastTransactionDateMs: toMs(d.lastTransactionDate),
      virtual: d.virtual,
    };
  });

  const weeklyAggregates: SeedWeeklyAggregate[] = findCollection("seed-weekly-aggregates").map(({ id, data: raw }) => {
    const d = raw as unknown as WeeklyAggregateSeedData;
    return {
      id,
      weekStartMs: requireMs(d.weekStart, "weekStart"),
      creditTotal: d.creditTotal,
      unbudgetedTotal: d.unbudgetedTotal,
    };
  });

  return {
    transactions,
    budgets,
    budgetPeriods,
    rules,
    normalizationRules,
    statements,
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
