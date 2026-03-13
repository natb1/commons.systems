import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";
import { DataIntegrityError } from "./errors.js";

declare const __brand: unique symbol;
type Brand<B extends string> = string & { readonly [__brand]: B };

export type GroupId = Brand<"GroupId">;

/**
 * Client-side view of a Firestore group document.
 * The stored document includes a `members` array (used for access control in
 * security rules and the getUserGroups query), but the client type only
 * exposes id and display name since members is not needed in the UI.
 */
export interface Group {
  readonly id: GroupId;
  readonly name: string;
}

function groupsPath(namespace: string): string {
  return nsCollectionPath(namespace, "groups");
}

function requireEmail(caller: string, user: User): string {
  if (!user.email) {
    throw new Error(
      `${caller}: user "${user.uid}" has no email. ` +
      `Email-based group membership requires an auth provider that supplies an email address.`,
    );
  }
  return user.email;
}

export async function getUserGroups(db: Firestore, namespace: string, user: User): Promise<Group[]> {
  const email = requireEmail("getUserGroups", user);
  const q = query(collection(db, groupsPath(namespace)), where("members", "array-contains", email));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((docSnap) => {
      const name = docSnap.data().name;
      if (typeof name !== "string") {
        throw new DataIntegrityError(`Expected string for groups.name, got ${typeof name}`);
      }
      return { id: docSnap.id as GroupId, name };
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
  groupId: GroupId,
): Promise<boolean> {
  if (!user) return false;
  const email = requireEmail("isInGroup", user);
  try {
    const docSnap = await getDoc(doc(db, groupsPath(namespace), groupId));
    if (!docSnap.exists()) return false;
    const members = docSnap.data().members;
    return Array.isArray(members) && members.includes(email);
  } catch (error) {
    // Firestore rules restrict group reads to members (request.auth.token.email in
    // resource.data.members), so permission-denied is the primary signal that
    // the user is not in this group. The membership check on the returned
    // document is a defensive guard for the case where rules and data are
    // inconsistent.
    if (isPermissionDenied(error)) {
      console.warn(`isInGroup: permission denied for group "${groupId}" (user ${email})`);
      return false;
    }
    throw error;
  }
}
