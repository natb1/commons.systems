import type { Firestore } from "firebase-admin/firestore";

export async function deleteNamespace(
  db: Firestore,
  namespace: string,
): Promise<void> {
  if (!namespace) {
    throw new Error("namespace must not be empty");
  }
  if (namespace === "prod") {
    throw new Error("refusing to delete the prod namespace");
  }
  await db.recursiveDelete(db.doc(`ns/${namespace}`));
}
