import { Timestamp } from "firebase/firestore";
import type {
  Transaction,
  Statement,
  Budget,
  BudgetPeriod,
  Rule,
  NormalizationRule,
  WeeklyAggregate,
  TransactionId,
  StatementId,
  StatementItemId,
  BudgetId,
  BudgetPeriodId,
  RuleId,
  NormalizationRuleId,
  GroupId,
  Rollover,
  AllowancePeriod,
  RuleType,
} from "./firestore.js";
import { ROLLOVERS, ALLOWANCE_PERIODS, RULE_TYPES } from "./schema/enums.js";
import type { ParsedData } from "./idb.js";

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

interface RawOutput {
  version: number;
  exportedAt: string;
  groupId: string;
  groupName: string;
  transactions: RawTransaction[];
  budgets: RawBudget[];
  budgetPeriods: RawBudgetPeriod[];
  rules: RawRule[];
  normalizationRules: RawNormalizationRule[];
  statements: RawStatement[];
  weeklyAggregates?: RawWeeklyAggregate[];
}

interface RawTransaction {
  id: string;
  institution: string;
  account: string;
  description: string;
  amount: number;
  timestamp: string;
  statementId: string;
  statementItemId?: string | null;
  category: string;
  budget: string | null;
  note: string;
  reimbursement: number;
  normalizedId: string | null;
  normalizedPrimary: boolean;
  normalizedDescription: string | null;
  virtual?: boolean;
}

interface RawBudgetOverride {
  date: string;
  balance: number;
}

interface RawBudget {
  id: string;
  name: string;
  allowance: number;
  allowancePeriod?: string;
  rollover: string;
  overrides?: RawBudgetOverride[];
}

interface RawBudgetPeriod {
  id: string;
  budgetId: string;
  periodStart: string;
  periodEnd: string;
  total: number;
  count: number;
  categoryBreakdown: Record<string, number>;
}

interface RawRule {
  id: string;
  type: string;
  pattern: string;
  target: string;
  priority: number;
  institution: string;
  account: string;
  minAmount?: number;
  maxAmount?: number;
  excludeCategory?: string;
  matchCategory?: string;
}

interface RawNormalizationRule {
  id: string;
  pattern: string;
  patternType: string;
  canonicalDescription: string;
  dateWindowDays: number;
  institution: string;
  account: string;
  priority: number;
}

interface RawStatement {
  id: string;
  statementId: string;
  institution: string;
  account: string;
  balance: number;
  period: string;
  balanceDate?: string;
  lastTransactionDate?: string | null;
  virtual?: boolean;
}

interface RawWeeklyAggregate {
  id: string;
  weekStart: string;
  creditTotal: number;
  unbudgetedTotal: number;
}

export interface ParsedUpload {
  transactions: Transaction[];
  statements: Statement[];
  budgets: Budget[];
  budgetPeriods: BudgetPeriod[];
  rules: Rule[];
  normalizationRules: NormalizationRule[];
  weeklyAggregates: WeeklyAggregate[];
  groupName: string;
  version: number;
  exportedAt: string;
}

function parseTimestamp(iso: string, field: string): Timestamp {
  const ms = Date.parse(iso);
  if (isNaN(ms)) throw new UploadValidationError(`Invalid timestamp for ${field}: "${iso}"`);
  return Timestamp.fromMillis(ms);
}

function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}

function requireRollover(value: string): Rollover {
  if (!(ROLLOVERS as readonly string[]).includes(value)) {
    throw new UploadValidationError(`Invalid rollover value: "${value}"`);
  }
  return value as Rollover;
}

function requireAllowancePeriod(value: string | undefined): AllowancePeriod {
  if (value == null || value === "weekly") return "weekly";
  if (!(ALLOWANCE_PERIODS as readonly string[]).includes(value)) {
    throw new UploadValidationError(`Invalid allowancePeriod value: "${value}"`);
  }
  return value as AllowancePeriod;
}

function requireId(value: unknown, entity: string, index: number): string {
  if (typeof value !== "string" || value === "") {
    throw new UploadValidationError(`${entity}[${index}] is missing a valid id`);
  }
  return value;
}

function requireString(value: unknown, entity: string, index: number, field: string): string {
  if (typeof value !== "string" || value === "") {
    throw new UploadValidationError(`${entity}[${index}].${field} is missing or empty`);
  }
  return value;
}

function requireFiniteNumber(value: unknown, entity: string, index: number, field: string): number {
  if (typeof value !== "number" || !isFinite(value)) {
    throw new UploadValidationError(`${entity}[${index}].${field} must be a finite number`);
  }
  return value;
}

function requireRuleType(value: string): RuleType {
  if (!(RULE_TYPES as readonly string[]).includes(value)) {
    throw new UploadValidationError(`Invalid rule type: "${value}"`);
  }
  return value as RuleType;
}

