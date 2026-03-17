import type { Firestore } from "firebase-admin/firestore";
import { nsCollectionPath } from "./namespace.js";

export interface SeedDocument<T extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  data: T;
}

export interface SeedCollection {
  name: string;
  documents: SeedDocument[];
  /** When true, skip this collection unless the caller passes includeTestOnly.
   *  Used for data that should exist in emulators and preview environments
   *  but not production (e.g., test user group memberships). */
  testOnly?: boolean;
  /** When true, delete existing documents not present in the seed spec.
   *  All seed documents are written first (via set, which upserts), then
   *  any documents in the collection not present in the spec are deleted.
   *  Makes the seed spec the source of truth for this collection. */
  convergent?: boolean;
}

export interface SeedSpec {
  namespace: string;
  collections: SeedCollection[];
}

export interface SeedOptions {
  includeTestOnly?: boolean;
}

export async function seed(db: Firestore, spec: SeedSpec, options?: SeedOptions): Promise<void> {
  const idsByCollection = new Map<string, Set<string>>();
  for (const collection of spec.collections) {
    if (collection.testOnly && !options?.includeTestOnly) {
      console.log(`Skipping testOnly collection "${collection.name}"`);
      continue;
    }
    const path = nsCollectionPath(spec.namespace, collection.name);
    const ids = collection.documents.map((d) => d.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length > 0) {
      throw new Error(`duplicate document ids in "${collection.name}": ${[...new Set(dupes)].join(", ")}`);
    }
    const seen = idsByCollection.get(collection.name) ?? new Set<string>();
    for (const doc of collection.documents) {
      if (seen.has(doc.id)) {
        throw new Error(
          `duplicate document id "${doc.id}" across "${collection.name}" collection entries`,
        );
      }
      seen.add(doc.id);
    }
    idsByCollection.set(collection.name, seen);
    for (const doc of collection.documents) {
      if (!doc.id) throw new Error(`seed document in "${collection.name}" has empty id`);
      try {
        await db.doc(`${path}/${doc.id}`).set(doc.data);
      } catch (err) {
        throw new Error(
          `Failed to write seed document "${doc.id}" in "${collection.name}" (path: ${path}/${doc.id}): ${err instanceof Error ? err.message : err}`,
        );
      }
    }
    if (collection.convergent) {
      if (collection.documents.length === 0) {
        throw new Error(
          `Convergent collection "${collection.name}" has no documents. ` +
          `This would delete all existing documents. Remove the collection from the seed spec instead.`,
        );
      }
      const seedIds = new Set(ids);
      let existing: { id: string; delete: () => Promise<unknown> }[];
      try {
        existing = await db.collection(path).listDocuments();
      } catch (err) {
        throw new Error(
          `Failed to list documents in "${path}" during convergent seed of "${collection.name}": ${err instanceof Error ? err.message : err}`,
        );
      }
      let deletedCount = 0;
      for (const ref of existing) {
        if (!seedIds.has(ref.id)) {
          console.log(`Deleting stale document "${ref.id}" from "${collection.name}"`);
          try {
            await ref.delete();
          } catch (err) {
            throw new Error(
              `Failed to delete stale document "${ref.id}" in "${collection.name}" (path: ${path}/${ref.id}): ${err instanceof Error ? err.message : err}`,
            );
          }
          deletedCount++;
        }
      }
      console.log(
        `Convergent check for "${collection.name}": ${deletedCount} stale document(s) deleted, ${seedIds.size} retained`,
      );
    }
  }
}
