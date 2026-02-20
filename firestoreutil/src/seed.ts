import type { Firestore } from "firebase-admin/firestore";
import { nsCollectionPath } from "./namespace.js";

export interface SeedDocument {
  id: string;
  data: Record<string, unknown>;
}

export interface SeedCollection {
  name: string;
  documents: SeedDocument[];
}

export interface SeedSpec {
  namespace: string;
  collections: SeedCollection[];
}

export async function seed(db: Firestore, spec: SeedSpec): Promise<void> {
  for (const collection of spec.collections) {
    const path = nsCollectionPath(spec.namespace, collection.name);
    for (const doc of collection.documents) {
      await db.doc(`${path}/${doc.id}`).set(doc.data);
    }
  }
}
