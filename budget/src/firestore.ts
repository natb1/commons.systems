import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, increment, Timestamp, addDoc, deleteDoc, type QueryDocumentSnapshot, type DocumentData } from "firebase/firestore";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";
import { requireString, requireNumber, requireNonNegativeNumber, optionalString, optionalNumber, requireOneOf } from "@commons-systems/firestoreutil/validate";

import { db, NAMESPACE } from "./firebase.js";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import type { GroupId } from "@commons-systems/authutil/groups";
import type { Brand } from "@commons-systems/firestoreutil/brand";
import {
  ROLLOVERS,
  ALLOWANCE_PERIODS,
  RECONCILIATION_CLASSIFICATIONS,
  RECONCILIATION_ENTITY_TYPES,
  RULE_TYPES,
  type Rollover,
  type AllowancePeriod,
  type ReconciliationClassification,
  type ReconciliationEntityType,
  type RuleType,
} from "./schema/enums.js";
import { parseFirestoreTransaction, validateReimbursementRange } from "./entities/transaction.js";
import type { Transaction, TransactionId } from "./entities/transaction.js";
export type { Transaction, IdbTransaction, TransactionId } from "./entities/transaction.js";

export type StatementId = Brand<"StatementId">;
export type StatementItemId = Brand<"StatementItemId">;
export type BudgetId = Brand<"BudgetId">;
export type BudgetPeriodId = Brand<"BudgetPeriodId">;
export type RuleId = Brand<"RuleId">;
export type NormalizationRuleId = Brand<"NormalizationRuleId">;

/** Classification applied to unmatched statement items or transactions during reconciliation. */
export type { ReconciliationClassification, ReconciliationEntityType, Rollover, AllowancePeriod, RuleType } from "./schema/enums.js";
export { ROLLOVERS, ALLOWANCE_PERIODS, RECONCILIATION_CLASSIFICATIONS, RECONCILIATION_ENTITY_TYPES, RULE_TYPES } from "./schema/enums.js";

export type { GroupId } from "@commons-systems/authutil/groups";

export interface BudgetOverride {
  readonly date: Timestamp;
  readonly balance: number;
}

export interface Budget {
  readonly id: BudgetId;
  readonly name: string;
  readonly allowance: number;
  readonly allowancePeriod: AllowancePeriod;
  readonly rollover: Rollover;
  /** Sorted by date ascending. findLatestOverride assumes this ordering. */
  readonly overrides: BudgetOverride[];
  readonly groupId: GroupId | null;
}

export interface BudgetPeriod {
  readonly id: BudgetPeriodId;
  readonly budgetId: BudgetId;
  readonly periodStart: Timestamp;
  readonly periodEnd: Timestamp;
  /** Sum of net transaction amounts (after reimbursement) in this period. May be negative when credits/refunds exceed debits. Client-updatable. */
  readonly total: number;
  /** Number of transactions in this period. Non-negative, immutable by client. */
  readonly count: number;
  /** Net amounts broken down by category. Immutable by client. */
  readonly categoryBreakdown: Record<string, number>;
  readonly groupId: GroupId | null;
}

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

export interface Statement {
  readonly id: string;
  readonly statementId: StatementId;
  readonly institution: string;
  readonly account: string;
  readonly balance: number;
  readonly period: string;
  readonly balanceDate: string | null;
  readonly lastTransactionDate: Timestamp | null;
  readonly groupId: GroupId | null;
  readonly virtual: boolean;
}

/**
 * Immutable bank-record line item. One document per OFX transaction line.
 * Amount uses the raw bank sign convention: negative = debit, positive = credit.
 * Transactions invert this (positive = spending), so reconciliation must sign-flip when matching.
 */
export interface StatementItem {
  readonly id: string;
  readonly statementItemId: StatementItemId;
  readonly statementId: StatementId;
  readonly institution: string;
  readonly account: string;
  readonly period: string;
  readonly amount: number;
  readonly timestamp: Timestamp;
  readonly description: string;
  readonly fitid: string;
  readonly groupId: GroupId | null;
}

/** User annotation on an unmatched reconciliation entity. Document id = `{entityType}_{entityId}`. */
export interface ReconciliationNote {
  readonly id: string;
  readonly entityType: ReconciliationEntityType;
  readonly entityId: string;
  readonly classification: ReconciliationClassification;
  readonly note: string;
  readonly updatedAt: Timestamp;
  readonly updatedBy: string;
  readonly groupId: GroupId | null;
}

function optionalTimestamp(value: unknown, field: string): Timestamp | null {
  if (value == null) return null;
  if (!(value instanceof Timestamp)) {
    throw new DataIntegrityError(`Expected Timestamp for ${field}, got ${typeof value}`);
  }
  return value;
}