export function parseUploadedJson(text: string): ParsedUpload {
  let raw: RawOutput;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    const detail = e instanceof SyntaxError ? `: ${e.message}` : "";
    throw new UploadValidationError(`Invalid JSON file${detail}`);
  }

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new UploadValidationError("JSON must be an object");
  }

  if (raw.version !== 1) {
    throw new UploadValidationError(
      raw.version === undefined
        ? "Missing required field: version"
        : `Unsupported version: ${raw.version} (expected 1)`,
    );
  }

  if (!raw.groupName || typeof raw.groupName !== "string") {
    throw new UploadValidationError("Missing required field: groupName");
  }
  if (!raw.exportedAt || typeof raw.exportedAt !== "string") {
    throw new UploadValidationError("Missing required field: exportedAt");
  }
  if (!Array.isArray(raw.transactions)) {
    throw new UploadValidationError("Missing required field: transactions");
  }

  const transactions: Transaction[] = raw.transactions.map((t: RawTransaction, i: number) => ({
    id: requireId(t.id, "transaction", i) as TransactionId,
    institution: t.institution ?? "",
    account: t.account ?? "",
    description: t.description ?? "",
    amount: t.amount ?? 0,
    note: t.note ?? "",
    category: t.category ?? "",
    reimbursement: t.reimbursement ?? 0,
    budget: (t.budget || null) as BudgetId | null,
    timestamp: t.timestamp ? parseTimestamp(t.timestamp, "transaction.timestamp") : null,
    statementId: (t.statementId || null) as StatementId | null,
    statementItemId: (t.statementItemId || null) as StatementItemId | null,
    groupId: null as GroupId | null,
    normalizedId: t.normalizedId || null,
    normalizedPrimary: t.normalizedPrimary !== false,
    normalizedDescription: t.normalizedDescription || null,
    virtual: t.virtual ?? false,
  }));

  const budgets: Budget[] = (raw.budgets ?? []).map((b: RawBudget, i: number) => ({
    id: requireId(b.id, "budget", i) as BudgetId,
    name: b.name,
    allowance: b.allowance ?? 0,
    allowancePeriod: requireAllowancePeriod(b.allowancePeriod),
    rollover: requireRollover(b.rollover ?? "none"),
    overrides: ((rawOverrides: Array<{date: string; balance: number}>) => {
      const parsed = rawOverrides.map(o => ({
        date: parseTimestamp(o.date, "budget.overrides.date"),
        balance: o.balance,
      }));
      for (let j = 1; j < parsed.length; j++) {
        if (parsed[j].date.toMillis() <= parsed[j - 1].date.toMillis()) {
          throw new UploadValidationError(`budget[${i}].overrides not sorted by date ascending at index ${j}`);
        }
      }
      return parsed;
    })(b.overrides ?? []),
    groupId: null as GroupId | null,
  }));

  const budgetPeriods: BudgetPeriod[] = (raw.budgetPeriods ?? []).map((p: RawBudgetPeriod, i: number) => ({
    id: requireId(p.id, "budgetPeriod", i) as BudgetPeriodId,
    budgetId: requireId(p.budgetId, "budgetPeriod.budgetId", i) as BudgetId,
    periodStart: parseTimestamp(p.periodStart, "budgetPeriod.periodStart"),
    periodEnd: parseTimestamp(p.periodEnd, "budgetPeriod.periodEnd"),
    total: p.total ?? 0,
    count: p.count ?? 0,
    categoryBreakdown: p.categoryBreakdown ?? {},
    groupId: null as GroupId | null,
  }));

  const rules: Rule[] = (raw.rules ?? []).map((r: RawRule, i: number) => ({
    id: requireId(r.id, "rule", i) as RuleId,
    type: requireRuleType(r.type),
    pattern: r.pattern ?? "",
    target: r.target ?? "",
    priority: r.priority ?? 0,
    institution: emptyToNull(r.institution ?? ""),
    account: emptyToNull(r.account ?? ""),
    minAmount: r.minAmount ?? null,
    maxAmount: r.maxAmount ?? null,
    excludeCategory: emptyToNull(r.excludeCategory ?? ""),
    matchCategory: emptyToNull(r.matchCategory ?? ""),
    groupId: null as GroupId | null,
  }));

  const normalizationRules: NormalizationRule[] = (raw.normalizationRules ?? []).map(
    (r: RawNormalizationRule, i: number) => ({
      id: requireId(r.id, "normalizationRule", i) as NormalizationRuleId,
      pattern: r.pattern ?? "",
      patternType: emptyToNull(r.patternType ?? ""),
      canonicalDescription: r.canonicalDescription ?? "",
      dateWindowDays: r.dateWindowDays ?? 0,
      institution: emptyToNull(r.institution ?? ""),
      account: emptyToNull(r.account ?? ""),
      priority: r.priority ?? 0,
      groupId: null as GroupId | null,
    }),
  );

  const statements: Statement[] = (raw.statements ?? []).map(
    (s: RawStatement, i: number) => ({
      id: requireId(s.id, "statement", i),
      statementId: requireId(s.statementId, "statement.statementId", i) as StatementId,
      institution: requireString(s.institution, "statement", i, "institution"),
      account: requireString(s.account, "statement", i, "account"),
      balance: requireFiniteNumber(s.balance, "statement", i, "balance"),
      period: requireString(s.period, "statement", i, "period"),
      balanceDate: s.balanceDate || null,
      lastTransactionDate: s.lastTransactionDate
        ? parseTimestamp(s.lastTransactionDate, `statement[${i}].lastTransactionDate`)
        : null,
      groupId: null as GroupId | null,
      virtual: s.virtual ?? false,
    }),
  );

  const weeklyAggregates: WeeklyAggregate[] = (raw.weeklyAggregates ?? []).map(
    (a: RawWeeklyAggregate, i: number) => ({
      id: requireId(a.id, "weeklyAggregate", i),
      weekStart: parseTimestamp(a.weekStart, "weeklyAggregate.weekStart"),
      creditTotal: requireFiniteNumber(a.creditTotal, "weeklyAggregate", i, "creditTotal"),
      unbudgetedTotal: requireFiniteNumber(a.unbudgetedTotal, "weeklyAggregate", i, "unbudgetedTotal"),
      groupId: null as GroupId | null,
    }),
  );

  return {
    transactions,
    statements,
    budgets,
    budgetPeriods,
    rules,
    normalizationRules,
    weeklyAggregates,
    groupName: raw.groupName,
    version: raw.version,
    exportedAt: raw.exportedAt,
  };
}

