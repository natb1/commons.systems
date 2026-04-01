import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { nsCollectionPath } from "./namespace.js";
import type { Namespace } from "./namespace.js";

export function createMediaQueries<T extends { id: string; addedAt: string }>(
  db: Firestore,
  namespace: Namespace,
  collectionName: string,
  toItem: (id: string, data: Record<string, unknown>) => T,
) {
  async function getPublicMedia(): Promise<T[]> {
    const path = nsCollectionPath(namespace, collectionName);
    const q = query(collection(db, path), where("publicDomain", "==", true));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((docSnap) => toItem(docSnap.id, docSnap.data()));
    items.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
    return items;
  }

  async function getUserMedia(email: string): Promise<T[]> {
    const path = nsCollectionPath(namespace, collectionName);
    const q = query(collection(db, path), where("memberEmails", "array-contains", email));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => toItem(docSnap.id, docSnap.data()));
  }

  async function getAllAccessibleMedia(email: string): Promise<T[]> {
    const [publicItems, userItems] = await Promise.all([
      getPublicMedia(),
      getUserMedia(email),
    ]);

    const seen = new Set<string>();
    const merged: T[] = [];
    for (const item of [...publicItems, ...userItems]) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
    }

    merged.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
    return merged;
  }

  async function getMediaItem(id: string): Promise<T | null> {
    const path = nsCollectionPath(namespace, collectionName);
    const docSnap = await getDoc(doc(db, path, id));
    if (!docSnap.exists()) return null;
    return toItem(docSnap.id, docSnap.data());
  }

  return { getPublicMedia, getUserMedia, getAllAccessibleMedia, getMediaItem };
}
