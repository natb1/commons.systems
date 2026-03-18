interface DbConnectionConfig {
  name: string;
  version: number;
  onUpgrade: (db: IDBDatabase, oldVersion: number) => void;
}

export function createDbConnection(config: DbConnectionConfig): {
  openDb: () => Promise<IDBDatabase>;
  closeDb: () => Promise<void>;
} {
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
      } catch {
        // Connection already failed; nothing to close.
      }
    }
  }

  return { openDb, closeDb };
}
