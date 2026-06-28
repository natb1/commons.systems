/**
 * Capability detection for the File System Access (FSA) API. Every check is a
 * guarded `typeof` probe so it never throws on a browser (or test environment)
 * that lacks the API.
 */

export interface FsaCapabilities {
  /** `window.showOpenFilePicker` is available (pick an on-disk file). */
  filePicker: boolean;
  /** `window.showDirectoryPicker` is available (pick an on-disk directory). */
  directoryPicker: boolean;
}

/**
 * Probe the current environment for FSA support. Never throws — on any non-FSA
 * browser (or non-browser context) the corresponding flag is `false`. When both
 * flags are false the caller should route to its existing cloud path.
 */
export function detectFsaCapabilities(): FsaCapabilities {
  const win = typeof window !== "undefined" ? window : undefined;
  return {
    filePicker: typeof win?.showOpenFilePicker === "function",
    directoryPicker: typeof win?.showDirectoryPicker === "function",
  };
}

/**
 * True when the browser can let the user pick a persistable on-disk handle
 * (file or directory). When false, callers should route to their existing
 * cloud (Firebase Storage) path rather than the local-first on-disk path.
 */
export function isFsaSupported(): boolean {
  const caps = detectFsaCapabilities();
  return caps.filePicker || caps.directoryPicker;
}
