/**
 * IndexedDB-backed LRU cache for audio files. Thin wrapper around the shared
 * `@commons-systems/idbutil/lru-blob-cache` primitive.
 */
import { createLruBlobCache } from "@commons-systems/idbutil/lru-blob-cache";

export const MAX_CACHE_BYTES = 500 * 1024 * 1024;

export const CACHE_UPDATED_EVENT = "audio-cache-updated";

const cache = createLruBlobCache({
  name: "audio-media-cache",
  version: 1,
  maxBytes: MAX_CACHE_BYTES,
});

export const closeDb = cache.closeDb;
export const clearCache = cache.clearCache;

export async function getFile(storagePath: string): Promise<ArrayBuffer | null> {
  const result = await cache.getEntry(storagePath);
  return result as ArrayBuffer | null;
}

export function putFile(storagePath: string, data: ArrayBuffer): Promise<void> {
  return cache.putEntry(storagePath, data);
}

export async function getCacheStats(): Promise<{ trackCount: number; totalBytes: number }> {
  const { entryCount, totalBytes } = await cache.getStats();
  return { trackCount: entryCount, totalBytes };
}
