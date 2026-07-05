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
  compareByAddedAtDescIdDesc,
  encodeMergedCursor,
  decodeMergedCursor,
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
    const decoded = opts?.cursor ? decodeMergedCursor(opts.cursor) : null;
    const key = decoded?.key ?? null;
    const wasExhausted = decoded?.exhausted ?? [];
    // Broadcast the SAME decoded cursor key and pageSize to both sub-streams —
    // the composability point. A stream the previous page flagged exhausted is
    // skipped (not re-queried), saving up to pageSize wasted Firestore reads.
    // pagedMerge then dedups, sorts, and re-slices to one page.
    const EXHAUSTED = { items: [] as T[], hasMore: false };
    const [publicStream, userStream] = await Promise.all([
      wasExhausted[0]
        ? Promise.resolve(EXHAUSTED)
        : fetchStream([where("publicDomain", "==", true)], pageSize, key),
      wasExhausted[1]
        ? Promise.resolve(EXHAUSTED)
        : fetchStream([where("memberEmails", "array-contains", email)], pageSize, key),
    ]);
    const streams = [publicStream, userStream];
    const page = pagedMerge(
      streams,
      pageSize,
      (item) => item.id,
      (item) => ({ addedAt: item.addedAt, id: item.id }),
    );
    // pagedMerge's null nextCursor is the authoritative "no more pages" signal;
    // only when non-null do we re-wrap with per-stream exhaustion. A non-null
    // cursor guarantees page.items is non-empty, so Kcut is safe.
    if (page.nextCursor === null) return page;
    const kcut = {
      addedAt: page.items[page.items.length - 1].addedAt,
      id: page.items[page.items.length - 1].id,
    };
    // A stream is exhausted for the NEXT page iff it returned all its remaining
    // docs (!hasMore) AND its returned tail is fully within the shown window
    // (its oldest returned item is at or above the page cut). Deferring the skip
    // until the tail is consumed prevents dropping items that fell below the cut
    // because the other stream contributed newer rows. A skipped stream's
    // items.length === 0 keeps it flagged on every following page.
    const exhausted = streams.map(
      (s) =>
        !s.hasMore &&
        (s.items.length === 0 ||
          compareByAddedAtDescIdDesc(
            {
              addedAt: s.items[s.items.length - 1].addedAt,
              id: s.items[s.items.length - 1].id,
            },
            kcut,
          ) <= 0),
    );
    return { items: page.items, nextCursor: encodeMergedCursor(kcut, exhausted) };
  }

  async function getMediaItem(id: string): Promise<T | null> {
    const docSnap = await getDoc(doc(db, path, id));
    if (!docSnap.exists()) return null;
    return toItem(docSnap.id, docSnap.data());
  }

  return { getPublicMedia, getUserMedia, getAllAccessibleMedia, getMediaItem };
}
