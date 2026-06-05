/**
 * `FirebaseMediaSource` implements `MediaSource<T>` over the existing cloud
 * substrate: `createMediaQueries` Firestore metadata, a Firebase Storage
 * download, and an `@commons-systems/idbutil` LRU blob cache as a derived
 * read-through cache. This is the default, prod cloud library path — a future
 * `LocalFolderMediaSource` implements the same interface over an on-disk folder.
 */
import { getDownloadURL, ref } from "firebase/storage";
import type { FirebaseStorage } from "firebase/storage";
import type { LruBlobCache } from "@commons-systems/idbutil/lru-blob-cache";
import type { MediaSource } from "./source.js";

/**
 * The subset of a `createMediaQueries` result this source reads. The full
 * result (which also exposes `getUserMedia`) is structurally assignable.
 */
export interface MediaQueries<T> {
  getPublicMedia(): Promise<T[]>;
  getAllAccessibleMedia(email: string): Promise<T[]>;
  getMediaItem(id: string): Promise<T | null>;
}

export interface FirebaseMediaSourceConfig<
  T extends { id: string; addedAt: string; storagePath: string },
> {
  /** Firestore metadata queries (from `createMediaQueries`). */
  queries: MediaQueries<T>;
  /** Derived LRU blob cache (from `createLruBlobCache`). */
  cache: LruBlobCache;
  /** Initialized Firebase Storage handle. */
  storage: FirebaseStorage;
  /** Storage path prefix, e.g. the app's storage namespace. */
  storageNamespace: string;
  /**
   * The current viewer's email, or `null` for the public / unauthenticated
   * library. Evaluated per `list()` call so auth changes are reflected.
   */
  viewerEmail?: () => string | null;
}

export function createFirebaseMediaSource<
  T extends { id: string; addedAt: string; storagePath: string },
>(config: FirebaseMediaSourceConfig<T>): MediaSource<T> {
  const { queries, cache, storage, storageNamespace, viewerEmail } = config;

  async function downloadUrl(storagePath: string): Promise<string> {
    return getDownloadURL(ref(storage, `${storageNamespace}/${storagePath}`));
  }

  return {
    list() {
      const email = viewerEmail?.() ?? null;
      return email
        ? queries.getAllAccessibleMedia(email)
        : queries.getPublicMedia();
    },

    metadata(id) {
      return queries.getMediaItem(id);
    },

    async resolveToBlob(item) {
      const cached = await cache.getEntry<ArrayBuffer>(item.storagePath);
      if (cached) return cached;

      const url = await downloadUrl(item.storagePath);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Media fetch failed: ${res.status}`);
      const buf = await res.arrayBuffer();

      await cache.putEntry(item.storagePath, buf);
      return buf;
    },
  };
}
