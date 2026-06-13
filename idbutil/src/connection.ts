interface DbConnectionConfig {
  name: string;
  version: number;
  onUpgrade: (db: IDBDatabase, oldVersion: number) => void;
  /**
   * Bounds how long an open waits for a blocking connection to close before
   * rejecting. Defaults to 30000 ms.
   */
  blockedTimeoutMs?: number;
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
  if (
    config.blockedTimeoutMs !== undefined &&
    (typeof config.blockedTimeoutMs !== "number" ||
      !Number.isFinite(config.blockedTimeoutMs) ||
      config.blockedTimeoutMs <= 0)
  ) {
    throw new Error(
      `DbConnectionConfig.blockedTimeoutMs must be a positive number, got ${config.blockedTimeoutMs}`,
    );
  }
  const blockedTimeoutMs = config.blockedTimeoutMs ?? 30000;
  let dbPromise: Promise<IDBDatabase> | null = null;

  function openDb(): Promise<IDBDatabase> {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        let upgradeError: unknown;
        let blockedTimer: ReturnType<typeof setTimeout> | undefined;
        let settledByTimeout = false;
        const request = indexedDB.open(config.name, config.version);
        request.onupgradeneeded = (event) => {
          try {
            config.onUpgrade(request.result, event.oldVersion);
          } catch (err) {
            upgradeError = err;
            request.transaction?.abort();
          }
        };
        request.onsuccess = () => {
          clearTimeout(blockedTimer);
          if (settledByTimeout) {
            request.result.close();
            return;
          }
          const db = request.result;
          db.onclose = () => { dbPromise = null; };
          db.onversionchange = () => { db.close(); dbPromise = null; };
          resolve(db);
        };
        request.onblocked = () => {
          console.warn(
            `IndexedDB upgrade of "${config.name}" is blocked by another connection; waiting for it to close.`,
          );
          if (blockedTimer === undefined) {
            blockedTimer = setTimeout(() => {
              settledByTimeout = true;
              dbPromise = null;
              reject(new Error(
                `IndexedDB upgrade of "${config.name}" timed out waiting for another tab to close its connection. Close other tabs using this app and retry.`,
              ));
            }, blockedTimeoutMs);
          }
        };
        request.onerror = () => { clearTimeout(blockedTimer); dbPromise = null; reject(upgradeError ?? request.error); };
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
