import { Timestamp } from "firebase/firestore";
import type {
  Transaction,
  Statement,
  StatementItem,
  StatementItemId,
  ReconciliationNote,
  ReconciliationEntityType,
  ReconciliationClassification,
  Account,
  JournalEntry,
  JournalLeg,
  ReconciliationEvent,
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
import { assertLegStateTransition } from "./firestore.js";
import seedData from "virtual:budget-seed-data";
import { getAll, get, put, deleteRecord } from "./idb.js";
import type { IdbTransaction, IdbStatement, IdbStatementItem, IdbReconciliationNote, IdbAccount, IdbJournalEntry, IdbJournalLeg, IdbReconciliationEvent, IdbBudget, IdbBudgetPeriod, IdbRule, IdbNormalizationRule, IdbWeeklyAggregate } from "./idb.js";
import { idbToTransaction } from "./entities/transaction.js";
import { idbToStatement } from "./entities/statement.js";
import { idbToStatementItem } from "./entities/statement-item.js";
import { idbToReconciliationNote } from "./entities/reconciliation-note.js";
import { idbToAccount, accountDocId } from "./entities/account.js";
import { idbToJournalEntry } from "./entities/journal-entry.js";
import { idbToJournalLeg } from "./entities/journal-leg.js";
import { idbToReconciliationEvent } from "./entities/reconciliation-event.js";
import { idbToBudget } from "./entities/budget.js";
import { idbToBudgetPeriod } from "./entities/budget-period.js";
import { idbToRule } from "./entities/rule.js";
import { idbToNormalizationRule } from "./entities/normalization-rule.js";
import { idbToWeeklyAggregate } from "./entities/weekly-aggregate.js";
import { filterByTimestamp } from "./entities/_helpers.js";

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

/**
 * Everything an `IdbReconciliationEvent` record needs except the `legIds` array
 * (passed separately) and the document `id` (derived from institution + account
 * + reconciled-through date).
 */
export type ReconciliationEventFields = Omit<IdbReconciliationEvent, "id" | "legIds">;

/** Fields for a new journal entry; the document `id` is generated on write. */
export interface JournalEntryFields {
  timestampMs: number;
  description: string;
  note?: string | null;
}

/** Fields for a new journal leg; the document `id` is generated on write. */
export interface JournalLegFields {
  accountId: string;
  debit: number;
  credit: number;
  cleared: boolean;
}

export interface DataSource {
  getTransactions(query?: TransactionQuery): Promise<Transaction[]>;
  getStatements(): Promise<Statement[]>;
  getStatementItems(): Promise<StatementItem[]>;
  getReconciliationNotes(): Promise<ReconciliationNote[]>;
  getAccounts(): Promise<Account[]>;
  getJournalEntries(): Promise<JournalEntry[]>;
  getJournalLegs(): Promise<JournalLeg[]>;
  getReconciliationEvents(): Promise<ReconciliationEvent[]>;
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
  updateJournalLegCleared(legId: string, cleared: boolean): Promise<void>;
  createReconciliationEvent(fields: ReconciliationEventFields, legIds: string[]): Promise<ReconciliationEvent>;
  /**
   * Creates a balanced journal entry with its legs in one operation.
   * `legIds[i]` in the result corresponds to `legs[i]` (same order).
   */
  createJournalEntry(entry: JournalEntryFields, legs: JournalLegFields[]): Promise<{ entryId: string; legIds: string[] }>;
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
    return filtered.map(idbToTransaction);
  }
  async getStatements(): Promise<Statement[]> {
    return seedData.statements.map(idbToStatement);
  }
  async getStatementItems(): Promise<StatementItem[]> {
    return seedData.statementItems.map(idbToStatementItem);
  }
  async getReconciliationNotes(): Promise<ReconciliationNote[]> {
    return seedData.reconciliationNotes.map(idbToReconciliationNote);
  }
  async getAccounts(): Promise<Account[]> {
    return seedData.accounts.map(idbToAccount);
  }
  async getJournalEntries(): Promise<JournalEntry[]> {
    return seedData.journalEntries.map(idbToJournalEntry);
  }
  async getJournalLegs(): Promise<JournalLeg[]> {
    return seedData.journalLegs.map(idbToJournalLeg);
  }
  async getReconciliationEvents(): Promise<ReconciliationEvent[]> {
    return seedData.reconciliationEvents.map(idbToReconciliationEvent);
  }
  async getBudgets(): Promise<Budget[]> {
    return seedData.budgets.map(idbToBudget);
  }
  async getBudgetPeriods(): Promise<BudgetPeriod[]> {
    return seedData.budgetPeriods.map(idbToBudgetPeriod);
  }
  async getRules(): Promise<Rule[]> {
    return seedData.rules.map(idbToRule);
  }
  async getNormalizationRules(): Promise<NormalizationRule[]> {
    return seedData.normalizationRules.map(idbToNormalizationRule);
  }
  async getWeeklyAggregates(): Promise<WeeklyAggregate[]> {
    return seedData.weeklyAggregates.map(idbToWeeklyAggregate);
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
  async updateJournalLegCleared(): Promise<void> {
    throw new Error("Seed data is read-only");
  }
  async createReconciliationEvent(): Promise<ReconciliationEvent> {
    throw new Error("Seed data is read-only");
  }
  async createJournalEntry(): Promise<{ entryId: string; legIds: string[] }> {
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
    return filtered.map(idbToTransaction);
  }

  async getStatements(): Promise<Statement[]> {
    const rows = await getAll<IdbStatement>("statements");
    return rows.map(idbToStatement);
  }

  async getStatementItems(): Promise<StatementItem[]> {
    const rows = await getAll<IdbStatementItem>("statementItems");
    return rows.map(idbToStatementItem);
  }

  async getReconciliationNotes(): Promise<ReconciliationNote[]> {
    const rows = await getAll<IdbReconciliationNote>("reconciliationNotes");
    return rows.map(idbToReconciliationNote);
  }

  async getAccounts(): Promise<Account[]> {
    const rows = await getAll<IdbAccount>("accounts");
    return rows.map(idbToAccount);
  }

  async getJournalEntries(): Promise<JournalEntry[]> {
    const rows = await getAll<IdbJournalEntry>("journalEntries");
    return rows.map(idbToJournalEntry);
  }

  async getJournalLegs(): Promise<JournalLeg[]> {
    const rows = await getAll<IdbJournalLeg>("journalLegs");
    return rows.map(idbToJournalLeg);
  }

  async getReconciliationEvents(): Promise<ReconciliationEvent[]> {
    const rows = await getAll<IdbReconciliationEvent>("reconciliationEvents");
    return rows.map(idbToReconciliationEvent);
  }

  async getBudgets(): Promise<Budget[]> {
    const rows = await getAll<IdbBudget>("budgets");
    return rows.map(idbToBudget);
  }

  async getBudgetPeriods(): Promise<BudgetPeriod[]> {
    const rows = await getAll<IdbBudgetPeriod>("budgetPeriods");
    return rows.map(idbToBudgetPeriod);
  }

  async getRules(): Promise<Rule[]> {
    const rows = await getAll<IdbRule>("rules");
    return rows.map(idbToRule);
  }

  async getNormalizationRules(): Promise<NormalizationRule[]> {
    const rows = await getAll<IdbNormalizationRule>("normalizationRules");
    return rows.map(idbToNormalizationRule);
  }

  async getWeeklyAggregates(): Promise<WeeklyAggregate[]> {
    const rows = await getAll<IdbWeeklyAggregate>("weeklyAggregates");
    return rows.map(idbToWeeklyAggregate);
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

  async updateJournalLegCleared(legId: string, cleared: boolean): Promise<void> {
    const row = await get<IdbJournalLeg>("journalLegs", legId);
    if (!row) throw new Error(`Journal leg ${legId} not found`);
    // assertLegStateTransition reads the domain shape; only cleared/reconciledAt matter.
    assertLegStateTransition(
      { cleared: row.cleared, reconciledAt: row.reconciledAtMs == null ? null : Timestamp.fromMillis(row.reconciledAtMs) },
      cleared,
    );
    await put("journalLegs", { ...row, cleared } as unknown as Record<string, unknown>);
  }

  async createReconciliationEvent(
    fields: ReconciliationEventFields,
    legIds: string[],
  ): Promise<ReconciliationEvent> {
    const reconciledThrough = new Date(fields.reconciledThroughDateMs).toISOString().slice(0, 10);
    const id = `${accountDocId(fields.institution, fields.account)}_${reconciledThrough}`;
    const record: IdbReconciliationEvent = { id, ...fields, legIds: [...legIds] };
    await put("reconciliationEvents", record as unknown as Record<string, unknown>);
    // Stamp each cleared leg as reconciled by this event.
    await Promise.all(
      legIds.map((legId) =>
        updateRecord<IdbJournalLeg>("journalLegs", legId, "Journal leg", {
          reconciledAtMs: fields.reconciledAtMs,
          reconciledEventId: id,
        }),
      ),
    );
    return idbToReconciliationEvent(record);
  }

  async createJournalEntry(
    entry: JournalEntryFields,
    legs: JournalLegFields[],
  ): Promise<{ entryId: string; legIds: string[] }> {
    if (legs.length < 2) throw new Error("A journal entry requires at least 2 legs");
    const totalDebit = legs.reduce((s, l) => s + l.debit, 0);
    const totalCredit = legs.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.005) {
      throw new Error(`Unbalanced journal entry: debits ${totalDebit} != credits ${totalCredit}`);
    }
    const entryId = crypto.randomUUID();
    const entryRecord: IdbJournalEntry = {
      id: entryId,
      timestampMs: entry.timestampMs,
      description: entry.description,
      note: entry.note ?? null,
      legCount: legs.length,
    };
    await put("journalEntries", entryRecord as unknown as Record<string, unknown>);
    const legIds: string[] = [];
    for (const leg of legs) {
      const legId = crypto.randomUUID();
      legIds.push(legId);
      const legRecord: IdbJournalLeg = {
        id: legId,
        entryId,
        accountId: leg.accountId,
        debit: leg.debit,
        credit: leg.credit,
        timestampMs: entry.timestampMs,
        cleared: leg.cleared,
        reconciledAtMs: null,
        reconciledEventId: null,
        statementItemId: null,
      };
      await put("journalLegs", legRecord as unknown as Record<string, unknown>);
    }
    return { entryId, legIds };
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
