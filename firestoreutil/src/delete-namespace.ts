import type { Firestore } from "firebase-admin/firestore";
import { validateNamespace } from "./namespace.js";

export async function deleteNamespace(
  db: Firestore,
  namespace: string,
): Promise<void> {
  validateNamespace(namespace);
  if (namespace.split("/")[1] === "prod") {
    throw new Error("refusing to delete production namespace: " + namespace);
  }
  await db.recursiveDelete(db.doc(namespace));
}
