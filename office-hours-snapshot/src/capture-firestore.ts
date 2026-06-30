// In-memory capture stand-in for the firebase-admin `Firestore` surface the
// three extracted cores (syncOfficeHoursCore / sampleDispatchQueueCore /
// collectProjectSignalsCore) call. Instead of talking to a real database, it
// records every written document in memory keyed by collection/doc path, so the
// snapshot producer (produce.ts) can drive the unmodified cores and then read
// back exactly what they would have written.
//
// It implements the MINIMAL surface the cores exercise:
//   - firestore.doc(path).set(payload)
//   - firestore.collection(path).doc(id).set(payload)
//   - firestore.collection(path).add(payload)
//   - firestore.collection(path).get()  → always empty (no pre-existing docs)
//   - firestore.bulkWriter() → { set(ref, payload), delete(ref), close() }
//
// Captured values are stored VERBATIM: a firebase-admin `Timestamp` or a
// `FieldValue.serverTimestamp()` sentinel is recorded exactly as the core passed
// it (never unwrapped or resolved). The Unit-5 serializer's `toIso` normalizes
// those forms downstream. The stub needs no `initializeApp()` / credentials.

import type { Firestore } from "firebase-admin/firestore";

/** One `bulkWriter().set(ref, payload)` record, keyed back to its doc id. */
export interface CapturedBulkSet {
  id: string;
  payload: Record<string, unknown>;
}

/** Read-back surface over everything the cores wrote. */
export interface Captured {
  /** Payload written via `doc(path).set()` or `collection(c).doc(id).set()` (keyed by full path). */
  doc(path: string): Record<string, unknown> | undefined;
  /** Payloads appended via `collection(path).add()`, in insertion order. */
  added(collectionPath: string): Record<string, unknown>[];
  /** Payloads written via `bulkWriter().set(collection(path).doc(id), …)`. */
  bulkSets(collectionPath: string): CapturedBulkSet[];
  /** Doc ids deleted via `bulkWriter().delete(collection(path).doc(id))`. */
  bulkDeletes(collectionPath: string): string[];
}

/** A document reference the stub hands out. Carries enough to record a write. */
interface StubDocRef {
  collectionPath: string;
  id: string;
  fullPath: string;
  set(payload: Record<string, unknown>): Promise<void>;
}

/** The mutable in-memory store plus the Firestore-shaped facade over it. */
export interface CaptureFirestore {
  /** Pass this straight into a core's `firestore` dep. */
  firestore: Firestore;
  /** Read back what the core wrote. */
  captured: Captured;
}

/** Split a document path ("a/b/c") into its collection path ("a/b") and id ("c"). */
function splitDocPath(fullPath: string): { collectionPath: string; id: string } {
  const idx = fullPath.lastIndexOf("/");
  if (idx <= 0 || idx === fullPath.length - 1) {
    throw new Error(`capture-firestore: invalid document path "${fullPath}"`);
  }
  return { collectionPath: fullPath.slice(0, idx), id: fullPath.slice(idx + 1) };
}

export function createCaptureFirestore(): CaptureFirestore {
  // doc(path).set / collection(c).doc(id).set — keyed by FULL document path.
  const setByPath = new Map<string, Record<string, unknown>>();
  // collection(path).add — appended list per collection path.
  const addsByPath = new Map<string, Record<string, unknown>[]>();
  // bulkWriter().set — list per collection path, each tagged with its doc id.
  const bulkSetsByPath = new Map<string, CapturedBulkSet[]>();
  // bulkWriter().delete — deleted doc ids per collection path.
  const bulkDeletesByPath = new Map<string, string[]>();

  let addCounter = 0;

  const makeDocRef = (collectionPath: string, id: string): StubDocRef => {
    const fullPath = `${collectionPath}/${id}`;
    return {
      collectionPath,
      id,
      fullPath,
      set(payload) {
        setByPath.set(fullPath, payload);
        return Promise.resolve();
      },
    };
  };

  const collection = (collectionPath: string) => ({
    doc: (id: string) => makeDocRef(collectionPath, id),
    add: (payload: Record<string, unknown>) => {
      const list = addsByPath.get(collectionPath) ?? [];
      list.push(payload);
      addsByPath.set(collectionPath, list);
      addCounter += 1;
      return Promise.resolve({ id: `cap-${addCounter}` });
    },
    // The producer always captures a fresh, empty items collection, so the
    // office-hours sync core's reconcile read finds nothing to delete.
    get: () => Promise.resolve({ docs: [] as Array<{ id: string; ref: StubDocRef }> }),
  });

  const doc = (fullPath: string): StubDocRef => {
    const { collectionPath, id } = splitDocPath(fullPath);
    return makeDocRef(collectionPath, id);
  };

  const bulkWriter = () => ({
    set: (ref: StubDocRef, payload: Record<string, unknown>) => {
      const list = bulkSetsByPath.get(ref.collectionPath) ?? [];
      list.push({ id: ref.id, payload });
      bulkSetsByPath.set(ref.collectionPath, list);
      return Promise.resolve();
    },
    delete: (ref: StubDocRef) => {
      const list = bulkDeletesByPath.get(ref.collectionPath) ?? [];
      list.push(ref.id);
      bulkDeletesByPath.set(ref.collectionPath, list);
      return Promise.resolve();
    },
    close: () => Promise.resolve(),
  });

  const firestoreStub = { doc, collection, bulkWriter };

  const captured: Captured = {
    doc: (path) => setByPath.get(path),
    added: (path) => addsByPath.get(path) ?? [],
    bulkSets: (path) => bulkSetsByPath.get(path) ?? [],
    bulkDeletes: (path) => bulkDeletesByPath.get(path) ?? [],
  };

  return {
    // The cores type their dep as the full firebase-admin Firestore; the stub
    // implements only the handful of methods they actually call.
    firestore: firestoreStub as unknown as Firestore, // type-safety-ok: minimal in-memory facade implementing only the Firestore methods the cores invoke
    captured,
  };
}
