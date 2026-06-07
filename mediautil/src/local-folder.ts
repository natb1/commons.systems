/**
 * `LocalFolderMediaSource` implements `MediaSource<T>` over an on-disk folder
 * the user picked via the File System Access API: it lists and resolves audio
 * files in place, with no upload. This is the local-first sibling of the
 * Firebase cloud source (`createFirebaseMediaSource`) — apps union the two so
 * the library shows local and cloud items on equal footing.
 *
 * Files can move or disappear between a scan and a read (the user owns the
 * folder); such races are handled gracefully rather than as hard errors —
 * vanished entries are skipped during `list`, and a missing file at resolve
 * time surfaces as a typed `MediaItemMissingError`.
 */
import type { MediaSource } from "./source.js";

/** A file that has gone missing since the last scan (moved or removed). */
export class MediaItemMissingError extends Error {
  readonly fileName: string;

  constructor(fileName: string) {
    super(`Local media file is missing: ${fileName}`);
    this.name = "MediaItemMissingError";
    this.fileName = fileName;
  }
}

/** The minimal per-file facts a scan exposes to `toItem`. */
export interface LocalFolderEntry {
  name: string;
  lastModified: number;
}

export interface LocalFolderMediaSourceConfig<
  T extends { id: string; addedAt: string },
> {
  /** The user-picked directory handle (from `showDirectoryPicker`). */
  directoryHandle: FileSystemDirectoryHandle;
  /** Whether a file name belongs in the library (e.g. an audio extension). */
  accept(name: string): boolean;
  /** Map a scanned entry to the app's metadata record. */
  toItem(entry: LocalFolderEntry): T;
  /** Recover the directory-relative name for an item, for byte resolution. */
  fileName(item: T): string;
}

export function createLocalFolderMediaSource<
  T extends { id: string; addedAt: string },
>(config: LocalFolderMediaSourceConfig<T>): MediaSource<T> {
  const { directoryHandle, accept, toItem, fileName } = config;

  async function list(): Promise<T[]> {
    const items: T[] = [];
    for await (const entry of directoryHandle.values()) {
      if (entry.kind !== "file") continue;
      if (!accept(entry.name)) continue;
      // `values()` is typed as yielding the base `FileSystemHandle`; the
      // `kind === "file"` check above guarantees a file handle, which exposes
      // `getFile()`.
      const fileHandle = entry as FileSystemFileHandle;
      try {
        const file = await fileHandle.getFile();
        items.push(toItem({ name: entry.name, lastModified: file.lastModified }));
      } catch {
        // The file vanished between enumeration and read (moved/removed
        // mid-scan). Skip it rather than failing the whole listing.
      }
    }
    // Newest first, matching the cloud source's contract.
    items.sort((a, b) => (a.addedAt < b.addedAt ? 1 : a.addedAt > b.addedAt ? -1 : 0));
    return items;
  }

  return {
    list,

    async metadata(id) {
      const items = await list();
      return items.find((i) => i.id === id) ?? null;
    },

    async resolveToBlob(item) {
      const name = fileName(item);
      try {
        const handle = await directoryHandle.getFileHandle(name);
        const file = await handle.getFile();
        return await file.arrayBuffer();
      } catch (err) {
        if (err instanceof Error && err.name === "NotFoundError") {
          throw new MediaItemMissingError(name);
        }
        throw err;
      }
    },
  };
}
