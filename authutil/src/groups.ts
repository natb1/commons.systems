import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";
import { DataIntegrityError } from "./errors.js";

/**
 * Client-side view of a Firestore group document.
 * The stored document includes a `members` array (used for access control in
 * security rules and the getUserGroups query), but the client type only
 * exposes id and display name since members is not needed in the UI.
 */
export interface Group {
  readonly id: string;
  readonly name: string;
}

function groupsPath(namespace: string): string {
  return nsCollectionPath(namespace, "groups");
}

export async function getUserGroups(db: Firestore, namespace: string, user: User): Promise<Group[]> {
  const q = query(collection(db, groupsPath(namespace)), where("members", "array-contains", user.uid));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((docSnap) => {
      const name = docSnap.data().name;
      if (typeof name !== "string") {
        throw new DataIntegrityError(`Expected string for groups.name, got ${typeof name}`);
      }
      return { id: docSnap.id, name };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function isPermissionDenied(error: unknown): boolean {
  return error instanceof Error && (error as { code?: string }).code === "permission-denied";
}

export async function isInGroup(
  db: Firestore,
  namespace: string,
  user: User | null,
  groupId: string,
): Promise<boolean> {
  if (!user) return false;
  try {
    const docSnap = await getDoc(doc(db, groupsPath(namespace), groupId));
    if (!docSnap.exists()) return false;
    const members = docSnap.data().members;
    return Array.isArray(members) && members.includes(user.uid);
  } catch (error) {
    // Firestore rules restrict group reads to members (request.auth.uid in
    // resource.data.members), so permission-denied is the primary signal that
    // the user is not in this group. The members.includes check above is a
    // defensive guard for the case where rules and data are inconsistent.
    if (isPermissionDenied(error)) {
      console.warn(`isInGroup: permission denied for group "${groupId}" (user ${user.uid})`);
      return false;
    }
    throw error;
  }
}
