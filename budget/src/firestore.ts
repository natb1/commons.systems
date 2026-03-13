import { collection, doc, getDoc, getDocs, query, updateDoc, where, increment, Timestamp, addDoc, deleteDoc, type QueryDocumentSnapshot, type DocumentData } from "firebase/firestore";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";
import { requireString, requireNumber, requireNonNegativeNumber, optionalString } from "@commons-systems/firestoreutil/validate";

import { db, NAMESPACE } from "./firebase.js";
import { DataIntegrityError } from "./errors.js";

/**
 * Budget rollover strategy:
 * - "none": balance resets to the weekly allowance each period (no carry-forward)
 * - "debt": only negative balances carry to next period
 * - "balance": full balance (positive or negative) carries over
 */
export type Rollover = "none" | "debt" | "balance";

export interface Budget {
  readonly id: string;
  readonly name: string;
  readonly weeklyAllowance: number;
  readonly rollover: Rollover;
  readonly groupId: string | null;
}

export interface BudgetPeriod {
  readonly id: string;
  readonly budgetId: string;
  readonly periodStart: Timestamp;
  readonly periodEnd: Timestamp;
  /** Sum of net transaction amounts (after reimbursement) in this period. May be negative when credits/refunds exceed debits. Client-updatable. */
  readonly total: number;
  /** Number of transactions in this period. Non-negative, immutable by client. */
  readonly count: number;
  /** Net amounts broken down by category. Immutable by client. */
  readonly categoryBreakdown: Record<string, number>;
  readonly groupId: string | null;
}

/** Serialized form of BudgetPeriod for HTML data attributes. Used by both home.ts (serializer) and home-hydrate.ts (parser). */
export interface SerializedBudgetPeriod {
  readonly id: string;
  readonly budgetId: string;
  readonly periodStartMs: number;
  readonly periodEndMs: number;
  readonly total: number;
  readonly count: number;
  readonly categoryBreakdown: Record<string, number>;
}

export interface Transaction {
  readonly id: string;
  readonly institution: string;
  readonly account: string;
  readonly description: string;
  /** Transaction amount. May be negative for credits/refunds. */
  readonly amount: number;
  readonly note: string;
  readonly category: string;
  /**
   * Percentage, range [0, 100]. Validated at read and write boundaries:
   * read via requireReimbursement (throws RangeError for out-of-range values),
   * write via validateReimbursementRange in updateTransaction.
   * Server-side enforcement via Firestore security rules ensures the type
   * and range constraints hold even if client validation is bypassed.
   */
  readonly reimbursement: number;
  readonly budget: string | null;
  readonly timestamp: Timestamp | null;
  readonly statementId: string | null;
  readonly groupId: string | null;
  readonly normalizedId: string | null;
  readonly normalizedPrimary: boolean;
  readonly normalizedDescription: string | null;
}

function validateReimbursementRange(n: number): void {
  if (!Number.isFinite(n) || n < 0 || n > 100) {
    throw new RangeError(`reimbursement must be between 0 and 100, got ${n}`);
  }
}

function requireReimbursement(value: unknown): number {
  const n = requireNumber(value, "reimbursement");
  validateReimbursementRange(n);
  return n;
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

function requireRollover(value: unknown): Rollover {
  if (value === "none" || value === "debt" || value === "balance") return value;
  throw new DataIntegrityError(`Expected rollover to be one of none, debt, balance, got ${value}`);
}

/**
 * Build and execute a group-scoped Firestore query.
 * When groupId is null, reads the public seed collection (e.g. "seed-transactions").
 * When groupId is provided, reads the authenticated collection filtered by group membership.
 */
async function queryGroupCollection(
  collectionName: string,
  seedPrefix: string,
  groupId: string | null,
  email?: string,
): Promise<QueryDocumentSnapshot<DocumentData, DocumentData>[]> {
  if (groupId && !email) throw new Error("email is required when querying by groupId");
  const name = groupId ? collectionName : `${seedPrefix}${collectionName}`;
  const path = nsCollectionPath(NAMESPACE, name);
  const q = groupId
    ? query(
        collection(db, path),
        where("groupId", "==", groupId),
        where("memberEmails", "array-contains", email),
      )
    : query(collection(db, path));
  const snapshot = await getDocs(q);
  return snapshot.docs;
}

export async function getGroupMembers(groupId: string): Promise<string[]> {
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

export async function getTransactions(groupId: null): Promise<Transaction[]>;
export async function getTransactions(groupId: string, email: string): Promise<Transaction[]>;
export async function getTransactions(groupId: string | null, email?: string): Promise<Transaction[]> {
  const docs = await queryGroupCollection("transactions", "seed-", groupId, email);
  return docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      institution: requireString(data.institution, "institution"),
      account: requireString(data.account, "account"),
      description: requireString(data.description, "description"),
      amount: requireNumber(data.amount, "amount"),
      note: requireString(data.note, "note"),
      category: requireString(data.category, "category"),
      reimbursement: requireReimbursement(data.reimbursement),
      budget: optionalString(data.budget, "budget"),
      timestamp: optionalTimestamp(data.timestamp, "timestamp"),
      statementId: optionalString(data.statementId, "statementId"),
      groupId: optionalString(data.groupId, "groupId"),
      normalizedId: optionalString(data.normalizedId, "normalizedId"),
      normalizedPrimary: data.normalizedPrimary !== false,
      normalizedDescription: optionalString(data.normalizedDescription, "normalizedDescription"),
    };
  });
}