function requireTimestamp(value: unknown, field: string): Timestamp {
  const ts = optionalTimestamp(value, field);
  if (ts === null) throw new DataIntegrityError(`Expected Timestamp for ${field}, got null`);
  return ts;
}

function requireCategoryBreakdown(value: unknown): Record<string, number> {
  if (value == null) return {};
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new DataIntegrityError(`Expected object for categoryBreakdown, got ${typeof value}`);
  }
  const result: Record<string, number> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (typeof val !== "number" || !Number.isFinite(val)) {
      throw new DataIntegrityError(`categoryBreakdown[${key}] is not a finite number`);
    }
    result[key] = val;
  }
  return result;
}

function requireOverrides(value: unknown): BudgetOverride[] {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    throw new DataIntegrityError(`Expected array for overrides, got ${typeof value}`);
  }
  const result: BudgetOverride[] = [];
  for (let i = 0; i < value.length; i++) {
    const entry = value[i];
    if (entry == null || typeof entry !== "object") {
      throw new DataIntegrityError(`overrides[${i}] is not an object`);
    }
    const date = requireTimestamp(entry.date, `overrides[${i}].date`);
    const balance = requireNumber(entry.balance, `overrides[${i}].balance`);
    result.push({ date, balance });
  }
  for (let i = 1; i < result.length; i++) {
    if (result[i].date.toMillis() <= result[i - 1].date.toMillis()) {
      throw new DataIntegrityError(`overrides not sorted by date ascending at index ${i}`);
    }
  }
  return result;
}

function requireRollover(value: unknown): Rollover {
  const s = requireString(value, "rollover");
  if (!(ROLLOVERS as readonly string[]).includes(s)) {
    throw new DataIntegrityError(`Expected rollover to be one of ${ROLLOVERS.join(", ")}, got ${value}`);
  }
  return s as Rollover;
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
  filters?: { since?: Timestamp; before?: Timestamp },
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
  return docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      statementId: requireString(data.statementId, "statementId") as StatementId,
      institution: requireString(data.institution, "institution"),
      account: requireString(data.account, "account"),
      balance: requireNumber(data.balance, "balance"),
      period: requireString(data.period, "period"),
      balanceDate: optionalString(data.balanceDate, "balanceDate"),
      lastTransactionDate: optionalTimestamp(data.lastTransactionDate, "lastTransactionDate"),
      groupId: optionalString(data.groupId, "groupId") as GroupId | null,
      virtual: data.virtual === true,
    };
  });
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
  return docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      statementItemId: requireString(data.statementItemId, "statementItemId") as StatementItemId,
      statementId: requireString(data.statementId, "statementId") as StatementId,
      institution: requireString(data.institution, "institution"),
      account: requireString(data.account, "account"),
      period: requireString(data.period, "period"),
      amount: requireNumber(data.amount, "amount"),
      timestamp: requireTimestamp(data.timestamp, "timestamp"),
      description: requireString(data.description, "description"),
      fitid: requireString(data.fitid, "fitid"),
      groupId: optionalString(data.groupId, "groupId") as GroupId | null,
    };
  });
}

function requireReconciliationClassification(value: unknown): ReconciliationClassification {
  return requireOneOf(value, RECONCILIATION_CLASSIFICATIONS, "classification");
}

function requireReconciliationEntityType(value: unknown): ReconciliationEntityType {
  return requireOneOf(value, RECONCILIATION_ENTITY_TYPES, "entityType");
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
  return docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      entityType: requireReconciliationEntityType(data.entityType),
      entityId: requireString(data.entityId, "entityId"),
      classification: requireReconciliationClassification(data.classification),
      note: typeof data.note === "string" ? data.note : "",
      updatedAt: requireTimestamp(data.updatedAt, "updatedAt"),
      updatedBy: requireString(data.updatedBy, "updatedBy"),
      groupId: optionalString(data.groupId, "groupId") as GroupId | null,
    };
  });
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
  requireReconciliationEntityType(fields.entityType);
  requireReconciliationClassification(fields.classification);
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
  return docs.map((docSnap) => {
    const data = docSnap.data();
    const name = requireString(data.name, "name");
    if (!name) throw new DataIntegrityError("Budget name must be non-empty");
    return {
      id: docSnap.id as BudgetId,
      name,
      allowance: requireNonNegativeNumber(data.allowance, "allowance"),
      allowancePeriod: requireAllowancePeriod(data.allowancePeriod),
      rollover: requireRollover(data.rollover),
      overrides: requireOverrides(data.overrides),
      groupId: optionalString(data.groupId, "groupId") as GroupId | null,
    };
  });
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
  const periods = docs.map((docSnap) => {
    const data = docSnap.data();
    const periodStart = requireTimestamp(data.periodStart, "periodStart");
    const periodEnd = requireTimestamp(data.periodEnd, "periodEnd");
    if (periodStart.toMillis() >= periodEnd.toMillis()) {
      throw new DataIntegrityError(
        `periodStart must be before periodEnd for budget period ${docSnap.id}`
      );
    }
    return {
      id: docSnap.id as BudgetPeriodId,
      budgetId: requireString(data.budgetId, "budgetId") as BudgetId,
      periodStart,
      periodEnd,
      total: requireNumber(data.total, "total"),
      count: requireNonNegativeNumber(data.count, "count"),
      categoryBreakdown: requireCategoryBreakdown(data.categoryBreakdown),
      groupId: optionalString(data.groupId, "groupId") as GroupId | null,
    };
  });

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

