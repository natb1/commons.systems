/**
 * IndexedDB-backed LRU cache for print media files (PDFs, EPUBs, image archive
 * chunks). Thin wrapper around the shared `@commons-systems/idbutil/lru-blob-cache`
 * primitive. Whole files and range-request chunks share the same stores.
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

export const closeDb = cache.closeDb;
export const clearCache = cache.clearCache;

function chunkKey(storagePath: string, offset: number, length: number): string {
  return `${storagePath}:${offset}:${length}`;
}

export async function getFile(storagePath: string): Promise<ArrayBuffer | null> {
  const result = await cache.getEntry(storagePath);
  return result as ArrayBuffer | null;
}

export function putFile(storagePath: string, data: ArrayBuffer): Promise<void> {
  return cache.putEntry(storagePath, data);
}

export async function getChunk(
  storagePath: string,
  offset: number,
  length: number,
): Promise<Uint8Array | null> {
  const result = await cache.getEntry(chunkKey(storagePath, offset, length));
  return result as Uint8Array | null;
}

export function putChunk(
  storagePath: string,
  offset: number,
  length: number,
  data: Uint8Array,
): Promise<void> {
  return cache.putEntry(chunkKey(storagePath, offset, length), data);
}
