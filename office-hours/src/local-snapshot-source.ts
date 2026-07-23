/**
 * The office-hours app's local-snapshot source.
 *
 * A user picks ONE read-only `.benc` snapshot file via the File System Access
 * API; its file handle is persisted via `@commons-systems/local-first` so a
 * returning session restores it with zero clicks when read permission is already
 * granted, or one click when permission is in the `prompt` state.
 *
 * This module owns only the FSA file-handle lifecycle (connect / restore /
 * regrant / disconnect), reading the file's bytes, and a staleness watermark for
 * focus-reload. It is purely read-only: no write-back, no readwrite permission,
 * no parsing, and no decryption (those live in sibling units).
 */
import { createFsaHandleStore } from "@commons-systems/local-first/fsa-handle-store";

// File System Access API surface. `window.showOpenFilePicker` and
// `FileSystemHandle.queryPermission` / `requestPermission` are not in baseline
// `lib.dom.d.ts`, so this module owns the minimal ambient declarations.
interface FileSystemHandlePermissionDescriptor {
  mode?: "read" | "readwrite";
}
interface OpenFilePickerOptions {
  multiple?: boolean;
  types?: { description?: string; accept: Record<string, string[]> }[];
}
interface DirectoryPickerOptions {
  id?: string;
  mode?: "read" | "readwrite";
}
declare global {
  interface Window {
    showOpenFilePicker(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>;
    // Fully typed for graph-source.ts (the clone-directory picker); optional
    // because directory picking ships behind file picking in some browsers.
    showDirectoryPicker?(options?: DirectoryPickerOptions): Promise<FileSystemDirectoryHandle>;
  }
  interface FileSystemHandle {
    queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  }
}

const PURPOSE = "snapshot-file";
const store = createFsaHandleStore({ app: "office-hours" });

export type SnapshotSourceState = "unsupported" | "none" | "granted" | "prompt" | "denied";

let currentHandle: FileSystemFileHandle | null = null;
let state: SnapshotSourceState = "none";
let restorePromise: Promise<SnapshotSourceState> | null = null;

/** Most-recently-read file `lastModified`, or null when nothing has been read. */
let lastModifiedWatermark: number | null = null;
/** In-flight staleness check, so overlapping focus events don't double-fire. */
let checkInFlight: Promise<boolean> | null = null;

/** True when the browser can pick and persist an on-disk file handle. */
export function isSnapshotSupported(): boolean {
  return store.isSupported() && "showOpenFilePicker" in window;
}

/** The current local-snapshot state. */
export function getSnapshotState(): SnapshotSourceState {
  return isSnapshotSupported() ? state : "unsupported";
}

/**
 * Prompt the user to pick a `.benc` snapshot file (read mode), persist its
 * handle, and bind it as current. Returns the handle, or null when the user
 * cancels the picker (AbortError). Must be called from within a user gesture.
 */
export async function pickSnapshotFile(): Promise<FileSystemFileHandle | null> {
  let handle: FileSystemFileHandle;
  try {
    const handles = await window.showOpenFilePicker({
      multiple: false,
      types: [
        {
          description: "Office-hours snapshot",
          accept: { "application/octet-stream": [".benc"] },
        },
      ],
    });
    handle = handles[0];
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return null;
    }
    throw error;
  }
  await store.put(PURPOSE, handle);
  currentHandle = handle;
  state = "granted";
  return handle;
}

async function restore(): Promise<SnapshotSourceState> {
  if (!isSnapshotSupported()) {
    state = "unsupported";
    return state;
  }
  const loaded = await store.get(PURPOSE);
  if (!loaded) {
    state = "none";
    return state;
  }
  const handle = loaded as FileSystemFileHandle; // type-safety-ok: store always holds FileSystemFileHandle for this PURPOSE key
  // Query only — never request permission at startup (no user gesture).
  const r = await store.queryPermission(handle, "read");
  if (r === "granted") {
    currentHandle = handle;
    state = "granted";
    return state;
  }
  state = r; // "prompt" | "denied"
  return state;
}

/** Restore the persisted snapshot handle once per session (memoized). */
export function restoreSnapshotHandle(): Promise<SnapshotSourceState> {
  if (!restorePromise) restorePromise = restore();
  return restorePromise;
}

/**
 * Re-grant read permission on the persisted handle (one click). Must be called
 * from within a user gesture. Returns true iff permission ends up granted.
 */
export async function regrantSnapshot(): Promise<boolean> {
  const loaded = await store.get(PURPOSE);
  if (!loaded) {
    state = "none";
    return false;
  }
  const handle = loaded as FileSystemFileHandle; // type-safety-ok: store always holds FileSystemFileHandle for this PURPOSE key
  // Request within the gesture — ensurePermission only prompts on "prompt".
  const r = await store.ensurePermission(handle, "read");
  if (r === "granted") {
    currentHandle = handle;
    state = "granted";
    return true;
  }
  state = r; // "prompt" | "denied"
  return false;
}

/**
 * Read the snapshot file's bytes. The handle must already be read-granted via
 * restore / regrant / pick. Stamps the staleness watermark to the read file's
 * `lastModified` so later `hasExternallyChanged` calls compare against this
 * version. Does NOT catch a NotFoundError (vanished file) — it propagates so the
 * caller can treat it as a stale handle (matches `readFileFromHandle`'s contract).
 */
export async function readSnapshotBytes(handle: FileSystemFileHandle): Promise<ArrayBuffer> {
  const file = await handle.getFile();
  lastModifiedWatermark = file.lastModified;
  return file.arrayBuffer();
}

/**
 * True iff the on-disk file is newer than the last-read version — i.e. it was
 * changed externally since `readSnapshotBytes` last stamped the watermark.
 * Returns false when nothing has been read yet (watermark null) or the file is
 * unchanged. Uses an in-flight guard so overlapping focus events share one read
 * rather than double-firing.
 */
export function hasExternallyChanged(handle: FileSystemFileHandle): Promise<boolean> {
  if (checkInFlight) return checkInFlight;
  checkInFlight = (async () => {
    const file = await handle.getFile();
    return lastModifiedWatermark !== null && file.lastModified > lastModifiedWatermark;
  })();
  // Reset the guard once the check settles, win or lose.
  void checkInFlight.finally(() => {
    checkInFlight = null;
  });
  return checkInFlight;
}

/** The currently bound snapshot handle, or null when none is connected. */
export function getCurrentSnapshotHandle(): FileSystemFileHandle | null {
  return currentHandle;
}
