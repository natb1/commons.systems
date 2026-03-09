import { collection, doc, getDocs, query, updateDoc, where, increment, Timestamp, type QueryDocumentSnapshot, type DocumentData } from "firebase/firestore";
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
  /** Sum of net transaction amounts (after reimbursement) in this period. Non-negative per Firestore rules. */
  readonly total: number;
  readonly groupId: string | null;
}

/** Serialized form of BudgetPeriod for HTML data attributes. Used by both home.ts (serializer) and home-hydrate.ts (parser). */
export interface SerializedBudgetPeriod {
  readonly id: string;
  readonly budgetId: string;
  readonly periodStartMs: number;
  readonly periodEndMs: number;
  readonly total: number;
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
    };
  });
}

function requireDocId(id: string, label: string): void {
  if (!id || id.includes("/")) throw new Error(`Invalid ${label} ID`);
}

export async function updateTransaction(
  txnId: string,
  fields: Partial<Pick<Transaction, "note" | "category" | "reimbursement" | "budget">>,
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
      total: requireNonNegativeNumber(data.total, "total"),
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
    if (!Number.isFinite(fields.total) || fields.total < 0) {
      throw new RangeError("Total must be a non-negative number");
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
