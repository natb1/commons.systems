/**
 * IndexedDB-backed LRU cache for audio files.
 *
 * Two object stores: `media-data` holds ArrayBuffers, `media-meta` holds size +
 * lastAccessed metadata (separated so eviction scans never load large buffers
 * and read-path timestamp updates do not block data retrieval). A sentinel
 * `__total__` entry in meta tracks
 * aggregate cache size for O(1) capacity checks. The sentinel uses `lastAccessed: 0`
 * so it sorts first in the eviction index; the eviction cursor explicitly skips it.
 * 500 MB cap with LRU eviction.
 */
import { createDbConnection } from "@commons-systems/idbutil/connection";

export const MAX_CACHE_BYTES = 500 * 1024 * 1024;

const DATA_STORE = "media-data";
const META_STORE = "media-meta";
const TOTAL_KEY = "__total__";

interface DataEntry {
  key: string;
  data: ArrayBuffer;
}

interface MetaEntry {
  key: string;
  size: number;
  lastAccessed: number;
}

const { openDb, closeDb: closeDbConn } = createDbConnection({
  name: "audio-media-cache",
  version: 1,
  onUpgrade(db) {
    if (!db.objectStoreNames.contains(DATA_STORE)) {
      db.createObjectStore(DATA_STORE, { keyPath: "key" });
    }
    if (!db.objectStoreNames.contains(META_STORE)) {
      const metaStore = db.createObjectStore(META_STORE, { keyPath: "key" });
      metaStore.createIndex("lastAccessed", "lastAccessed", { unique: false });
    }
  },
});

export const closeDb = closeDbConn;

export const CACHE_UPDATED_EVENT = "audio-cache-updated";

/** Fire-and-forget: updates the LRU timestamp without blocking the caller. */
function touchLastAccessed(db: IDBDatabase, key: string): void {
  const tx = db.transaction(META_STORE, "readwrite");
  const store = tx.objectStore(META_STORE);
  const getReq = store.get(key);
  getReq.onsuccess = () => {
    const entry = getReq.result as MetaEntry | undefined;
    if (entry) {
      entry.lastAccessed = Date.now();
      store.put(entry);
    }
  };
  tx.onerror = () => {
    reportError(new Error("Failed to touch lastAccessed", { cause: tx.error }));
  };
}

async function getTotalSize(db: IDBDatabase): Promise<number> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, "readonly");
    const req = tx.objectStore(META_STORE).get(TOTAL_KEY);
    req.onsuccess = () => {
      const entry = req.result as MetaEntry | undefined;
      resolve(entry ? entry.size : 0);
    };
    req.onerror = () => reject(req.error);
  });
}

function updateTotalAfterEviction(
  metaStore: IDBObjectStore,
  evictedSize: number,
  fallbackTotal: number,
  resolve: () => void,
  reject: (reason: unknown) => void,
): void {
  const totalReq = metaStore.get(TOTAL_KEY);
  totalReq.onsuccess = () => {
    const totalEntry = totalReq.result as MetaEntry | undefined;
    const currentTotal = totalEntry ? totalEntry.size : fallbackTotal;
    metaStore.put({ key: TOTAL_KEY, size: currentTotal - evictedSize, lastAccessed: 0 });
    resolve();
  };
  totalReq.onerror = () => reject(totalReq.error);
}

/**
 * The total-size read and eviction here run in a separate transaction from the
 * subsequent put in the caller (putFile); concurrent writes may briefly exceed
 * the cap, which is acceptable for a best-effort cache.
 */
async function evictIfNeeded(db: IDBDatabase, incomingSize: number): Promise<void> {
  const totalSize = await getTotalSize(db);

  if (totalSize + incomingSize <= MAX_CACHE_BYTES) return;

  const evictTx = db.transaction([DATA_STORE, META_STORE], "readwrite");
  const metaStore = evictTx.objectStore(META_STORE);
  const dataStore = evictTx.objectStore(DATA_STORE);
  const evictIndex = metaStore.index("lastAccessed");

  await new Promise<void>((resolve, reject) => {
    let remaining = totalSize + incomingSize - MAX_CACHE_BYTES;
    let evictedSize = 0;
    const req = evictIndex.openCursor();
    req.onsuccess = () => {
      if (remaining <= 0) {
        updateTotalAfterEviction(metaStore, evictedSize, totalSize, resolve, reject);
        return;
      }
      const cursor = req.result;
      if (!cursor) {
        updateTotalAfterEviction(metaStore, evictedSize, totalSize, resolve, reject);
        return;
      }
      const entry = cursor.value as MetaEntry;
      if (entry.key === TOTAL_KEY) { cursor.continue(); return; }
      remaining -= entry.size;
      evictedSize += entry.size;
      dataStore.delete(entry.key);
      cursor.delete();
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getFile(storagePath: string): Promise<ArrayBuffer | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DATA_STORE, "readonly");
    const req = tx.objectStore(DATA_STORE).get(storagePath);
    req.onsuccess = () => {
      const entry = req.result as DataEntry | undefined;
      if (entry) {
        touchLastAccessed(db, storagePath);
        resolve(entry.data);
      } else {
        resolve(null);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function putFile(storagePath: string, data: ArrayBuffer): Promise<void> {
  const db = await openDb();
  await evictIfNeeded(db, data.byteLength);
  return new Promise((resolve, reject) => {
    const tx = db.transaction([DATA_STORE, META_STORE], "readwrite");
    const dataStore = tx.objectStore(DATA_STORE);
    const metaStore = tx.objectStore(META_STORE);

    const existingReq = metaStore.get(storagePath);
    existingReq.onsuccess = () => {
      const existing = existingReq.result as MetaEntry | undefined;
      const oldSize = existing ? existing.size : 0;

      dataStore.put({ key: storagePath, data });
      metaStore.put({ key: storagePath, size: data.byteLength, lastAccessed: Date.now() });

      const totalReq = metaStore.get(TOTAL_KEY);
      totalReq.onsuccess = () => {
        const totalEntry = totalReq.result as MetaEntry | undefined;
        const currentTotal = totalEntry ? totalEntry.size : 0;
        metaStore.put({ key: TOTAL_KEY, size: currentTotal - oldSize + data.byteLength, lastAccessed: 0 });
      };
      totalReq.onerror = () => tx.abort();
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearCache(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([DATA_STORE, META_STORE], "readwrite");
    tx.objectStore(DATA_STORE).clear();
    tx.objectStore(META_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCacheStats(): Promise<{ trackCount: number; totalBytes: number }> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, "readonly");
    const store = tx.objectStore(META_STORE);
    const countReq = store.count();
    const totalReq = store.get(TOTAL_KEY);
    let trackCount = 0;
    let totalBytes = 0;
    countReq.onsuccess = () => {
      const raw = countReq.result;
      // Subtract 1 for the __total__ sentinel entry (or 0 if store is empty)
      trackCount = raw > 0 ? raw - 1 : 0;
    };
    totalReq.onsuccess = () => {
      const entry = totalReq.result as MetaEntry | undefined;
      totalBytes = entry ? entry.size : 0;
    };
    tx.oncomplete = () => resolve({ trackCount, totalBytes });
    tx.onerror = () => reject(tx.error);
  });
}
