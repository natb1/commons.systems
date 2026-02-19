import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db, NAMESPACE } from "./firebase.js";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";

export interface Message {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export async function getMessages(): Promise<Message[]> {
  const path = nsCollectionPath(NAMESPACE, "messages");
  const q = query(collection(db, path), orderBy("createdAt"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    text: doc.data().text as string,
    author: doc.data().author as string,
    createdAt: doc.data().createdAt as string,
  }));
}
