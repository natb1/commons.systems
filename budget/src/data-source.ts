import { Timestamp } from "firebase/firestore";
import type {
  Transaction,
  Statement,
  StatementItem,
  StatementItemId,
  ReconciliationNote,
  ReconciliationEntityType,
  ReconciliationClassification,
  Budget,
  BudgetOverride,
  BudgetPeriod,
  Rule,
  NormalizationRule,
  WeeklyAggregate,
  TransactionId,
  BudgetId,
  BudgetPeriodId,
  RuleId,
  NormalizationRuleId,
} from "./firestore.js";
import seedData from "virtual:budget-seed-data";
import { getAll, get, put, deleteRecord } from "./idb.js";
import type { IdbTransaction, IdbStatement, IdbStatementItem, IdbReconciliationNote, IdbBudget, IdbBudgetPeriod, IdbRule, IdbNormalizationRule, IdbWeeklyAggregate } from "./idb.js";
import { toTransaction, toBudget, toBudgetPeriod, toRule, toStatement, toStatementItem, toReconciliationNote, toWeeklyAggregate, toNormalizationRule, filterByTimestamp } from "./converters.js";

export interface TransactionQuery {
  since?: Timestamp;
  before?: Timestamp;
}

export interface ReconciliationNoteFields {
  entityType: ReconciliationEntityType;
  entityId: string;
  classification: ReconciliationClassification;
  note: string;
}

export interface DataSource {
  getTransactions(query?: TransactionQuery): Promise<Transaction[]>;
  getStatements(): Promise<Statement[]>;
  getStatementItems(): Promise<StatementItem[]>;
  getReconciliationNotes(): Promise<ReconciliationNote[]>;
  getBudgets(): Promise<Budget[]>;
  getBudgetPeriods(): Promise<BudgetPeriod[]>;
  getRules(): Promise<Rule[]>;
  getNormalizationRules(): Promise<NormalizationRule[]>;
  getWeeklyAggregates(): Promise<WeeklyAggregate[]>;
  updateTransaction(
    id: TransactionId,
    fields: Partial<Pick<Transaction, "note" | "category" | "reimbursement" | "budget" | "normalizedId" | "normalizedPrimary" | "normalizedDescription">>,
  ): Promise<void>;
  updateTransactionStatementItemLink(id: TransactionId, statementItemId: StatementItemId | null): Promise<void>;
  upsertReconciliationNote(fields: ReconciliationNoteFields): Promise<void>;
  deleteReconciliationNote(entityType: ReconciliationEntityType, entityId: string): Promise<void>;
  updateBudget(
    id: BudgetId,
    fields: Partial<Pick<Budget, "name" | "allowance" | "allowancePeriod" | "rollover">>,
  ): Promise<void>;
  updateBudgetOverrides(id: BudgetId, overrides: BudgetOverride[]): Promise<void>;
  adjustBudgetPeriodTotal(id: BudgetPeriodId, delta: number): Promise<void>;
  createRule(fields: Omit<Rule, "id" | "groupId">): Promise<RuleId>;
  updateRule(
    id: RuleId,
    fields: Partial<Pick<Rule, "pattern" | "target" | "priority" | "type" | "institution" | "account" | "minAmount" | "maxAmount" | "excludeCategory" | "matchCategory">>,
  ): Promise<void>;
  deleteRule(id: RuleId): Promise<void>;
  createNormalizationRule(fields: Omit<NormalizationRule, "id" | "groupId">): Promise<NormalizationRuleId>;
  updateNormalizationRule(
    id: NormalizationRuleId,
    fields: Partial<Pick<NormalizationRule, "pattern" | "patternType" | "canonicalDescription" | "dateWindowDays" | "priority" | "institution" | "account">>,
  ): Promise<void>;
  deleteNormalizationRule(id: NormalizationRuleId): Promise<void>;
}

