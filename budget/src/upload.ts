import { Timestamp } from "firebase/firestore";
import type {
  Transaction,
  Statement,
  Budget,
  BudgetPeriod,
  Rule,
  NormalizationRule,
  WeeklyAggregate,
  RuleId,
  NormalizationRuleId,
  GroupId,
  RuleType,
} from "./firestore.js";
import { RULE_TYPES } from "./schema/enums.js";
import type { ParsedData } from "./idb.js";
import type { RawTransaction } from "./entities/transaction.js";
import { parseRawTransaction, transactionToIdbRecord } from "./entities/transaction.js";
import { UploadValidationError } from "./entities/_helpers.js";
import type { RawStatement } from "./entities/statement.js";
import { parseRawStatement, statementToIdbRecord } from "./entities/statement.js";
import type { RawBudget } from "./entities/budget.js";
import { parseRawBudget, budgetToIdbRecord } from "./entities/budget.js";
import type { RawBudgetPeriod } from "./entities/budget-period.js";
import { parseRawBudgetPeriod, budgetPeriodToIdbRecord } from "./entities/budget-period.js";
// Re-export so existing import sites keep working.
export { UploadValidationError };

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

function requireId(value: unknown, entity: string, index: number): string {
  if (typeof value !== "string" || value === "") {
    throw new UploadValidationError(`${entity}[${index}] is missing a valid id`);
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

  const transactions: Transaction[] = raw.transactions.map(parseRawTransaction);

  const budgets: Budget[] = (raw.budgets ?? []).map((b: RawBudget, i: number) => parseRawBudget(b, i));

  const budgetPeriods: BudgetPeriod[] = (raw.budgetPeriods ?? []).map((p: RawBudgetPeriod, i: number) => parseRawBudgetPeriod(p, i));

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
    (s: RawStatement, i: number) => parseRawStatement(s, i),
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
    transactions: parsed.transactions.map(transactionToIdbRecord),
    budgets: parsed.budgets.map(budgetToIdbRecord),
    budgetPeriods: parsed.budgetPeriods.map(budgetPeriodToIdbRecord),
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
    statements: parsed.statements.map(statementToIdbRecord),
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
