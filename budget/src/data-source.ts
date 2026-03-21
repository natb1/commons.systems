import { Timestamp } from "firebase/firestore";
import type {
  Transaction,
  Statement,
  Budget,
  BudgetOverride,
  BudgetPeriod,
  Rule,
  NormalizationRule,
  TransactionId,
  StatementId,
  BudgetId,
  BudgetPeriodId,
  RuleId,
  GroupId,
  AllowancePeriod,
} from "./firestore.js";
import {
  getTransactions as fsGetTransactions,
  getStatements as fsGetStatements,
  getBudgets as fsGetBudgets,
  getBudgetPeriods as fsGetBudgetPeriods,
  getRules as fsGetRules,
  getNormalizationRules as fsGetNormalizationRules,
} from "./firestore.js";
import { getAll, get, put, deleteRecord } from "./idb.js";
import type { IdbTransaction, IdbStatement, IdbBudget, IdbBudgetPeriod, IdbRule, IdbNormalizationRule } from "./idb.js";

export interface DataSource {
  getTransactions(): Promise<Transaction[]>;
  getStatements(): Promise<Statement[]>;
  getBudgets(): Promise<Budget[]>;
  getBudgetPeriods(): Promise<BudgetPeriod[]>;
  getRules(): Promise<Rule[]>;
  getNormalizationRules(): Promise<NormalizationRule[]>;
  updateTransaction(
    id: TransactionId,
    fields: Partial<Pick<Transaction, "note" | "category" | "reimbursement" | "budget" | "normalizedId" | "normalizedPrimary" | "normalizedDescription">>,
  ): Promise<void>;
  updateBudget(
    id: BudgetId,
    fields: Partial<Pick<Budget, "name" | "weeklyAllowance" | "allowancePeriod" | "rollover">>,
  ): Promise<void>;
  updateBudgetOverrides(id: BudgetId, overrides: BudgetOverride[]): Promise<void>;
  adjustBudgetPeriodTotal(id: BudgetPeriodId, delta: number): Promise<void>;
  createRule(fields: Omit<Rule, "id" | "groupId">): Promise<RuleId>;
  updateRule(
    id: RuleId,
    fields: Partial<Pick<Rule, "pattern" | "target" | "priority" | "type" | "institution" | "account">>,
  ): Promise<void>;
  deleteRule(id: RuleId): Promise<void>;
  createNormalizationRule(fields: Omit<NormalizationRule, "id" | "groupId">): Promise<string>;
  updateNormalizationRule(
    id: string,
    fields: Partial<Pick<NormalizationRule, "pattern" | "patternType" | "canonicalDescription" | "dateWindowDays" | "priority" | "institution" | "account">>,
  ): Promise<void>;
  deleteNormalizationRule(id: string): Promise<void>;
}

export class FirestoreSeedDataSource implements DataSource {
  async getTransactions(): Promise<Transaction[]> {
    return fsGetTransactions(null);
  }
  async getStatements(): Promise<Statement[]> {
    return fsGetStatements(null);
  }
  async getBudgets(): Promise<Budget[]> {
    return fsGetBudgets(null);
  }
  async getBudgetPeriods(): Promise<BudgetPeriod[]> {
    return fsGetBudgetPeriods(null);
  }
  async getRules(): Promise<Rule[]> {
    return fsGetRules(null);
  }
  async getNormalizationRules(): Promise<NormalizationRule[]> {
    return fsGetNormalizationRules(null);
  }
  async updateTransaction(): Promise<void> {
    throw new Error("Seed data is read-only");
  }
  async updateBudget(): Promise<void> {
    throw new Error("Seed data is read-only");
  }
  async updateBudgetOverrides(): Promise<void> {
    throw new Error("Seed data is read-only");
  }
  async adjustBudgetPeriodTotal(): Promise<void> {
    throw new Error("Seed data is read-only");
  }
  async createRule(): Promise<RuleId> {
    throw new Error("Seed data is read-only");
  }
  async updateRule(): Promise<void> {
    throw new Error("Seed data is read-only");
  }
  async deleteRule(): Promise<void> {
    throw new Error("Seed data is read-only");
  }
  async createNormalizationRule(): Promise<string> {
    throw new Error("Seed data is read-only");
  }
  async updateNormalizationRule(): Promise<void> {
    throw new Error("Seed data is read-only");
  }
  async deleteNormalizationRule(): Promise<void> {
    throw new Error("Seed data is read-only");
  }
}

