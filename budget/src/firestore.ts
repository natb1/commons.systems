import { collection, doc, getDocs, query, updateDoc, where, type Timestamp } from "firebase/firestore";
import type { User } from "firebase/auth";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";

import { db, NAMESPACE } from "./firebase.js";
import { DataIntegrityError } from "./errors.js";

/** Client-side projection of the Firestore groups document (excludes `members` array). */
export interface Group {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  institution: string;
  account: string;
  description: string;
  amount: number;
  note: string;
  category: string;
  /** Percentage, range [0, 100]. Validated at read and write boundaries. */
  reimbursement: number;
  budget: string | null;
  timestamp: Timestamp | null;
  statementId: string | null;
  groupId: string | null;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string") throw new DataIntegrityError(`Expected string for ${field}, got ${typeof value}`);
  return value;
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new DataIntegrityError(`Expected finite number for ${field}, got ${value}`);
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

export async function getUserGroups(user: User): Promise<Group[]> {
  const path = nsCollectionPath(NAMESPACE, "groups");
  const q = query(collection(db, path), where("members", "array-contains", user.uid));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, name: requireString(d.data().name, "groups.name") }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function asTimestamp(value: unknown): Timestamp | null {
  if (value == null) return null;
  if (typeof (value as Timestamp).toDate !== "function") {
    throw new DataIntegrityError(`Expected Timestamp for timestamp field, got ${typeof value}`);
  }
  return value as Timestamp;
}

export async function getTransactions(groupId: null): Promise<Transaction[]>;
export async function getTransactions(groupId: string, uid: string): Promise<Transaction[]>;
export async function getTransactions(groupId: string | null, uid?: string): Promise<Transaction[]> {
  if (groupId && !uid) throw new Error("uid is required when querying by groupId");
  const collectionName = groupId ? "transactions" : "seed-transactions";
  const path = nsCollectionPath(NAMESPACE, collectionName);
  const q = groupId
    ? query(collection(db, path), where("groupId", "==", groupId), where("memberUids", "array-contains", uid))
    : query(collection(db, path));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      institution: requireString(data.institution, "institution"),
      account: requireString(data.account, "account"),
      description: requireString(data.description, "description"),
      amount: requireNumber(data.amount, "amount"),
      note: requireString(data.note, "note"),
      category: requireString(data.category, "category"),
      reimbursement: requireReimbursement(data.reimbursement),
      budget: typeof data.budget === "string" ? data.budget : null,
      timestamp: asTimestamp(data.timestamp),
      statementId: typeof data.statementId === "string" ? data.statementId : null,
      groupId: typeof data.groupId === "string" ? data.groupId : null,
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
