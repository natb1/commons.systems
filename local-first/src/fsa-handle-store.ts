import { createDbConnection } from "@commons-systems/idbutil/connection";
import { detectFsaCapabilities, isFsaSupported, type FsaCapabilities } from "./capabilities.js";

const HANDLE_STORE = "handles";
const DEFAULT_DB_NAME = "fsa-handle-store";
const DEFAULT_VERSION = 1;

export type FsaPermissionMode = "read" | "readwrite";

export interface FsaHandleStoreConfig {
  /** App namespace — keeps one app's handles from colliding with another's. */
  app: string;
  /** IndexedDB database name. Defaults to "fsa-handle-store". */
  dbName?: string;
  /** IndexedDB schema version. Defaults to 1. */
  version?: number;
}

export interface FsaHandleStore {
  /** Detected FSA capabilities for this environment. */
  readonly capabilities: FsaCapabilities;
  /**
   * True when the browser can pick a persistable on-disk handle. When false,
   * the caller should route to its existing cloud (Firebase Storage) path.
   */
  isSupported(): boolean;
  /** Persist a picked handle under (app, purpose). */
  put(purpose: string, handle: FileSystemHandle): Promise<void>;
  /** Retrieve the persisted handle for (app, purpose), or null if none. */
  get(purpose: string): Promise<FileSystemHandle | null>;
  /** Remove the persisted handle for (app, purpose). Idempotent. */
  remove(purpose: string): Promise<void>;
  /** Query the current permission state without prompting. */
  queryPermission(
    handle: FileSystemHandle,
    mode?: FsaPermissionMode,
  ): Promise<PermissionState>;
  /** Request permission — must be called from within a user gesture. */
  requestPermission(
    handle: FileSystemHandle,
    mode?: FsaPermissionMode,
  ): Promise<PermissionState>;
  /**
   * Ensure usable permission with the fewest prompts: zero when already
   * granted, one request when in the `prompt` state. Returns the final state.
   * Call from within a user gesture so the `prompt` path can surface the
   * dialog.
   */
  ensurePermission(
    handle: FileSystemHandle,
    mode?: FsaPermissionMode,
  ): Promise<PermissionState>;
  /**
   * Load the persisted handle for (app, purpose) and resolve its permission.
   * Returns null when no handle is persisted. `permission` reflects the
   * post-`ensurePermission` state.
   *
   * Because this calls `ensurePermission`, which issues a permission request
   * when the handle is in the `prompt` state, call `load` from within a user
   * gesture. Outside a gesture the browser silently denies the request and
   * `permission` resolves to `denied`; a non-null return therefore does not
   * imply the handle is usable — check `permission === "granted"` before I/O.
   */
  load(
    purpose: string,
    mode?: FsaPermissionMode,
  ): Promise<{ handle: FileSystemHandle; permission: PermissionState } | null>;
}

export function createFsaHandleStore(
  config: FsaHandleStoreConfig,
): FsaHandleStore {
  if (!config.app) {
    throw new Error("FsaHandleStoreConfig.app must be a non-empty string");
  }
  if (config.app.includes(":")) {
    throw new Error('FsaHandleStoreConfig.app must not contain ":"');
  }
  const capabilities = detectFsaCapabilities();
  const conn = createDbConnection({
    name: config.dbName ?? DEFAULT_DB_NAME,
    version: config.version ?? DEFAULT_VERSION,
    onUpgrade: (db) => {
      if (!db.objectStoreNames.contains(HANDLE_STORE)) {
        db.createObjectStore(HANDLE_STORE);
      }
    },
  });

  const keyFor = (purpose: string): string => {
    if (!purpose) {
      throw new Error("purpose must be a non-empty string");
    }
    if (purpose.includes(":")) {
      throw new Error('purpose must not contain ":"');
    }
    return `${config.app}:${purpose}`;
  };

  async function put(
    purpose: string,
    handle: FileSystemHandle,
  ): Promise<void> {
    const key = keyFor(purpose);
    const db = await conn.openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE, "readwrite");
      tx.objectStore(HANDLE_STORE).put(handle, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async function get(purpose: string): Promise<FileSystemHandle | null> {
    const key = keyFor(purpose);
    const db = await conn.openDb();
    return new Promise<FileSystemHandle | null>((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE, "readonly");
      const req = tx.objectStore(HANDLE_STORE).get(key);
      req.onsuccess = () => {
        const result = req.result as unknown;
        if (result === undefined || result === null) {
          resolve(null);
          return;
        }
        if (
          typeof result !== "object" ||
          ((result as { kind?: unknown }).kind !== "file" &&
            (result as { kind?: unknown }).kind !== "directory")
        ) {
          reject(
            new Error(
              "Persisted FSA handle is malformed (expected a FileSystemHandle); the IndexedDB store may be corrupted or tampered with",
            ),
          );
          return;
        }
        resolve(result as FileSystemHandle);
      };
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async function remove(purpose: string): Promise<void> {
    const key = keyFor(purpose);
    const db = await conn.openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE, "readwrite");
      tx.objectStore(HANDLE_STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async function queryPermission(
    handle: FileSystemHandle,
    mode: FsaPermissionMode = "read",
  ): Promise<PermissionState> {
    return handle.queryPermission({ mode });
  }

  async function requestPermission(
    handle: FileSystemHandle,
    mode: FsaPermissionMode = "read",
  ): Promise<PermissionState> {
    return handle.requestPermission({ mode });
  }

  async function ensurePermission(
    handle: FileSystemHandle,
    mode: FsaPermissionMode = "read",
  ): Promise<PermissionState> {
    const current = await handle.queryPermission({ mode });
    if (current === "granted") return "granted";
    if (current === "prompt") return handle.requestPermission({ mode });
    return current; // denied
  }

  async function load(
    purpose: string,
    mode: FsaPermissionMode = "read",
  ): Promise<
    { handle: FileSystemHandle; permission: PermissionState } | null
  > {
    const handle = await get(purpose);
    if (!handle) return null;
    const permission = await ensurePermission(handle, mode);
    return { handle, permission };
  }

  return {
    capabilities,
    isSupported: isFsaSupported,
    put,
    get,
    remove,
    queryPermission,
    requestPermission,
    ensurePermission,
    load,
  };
}