export class SeedDataSource implements DataSource {
  async getTransactions(query?: TransactionQuery): Promise<Transaction[]> {
    const filtered = filterByTimestamp(
      seedData.transactions, query?.since?.toMillis(), query?.before?.toMillis(),
    );
    return filtered.map(toTransaction);
  }
  async getStatements(): Promise<Statement[]> {
    return seedData.statements.map(toStatement);
  }
  async getStatementItems(): Promise<StatementItem[]> {
    return seedData.statementItems.map(toStatementItem);
  }
  async getReconciliationNotes(): Promise<ReconciliationNote[]> {
    return seedData.reconciliationNotes.map(toReconciliationNote);
  }
  async getBudgets(): Promise<Budget[]> {
    return seedData.budgets.map(toBudget);
  }
  async getBudgetPeriods(): Promise<BudgetPeriod[]> {
    return seedData.budgetPeriods.map(toBudgetPeriod);
  }
  async getRules(): Promise<Rule[]> {
    return seedData.rules.map(toRule);
  }
  async getNormalizationRules(): Promise<NormalizationRule[]> {
    return seedData.normalizationRules.map(toNormalizationRule);
  }
  async getWeeklyAggregates(): Promise<WeeklyAggregate[]> {
    return seedData.weeklyAggregates.map(toWeeklyAggregate);
  }
  async updateTransaction(): Promise<void> {
    throw new Error("Seed data is read-only");
  }
  async updateTransactionStatementItemLink(): Promise<void> {
    throw new Error("Seed data is read-only");
  }
  async upsertReconciliationNote(): Promise<void> {
    throw new Error("Seed data is read-only");
  }
  async deleteReconciliationNote(): Promise<void> {
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
  async createNormalizationRule(): Promise<NormalizationRuleId> {
    throw new Error("Seed data is read-only");
  }
  async updateNormalizationRule(): Promise<void> {
    throw new Error("Seed data is read-only");
  }
  async deleteNormalizationRule(): Promise<void> {
    throw new Error("Seed data is read-only");
  }
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
  async getTransactions(query?: TransactionQuery): Promise<Transaction[]> {
    const rows = await getAll<IdbTransaction>("transactions");
    const filtered = filterByTimestamp(rows, query?.since?.toMillis(), query?.before?.toMillis());
    return filtered.map(toTransaction);
  }

  async getStatements(): Promise<Statement[]> {
    const rows = await getAll<IdbStatement>("statements");
    return rows.map(toStatement);
  }

  async getStatementItems(): Promise<StatementItem[]> {
    const rows = await getAll<IdbStatementItem>("statementItems");
    return rows.map(toStatementItem);
  }

  async getReconciliationNotes(): Promise<ReconciliationNote[]> {
    const rows = await getAll<IdbReconciliationNote>("reconciliationNotes");
    return rows.map(toReconciliationNote);
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

  async getWeeklyAggregates(): Promise<WeeklyAggregate[]> {
    const rows = await getAll<IdbWeeklyAggregate>("weeklyAggregates");
    return rows.map(toWeeklyAggregate);
  }

  async updateTransaction(
    id: TransactionId,
    fields: Partial<Pick<Transaction, "note" | "category" | "reimbursement" | "budget" | "normalizedId" | "normalizedPrimary" | "normalizedDescription">>,
  ): Promise<void> {
    await updateRecord<IdbTransaction>("transactions", id, "Transaction", fields);
  }

  async updateTransactionStatementItemLink(
    id: TransactionId,
    statementItemId: StatementItemId | null,
  ): Promise<void> {
    await updateRecord<IdbTransaction>("transactions", id, "Transaction", {
      statementItemId: statementItemId as string | null,
    });
  }

  async upsertReconciliationNote(fields: ReconciliationNoteFields): Promise<void> {
    const id = `${fields.entityType}_${fields.entityId}`;
    const record: IdbReconciliationNote = {
      id,
      entityType: fields.entityType,
      entityId: fields.entityId,
      classification: fields.classification,
      note: fields.note,
      updatedAtMs: Date.now(),
      updatedBy: "local",
    };
    await put("reconciliationNotes", record as unknown as Record<string, unknown>);
  }

  async deleteReconciliationNote(
    entityType: ReconciliationEntityType,
    entityId: string,
  ): Promise<void> {
    const id = `${entityType}_${entityId}`;
    await deleteRecord("reconciliationNotes", id);
  }

  async updateBudget(
    id: BudgetId,
    fields: Partial<Pick<Budget, "name" | "allowance" | "allowancePeriod" | "rollover">>,
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
      minAmount: fields.minAmount,
      maxAmount: fields.maxAmount,
      excludeCategory: fields.excludeCategory,
      matchCategory: fields.matchCategory,
    };
    await put("rules", record as unknown as Record<string, unknown>);
    return id;
  }

  async updateRule(
    id: RuleId,
    fields: Partial<Pick<Rule, "pattern" | "target" | "priority" | "type" | "institution" | "account" | "minAmount" | "maxAmount" | "excludeCategory" | "matchCategory">>,
  ): Promise<void> {
    await updateRecord<IdbRule>("rules", id, "Rule", fields);
  }

  async deleteRule(id: RuleId): Promise<void> {
    await deleteRecord("rules", id);
  }

  async createNormalizationRule(fields: Omit<NormalizationRule, "id" | "groupId">): Promise<NormalizationRuleId> {
    const id = crypto.randomUUID() as NormalizationRuleId;
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
    id: NormalizationRuleId,
    fields: Partial<Pick<NormalizationRule, "pattern" | "patternType" | "canonicalDescription" | "dateWindowDays" | "priority" | "institution" | "account">>,
  ): Promise<void> {
    await updateRecord<IdbNormalizationRule>("normalizationRules", id, "Normalization rule", fields);
  }

  async deleteNormalizationRule(id: NormalizationRuleId): Promise<void> {
    await deleteRecord("normalizationRules", id);
  }
}
