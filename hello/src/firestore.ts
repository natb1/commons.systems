import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db, NAMESPACE } from "./firebase.js";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";

export interface Message {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface Note {
  id: string;
  text: string;
  createdAt: string;
}

export async function getMessages(): Promise<Message[]> {
  const path = nsCollectionPath(NAMESPACE, "messages");
  const q = query(collection(db, path), orderBy("createdAt"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      text: data.text as string,
      author: data.author as string,
      createdAt: data.createdAt as string,
    };
  });
}

export async function getNotes(): Promise<Note[]> {
  const path = nsCollectionPath(NAMESPACE, "notes");
  const q = query(collection(db, path), orderBy("createdAt"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      text: data.text as string,
      createdAt: data.createdAt as string,
    };
  });
}
