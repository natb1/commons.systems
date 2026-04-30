import type {
  Transaction,
  Statement,
  Budget,
  BudgetPeriod,
  WeeklyAggregate,
} from "./firestore.js";
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
import type { Rule, RawRule } from "./entities/rule.js";
import { parseRawRule, ruleToIdbRecord } from "./entities/rule.js";
import type { NormalizationRule, RawNormalizationRule } from "./entities/normalization-rule.js";
import { parseRawNormalizationRule, normalizationRuleToIdbRecord } from "./entities/normalization-rule.js";
import type { RawWeeklyAggregate } from "./entities/weekly-aggregate.js";
import { parseRawWeeklyAggregate, weeklyAggregateToIdbRecord } from "./entities/weekly-aggregate.js";
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
  const rules: Rule[] = (raw.rules ?? []).map((r: RawRule, i: number) => parseRawRule(r, i));
  const normalizationRules: NormalizationRule[] = (raw.normalizationRules ?? []).map((r: RawNormalizationRule, i: number) => parseRawNormalizationRule(r, i));
  const statements: Statement[] = (raw.statements ?? []).map((s: RawStatement, i: number) => parseRawStatement(s, i));
  const weeklyAggregates: WeeklyAggregate[] = (raw.weeklyAggregates ?? []).map((a: RawWeeklyAggregate, i: number) => parseRawWeeklyAggregate(a, i));

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
    rules: parsed.rules.map(ruleToIdbRecord),
    normalizationRules: parsed.normalizationRules.map(normalizationRuleToIdbRecord),
    statements: parsed.statements.map(statementToIdbRecord),
    statementItems: [],
    reconciliationNotes: [],
    weeklyAggregates: parsed.weeklyAggregates.map(weeklyAggregateToIdbRecord),
    meta: {
      key: "upload",
      groupName: parsed.groupName,
      version: parsed.version,
      exportedAt: parsed.exportedAt,
    },
  };
}
