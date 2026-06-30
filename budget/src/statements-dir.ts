import { get, put } from "./idb.js";

/**
 * READ-ONLY File System Access (FSA) plumbing for the user's statements folder.
 *
 * Persists a directory handle in IndexedDB so a returning session can resolve a
 * transaction's source-statement file without re-prompting. Access is read-only
 * throughout: every permission call uses `mode: "read"`. This module never
 * requests readwrite, never parses, and never uploads.
 */

/**
 * The FSA permission methods (`queryPermission` / `requestPermission`) are not
 * part of the TS DOM lib's `FileSystemHandle`. Augment locally with a read-only
 * descriptor rather than pulling in a dependency.
 */
type PermissionState = "granted" | "denied" | "prompt";

interface FsaPermissionHandle {
  queryPermission(descriptor: { mode: "read" }): Promise<PermissionState>;
  requestPermission(descriptor: { mode: "read" }): Promise<PermissionState>;
}

/** `window.showDirectoryPicker` is not typed by the default DOM lib. */
interface DirectoryPickerWindow {
  showDirectoryPicker(options: { mode: "read" }): Promise<FileSystemDirectoryHandle>;
}

/** The persisted meta-store record. The `meta` store is keyed by `key`. */
interface StatementsDirMeta {
  key: "statementsDir";
  handle: FileSystemDirectoryHandle;
}

const META_KEY = "statementsDir";

/** True when the browser exposes the File System Access directory picker. */
export function isDirectoryAccessSupported(): boolean {
  return "showDirectoryPicker" in window;
}

/** Read the persisted statements-folder directory handle, or `undefined`. */
export async function getStoredDirectoryHandle(): Promise<FileSystemDirectoryHandle | undefined> {
  const record = await get<StatementsDirMeta>("meta", META_KEY);
  return record?.handle;
}

/** Persist the statements-folder directory handle under the `meta` store. */
export async function storeDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const record: StatementsDirMeta = { key: META_KEY, handle };
  await put("meta", record as unknown as Record<string, unknown>);
}

/**
 * Prompt the user to pick their statements folder (read-only), persist the
 * resulting handle, and return it.
 */
export async function pickStatementsDirectory(): Promise<FileSystemDirectoryHandle> {
  const picker = window as unknown as DirectoryPickerWindow;
  const handle = await picker.showDirectoryPicker({ mode: "read" });
  await storeDirectoryHandle(handle);
  return handle;
}

/**
 * Ensure read permission on a directory handle. Queries first; if the state is
 * `"prompt"`, requests it. READ MODE ONLY. Returns `true` iff the final state is
 * `"granted"`.
 */
export async function ensureReadPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const permHandle = handle as unknown as FsaPermissionHandle;
  let state = await permHandle.queryPermission({ mode: "read" });
  if (state === "prompt") {
    state = await permHandle.requestPermission({ mode: "read" });
  }
  return state === "granted";
}
