import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  documentId,
} from "firebase/firestore";
import type { Firestore, QueryConstraint } from "firebase/firestore";
import { nsCollectionPath } from "./namespace.js";
import type { Namespace } from "./namespace.js";
import {
  decodeCursor,
  pagedMerge,
  DEFAULT_MEDIA_PAGE_SIZE,
} from "./paged-merge.js";
import type { MediaCursor, MediaPage, MediaPageOptions } from "./paged-merge.js";

export function createMediaQueries<T extends { id: string; addedAt: string }>(
  db: Firestore,
  namespace: Namespace,
  collectionName: string,
  toItem: (id: string, data: Record<string, unknown>) => T,
) {
  const path = nsCollectionPath(namespace, collectionName);

  // Raw firebase/firestore primitives are used here instead of the boundedQuery
  // typestate DSL for two reasons:
  //   1. Cursor pagination needs startAfter(), which the DSL does not expose.
  //   2. The whole-repo query-bounds sensor
  //      (.github/scripts/check-firestore-query-bounds.sh) resolves the getDocs
  //      argument BACKWARD to a single `const q = query(... limit(...) ...)` and
  //      detects the limit() in that span, so this shape is sensor-clean with NO
  //      `// query-bounds-ok:` marker. A DSL chained-getDocs call reads as
  //      "inline" and would need a marker. Do NOT rewrite this back to the DSL:
  //      it would reintroduce a marker and lose cursor support.
  // Every constraint lives in ONE query(...) call (no conditional reassignment
  // of q) so the sensor sees limit( in the backward-resolved span.
  async function fetchStream(
    constraints: QueryConstraint[],
    pageSize: number,
    cursor: MediaCursor | null,
  ): Promise<{ items: T[]; hasMore: boolean }> {
    const q = query(
      collection(db, path),
      ...constraints,
      orderBy("addedAt", "desc"),
      orderBy(documentId(), "desc"),
      // startAfter uses the (addedAt, name) tuple to match the two orderBy keys.
      // The DocumentReference form is used for the __name__ component. If real
      // Firestore rejects it, the plain-string fallback is:
      //   startAfter(cursor.addedAt, cursor.id)
      // (deploy-time-verified; deferred in the plan).
      ...(cursor ? [startAfter(cursor.addedAt, doc(db, path, cursor.id))] : []),
      limit(pageSize),
    );
    const snap = await getDocs(q);
    const items = snap.docs.map((docSnap) => toItem(docSnap.id, docSnap.data()));
    return { items, hasMore: snap.docs.length === pageSize };
  }

  // Requires the (publicDomain ASC, addedAt DESC) composite index in
  // firestore.indexes.json.
  async function getPublicMedia(opts?: MediaPageOptions): Promise<MediaPage<T>> {
    const pageSize = opts?.pageSize ?? DEFAULT_MEDIA_PAGE_SIZE;
    const cursor = opts?.cursor ? decodeCursor(opts.cursor) : null;
    const stream = await fetchStream(
      [where("publicDomain", "==", true)],
      pageSize,
      cursor,
    );
    return pagedMerge(
      [stream],
      pageSize,
      (item) => item.id,
      (item) => ({ addedAt: item.addedAt, id: item.id }),
    );
  }

  // Requires the (memberEmails CONTAINS, addedAt DESC) composite index in
  // firestore.indexes.json.
  async function getUserMedia(
    email: string,
    opts?: MediaPageOptions,
  ): Promise<MediaPage<T>> {
    const pageSize = opts?.pageSize ?? DEFAULT_MEDIA_PAGE_SIZE;
    const cursor = opts?.cursor ? decodeCursor(opts.cursor) : null;
    const stream = await fetchStream(
      [where("memberEmails", "array-contains", email)],
      pageSize,
      cursor,
    );
    return pagedMerge(
      [stream],
      pageSize,
      (item) => item.id,
      (item) => ({ addedAt: item.addedAt, id: item.id }),
    );
  }

  async function getAllAccessibleMedia(
    email: string,
    opts?: MediaPageOptions,
  ): Promise<MediaPage<T>> {
    const pageSize = opts?.pageSize ?? DEFAULT_MEDIA_PAGE_SIZE;
    const cursor = opts?.cursor ? decodeCursor(opts.cursor) : null;
    // Broadcast the SAME decoded cursor and pageSize to both sub-streams — the
    // composability point. pagedMerge then dedups, sorts, and re-slices to one
    // page, computing the merged nextCursor.
    const [publicStream, userStream] = await Promise.all([
      fetchStream([where("publicDomain", "==", true)], pageSize, cursor),
      fetchStream([where("memberEmails", "array-contains", email)], pageSize, cursor),
    ]);
    return pagedMerge(
      [publicStream, userStream],
      pageSize,
      (item) => item.id,
      (item) => ({ addedAt: item.addedAt, id: item.id }),
    );
  }

  async function getMediaItem(id: string): Promise<T | null> {
    const docSnap = await getDoc(doc(db, path, id));
    if (!docSnap.exists()) return null;
    return toItem(docSnap.id, docSnap.data());
  }

  return { getPublicMedia, getUserMedia, getAllAccessibleMedia, getMediaItem };
}
