// Import-free by design. mediautil (a browser package) imports this module,
// while firestoreutil also carries a firebase-admin dependency. Keeping this
// module free of ALL imports guarantees firebase-admin (and any DOM types)
// can never be dragged into the client bundle through this file.

/** Internal structured pagination key. */
export interface MediaCursor {
  addedAt: string;
  id: string;
}

/** The contract's page shape. `nextCursor` is the opaque encoded string. */
export interface MediaPage<T> {
  items: T[];
  nextCursor: string | null;
}

export interface MediaPageOptions {
  pageSize?: number;
  cursor?: string | null;
}

export const DEFAULT_MEDIA_PAGE_SIZE = 24;

/**
 * Encode a cursor as base64 of a stable JSON form (fixed field order), so the
 * round-trip is deterministic. Works in both Node (vitest) and the browser:
 * uses Buffer when present, else the browser's btoa.
 */
export function encodeCursor(k: MediaCursor): string {
  const json = JSON.stringify([k.addedAt, k.id]);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(json, "utf8").toString("base64");
  }
  return btoa(json);
}

/** Inverse of encodeCursor. */
export function decodeCursor(s: string): MediaCursor {
  let json: string;
  if (typeof Buffer !== "undefined") {
    json = Buffer.from(s, "base64").toString("utf8");
  } else {
    json = atob(s);
  }
  const parsed = JSON.parse(json) as [string, string];
  return { addedAt: parsed[0], id: parsed[1] };
}

/**
 * Compare two cursors by addedAt then id, both DESCENDING, using code-unit
 * `<`/`>` operators (NOT localeCompare) so ordering matches Firestore
 * `__name__` byte ordering exactly. Returns negative when `a` should sort
 * BEFORE `b` in DESC order (i.e. when `a` is the larger value).
 */
export function compareByAddedAtDescIdDesc(a: MediaCursor, b: MediaCursor): number {
  if (a.addedAt > b.addedAt) return -1;
  if (a.addedAt < b.addedAt) return 1;
  if (a.id > b.id) return -1;
  if (a.id < b.id) return 1;
  return 0;
}

/**
 * Merge multiple pre-fetched input streams into one page: concat, stable-sort
 * by (addedAt desc, id desc), dedup by id keeping the first occurrence, slice
 * to pageSize, and compute the opaque nextCursor.
 */
export function pagedMerge<T>(
  inputs: { items: T[]; hasMore: boolean }[],
  pageSize: number,
  idOf: (t: T) => string,
  keyOf: (t: T) => MediaCursor,
): MediaPage<T> {
  const buffer: T[] = [];
  for (const input of inputs) {
    for (const item of input.items) buffer.push(item);
  }

  // Array.prototype.sort is stable in modern engines; rely on it.
  buffer.sort((a, b) => compareByAddedAtDescIdDesc(keyOf(a), keyOf(b)));

  const seen = new Set<string>();
  const distinctBuffer: T[] = [];
  for (const item of buffer) {
    const id = idOf(item);
    if (seen.has(id)) continue;
    seen.add(id);
    distinctBuffer.push(item);
  }

  const items = distinctBuffer.slice(0, pageSize);
  const moreInBuffer = distinctBuffer.length > pageSize;
  const anyInputHasMore = inputs.some((i) => i.hasMore);

  // `moreInBuffer` alone is WRONG: two full streams that fully dedup to exactly
  // pageSize would under-report hasMore and drop the tail. OR it with
  // anyInputHasMore so an input with more un-fetched rows still yields a cursor.
  const nextCursor =
    (moreInBuffer || anyInputHasMore) && items.length > 0
      ? encodeCursor(keyOf(items[items.length - 1]))
      : null;

  return { items, nextCursor };
}