function requireDocId(id: string, label: string): void {
  if (!id || id.includes("/")) throw new Error(`Invalid ${label} ID`);
}

export async function updateTransaction(
  txnId: string,
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

export async function getBudgets(groupId: null): Promise<Budget[]>;
export async function getBudgets(groupId: string, email: string): Promise<Budget[]>;
export async function getBudgets(groupId: string | null, email?: string): Promise<Budget[]> {
  const docs = await queryGroupCollection("budgets", "seed-", groupId, email);
  return docs.map((docSnap) => {
    const data = docSnap.data();
    const name = requireString(data.name, "name");
    if (!name) throw new DataIntegrityError("Budget name must be non-empty");
    return {
      id: docSnap.id,
      name,
      weeklyAllowance: requireNonNegativeNumber(data.weeklyAllowance, "weeklyAllowance"),
      rollover: requireRollover(data.rollover),
      groupId: optionalString(data.groupId, "groupId"),
    };
  });
}

function validateNoOverlappingPeriods(periods: BudgetPeriod[]): void {
  const byBudget = new Map<string, BudgetPeriod[]>();
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
export async function getBudgetPeriods(groupId: string, email: string): Promise<BudgetPeriod[]>;
export async function getBudgetPeriods(groupId: string | null, email?: string): Promise<BudgetPeriod[]> {
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
      id: docSnap.id,
      budgetId: requireString(data.budgetId, "budgetId"),
      periodStart,
      periodEnd,
      total: requireNumber(data.total, "total"),
      count: requireNonNegativeNumber(data.count, "count"),
      categoryBreakdown: requireCategoryBreakdown(data.categoryBreakdown),
      groupId: optionalString(data.groupId, "groupId"),
    };
  });

  validateNoOverlappingPeriods(periods);
  return periods;
}

export async function updateBudgetPeriod(
  periodId: string,
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
  periodId: string,
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
  budgetId: string,
  fields: Partial<Pick<Budget, "name" | "weeklyAllowance" | "rollover">>,
): Promise<void> {
  requireDocId(budgetId, "budget");
  if (Object.keys(fields).length === 0) return;
  if (fields.name !== undefined && !fields.name) {
    throw new Error("Budget name cannot be empty");
  }
  if (fields.weeklyAllowance !== undefined) {
    if (!Number.isFinite(fields.weeklyAllowance) || fields.weeklyAllowance < 0) {
      throw new RangeError("Weekly allowance must be a non-negative number");
    }
  }
  if (fields.rollover !== undefined) {
    requireRollover(fields.rollover);
  }
  const path = nsCollectionPath(NAMESPACE, "budgets");
  const ref = doc(db, path, budgetId);
  await updateDoc(ref, fields);
}

// --- Rules ---

export type RuleType = "categorization" | "budget_assignment";

export interface Rule {
  readonly id: string;
  readonly type: RuleType;
  readonly pattern: string;
  readonly target: string;
  readonly priority: number;
  readonly institution: string | null;
  readonly account: string | null;
  readonly groupId: string | null;
}

function requireRuleType(value: unknown): RuleType {
  if (value === "categorization" || value === "budget_assignment") return value;
  throw new DataIntegrityError(`Expected rule type to be categorization or budget_assignment, got ${value}`);
}