function toTransaction(row: IdbTransaction): Transaction {
  return {
    id: row.id as TransactionId,
    institution: row.institution,
    account: row.account,
    description: row.description,
    amount: row.amount,
    note: row.note,
    category: row.category,
    reimbursement: row.reimbursement,
    budget: (row.budget || null) as BudgetId | null,
    timestamp: row.timestampMs != null ? Timestamp.fromMillis(row.timestampMs) : null,
    statementId: (row.statementId || null) as StatementId | null,
    groupId: null as GroupId | null,
    normalizedId: row.normalizedId,
    normalizedPrimary: row.normalizedPrimary,
    normalizedDescription: row.normalizedDescription,
  };
}

function toAllowancePeriod(value: string | undefined): AllowancePeriod {
  if (value === "monthly") return "monthly";
  return "weekly";
}

function toBudget(row: IdbBudget): Budget {
  return {
    id: row.id as BudgetId,
    name: row.name,
    weeklyAllowance: row.weeklyAllowance,
    allowancePeriod: toAllowancePeriod(row.allowancePeriod),
    rollover: row.rollover,
    overrides: (row.overrides ?? []).map(o => ({
      date: Timestamp.fromMillis(o.dateMs),
      balance: o.balance,
    })),
    groupId: null as GroupId | null,
  };
}

function toBudgetPeriod(row: IdbBudgetPeriod): BudgetPeriod {
  return {
    id: row.id as BudgetPeriodId,
    budgetId: row.budgetId as BudgetId,
    periodStart: Timestamp.fromMillis(row.periodStartMs),
    periodEnd: Timestamp.fromMillis(row.periodEndMs),
    total: row.total,
    count: row.count,
    categoryBreakdown: row.categoryBreakdown,
    groupId: null as GroupId | null,
  };
}

function toRule(row: IdbRule): Rule {
  return {
    id: row.id as RuleId,
    type: row.type,
    pattern: row.pattern,
    target: row.target,
    priority: row.priority,
    institution: row.institution,
    account: row.account,
    groupId: null as GroupId | null,
  };
}

function toStatement(row: IdbStatement): Statement {
  return {
    id: row.id,
    statementId: row.statementId as StatementId,
    institution: row.institution,
    account: row.account,
    balance: row.balance,
    period: row.period,
    groupId: null as GroupId | null,
  };
}

function toNormalizationRule(row: IdbNormalizationRule): NormalizationRule {
  return {
    id: row.id,
    pattern: row.pattern,
    patternType: row.patternType,
    canonicalDescription: row.canonicalDescription,
    dateWindowDays: row.dateWindowDays,
    institution: row.institution,
    account: row.account,
    priority: row.priority,
    groupId: null as GroupId | null,
  };
}

/** Read-modify-write: get a record, throw if missing, merge fields, put back. */
async function updateRecord<T extends { id: string }>(
  store: Parameters<typeof get>[0],
  id: string,
  label: string,
  fields: Partial<T>,
): Promise<void> {
  const row = await get<T>(store, id);
  if (!row) throw new Error(`${label} ${id} not found`);
  await put(store, { ...row, ...fields } as unknown as Record<string, unknown>);
}

export class IdbDataSource implements DataSource {
  async getTransactions(): Promise<Transaction[]> {
    const rows = await getAll<IdbTransaction>("transactions");
    return rows.map(toTransaction);
  }

  async getStatements(): Promise<Statement[]> {
    const rows = await getAll<IdbStatement>("statements");
    return rows.map(toStatement);
  }

