/**
 * Resolve a recorded relative source-statement path against a directory handle
 * to a file handle. READ-ONLY: this only walks handles and never writes.
 *
 * The handle types are minimal structural interfaces rather than the DOM
 * FileSystem types, because the test environment (happy-dom) does not implement
 * the real File System Access APIs and tests pass in-memory mocks.
 */

export interface FileHandleLike {
  getFile(): Promise<File>;
}

export interface DirHandleLike {
  getDirectoryHandle(name: string): Promise<DirHandleLike>;
  getFileHandle(name: string): Promise<FileHandleLike>;
}

/**
 * Walk `relPath` (slash-separated) against `dir`: each intermediate segment is a
 * subdirectory, the final segment is the file. Returns the file handle, or
 * `null` when a directory or the file is missing/moved (a `NotFoundError`). All
 * other errors propagate.
 */
export async function resolveSourceFile(
  dir: DirHandleLike,
  relPath: string,
): Promise<FileHandleLike | null> {
  const segments = relPath.split("/").filter((s) => s.length > 0);
  if (segments.length === 0) {
    return null;
  }

  try {
    let current = dir;
    for (let i = 0; i < segments.length - 1; i++) {
      current = await current.getDirectoryHandle(segments[i]);
    }
    return await current.getFileHandle(segments[segments.length - 1]);
  } catch (err) {
    if (err instanceof Error && err.name === "NotFoundError") {
      return null;
    }
    throw err;
  }
}
