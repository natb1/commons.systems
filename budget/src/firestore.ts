import { collection, doc, getDocs, query, Timestamp, updateDoc, where } from "firebase/firestore";
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
  groupName?: string;
}

export async function getUserGroup(user: User): Promise<Group | null> {
  const path = nsCollectionPath(NAMESPACE, "groups");
  const q = query(collection(db, path), where("members", "array-contains", user.uid));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, name: d.data().name as string };
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
      institution: data.institution as string,
      account: data.account as string,
      description: data.description as string,
      amount: data.amount as number,
      note: data.note as string,
      category: data.category as string,
      reimbursement: data.reimbursement as number,
      budget: (data.budget as string) ?? null,
      timestamp: (data.timestamp as Timestamp) ?? null,
      statementId: (data.statementId as string) ?? null,
      ...(data.groupId ? { groupId: data.groupId as string } : {}),
      ...(data.groupName ? { groupName: data.groupName as string } : {}),
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