// --- Rules ---

export interface Rule {
  readonly id: RuleId;
  readonly type: RuleType;
  readonly pattern: string;
  readonly target: string;
  readonly priority: number;
  readonly institution: string | null;
  readonly account: string | null;
  readonly minAmount: number | null;
  readonly maxAmount: number | null;
  readonly excludeCategory: string | null;
  readonly matchCategory: string | null;
  readonly groupId: GroupId | null;
}

function requireRuleType(value: unknown): RuleType {
  const s = requireString(value, "rule type");
  if (!(RULE_TYPES as readonly string[]).includes(s)) {
    throw new DataIntegrityError(`Expected rule type to be ${RULE_TYPES.join(" or ")}, got ${value}`);
  }
  return s as RuleType;
}

export async function getRules(groupId: GroupId, email: string): Promise<Rule[]>;
export async function getRules(groupId: null): Promise<Rule[]>;
export async function getRules(groupId: GroupId | null, email?: string): Promise<Rule[]> {
  const docs = await queryGroupCollection("rules", "seed-", groupId, email);
  return docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id as RuleId,
      type: requireRuleType(data.type),
      pattern: requireString(data.pattern, "pattern"),
      target: requireString(data.target, "target"),
      priority: requireNumber(data.priority, "priority"),
      institution: optionalString(data.institution, "institution"),
      account: optionalString(data.account, "account"),
      minAmount: optionalNumber(data.minAmount, "minAmount"),
      maxAmount: optionalNumber(data.maxAmount, "maxAmount"),
      excludeCategory: optionalString(data.excludeCategory, "excludeCategory"),
      matchCategory: optionalString(data.matchCategory, "matchCategory"),
      groupId: optionalString(data.groupId, "groupId") as GroupId | null,
    };
  });
}

export async function createRule(
  groupId: GroupId,
  memberEmails: string[],
  fields: Omit<Rule, "id" | "groupId">,
): Promise<RuleId> {
  requireRuleType(fields.type);
  if (!Number.isFinite(fields.priority)) throw new RangeError("Rule priority must be a finite number");
  if (!fields.pattern && !fields.matchCategory) throw new Error("Rule pattern or matchCategory is required");
  if (!fields.target) throw new Error("Rule target cannot be empty");
  const path = nsCollectionPath(NAMESPACE, "rules");
  const ref = await addDoc(collection(db, path), {
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
    groupId,
    memberEmails,
  });
  return ref.id as RuleId;
}

export async function updateRule(
  ruleId: RuleId,
  fields: Partial<Pick<Rule, "pattern" | "target" | "priority" | "type" | "institution" | "account" | "minAmount" | "maxAmount" | "excludeCategory" | "matchCategory">>,
): Promise<void> {
  requireDocId(ruleId, "rule");
  if (Object.keys(fields).length === 0) return;
  if (fields.type !== undefined) requireRuleType(fields.type);
  if (fields.priority !== undefined && !Number.isFinite(fields.priority)) throw new RangeError("Rule priority must be a finite number");
  if (fields.target !== undefined && !fields.target) throw new Error("Rule target cannot be empty");
  const path = nsCollectionPath(NAMESPACE, "rules");
  const ref = doc(db, path, ruleId);
  await updateDoc(ref, fields);
}

export async function deleteRule(ruleId: RuleId): Promise<void> {
  requireDocId(ruleId, "rule");
  const path = nsCollectionPath(NAMESPACE, "rules");
  const ref = doc(db, path, ruleId);
  await deleteDoc(ref);
}

// --- Normalization Rules ---

