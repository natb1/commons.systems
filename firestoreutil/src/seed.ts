import type { Firestore } from "firebase-admin/firestore";
import { nsCollectionPath } from "./namespace.js";

export interface SeedDocument {
  id: string;
  data: Record<string, unknown>;
}

export interface SeedCollection {
  name: string;
  documents: SeedDocument[];
  /** When true, skip this collection unless the caller passes includeTestOnly.
   *  Used for data that should exist in emulators and preview environments
   *  but not production (e.g., test user group memberships). */
  testOnly?: boolean;
}

export interface SeedSpec {
  namespace: string;
  collections: SeedCollection[];
}

export interface SeedOptions {
  includeTestOnly?: boolean;
}

export async function seed(db: Firestore, spec: SeedSpec, options?: SeedOptions): Promise<void> {
  for (const collection of spec.collections) {
    if (collection.testOnly && !options?.includeTestOnly) {
      console.log(`Skipping testOnly collection "${collection.name}"`);
      continue;
    }
    const path = nsCollectionPath(spec.namespace, collection.name);
    for (const doc of collection.documents) {
      if (!doc.id) throw new Error(`seed document in "${collection.name}" has empty id`);
      await db.doc(`${path}/${doc.id}`).set(doc.data);
    }
  }
}
