const DB_NAME = "budget";
const DB_VERSION = 1;

const STORE_NAMES = [
  "transactions",
  "budgets",
  "budgetPeriods",
  "rules",
  "normalizationRules",
  "meta",
] as const;

export type StoreName = (typeof STORE_NAMES)[number];

export function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of STORE_NAMES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: name === "meta" ? "key" : "id" });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface UploadMeta {
  key: "upload";
  groupName: string;
  version: number;
  exportedAt: string;
}

export interface ParsedData {
  transactions: Record<string, unknown>[];
  budgets: Record<string, unknown>[];
  budgetPeriods: Record<string, unknown>[];
  rules: Record<string, unknown>[];
  normalizationRules: Record<string, unknown>[];
  meta: UploadMeta;
}

export async function storeParsedData(data: ParsedData): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAMES as unknown as string[], "readwrite");
  const stores: Record<string, IDBObjectStore> = {};
  for (const name of STORE_NAMES) {
    stores[name] = tx.objectStore(name);
  }

  // Clear all stores first
  const clearPromises: Promise<void>[] = [];
  for (const name of STORE_NAMES) {
    clearPromises.push(
      new Promise((resolve, reject) => {
        const req = stores[name].clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      }),
    );
  }
  await Promise.all(clearPromises);

  // Write all records
  for (const record of data.transactions) stores.transactions.put(record);
  for (const record of data.budgets) stores.budgets.put(record);
  for (const record of data.budgetPeriods) stores.budgetPeriods.put(record);
  for (const record of data.rules) stores.rules.put(record);
  for (const record of data.normalizationRules) stores.normalizationRules.put(record);
  stores.meta.put(data.meta);

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getAll<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).getAll();
    request.onsuccess = () => {
      db.close();
      resolve(request.result as T[]);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function get<T>(storeName: StoreName, id: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).get(id);
    request.onsuccess = () => {
      db.close();
      resolve(request.result as T | undefined);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function put(storeName: StoreName, record: Record<string, unknown>): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const request = tx.objectStore(storeName).put(record);
    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function deleteRecord(storeName: StoreName, id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const request = tx.objectStore(storeName).delete(id);
    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function clearAll(): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAMES as unknown as string[], "readwrite");
  for (const name of STORE_NAMES) {
    tx.objectStore(name).clear();
  }
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function hasData(): Promise<boolean> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("meta", "readonly");
    const request = tx.objectStore("meta").get("upload");
    request.onsuccess = () => {
      db.close();
      resolve(request.result !== undefined);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function getMeta(): Promise<UploadMeta | undefined> {
  return get<UploadMeta>("meta", "upload");
}
