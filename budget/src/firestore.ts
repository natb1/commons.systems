import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
import type { User } from "firebase/auth";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";

import { db, NAMESPACE } from "./firebase.js";

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
  reimbursement: number;
  budget: string | null;
  timestamp: Timestamp | null;
  statementId: string | null;
  groupId?: string;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string") throw new Error(`Expected string for ${field}, got ${typeof value}`);
  return value;
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new Error(`Expected finite number for ${field}, got ${value}`);
  return value;
}

export async function getUserGroup(user: User): Promise<Group | null> {
  const path = nsCollectionPath(NAMESPACE, "groups");
  const q = query(collection(db, path), where("members", "array-contains", user.uid));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, name: requireString(d.data().name, "groups.name") };
}

export async function getTransactions(groupId: string | null): Promise<Transaction[]> {
  const collectionName = groupId ? "transactions" : "seed-transactions";
  const path = nsCollectionPath(NAMESPACE, collectionName);
  const q = groupId
    ? query(collection(db, path), where("groupId", "==", groupId))
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
      reimbursement: requireNumber(data.reimbursement, "reimbursement"),
      budget: typeof data.budget === "string" ? data.budget : null,
      timestamp: data.timestamp != null ? (data.timestamp as Timestamp) : null,
      statementId: typeof data.statementId === "string" ? data.statementId : null,
      ...(typeof data.groupId === "string" ? { groupId: data.groupId } : {}),
    };
  });
}

export async function updateTransaction(
  txnId: string,
  fields: Partial<Pick<Transaction, "note" | "category" | "reimbursement" | "budget">>,
): Promise<void> {
  const path = nsCollectionPath(NAMESPACE, "transactions");
  const ref = doc(db, path, txnId);
  await updateDoc(ref, fields);
}
