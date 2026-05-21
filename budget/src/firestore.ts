import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, increment, writeBatch, Timestamp, deleteDoc, type QueryDocumentSnapshot, type DocumentData } from "firebase/firestore";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";
import { requireOneOf } from "@commons-systems/firestoreutil/validate";

import { db, NAMESPACE } from "./firebase.js";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import type { GroupId } from "@commons-systems/authutil/groups";
import {
  ROLLOVERS,
  ALLOWANCE_PERIODS,
  RECONCILIATION_CLASSIFICATIONS,
  RECONCILIATION_ENTITY_TYPES,
  type Rollover,
  type AllowancePeriod,
  type ReconciliationClassification,
  type ReconciliationEntityType,
} from "./schema/enums.js";
import { parseFirestoreAccount } from "./entities/account.js";
import type { Account } from "./entities/account.js";
export type { Account } from "./entities/account.js";
import { parseFirestoreJournalEntry } from "./entities/journal-entry.js";
import type { JournalEntry } from "./entities/journal-entry.js";
export type { JournalEntry } from "./entities/journal-entry.js";
import { parseFirestoreJournalLeg } from "./entities/journal-leg.js";
import type { JournalLeg } from "./entities/journal-leg.js";
export type { JournalLeg } from "./entities/journal-leg.js";
import { parseFirestoreReconciliationEvent } from "./entities/reconciliation-event.js";
import type { ReconciliationEvent } from "./entities/reconciliation-event.js";
export type { ReconciliationEvent } from "./entities/reconciliation-event.js";
import { parseFirestoreTransaction, validateReimbursementRange } from "./entities/transaction.js";
import type { Transaction, TransactionId } from "./entities/transaction.js";
export type { Transaction, IdbTransaction, TransactionId } from "./entities/transaction.js";
import { parseFirestoreStatement } from "./entities/statement.js";
import type { Statement } from "./entities/statement.js";
export type { Statement, IdbStatement, StatementId } from "./entities/statement.js";
import { parseFirestoreStatementItem } from "./entities/statement-item.js";
import type { StatementItem, StatementItemId } from "./entities/statement-item.js";
export type { StatementItem, IdbStatementItem, StatementItemId } from "./entities/statement-item.js";
import { parseFirestoreReconciliationNote } from "./entities/reconciliation-note.js";
import type { ReconciliationNote } from "./entities/reconciliation-note.js";
export type { ReconciliationNote, IdbReconciliationNote } from "./entities/reconciliation-note.js";
import { parseFirestoreBudget } from "./entities/budget.js";
import type { Budget, BudgetOverride, BudgetId } from "./entities/budget.js";
export type { Budget, BudgetOverride, IdbBudget, BudgetId } from "./entities/budget.js";
import { parseFirestoreBudgetPeriod } from "./entities/budget-period.js";
import type { BudgetPeriod, BudgetPeriodId } from "./entities/budget-period.js";
export type { BudgetPeriod, IdbBudgetPeriod, BudgetPeriodId } from "./entities/budget-period.js";
export type { Rule, IdbRule, RuleId } from "./entities/rule.js";
export type { NormalizationRule, IdbNormalizationRule, NormalizationRuleId } from "./entities/normalization-rule.js";
import { parseFirestoreWeeklyAggregate } from "./entities/weekly-aggregate.js";
import type { WeeklyAggregate } from "./entities/weekly-aggregate.js";
export type { WeeklyAggregate, IdbWeeklyAggregate } from "./entities/weekly-aggregate.js";

/** Classification applied to unmatched statement items or transactions during reconciliation. */
export type { ReconciliationClassification, ReconciliationEntityType, Rollover, AllowancePeriod, RuleType, AccountType } from "./schema/enums.js";
export { ROLLOVERS, ALLOWANCE_PERIODS, RECONCILIATION_CLASSIFICATIONS, RECONCILIATION_ENTITY_TYPES, RULE_TYPES, ACCOUNT_TYPES } from "./schema/enums.js";

export type { GroupId } from "@commons-systems/authutil/groups";

/** Serialized form of BudgetPeriod for HTML data attributes. Serialized by page renderers and deserialized by their hydration counterparts. */
export interface SerializedBudgetPeriod {
  readonly id: BudgetPeriodId;
  readonly budgetId: BudgetId;
  readonly periodStartMs: number;
  readonly periodEndMs: number;
  readonly total: number;
  readonly count: number;
  readonly categoryBreakdown: Record<string, number>;
}

