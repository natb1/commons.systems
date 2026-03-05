import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";

export interface Group {
  readonly id: string;
  readonly name: string;
}

export async function getUserGroups(db: Firestore, namespace: string, user: User): Promise<Group[]> {
  const path = nsCollectionPath(namespace, "groups");
  const q = query(collection(db, path), where("members", "array-contains", user.uid));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((docSnap) => {
      const name = docSnap.data().name;
      if (typeof name !== "string") {
        throw new TypeError(`Expected string for groups.name, got ${typeof name}`);
      }
      return { id: docSnap.id, name };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function isInGroup(
  db: Firestore,
  namespace: string,
  user: User | null,
  groupId: string,
): Promise<boolean> {
  if (!user) return false;
  try {
    const path = nsCollectionPath(namespace, "groups");
    const docRef = doc(db, path, groupId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return false;
    const members = docSnap.data().members;
    return Array.isArray(members) && members.includes(user.uid);
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as { code: string }).code === "permission-denied") {
      return false;
    }
    throw error;
  }
}
