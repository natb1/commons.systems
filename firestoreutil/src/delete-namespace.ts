import type { Firestore } from "firebase-admin/firestore";

export async function deleteNamespace(
  db: Firestore,
  namespace: string,
): Promise<void> {
  if (!namespace) {
    throw new Error("namespace must not be empty");
  }
  if (!namespace.includes('/')) {
    throw new Error("namespace must be in '{app}/{env}' format, e.g. 'landing/prod'");
  }
  await db.recursiveDelete(db.doc(namespace));
}
