import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import type { User } from "firebase/auth";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";

import { db, NAMESPACE } from "./firebase.js";
import { isAuthorized } from "./is-authorized.js";

export interface Transaction {
  id: string;
  institution: string;
  account: string;
  description: string;
  amount: number;
  note: string;
  category: string;
  reimbursement: number;
  vacation: boolean;
  uid?: string;
}

export async function getTransactions(user: User | null): Promise<Transaction[]> {
  const authorized = isAuthorized(user);
  const collectionName = authorized ? "transactions" : "seed-transactions";
  const path = nsCollectionPath(NAMESPACE, collectionName);
  const q = authorized
    ? query(collection(db, path), where("uid", "==", user!.uid))
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
      vacation: data.vacation as boolean,
      ...(data.uid ? { uid: data.uid as string } : {}),
    };
  });
}

export async function updateTransaction(
  txnId: string,
  fields: Partial<Pick<Transaction, "note" | "category" | "reimbursement" | "vacation">>,
): Promise<void> {
  const path = nsCollectionPath(NAMESPACE, "transactions");
  const ref = doc(db, path, txnId);
  await updateDoc(ref, fields);
}