function requireRollover(value: unknown): Rollover {
  if (!(ROLLOVERS as readonly string[]).includes(String(value))) {
    throw new DataIntegrityError(`Expected rollover to be one of ${ROLLOVERS.join(", ")}, got ${value}`);
  }
  return value as Rollover;
}

function requireAllowancePeriod(value: unknown): AllowancePeriod {
  if (value == null) return "weekly";
  return requireOneOf(value, ALLOWANCE_PERIODS, "allowancePeriod");
}

/**
 * Build and execute a group-scoped Firestore query.
 * When groupId is null, reads the public seed collection (e.g. "seed-transactions").
 * When groupId is provided, reads the authenticated collection filtered by group membership.
 */
async function queryGroupCollection(
  collectionName: string,
  seedPrefix: string,
  groupId: GroupId | null,
  email?: string,
  filters?: { since?: Timestamp; before?: Timestamp; accountId?: string },
): Promise<QueryDocumentSnapshot<DocumentData, DocumentData>[]> {
  if (groupId && !email) throw new Error("email is required when querying by groupId");
  const name = groupId ? collectionName : `${seedPrefix}${collectionName}`;
  const path = nsCollectionPath(NAMESPACE, name);
  const constraints = groupId
    ? [
        where("groupId", "==", groupId),
        where("memberEmails", "array-contains", email),
      ]
    : [];
  if (filters?.accountId) constraints.push(where("accountId", "==", filters.accountId));
  if (filters?.since) constraints.push(where("timestamp", ">=", filters.since));
  if (filters?.before) constraints.push(where("timestamp", "<", filters.before));
  const q = query(collection(db, path), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs;
}

export async function getGroupMembers(groupId: GroupId): Promise<string[]> {
  const path = nsCollectionPath(NAMESPACE, "groups");
  const docSnap = await getDoc(doc(db, path, groupId));
  if (!docSnap.exists()) throw new Error(`Group ${groupId} not found`);
  const members = docSnap.data().members;
  if (!Array.isArray(members)) throw new DataIntegrityError(`Group ${groupId}: members is not an array`);
  const nonStrings = members.filter((m: unknown) => typeof m !== "string");
  if (nonStrings.length > 0) {
    throw new DataIntegrityError(`Group ${groupId}: members contains non-string elements`);
  }
  if (members.length === 0) throw new DataIntegrityError(`Group ${groupId}: members array is empty`);
  return members as string[];
}

export async function getTransactions(groupId: null, email?: undefined, filters?: { since?: Timestamp; before?: Timestamp }): Promise<Transaction[]>;
export async function getTransactions(groupId: GroupId, email: string, filters?: { since?: Timestamp; before?: Timestamp }): Promise<Transaction[]>;
export async function getTransactions(groupId: GroupId | null, email?: string, filters?: { since?: Timestamp; before?: Timestamp }): Promise<Transaction[]> {
  const docs = await queryGroupCollection("transactions", "seed-", groupId, email, filters);
  return docs.map(parseFirestoreTransaction);
}

export async function getStatements(groupId: null): Promise<Statement[]>;
export async function getStatements(groupId: GroupId, email: string): Promise<Statement[]>;
export async function getStatements(groupId: GroupId | null, email?: string): Promise<Statement[]> {
  const docs = await queryGroupCollection("statements", "seed-", groupId, email);
  return docs.map(parseFirestoreStatement);
}

function requireDocId(id: string, label: string): void {
  if (!id || id.includes("/")) throw new Error(`Invalid ${label} ID`);
}

export async function updateTransaction(
  txnId: TransactionId,
  fields: Partial<Pick<Transaction, "note" | "category" | "reimbursement" | "budget" | "normalizedId" | "normalizedPrimary" | "normalizedDescription">>,
): Promise<void> {
  requireDocId(txnId, "transaction");
  if (Object.keys(fields).length === 0) return;
  if (fields.reimbursement !== undefined) {
    validateReimbursementRange(fields.reimbursement);
  }
  const path = nsCollectionPath(NAMESPACE, "transactions");
  const ref = doc(db, path, txnId);
  await updateDoc(ref, fields);
}

export async function updateTransactionStatementItemLink(
  txnId: TransactionId,
  statementItemId: StatementItemId | null,
): Promise<void> {
  requireDocId(txnId, "transaction");
  const path = nsCollectionPath(NAMESPACE, "transactions");
  const ref = doc(db, path, txnId);
  await updateDoc(ref, { statementItemId });
}

export async function getStatementItems(groupId: null): Promise<StatementItem[]>;
export async function getStatementItems(groupId: GroupId, email: string): Promise<StatementItem[]>;
export async function getStatementItems(groupId: GroupId | null, email?: string): Promise<StatementItem[]> {
  const docs = await queryGroupCollection("statement-items", "seed-", groupId, email);
  return docs.map(parseFirestoreStatementItem);
}

export function reconciliationNoteDocId(
  entityType: ReconciliationEntityType,
  entityId: string,
): string {
  if (!entityId || entityId.includes("/")) throw new Error(`Invalid reconciliation entity id: ${entityId}`);
  return `${entityType}_${entityId}`;
}

export async function getReconciliationNotes(groupId: null): Promise<ReconciliationNote[]>;
export async function getReconciliationNotes(groupId: GroupId, email: string): Promise<ReconciliationNote[]>;
export async function getReconciliationNotes(groupId: GroupId | null, email?: string): Promise<ReconciliationNote[]> {
  const docs = await queryGroupCollection("reconciliation-notes", "seed-", groupId, email);
  return docs.map(parseFirestoreReconciliationNote);
}

export async function upsertReconciliationNote(
  groupId: GroupId,
  memberEmails: string[],
  updatedBy: string,
  fields: {
    entityType: ReconciliationEntityType;
    entityId: string;
    classification: ReconciliationClassification;
    note: string;
  },
): Promise<string> {
  requireOneOf(fields.entityType, RECONCILIATION_ENTITY_TYPES, "entityType");
  requireOneOf(fields.classification, RECONCILIATION_CLASSIFICATIONS, "classification");
  if (!fields.entityId) throw new Error("entityId is required");
  const id = reconciliationNoteDocId(fields.entityType, fields.entityId);
  const path = nsCollectionPath(NAMESPACE, "reconciliation-notes");
  const ref = doc(db, path, id);
  await setDoc(ref, {
    entityType: fields.entityType,
    entityId: fields.entityId,
    classification: fields.classification,
    note: fields.note,
    updatedAt: Timestamp.now(),
    updatedBy,
    groupId,
    memberEmails,
  });
  return id;
}

export async function deleteReconciliationNote(
  entityType: ReconciliationEntityType,
  entityId: string,
): Promise<void> {
  const id = reconciliationNoteDocId(entityType, entityId);
  const path = nsCollectionPath(NAMESPACE, "reconciliation-notes");
  const ref = doc(db, path, id);
  await deleteDoc(ref);
}

export async function getBudgets(groupId: null): Promise<Budget[]>;
export async function getBudgets(groupId: GroupId, email: string): Promise<Budget[]>;
export async function getBudgets(groupId: GroupId | null, email?: string): Promise<Budget[]> {
  const docs = await queryGroupCollection("budgets", "seed-", groupId, email);
  return docs.map(parseFirestoreBudget);
}

function validateNoOverlappingPeriods(periods: BudgetPeriod[]): void {
  const byBudget = new Map<BudgetId, BudgetPeriod[]>();
  for (const p of periods) {
    const list = byBudget.get(p.budgetId);
    if (list) list.push(p);
    else byBudget.set(p.budgetId, [p]);
  }
  for (const [budgetId, budgetPeriods] of byBudget) {
    budgetPeriods.sort((a, b) => a.periodStart.toMillis() - b.periodStart.toMillis());
    for (let i = 1; i < budgetPeriods.length; i++) {
      if (budgetPeriods[i].periodStart.toMillis() < budgetPeriods[i - 1].periodEnd.toMillis()) {
        throw new DataIntegrityError(
          `Overlapping budget periods for budget ${budgetId}: ${budgetPeriods[i - 1].id} and ${budgetPeriods[i].id}`
        );
      }
    }
  }
}

export async function getBudgetPeriods(groupId: null): Promise<BudgetPeriod[]>;
export async function getBudgetPeriods(groupId: GroupId, email: string): Promise<BudgetPeriod[]>;
export async function getBudgetPeriods(groupId: GroupId | null, email?: string): Promise<BudgetPeriod[]> {
  const docs = await queryGroupCollection("budget-periods", "seed-", groupId, email);
  const periods = docs.map(parseFirestoreBudgetPeriod);
  validateNoOverlappingPeriods(periods);
  return periods;
}

export async function updateBudgetPeriod(
  periodId: BudgetPeriodId,
  fields: Partial<Pick<BudgetPeriod, "total">>,
): Promise<void> {
  requireDocId(periodId, "period");
  if (Object.keys(fields).length === 0) return;
  if (fields.total !== undefined) {
    if (!Number.isFinite(fields.total)) {
      throw new RangeError("Total must be a finite number");
    }
  }
  const path = nsCollectionPath(NAMESPACE, "budget-periods");
  const ref = doc(db, path, periodId);
  await updateDoc(ref, fields);
}

export async function adjustBudgetPeriodTotal(
  periodId: BudgetPeriodId,
  delta: number,
): Promise<void> {
  requireDocId(periodId, "period");
  if (!Number.isFinite(delta)) throw new RangeError("Delta must be a finite number");
  if (delta === 0) return;
  const path = nsCollectionPath(NAMESPACE, "budget-periods");
  const ref = doc(db, path, periodId);
  await updateDoc(ref, { total: increment(delta) });
}

export async function updateBudget(
  budgetId: BudgetId,
  fields: Partial<Pick<Budget, "name" | "allowance" | "allowancePeriod" | "rollover">>,
): Promise<void> {
  requireDocId(budgetId, "budget");
  if (Object.keys(fields).length === 0) return;
  if (fields.name !== undefined && !fields.name) {
    throw new Error("Budget name cannot be empty");
  }
  if (fields.allowance !== undefined) {
    if (!Number.isFinite(fields.allowance) || fields.allowance < 0) {
      throw new RangeError("Allowance must be a non-negative number");
    }
  }
  if (fields.allowancePeriod !== undefined) {
    requireAllowancePeriod(fields.allowancePeriod);
  }
  if (fields.rollover !== undefined) {
    requireRollover(fields.rollover);
  }
  const path = nsCollectionPath(NAMESPACE, "budgets");
  const ref = doc(db, path, budgetId);
  await updateDoc(ref, fields);
}

export async function updateBudgetOverrides(
  budgetId: BudgetId,
  overrides: BudgetOverride[],
): Promise<void> {
  requireDocId(budgetId, "budget");
  for (let i = 1; i < overrides.length; i++) {
    if (overrides[i].date.toMillis() <= overrides[i - 1].date.toMillis()) {
      throw new Error("Overrides must be sorted by date ascending");
    }
  }
  const path = nsCollectionPath(NAMESPACE, "budgets");
  const ref = doc(db, path, budgetId);
  await updateDoc(ref, {
    overrides: overrides.map(o => ({ date: o.date, balance: o.balance })),
  });
}

// --- Weekly Aggregates ---

export async function getWeeklyAggregates(groupId: null): Promise<WeeklyAggregate[]>;
export async function getWeeklyAggregates(groupId: GroupId, email: string): Promise<WeeklyAggregate[]>;
export async function getWeeklyAggregates(groupId: GroupId | null, email?: string): Promise<WeeklyAggregate[]> {
  const docs = await queryGroupCollection("weekly-aggregates", "seed-", groupId, email);
  return docs.map(parseFirestoreWeeklyAggregate);
}

// --- Double-entry ledger: accounts, journal entries, journal legs, reconciliation events ---

/** Read the chart of accounts. Group-scoped; reads `seed-accounts` when groupId is null. */
export async function getAccounts(groupId: null): Promise<Account[]>;
export async function getAccounts(groupId: GroupId, email: string): Promise<Account[]>;
export async function getAccounts(groupId: GroupId | null, email?: string): Promise<Account[]> {
  const docs = await queryGroupCollection("accounts", "seed-", groupId, email);
  return docs.map(parseFirestoreAccount);
}

/** Read journal entries, optionally filtered by a timestamp range. */
export async function getJournalEntries(groupId: null, email?: undefined, filters?: { since?: Timestamp; before?: Timestamp }): Promise<JournalEntry[]>;
export async function getJournalEntries(groupId: GroupId, email: string, filters?: { since?: Timestamp; before?: Timestamp }): Promise<JournalEntry[]>;
export async function getJournalEntries(groupId: GroupId | null, email?: string, filters?: { since?: Timestamp; before?: Timestamp }): Promise<JournalEntry[]> {
  const docs = await queryGroupCollection("journal-entries", "seed-", groupId, email, filters);
  return docs.map(parseFirestoreJournalEntry);
}

/** Read completed reconciliation events. */
export async function getReconciliationEvents(groupId: null): Promise<ReconciliationEvent[]>;
export async function getReconciliationEvents(groupId: GroupId, email: string): Promise<ReconciliationEvent[]>;
export async function getReconciliationEvents(groupId: GroupId | null, email?: string): Promise<ReconciliationEvent[]> {
  const docs = await queryGroupCollection("reconciliation-events", "seed-", groupId, email);
  return docs.map(parseFirestoreReconciliationEvent);
}

/**
 * Read all journal legs for a single account within a timestamp period.
 * Queries the flat `journal-legs` collection with an `accountId` equality clause
 * plus the period range.
 */
export async function getJournalLegs(accountId: string, period: { since?: Timestamp; before?: Timestamp }, groupId: null): Promise<JournalLeg[]>;
export async function getJournalLegs(accountId: string, period: { since?: Timestamp; before?: Timestamp }, groupId: GroupId, email: string): Promise<JournalLeg[]>;
export async function getJournalLegs(accountId: string, period: { since?: Timestamp; before?: Timestamp }, groupId: GroupId | null, email?: string): Promise<JournalLeg[]> {
  const docs = await queryGroupCollection("journal-legs", "seed-", groupId, email, {
    accountId,
    since: period.since,
    before: period.before,
  });
  return docs.map(parseFirestoreJournalLeg);
}

/**
 * Create a balanced double-entry journal entry and its legs in a single batch.
 *
 * Validates synchronously and throws before any write when the legs are
 * unbalanced, fewer than two, have both a debit and a credit, or carry a
 * negative / non-finite amount. Returns the new journal-entry document id.
 */
export async function createJournalEntry(
  groupId: GroupId,
  memberEmails: string[],
  entry: { timestamp: Timestamp; description: string; note?: string | null },
  legs: ReadonlyArray<{
    accountId: string;
    debit: number;
    credit: number;
    cleared?: boolean;
    statementItemId?: string | null;
  }>,
): Promise<string> {
  if (legs.length < 2) {
    throw new DataIntegrityError(`Journal entry requires at least 2 legs, got ${legs.length}`);
  }
  let totalDebit = 0;
  let totalCredit = 0;
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    if (!Number.isFinite(leg.debit) || !Number.isFinite(leg.credit)) {
      throw new DataIntegrityError(`Journal leg ${i} has a non-finite amount (debit=${leg.debit}, credit=${leg.credit})`);
    }
    if (leg.debit < 0 || leg.credit < 0) {
      throw new DataIntegrityError(`Journal leg ${i} has a negative amount (debit=${leg.debit}, credit=${leg.credit})`);
    }
    if (leg.debit > 0 && leg.credit > 0) {
      throw new DataIntegrityError(`Journal leg ${i} cannot have both a debit and a credit (debit=${leg.debit}, credit=${leg.credit})`);
    }
    totalDebit += leg.debit;
    totalCredit += leg.credit;
  }
  if (Math.abs(totalDebit - totalCredit) > 0.005) {
    throw new DataIntegrityError(
      `Journal entry is unbalanced: debits ${totalDebit} != credits ${totalCredit}`,
    );
  }

  const entriesPath = nsCollectionPath(NAMESPACE, "journal-entries");
  const legsPath = nsCollectionPath(NAMESPACE, "journal-legs");
  const entryRef = doc(collection(db, entriesPath));
  const batch = writeBatch(db);
  batch.set(entryRef, {
    timestamp: entry.timestamp,
    description: entry.description,
    note: entry.note ?? null,
    legCount: legs.length,
    groupId,
    memberEmails,
  });
  for (const leg of legs) {
    const legRef = doc(collection(db, legsPath));
    batch.set(legRef, {
      entryId: entryRef.id,
      accountId: leg.accountId,
      debit: leg.debit,
      credit: leg.credit,
      timestamp: entry.timestamp,
      cleared: leg.cleared ?? false,
      statementItemId: leg.statementItemId ?? null,
      groupId,
      memberEmails,
    });
  }
  await batch.commit();
  return entryRef.id;
}

