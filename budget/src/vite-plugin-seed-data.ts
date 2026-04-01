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

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string") throw new Error(`Expected string for ${field}, got ${typeof value}`);
  return value;
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Expected finite number for ${field}, got ${value}`);
  return value;
}

function requireNonNegativeNumber(value: unknown, field: string): number {
  const n = requireNumber(value, field);
  if (n < 0) throw new Error(`Expected non-negative number for ${field}, got ${n}`);
  return n;
}

function requireReimbursement(value: unknown): number {
  const n = requireNumber(value, "reimbursement");
  if (n < 0 || n > 100) throw new RangeError(`reimbursement must be between 0 and 100, got ${n}`);
  return n;
}

function requireAllowancePeriod(value: unknown): "weekly" | "monthly" | "quarterly" {
  if (value === "weekly" || value === "monthly" || value === "quarterly") return value;
  throw new Error(`Expected allowancePeriod to be "weekly" | "monthly" | "quarterly", got ${JSON.stringify(value)}`);
}

function requireRollover(value: unknown): "none" | "debt" | "balance" {
  if (value === "none" || value === "debt" || value === "balance") return value;
  throw new Error(`Expected rollover to be "none" | "debt" | "balance", got ${JSON.stringify(value)}`);
}

function requireRuleType(value: unknown): "categorization" | "budget_assignment" {
  if (value === "categorization" || value === "budget_assignment") return value;
  throw new Error(`Expected rule type to be "categorization" | "budget_assignment", got ${JSON.stringify(value)}`);
}

export function serializeSeedData(): SeedData {
  const transactions: SeedTransaction[] = findCollection("seed-transactions").map(({ id, data: raw }) => {
    const d = raw as unknown as TransactionSeedData;
    return {
      id,
      institution: requireString(d.institution, "institution"),
      account: requireString(d.account, "account"),
      description: requireString(d.description, "description"),
      amount: requireNumber(d.amount, "amount"),
      note: requireString(d.note, "note"),
      category: requireString(d.category, "category"),
      reimbursement: requireReimbursement(d.reimbursement),
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
    const name = requireString(d.name, "name");
    if (!name) throw new Error("Budget name must be non-empty");
    const overrides: SeedBudgetOverride[] = Array.isArray(raw.overrides)
      ? (raw.overrides as { date: unknown; balance: number }[]).map((o) => ({
          dateMs: requireMs(o.date, "overrides.date"),
          balance: requireNumber(o.balance, "overrides.balance"),
        }))
      : [];
    return {
      id,
      name,
      allowance: requireNonNegativeNumber(d.allowance, "allowance"),
      allowancePeriod: requireAllowancePeriod(d.allowancePeriod),
      rollover: requireRollover(d.rollover),
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
      total: requireNumber(d.total, "total"),
      count: requireNumber(d.count, "count"),
      categoryBreakdown: d.categoryBreakdown,
    };
  });

  const rules: SeedRule[] = findCollection("seed-rules").map(({ id, data: raw }) => {
    const d = raw as unknown as RuleSeedData;
    return {
      id,
      type: requireRuleType(d.type),
      pattern: requireString(d.pattern, "pattern"),
      target: requireString(d.target, "target"),
      priority: requireNumber(d.priority, "priority"),
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
      pattern: requireString(d.pattern, "pattern"),
      patternType: d.patternType,
      canonicalDescription: requireString(d.canonicalDescription, "canonicalDescription"),
      dateWindowDays: d.dateWindowDays,
      institution: d.institution,
      account: d.account,
      priority: requireNumber(d.priority, "priority"),
    };
  });

  const statements: SeedStatement[] = findCollection("seed-statements").map(({ id, data: raw }) => {
    const d = raw as unknown as StatementSeedData;
    return {
      id,
      statementId: requireString(d.statementId, "statementId"),
      institution: requireString(d.institution, "institution"),
      account: requireString(d.account, "account"),
      balance: requireNumber(d.balance, "balance"),
      period: requireString(d.period, "period"),
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
      creditTotal: requireNumber(d.creditTotal, "creditTotal"),
      unbudgetedTotal: requireNumber(d.unbudgetedTotal, "unbudgetedTotal"),
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