export async function getRules(groupId: string, email: string): Promise<Rule[]>;
export async function getRules(groupId: null): Promise<Rule[]>;
export async function getRules(groupId: string | null, email?: string): Promise<Rule[]> {
  const docs = await queryGroupCollection("rules", "seed-", groupId, email);
  return docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      type: requireRuleType(data.type),
      pattern: requireString(data.pattern, "pattern"),
      target: requireString(data.target, "target"),
      priority: requireNumber(data.priority, "priority"),
      institution: optionalString(data.institution, "institution"),
      account: optionalString(data.account, "account"),
      groupId: optionalString(data.groupId, "groupId"),
    };
  });
}

export async function createRule(
  groupId: string,
  memberEmails: string[],
  fields: Omit<Rule, "id" | "groupId">,
): Promise<string> {
  requireRuleType(fields.type);
  if (!Number.isFinite(fields.priority)) throw new RangeError("Rule priority must be a finite number");
  if (!fields.pattern) throw new Error("Rule pattern cannot be empty");
  if (!fields.target) throw new Error("Rule target cannot be empty");
  const path = nsCollectionPath(NAMESPACE, "rules");
  const ref = await addDoc(collection(db, path), {
    type: fields.type,
    pattern: fields.pattern,
    target: fields.target,
    priority: fields.priority,
    institution: fields.institution,
    account: fields.account,
    groupId,
    memberEmails,
  });
  return ref.id;
}

export async function updateRule(
  ruleId: string,
  fields: Partial<Pick<Rule, "pattern" | "target" | "priority" | "type" | "institution" | "account">>,
): Promise<void> {
  requireDocId(ruleId, "rule");
  if (Object.keys(fields).length === 0) return;
  if (fields.type !== undefined) requireRuleType(fields.type);
  if (fields.priority !== undefined && !Number.isFinite(fields.priority)) throw new RangeError("Rule priority must be a finite number");
  if (fields.pattern !== undefined && !fields.pattern) throw new Error("Rule pattern cannot be empty");
  if (fields.target !== undefined && !fields.target) throw new Error("Rule target cannot be empty");
  const path = nsCollectionPath(NAMESPACE, "rules");
  const ref = doc(db, path, ruleId);
  await updateDoc(ref, fields);
}

export async function deleteRule(ruleId: string): Promise<void> {
  requireDocId(ruleId, "rule");
  const path = nsCollectionPath(NAMESPACE, "rules");
  const ref = doc(db, path, ruleId);
  await deleteDoc(ref);
}

// --- Normalization Rules ---

export interface NormalizationRule {
  readonly id: string;
  readonly pattern: string;
  readonly patternType: string | null;
  readonly canonicalDescription: string;
  readonly dateWindowDays: number;
  readonly institution: string | null;
  readonly account: string | null;
  readonly priority: number;
  readonly groupId: string | null;
}

export async function getNormalizationRules(groupId: string, email: string): Promise<NormalizationRule[]>;
export async function getNormalizationRules(groupId: null): Promise<NormalizationRule[]>;
export async function getNormalizationRules(groupId: string | null, email?: string): Promise<NormalizationRule[]> {
  const docs = await queryGroupCollection("normalization-rules", "seed-", groupId, email);
  return docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      pattern: requireString(data.pattern, "pattern"),
      patternType: optionalString(data.patternType, "patternType"),
      canonicalDescription: requireString(data.canonicalDescription, "canonicalDescription"),
      dateWindowDays: typeof data.dateWindowDays === "number" ? data.dateWindowDays : 0,
      institution: optionalString(data.institution, "institution"),
      account: optionalString(data.account, "account"),
      priority: requireNumber(data.priority, "priority"),
      groupId: optionalString(data.groupId, "groupId"),
    };
  });
}

export async function createNormalizationRule(
  groupId: string,
  memberEmails: string[],
  fields: Omit<NormalizationRule, "id" | "groupId">,
): Promise<string> {
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
  return ref.id;
}

export async function updateNormalizationRule(
  ruleId: string,
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

export async function deleteNormalizationRule(ruleId: string): Promise<void> {
  requireDocId(ruleId, "normalization rule");
  const path = nsCollectionPath(NAMESPACE, "normalization-rules");
  const ref = doc(db, path, ruleId);
  await deleteDoc(ref);
}
