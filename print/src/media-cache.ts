export const MAX_CACHE_BYTES = 500 * 1024 * 1024;

const DB_NAME = "print-media-cache";
const DB_VERSION = 1;
const STORE_NAME = "media";

interface CacheEntry {
  key: string;
  data: ArrayBuffer | Uint8Array;
  size: number;
  lastAccessed: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
          store.createIndex("lastAccessed", "lastAccessed", { unique: false });
        }
      };
      request.onsuccess = () => {
        request.result.onclose = () => { dbPromise = null; };
        resolve(request.result);
      };
      request.onblocked = () => {
        dbPromise = null;
        reject(new Error("Database upgrade blocked. Close other tabs using this app and try again."));
      };
      request.onerror = () => { dbPromise = null; reject(request.error); };
    });
  }
  return dbPromise;
}

function touchLastAccessed(db: IDBDatabase, key: string): void {
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const getReq = store.get(key);
  getReq.onsuccess = () => {
    const entry = getReq.result as CacheEntry | undefined;
    if (entry) {
      entry.lastAccessed = Date.now();
      store.put(entry);
    }
  };
}

async function evictIfNeeded(db: IDBDatabase, incomingSize: number): Promise<void> {
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);

  const totalSize = await new Promise<number>((resolve, reject) => {
    let sum = 0;
    const req = store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        sum += (cursor.value as CacheEntry).size;
        cursor.continue();
      } else {
        resolve(sum);
      }
    };
    req.onerror = () => reject(req.error);
  });

  if (totalSize + incomingSize <= MAX_CACHE_BYTES) return;

  const evictTx = db.transaction(STORE_NAME, "readwrite");
  const evictStore = evictTx.objectStore(STORE_NAME);
  const evictIndex = evictStore.index("lastAccessed");

  await new Promise<void>((resolve, reject) => {
    let remaining = totalSize + incomingSize - MAX_CACHE_BYTES;
    const req = evictIndex.openCursor();
    req.onsuccess = () => {
      if (remaining <= 0) { resolve(); return; }
      const cursor = req.result;
      if (!cursor) { resolve(); return; }
      const entry = cursor.value as CacheEntry;
      remaining -= entry.size;
      cursor.delete();
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
  });
}

function chunkKey(storagePath: string, offset: number, length: number): string {
  return `${storagePath}:${offset}:${length}`;
}

export async function getFile(storagePath: string): Promise<ArrayBuffer | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(storagePath);
    req.onsuccess = () => {
      const entry = req.result as CacheEntry | undefined;
      if (entry) {
        touchLastAccessed(db, storagePath);
        resolve(entry.data as ArrayBuffer);
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
    const tx = db.transaction(STORE_NAME, "readwrite");
    const entry: CacheEntry = {
      key: storagePath,
      data,
      size: data.byteLength,
      lastAccessed: Date.now(),
    };
    const req = tx.objectStore(STORE_NAME).put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getChunk(storagePath: string, offset: number, length: number): Promise<Uint8Array | null> {
  const db = await openDb();
  const key = chunkKey(storagePath, offset, length);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => {
      const entry = req.result as CacheEntry | undefined;
      if (entry) {
        touchLastAccessed(db, key);
        resolve(entry.data as Uint8Array);
      } else {
        resolve(null);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function putChunk(storagePath: string, offset: number, length: number, data: Uint8Array): Promise<void> {
  const db = await openDb();
  const key = chunkKey(storagePath, offset, length);
  await evictIfNeeded(db, data.byteLength);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const entry: CacheEntry = {
      key,
      data,
      size: data.byteLength,
      lastAccessed: Date.now(),
    };
    const req = tx.objectStore(STORE_NAME).put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearCache(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function closeDb(): Promise<void> {
  if (dbPromise) {
    const pending = dbPromise;
    dbPromise = null;
    try {
      const db = await pending;
      db.close();
    } catch {
      // Connection already failed; nothing to close.
    }
  }
}
