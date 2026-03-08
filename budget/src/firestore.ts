import { collection, doc, getDocs, query, updateDoc, where, Timestamp, type QueryDocumentSnapshot, type DocumentData } from "firebase/firestore";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";

import { db, NAMESPACE } from "./firebase.js";
import { DataIntegrityError } from "./errors.js";

/**
 * Budget rollover strategy:
 * - "none": unspent allowance resets each period
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
  /** Sum of transaction amounts in this period. Non-negative per Firestore rules. */
  readonly total: number;
  readonly groupId: string | null;
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

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new DataIntegrityError(`Expected string for ${field}, got ${typeof value}`);
  }
  return value;
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new DataIntegrityError(`Expected finite number for ${field}, got ${value}`);
  }
  return value;
}

function requireNonNegativeNumber(value: unknown, field: string): number {
  const n = requireNumber(value, field);
  if (n < 0) throw new DataIntegrityError(`Expected non-negative number for ${field}, got ${n}`);
  return n;
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

function optionalString(value: unknown, field: string): string | null {
  if (value == null) return null;
  if (typeof value !== "string") {
    throw new DataIntegrityError(`Expected string or null for ${field}, got ${typeof value}`);
  }
  return value;
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
  uid?: string,
): Promise<QueryDocumentSnapshot<DocumentData, DocumentData>[]> {
  if (groupId && !uid) throw new Error("uid is required when querying by groupId");
  const name = groupId ? collectionName : `${seedPrefix}${collectionName}`;
  const path = nsCollectionPath(NAMESPACE, name);
  const q = groupId
    ? query(
        collection(db, path),
        where("groupId", "==", groupId),
        where("memberUids", "array-contains", uid),
      )
    : query(collection(db, path));
  const snapshot = await getDocs(q);
  return snapshot.docs;
}

export async function getTransactions(groupId: null): Promise<Transaction[]>;
export async function getTransactions(groupId: string, uid: string): Promise<Transaction[]>;
export async function getTransactions(groupId: string | null, uid?: string): Promise<Transaction[]> {
  const docs = await queryGroupCollection("transactions", "seed-", groupId, uid);
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

export async function updateTransaction(
  txnId: string,
  fields: Partial<Pick<Transaction, "note" | "category" | "reimbursement" | "budget">>,
): Promise<void> {
  if (!txnId || txnId.includes("/")) throw new Error("Invalid transaction ID");
  if (Object.keys(fields).length === 0) return;
  if (fields.reimbursement !== undefined) {
    validateReimbursementRange(fields.reimbursement);
  }
  const path = nsCollectionPath(NAMESPACE, "transactions");
  const ref = doc(db, path, txnId);
  await updateDoc(ref, fields);
}

export async function getBudgets(groupId: null): Promise<Budget[]>;
export async function getBudgets(groupId: string, uid: string): Promise<Budget[]>;
export async function getBudgets(groupId: string | null, uid?: string): Promise<Budget[]> {
  const docs = await queryGroupCollection("budgets", "seed-", groupId, uid);
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

export async function getBudgetPeriods(groupId: null): Promise<BudgetPeriod[]>;
export async function getBudgetPeriods(groupId: string, uid: string): Promise<BudgetPeriod[]>;
export async function getBudgetPeriods(groupId: string | null, uid?: string): Promise<BudgetPeriod[]> {
  const docs = await queryGroupCollection("budget-periods", "seed-", groupId, uid);
  return docs.map((docSnap) => {
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
}

export async function updateBudgetPeriod(
  periodId: string,
  fields: Partial<Pick<BudgetPeriod, "total">>,
): Promise<void> {
  if (!periodId || periodId.includes("/")) throw new Error("Invalid period ID");
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

export async function updateBudget(
  budgetId: string,
  fields: Partial<Pick<Budget, "name" | "weeklyAllowance" | "rollover">>,
): Promise<void> {
  if (!budgetId || budgetId.includes("/")) throw new Error("Invalid budget ID");
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
