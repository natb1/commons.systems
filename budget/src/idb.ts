import { createDbConnection } from "@commons-systems/idbutil/connection";
import type { IdbTransaction } from "./entities/transaction.js";
export type { IdbTransaction };
import type { IdbStatement } from "./entities/statement.js";
export type { IdbStatement };
import type { IdbStatementItem } from "./entities/statement-item.js";
export type { IdbStatementItem };
import type { IdbReconciliationNote } from "./entities/reconciliation-note.js";
export type { IdbReconciliationNote };
import type { IdbAccount } from "./entities/account.js";
export type { IdbAccount };
import type { IdbJournalEntry } from "./entities/journal-entry.js";
export type { IdbJournalEntry };
import type { IdbJournalLeg } from "./entities/journal-leg.js";
export type { IdbJournalLeg };
import type { IdbReconciliationEvent } from "./entities/reconciliation-event.js";
export type { IdbReconciliationEvent };
import type { IdbBudget } from "./entities/budget.js";
export type { IdbBudget };
import type { IdbBudgetPeriod } from "./entities/budget-period.js";
export type { IdbBudgetPeriod };
import type { IdbRule } from "./entities/rule.js";
export type { IdbRule };
import type { IdbNormalizationRule } from "./entities/normalization-rule.js";
export type { IdbNormalizationRule };
import type { IdbWeeklyAggregate } from "./entities/weekly-aggregate.js";
export type { IdbWeeklyAggregate };
import { collectionRegistry } from "./collection-registry.js";
import type { CollectionIdbData, DataStoreName } from "./collection-registry.js";

const STORE_NAMES = [...(Object.keys(collectionRegistry) as DataStoreName[]), "meta"] as const;

export type StoreName = DataStoreName | "meta";

const { openDb, closeDb: closeDbConn } = createDbConnection({
  name: "budget",
  version: 5,
  onUpgrade(db) {
    for (const name of STORE_NAMES) {
      if (!db.objectStoreNames.contains(name)) {
        db.createObjectStore(name, { keyPath: name === "meta" ? "key" : "id" });
      }
    }
  },
});

/** Close the cached DB connection. Primarily for test cleanup. */
export const closeDb = closeDbConn;

export interface UploadMeta {
  key: "upload";
  groupName: string;
  version: number;
  exportedAt: string;
}

export interface FileHandleMeta {
  key: "fileHandle";
  handle: FileSystemFileHandle;
}

export async function putFileHandle(handle: FileSystemFileHandle): Promise<void> {
  await put("meta", { key: "fileHandle", handle });
}

export async function getFileHandle(): Promise<FileSystemFileHandle | undefined> {
  const record = await get<FileHandleMeta>("meta", "fileHandle");
  return record?.handle;
}

export async function clearFileHandle(): Promise<void> {
  await deleteRecord("meta", "fileHandle");
}

export type ParsedData = CollectionIdbData & { meta: UploadMeta };