  async getBudgets(): Promise<Budget[]> {
    const rows = await getAll<IdbBudget>("budgets");
    return rows.map(toBudget);
  }

  async getBudgetPeriods(): Promise<BudgetPeriod[]> {
    const rows = await getAll<IdbBudgetPeriod>("budgetPeriods");
    return rows.map(toBudgetPeriod);
  }

  async getRules(): Promise<Rule[]> {
    const rows = await getAll<IdbRule>("rules");
    return rows.map(toRule);
  }

  async getNormalizationRules(): Promise<NormalizationRule[]> {
    const rows = await getAll<IdbNormalizationRule>("normalizationRules");
    return rows.map(toNormalizationRule);
  }

  async updateTransaction(
    id: TransactionId,
    fields: Partial<Pick<Transaction, "note" | "category" | "reimbursement" | "budget" | "normalizedId" | "normalizedPrimary" | "normalizedDescription">>,
  ): Promise<void> {
    await updateRecord<IdbTransaction>("transactions", id, "Transaction", fields);
  }

  async updateBudget(
    id: BudgetId,
    fields: Partial<Pick<Budget, "name" | "weeklyAllowance" | "allowancePeriod" | "rollover">>,
  ): Promise<void> {
    await updateRecord<IdbBudget>("budgets", id, "Budget", fields);
  }

  async updateBudgetOverrides(id: BudgetId, overrides: BudgetOverride[]): Promise<void> {
    const row = await get<IdbBudget>("budgets", id);
    if (!row) throw new Error(`Budget ${id} not found`);
    await put("budgets", {
      ...row,
      overrides: overrides.map(o => ({ dateMs: o.date.toMillis(), balance: o.balance })),
    } as unknown as Record<string, unknown>);
  }

  async adjustBudgetPeriodTotal(id: BudgetPeriodId, delta: number): Promise<void> {
    if (!Number.isFinite(delta)) throw new RangeError("Delta must be a finite number");
    if (delta === 0) return;
    const row = await get<IdbBudgetPeriod>("budgetPeriods", id);
    if (!row) throw new Error(`Budget period ${id} not found`);
    await put("budgetPeriods", { ...row, total: row.total + delta } as unknown as Record<string, unknown>);
  }

  async createRule(fields: Omit<Rule, "id" | "groupId">): Promise<RuleId> {
    const id = crypto.randomUUID() as RuleId;
    const record: IdbRule = {
      id,
      type: fields.type,
      pattern: fields.pattern,
      target: fields.target,
      priority: fields.priority,
      institution: fields.institution,
      account: fields.account,
    };
    await put("rules", record as unknown as Record<string, unknown>);
    return id;
  }

  async updateRule(
    id: RuleId,
    fields: Partial<Pick<Rule, "pattern" | "target" | "priority" | "type" | "institution" | "account">>,
  ): Promise<void> {
    await updateRecord<IdbRule>("rules", id, "Rule", fields);
  }

  async deleteRule(id: RuleId): Promise<void> {
    await deleteRecord("rules", id);
  }

  async createNormalizationRule(fields: Omit<NormalizationRule, "id" | "groupId">): Promise<string> {
    const id = crypto.randomUUID();
    const record: IdbNormalizationRule = {
      id,
      pattern: fields.pattern,
      patternType: fields.patternType,
      canonicalDescription: fields.canonicalDescription,
      dateWindowDays: fields.dateWindowDays,
      institution: fields.institution,
      account: fields.account,
      priority: fields.priority,
    };
    await put("normalizationRules", record as unknown as Record<string, unknown>);
    return id;
  }

  async updateNormalizationRule(
    id: string,
    fields: Partial<Pick<NormalizationRule, "pattern" | "patternType" | "canonicalDescription" | "dateWindowDays" | "priority" | "institution" | "account">>,
  ): Promise<void> {
    await updateRecord<IdbNormalizationRule>("normalizationRules", id, "Normalization rule", fields);
  }

  async deleteNormalizationRule(id: string): Promise<void> {
    await deleteRecord("normalizationRules", id);
  }
}
