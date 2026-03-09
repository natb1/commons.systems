import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db, NAMESPACE } from "./firebase.js";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";
import { requireString } from "@commons-systems/firestoreutil/validate";

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
  groupId: string;
  memberEmails: string[];
}

export async function getMessages(): Promise<Message[]> {
  const path = nsCollectionPath(NAMESPACE, "messages");
  const q = query(collection(db, path), orderBy("createdAt"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      text: requireString(data.text, "text"),
      author: requireString(data.author, "author"),
      createdAt: requireString(data.createdAt, "createdAt"),
    };
  });
}

export async function getNotes(email: string): Promise<Note[]> {
  const path = nsCollectionPath(NAMESPACE, "notes");
  const q = query(collection(db, path), where("memberEmails", "array-contains", email));
  const snapshot = await getDocs(q);
  const notes = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      text: requireString(data.text, "text"),
      createdAt: requireString(data.createdAt, "createdAt"),
      groupId: requireString(data.groupId, "groupId"),
      memberEmails: data.memberEmails as string[],
    };
  });
  notes.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return notes;
}