export async function storeParsedData(data: ParsedData): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([...STORE_NAMES], "readwrite");
  const stores: Record<string, IDBObjectStore> = {};
  for (const name of STORE_NAMES) {
    stores[name] = tx.objectStore(name);
  }

  // Clear all stores first. The "meta" store is special: it mixes the
  // parsed-data cache (the "upload" record) with capability records (the
  // persisted "fileHandle"). A reload replaces the former and must preserve the
  // latter, so delete only the "upload" key here rather than clearing the whole
  // store — clearing it blindly would also drop the fileHandle, and skipping it
  // blindly would silently retain any future meta key.
  const clearPromises: Promise<void>[] = [];
  for (const name of STORE_NAMES) {
    if (name === "meta") continue;
    clearPromises.push(
      new Promise((resolve, reject) => {
        const req = stores[name].clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      }),
    );
  }
  clearPromises.push(
    new Promise((resolve, reject) => {
      const req = stores.meta.delete("upload");
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    }),
  );
  await Promise.all(clearPromises);

  // Write all records
  const dataStoreNames = Object.keys(collectionRegistry) as DataStoreName[];
  for (const name of dataStoreNames) {
    for (const record of data[name]) stores[name].put(record);
  }
  stores.meta.put(data.meta);

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAll<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function get<T>(storeName: StoreName, id: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).get(id);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function put(storeName: StoreName, record: Record<string, unknown>): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const request = tx.objectStore(storeName).put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteRecord(storeName: StoreName, id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const request = tx.objectStore(storeName).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * A handle to one open read-write transaction spanning one or more stores.
 * Every read and write issued through it commits or rolls back together.
 */
export interface WriteTransaction {
  get<T>(storeName: StoreName, id: string): Promise<T | undefined>;
  // `object` (not `Record<string, unknown>`) so entity interfaces like
  // IdbJournalEntry pass without an `as unknown as` cast — an interface is
  // assignable to `object` but not to `Record<string, unknown>`.
  put(storeName: StoreName, record: object): Promise<void>;
  delete(storeName: StoreName, id: string): Promise<void>;
}

/**
 * Run `fn` against a single read-write IndexedDB transaction spanning
 * `storeNames`, so all its reads and writes commit atomically or roll back
 * together. If `fn` throws (or any request rejects), the transaction is aborted
 * and nothing persists.
 *
 * The transaction stays open across `await`s on the handle's own operations —
 * each is backed by an in-flight IDB request, which keeps the transaction from
 * auto-closing. Do NOT `await` an unrelated promise (a timer, a fetch, another
 * `openDb()` call) inside `fn`: with no request in flight the transaction
 * auto-commits and subsequent handle calls throw `TransactionInactiveError`.
 */
export async function runInWriteTransaction<T>(
  storeNames: StoreName[],
  fn: (tx: WriteTransaction) => Promise<T>,
): Promise<T> {
  const db = await openDb();
  const idbTx = db.transaction(storeNames, "readwrite");
  const handle: WriteTransaction = {
    get<U>(storeName: StoreName, id: string): Promise<U | undefined> {
      return new Promise<U | undefined>((resolve, reject) => {
        const req = idbTx.objectStore(storeName).get(id);
        // req.result is typed `any` by lib.dom, so it assigns to U | undefined
        // without a cast.
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    },
    put(storeName: StoreName, record: object): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        const req = idbTx.objectStore(storeName).put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    },
    delete(storeName: StoreName, id: string): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        const req = idbTx.objectStore(storeName).delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    },
  };
  const done = new Promise<void>((resolve, reject) => {
    idbTx.oncomplete = () => resolve();
    idbTx.onerror = () => reject(idbTx.error ?? new Error("IndexedDB transaction failed"));
    idbTx.onabort = () => reject(idbTx.error ?? new Error("IndexedDB transaction aborted"));
  });
  let result: T;
  try {
    result = await fn(handle);
  } catch (err) {
    try {
      idbTx.abort();
    } catch {
      // Transaction may already be inactive/aborted; the original error wins.
    }
    await done.catch(() => {});
    throw err;
  }
  await done;
  return result;
}

export async function clearAll(): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([...STORE_NAMES], "readwrite");
  const stores: Record<string, IDBObjectStore> = {};
  for (const name of STORE_NAMES) {
    stores[name] = tx.objectStore(name);
  }

  // Clear all non-meta stores fully. The "meta" store is special: it holds both
  // the parsed-data cache ("upload" key) and persistent capability records
  // ("fileHandle", "statementsDir"). Only delete the "upload" key so the
  // capability records survive a data reset.
  const clearPromises: Promise<void>[] = [];
  for (const name of STORE_NAMES) {
    if (name === "meta") continue;
    clearPromises.push(
      new Promise((resolve, reject) => {
        const req = stores[name].clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      }),
    );
  }
  clearPromises.push(
    new Promise((resolve, reject) => {
      const req = stores.meta.delete("upload");
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    }),
  );
  await Promise.all(clearPromises);

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getMeta(): Promise<UploadMeta | undefined> {
  return get<UploadMeta>("meta", "upload");
}