/** Convert a ParsedUpload to the format expected by storeParsedData. Converts Timestamps to milliseconds and drops fields not stored in IDB (e.g. groupId). */
export function toParsedData(parsed: ParsedUpload): ParsedData {
  return {
    transactions: parsed.transactions.map((t) => ({
      id: t.id,
      institution: t.institution,
      account: t.account,
      description: t.description,
      amount: t.amount,
      note: t.note,
      category: t.category,
      reimbursement: t.reimbursement,
      budget: t.budget,
      timestampMs: t.timestamp?.toMillis() ?? null,
      statementId: t.statementId,
      statementItemId: t.statementItemId ?? null,
      normalizedId: t.normalizedId,
      normalizedPrimary: t.normalizedPrimary,
      normalizedDescription: t.normalizedDescription,
      virtual: t.virtual,
    })),
    budgets: parsed.budgets.map((b) => ({
      id: b.id,
      name: b.name,
      allowance: b.allowance,
      allowancePeriod: b.allowancePeriod,
      rollover: b.rollover,
      overrides: b.overrides.map(o => ({ dateMs: o.date.toMillis(), balance: o.balance })),
    })),
    budgetPeriods: parsed.budgetPeriods.map((p) => ({
      id: p.id,
      budgetId: p.budgetId,
      periodStartMs: p.periodStart.toMillis(),
      periodEndMs: p.periodEnd.toMillis(),
      total: p.total,
      count: p.count,
      categoryBreakdown: p.categoryBreakdown,
    })),
    rules: parsed.rules.map((r) => ({
      id: r.id,
      type: r.type,
      pattern: r.pattern,
      target: r.target,
      priority: r.priority,
      institution: r.institution,
      account: r.account,
      minAmount: r.minAmount,
      maxAmount: r.maxAmount,
      excludeCategory: r.excludeCategory,
      matchCategory: r.matchCategory,
    })),
    normalizationRules: parsed.normalizationRules.map((r) => ({
      id: r.id,
      pattern: r.pattern,
      patternType: r.patternType,
      canonicalDescription: r.canonicalDescription,
      dateWindowDays: r.dateWindowDays,
      institution: r.institution,
      account: r.account,
      priority: r.priority,
    })),
    statements: parsed.statements.map((s) => ({
      id: s.id,
      statementId: s.statementId,
      institution: s.institution,
      account: s.account,
      balance: s.balance,
      period: s.period,
      balanceDate: s.balanceDate,
      lastTransactionDateMs: s.lastTransactionDate?.toMillis() ?? null,
      virtual: s.virtual,
    })),
    statementItems: [],
    reconciliationNotes: [],
    weeklyAggregates: parsed.weeklyAggregates.map((a) => ({
      id: a.id,
      weekStartMs: a.weekStart.toMillis(),
      creditTotal: a.creditTotal,
      unbudgetedTotal: a.unbudgetedTotal,
    })),
    meta: {
      key: "upload",
      groupName: parsed.groupName,
      version: parsed.version,
      exportedAt: parsed.exportedAt,
    },
  };
}
