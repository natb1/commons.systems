interface DbConnectionConfig {
  name: string;
  version: number;
  onUpgrade: (db: IDBDatabase, oldVersion: number) => void;
}

/**
 * Create a memoized `openDb`/`closeDb` pair for a versioned IndexedDB database.
 *
 * `openDb` reuses the same connection until it is closed (explicitly via `closeDb`
 * or by the browser, e.g. during storage pressure). `closeDb` is idempotent and
 * safe to call when no connection exists.
 */
export function createDbConnection(config: DbConnectionConfig): {
  openDb: () => Promise<IDBDatabase>;
  closeDb: () => Promise<void>;
} {
  if (!config.name) throw new Error("DbConnectionConfig.name must be a non-empty string");
  if (!Number.isInteger(config.version) || config.version < 1) {
    throw new Error(`DbConnectionConfig.version must be a positive integer, got ${config.version}`);
  }
  let dbPromise: Promise<IDBDatabase> | null = null;

  function openDb(): Promise<IDBDatabase> {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(config.name, config.version);
        request.onupgradeneeded = (event) => {
          config.onUpgrade(request.result, event.oldVersion);
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

  async function closeDb(): Promise<void> {
    if (dbPromise) {
      const pending = dbPromise;
      dbPromise = null;
      try {
        const db = await pending;
        db.close();
      } catch (err) {
        reportError(new Error("closeDb: failed to close database connection", { cause: err }));
      }
    }
  }

  return { openDb, closeDb };
}
