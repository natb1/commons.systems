import { db, NAMESPACE } from "./firebase.js";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";
import { requireString } from "@commons-systems/firestoreutil/validate";
import { boundedQuery } from "@commons-systems/firestoreutil/bounded-query";

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
  // New apps: replace .unbounded(...) with .limit(n) or pagination — an unbounded scan grows reads with the collection.
  const snapshot = await boundedQuery(db, path)
    .orderBy("createdAt")
    .unbounded("scaffolding template — choose a real bound or pagination when building on this")
    .getDocs(); // query-bounds-ok: bounded via .unbounded() above — scaffolding template; replace with a real bound
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
  // New apps: replace .unbounded(...) with .limit(n) or pagination — an unbounded scan grows reads with the collection.
  const snapshot = await boundedQuery(db, path)
    .where("memberEmails", "array-contains", email)
    .unbounded("scaffolding template — choose a real bound or pagination when building on this")
    .getDocs(); // query-bounds-ok: bounded via .unbounded() above — scaffolding template; replace with a real bound
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
