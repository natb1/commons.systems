import { collection, doc, getDocs, query, updateDoc, where, Timestamp } from "firebase/firestore";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";

import { db, NAMESPACE } from "./firebase.js";
import { DataIntegrityError } from "./errors.js";

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

function asTimestamp(value: unknown): Timestamp | null {
  if (value == null) return null;
  if (!(value instanceof Timestamp)) {
    throw new DataIntegrityError(`Expected Timestamp for timestamp field, got ${typeof value}`);
  }
  return value;
}

const ROLLOVER_VALUES = new Set<string>(["none", "debt", "balance"]);

function requireRollover(value: unknown): Rollover {
  if (typeof value !== "string" || !ROLLOVER_VALUES.has(value)) {
    throw new DataIntegrityError(`Expected rollover to be one of ${[...ROLLOVER_VALUES].join(", ")}, got ${value}`);
  }
  return value as Rollover;
}

function requireTimestamp(value: unknown, field: string): Timestamp {
  if (value == null) {
    throw new DataIntegrityError(`Expected Timestamp for ${field}, got null`);
  }
  if (!(value instanceof Timestamp)) {
    throw new DataIntegrityError(`Expected Timestamp for ${field}, got ${typeof value}`);
  }
  return value;
}

export async function getTransactions(groupId: null): Promise<Transaction[]>;
export async function getTransactions(groupId: string, uid: string): Promise<Transaction[]>;
export async function getTransactions(groupId: string | null, uid?: string): Promise<Transaction[]> {
  if (groupId && !uid) throw new Error("uid is required when querying by groupId");
  const collectionName = groupId ? "transactions" : "seed-transactions";
  const path = nsCollectionPath(NAMESPACE, collectionName);
  const q = groupId
    ? query(
        collection(db, path),
        where("groupId", "==", groupId),
        where("memberUids", "array-contains", uid),
      )
    : query(collection(db, path));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => {
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
      timestamp: asTimestamp(data.timestamp),
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
  if (groupId && !uid) throw new Error("uid is required when querying by groupId");
  const collectionName = groupId ? "budgets" : "seed-budgets";
  const path = nsCollectionPath(NAMESPACE, collectionName);
  const q = groupId
    ? query(
        collection(db, path),
        where("groupId", "==", groupId),
        where("memberUids", "array-contains", uid),
      )
    : query(collection(db, path));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: requireString(data.name, "name"),
      weeklyAllowance: requireNumber(data.weeklyAllowance, "weeklyAllowance"),
      rollover: requireRollover(data.rollover),
      groupId: optionalString(data.groupId, "groupId"),
    };
  });
}

export async function getBudgetPeriods(groupId: null): Promise<BudgetPeriod[]>;
export async function getBudgetPeriods(groupId: string, uid: string): Promise<BudgetPeriod[]>;
export async function getBudgetPeriods(groupId: string | null, uid?: string): Promise<BudgetPeriod[]> {
  if (groupId && !uid) throw new Error("uid is required when querying by groupId");
  const collectionName = groupId ? "budget-periods" : "seed-budget-periods";
  const path = nsCollectionPath(NAMESPACE, collectionName);
  const q = groupId
    ? query(
        collection(db, path),
        where("groupId", "==", groupId),
        where("memberUids", "array-contains", uid),
      )
    : query(collection(db, path));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      budgetId: requireString(data.budgetId, "budgetId"),
      periodStart: requireTimestamp(data.periodStart, "periodStart"),
      periodEnd: requireTimestamp(data.periodEnd, "periodEnd"),
      total: requireNumber(data.total, "total"),
      groupId: optionalString(data.groupId, "groupId"),
    };
  });
}
