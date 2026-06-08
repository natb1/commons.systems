/**
 * `LocalFolderMediaSource` implements `MediaSource<T>` over a user-chosen
 * on-disk directory via the File System Access API. Files are read in place
 * with no upload; the source is intended to be unioned with `FirebaseMediaSource`
 * so the library shows local and cloud items together.
 *
 * The implementation is testable with any structural fake that satisfies
 * `LocalDirectoryHandleLike` — no direct FSA globals are imported here.
 */
import type { MediaSource } from "./source.js";

export interface LocalFileHandleLike {
  readonly kind: "file";
  readonly name: string;
  getFile(): Promise<File>;
}

export interface LocalDirEntryLike {
  readonly kind: "file" | "directory";
  readonly name: string;
}

export interface LocalDirectoryHandleLike {
  values(): AsyncIterableIterator<LocalDirEntryLike>;
}

export interface LocalFolderMediaSourceConfig<T extends { id: string; addedAt: string }> {
  directory: LocalDirectoryHandleLike;
  /** Map a top-level file to a record, or null to skip (unsupported ext). */
  toItem: (file: File, name: string) => T | null;
}

export function createLocalFolderMediaSource<T extends { id: string; addedAt: string }>(
  config: LocalFolderMediaSourceConfig<T>,
): MediaSource<T> {
  const index = new Map<string, LocalFileHandleLike>();
  const items = new Map<string, T>();

  async function scan(): Promise<T[]> {
    index.clear();
    items.clear();
    const results: T[] = [];

    for await (const entry of config.directory.values()) {
      if (entry.kind !== "file") continue;

      const fileHandle = entry as unknown as LocalFileHandleLike;

      let file: File;
      try {
        file = await fileHandle.getFile();
      } catch {
        continue;
      }

      const item = config.toItem(file, entry.name);
      if (item === null) continue;

      results.push(item);
      index.set(item.id, fileHandle);
      items.set(item.id, item);
    }

    results.sort((a, b) => {
      if (a.addedAt > b.addedAt) return -1;
      if (a.addedAt < b.addedAt) return 1;
      return 0;
    });

    return results;
  }

  return {
    async list() {
      return scan();
    },

    async metadata(id) {
      let item = items.get(id);
      if (!item) {
        await scan();
        item = items.get(id);
      }
      return item ?? null;
    },

    async resolveToBlob(item) {
      let handle = index.get(item.id);
      if (!handle) {
        await scan();
        handle = index.get(item.id);
      }
      if (!handle) {
        throw new Error("Local file no longer present");
      }
      try {
        const file = await handle.getFile();
        return file.arrayBuffer();
      } catch {
        throw new Error("Local file no longer present");
      }
    },
  };
}
