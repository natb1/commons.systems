/**
 * A generic media source: a list / resolve-to-blob / metadata contract that
 * unifies the cloud library (Firebase Storage + Firestore metadata) and a
 * future local on-disk folder behind one interface, so apps can union the two
 * sources on equal footing.
 *
 * `T` is the per-item metadata record. It always carries at least `id` and
 * `addedAt` (matching `createMediaQueries`); concrete sources further constrain
 * it with whatever locator they need to fetch bytes (e.g. `storagePath` for the
 * Firebase source).
 */
import type {
  MediaPage,
  MediaPageOptions,
} from "@commons-systems/firestoreutil/paged-merge";

// Re-export the shared page/cursor contract so downstream app consumers can
// import it from `@commons-systems/mediautil/source` alongside `MediaSource`,
// without reaching into firestoreutil directly.
export type {
  MediaCursor,
  MediaPage,
  MediaPageOptions,
} from "@commons-systems/firestoreutil/paged-merge";

export interface MediaSource<T extends { id: string; addedAt: string }> {
  /**
   * Enumerate a page of the items this source currently exposes, newest first.
   *
   * `opts.pageSize` bounds the page (a source-specific default applies when
   * absent); `opts.cursor` is the opaque `nextCursor` from a prior page and
   * resumes strictly after it. The returned `MediaPage` carries the `items`
   * and a `nextCursor` (null when no further page exists).
   */
  list(opts?: MediaPageOptions): Promise<MediaPage<T>>;

  /** Per-item metadata access by id; `null` when the item does not exist. */
  metadata(id: string): Promise<T | null>;

  /**
   * Fetch the raw bytes for an item. Implementations are cache-first where a
   * derived cache exists. Callers wrap the bytes in a typed `Blob` / object URL
   * with their own MIME knowledge.
   */
  resolveToBlob(item: T): Promise<ArrayBuffer>;
}
