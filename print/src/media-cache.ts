/**
 * IndexedDB-backed LRU cache for whole print media files (PDFs, EPUBs, image
 * archives). Thin wrapper around the shared
 * `@commons-systems/idbutil/lru-blob-cache` primitive.
 */
import { createLruBlobCache } from "@commons-systems/idbutil/lru-blob-cache";

export const MAX_CACHE_BYTES = 500 * 1024 * 1024;

const cache = createLruBlobCache({
  name: "print-media-cache",
  version: 2,
  maxBytes: MAX_CACHE_BYTES,
  onUpgrade(db, oldVersion) {
    if (oldVersion < 2 && db.objectStoreNames.contains("media")) {
      db.deleteObjectStore("media");
    }
  },
});

/** The underlying LRU blob cache, exposed for `MediaSource` derived-cache use. */
export const blobCache = cache;

export const closeDb = cache.closeDb;
export const clearCache = cache.clearCache;

export function getFile(storagePath: string): Promise<ArrayBuffer | null> {
  return cache.getEntry<ArrayBuffer>(storagePath);
}

export function putFile(storagePath: string, data: ArrayBuffer): Promise<void> {
  return cache.putEntry(storagePath, data);
}