/**
 * Guard for the journal-leg cleared/reconciled state model.
 *
 * A leg moves uncleared → cleared → reconciled. The uncleared/cleared
 * transition is free in either direction. `reconciled` (`reconciledAt != null`)
 * is terminal: any change to `cleared` on a reconciled leg is rejected.
 */
export function assertLegStateTransition(
  leg: Pick<JournalLeg, "cleared" | "reconciledAt">,
  nextCleared: boolean,
): void {
  if (leg.reconciledAt != null) {
    throw new Error(
      `Cannot change cleared state to ${nextCleared}: leg is reconciled (reconciled state is terminal)`,
    );
  }
}

/**
 * Toggle a journal leg's `cleared` flag. Rejects the change when the leg is
 * already reconciled (see `assertLegStateTransition`).
 */
export async function updateJournalLegCleared(legId: string, cleared: boolean): Promise<void> {
  requireDocId(legId, "journal leg");
  const path = nsCollectionPath(NAMESPACE, "journal-legs");
  const ref = doc(db, path, legId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error(`Journal leg ${legId} not found`);
  const leg = parseFirestoreJournalLeg(snap as QueryDocumentSnapshot<DocumentData, DocumentData>);
  assertLegStateTransition(leg, cleared);
  await updateDoc(ref, { cleared });
}