export interface NormalizationRule {
  readonly id: NormalizationRuleId;
  readonly pattern: string;
  readonly patternType: string | null;
  readonly canonicalDescription: string;
  readonly dateWindowDays: number;
  readonly institution: string | null;
  readonly account: string | null;
  readonly priority: number;
  readonly groupId: GroupId | null;
}

export async function getNormalizationRules(groupId: GroupId, email: string): Promise<NormalizationRule[]>;
export async function getNormalizationRules(groupId: null): Promise<NormalizationRule[]>;
export async function getNormalizationRules(groupId: GroupId | null, email?: string): Promise<NormalizationRule[]> {
  const docs = await queryGroupCollection("normalization-rules", "seed-", groupId, email);
  return docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id as NormalizationRuleId,
      pattern: requireString(data.pattern, "pattern"),
      patternType: optionalString(data.patternType, "patternType"),
      canonicalDescription: requireString(data.canonicalDescription, "canonicalDescription"),
      dateWindowDays: data.dateWindowDays == null ? 0 : requireNumber(data.dateWindowDays, "dateWindowDays"),
      institution: optionalString(data.institution, "institution"),
      account: optionalString(data.account, "account"),
      priority: requireNumber(data.priority, "priority"),
      groupId: optionalString(data.groupId, "groupId") as GroupId | null,
    };
  });
}

export async function createNormalizationRule(
  groupId: GroupId,
  memberEmails: string[],
  fields: Omit<NormalizationRule, "id" | "groupId">,
): Promise<NormalizationRuleId> {
  if (!fields.pattern) throw new Error("Normalization rule pattern cannot be empty");
  if (!fields.canonicalDescription) throw new Error("Normalization rule canonical description cannot be empty");
  if (!Number.isFinite(fields.priority)) throw new RangeError("Normalization rule priority must be a finite number");
  const path = nsCollectionPath(NAMESPACE, "normalization-rules");
  const data: Record<string, unknown> = {
    pattern: fields.pattern,
    canonicalDescription: fields.canonicalDescription,
    priority: fields.priority,
    groupId,
    memberEmails,
  };
  if (fields.patternType) data.patternType = fields.patternType;
  if (fields.dateWindowDays != null) data.dateWindowDays = fields.dateWindowDays;
  if (fields.institution) data.institution = fields.institution;
  if (fields.account) data.account = fields.account;
  const ref = await addDoc(collection(db, path), data);
  return ref.id as NormalizationRuleId;
}

export async function updateNormalizationRule(
  ruleId: NormalizationRuleId,
  fields: Partial<Pick<NormalizationRule, "pattern" | "patternType" | "canonicalDescription" | "dateWindowDays" | "priority" | "institution" | "account">>,
): Promise<void> {
  requireDocId(ruleId, "normalization rule");
  if (Object.keys(fields).length === 0) return;
  if (fields.pattern !== undefined && !fields.pattern) throw new Error("Normalization rule pattern cannot be empty");
  if (fields.canonicalDescription !== undefined && !fields.canonicalDescription) throw new Error("Normalization rule canonical description cannot be empty");
  if (fields.priority !== undefined && !Number.isFinite(fields.priority)) throw new RangeError("Normalization rule priority must be a finite number");
  const path = nsCollectionPath(NAMESPACE, "normalization-rules");
  const ref = doc(db, path, ruleId);
  await updateDoc(ref, fields);
}

export async function deleteNormalizationRule(ruleId: NormalizationRuleId): Promise<void> {
  requireDocId(ruleId, "normalization rule");
  const path = nsCollectionPath(NAMESPACE, "normalization-rules");
  const ref = doc(db, path, ruleId);
  await deleteDoc(ref);
}

// --- Weekly Aggregates ---

export interface WeeklyAggregate {
  readonly id: string;
  readonly weekStart: Timestamp;
  readonly creditTotal: number;
  readonly unbudgetedTotal: number;
  readonly groupId: GroupId | null;
}

export async function getWeeklyAggregates(groupId: null): Promise<WeeklyAggregate[]>;
export async function getWeeklyAggregates(groupId: GroupId, email: string): Promise<WeeklyAggregate[]>;
export async function getWeeklyAggregates(groupId: GroupId | null, email?: string): Promise<WeeklyAggregate[]> {
  const docs = await queryGroupCollection("weekly-aggregates", "seed-", groupId, email);
  return docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      weekStart: requireTimestamp(data.weekStart, "weekStart"),
      creditTotal: requireNumber(data.creditTotal, "creditTotal"),
      unbudgetedTotal: requireNumber(data.unbudgetedTotal, "unbudgetedTotal"),
      groupId: optionalString(data.groupId, "groupId") as GroupId | null,
    };
  });
}
