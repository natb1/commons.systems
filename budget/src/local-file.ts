// File System Access API (FSA) surface for the budget app.
//
// `window.showOpenFilePicker` and `FileSystemHandle.queryPermission` /
// `requestPermission` are not in baseline `lib.dom.d.ts`, so this module owns
// the minimal ambient declarations. The FSA primitives let a Chromium browser
// persist a `FileSystemFileHandle` (stored in IDB) and re-open the same on-disk
// `.benc` across sessions; non-Chromium browsers fall back to the existing
// `<input type=file>` upload path (detected via `isFsaSupported`).

interface FileSystemHandlePermissionDescriptor {
  mode?: "read" | "readwrite";
}
interface OpenFilePickerOptions {
  multiple?: boolean;
  types?: { description?: string; accept: Record<string, string[]> }[];
}
declare global {
  interface Window {
    showOpenFilePicker(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>;
  }
  interface FileSystemHandle {
    queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  }
}

/** True on Chromium browsers that expose the File System Access picker. */
export function isFsaSupported(): boolean {
  return typeof window !== "undefined" && "showOpenFilePicker" in window;
}

/**
 * Show the FSA picker for a `.benc`/`.json` file. Returns the picked handle, or
 * `null` when the user cancels the picker (AbortError). Any other error is
 * rethrown.
 */
export async function pickBencFile(): Promise<FileSystemFileHandle | null> {
  try {
    const handles = await window.showOpenFilePicker({
      multiple: false,
      types: [{ description: "Budget data", accept: { "application/octet-stream": [".benc"], "application/json": [".json"] } }],
    });
    return handles[0];
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return null;
    }
    throw error;
  }
}

/** Query whether the handle currently has read permission. */
export function queryReadPermission(handle: FileSystemFileHandle): Promise<PermissionState> {
  // Mode "read": S1 is load-only; #1019 upgrades to "readwrite".
  return handle.queryPermission({ mode: "read" });
}

/** Request read permission for the handle (may prompt the user). */
export function requestReadPermission(handle: FileSystemFileHandle): Promise<PermissionState> {
  return handle.requestPermission({ mode: "read" });
}

/**
 * Read the current `File` from the handle. Does not catch errors: a
 * NotFoundError (file moved/deleted) propagates so callers can treat it as a
 * stale handle and fall back to the re-link picker.
 */
export function readFileFromHandle(handle: FileSystemFileHandle): Promise<File> {
  return handle.getFile();
}
