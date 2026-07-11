/**
 * `LocalFolderMediaSource` implements `MediaSource<T>` over a user-chosen
 * on-disk directory via the File System Access API. Files are read in place
 * with no upload; the source is intended to be unioned with `FirebaseMediaSource`
 * so the library shows local and cloud items together.
 *
 * The implementation is testable with any structural fake that satisfies
 * `LocalDirectoryHandleLike` — no direct FSA globals are imported here.
 */
import {
  compareByAddedAtDescIdDesc,
  decodeCursor,
  encodeCursor,
} from "@commons-systems/firestoreutil/paged-merge";
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

export interface LocalFolderMediaSource<T extends { id: string; addedAt: string }>
  extends MediaSource<T> {
  resolveToFile(item: T): Promise<File>;
}

export function createLocalFolderMediaSource<T extends { id: string; addedAt: string }>(
  config: LocalFolderMediaSourceConfig<T>,
): LocalFolderMediaSource<T> {
  const index = new Map<string, LocalFileHandleLike>();
  const items = new Map<string, T>();
  let pendingScan: Promise<T[]> | null = null;

  async function doScan(): Promise<T[]> {
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
        // Expected I/O failure (file removed or permission revoked between
        // enumeration and read): skip this entry. The catch is deliberately
        // narrowed to getFile() so a bug thrown by the consumer's toItem mapper
        // surfaces instead of silently dropping the file from the library.
        continue;
      }
      const item = config.toItem(file, entry.name);
      if (item === null) continue;

      results.push(item);
      index.set(item.id, fileHandle);
      items.set(item.id, item);
    }

    // Sort by the SHARED (addedAt desc, id desc) order so the paging slice
    // boundaries in list() line up exactly with the cursor semantics.
    results.sort((a, b) =>
      compareByAddedAtDescIdDesc(
        { addedAt: a.addedAt, id: a.id },
        { addedAt: b.addedAt, id: b.id },
      ),
    );

    return results;
  }

  function scan(): Promise<T[]> {
    if (!pendingScan) {
      pendingScan = doScan().finally(() => {
        pendingScan = null;
      });
    }
    return pendingScan;
  }

  return {
    async list(opts) {
      // FSA enumerates the whole directory; scan() is full + memoized and
      // already sorted newest-first in the shared (addedAt desc, id desc)
      // order. We slice that full scan by the same cursor so a local page
      // composes into a higher cross-source merge.
      const all = await scan();
      const pageSize = opts?.pageSize;
      const cursor = opts?.cursor ? decodeCursor(opts.cursor) : null;

      // Start index: the first item strictly AFTER the cursor key in the
      // shared DESC order. compareByAddedAtDescIdDesc(itemKey, cursor) > 0
      // means itemKey sorts after cursor.
      let start = 0;
      if (cursor) {
        start = all.findIndex(
          (it) => compareByAddedAtDescIdDesc({ addedAt: it.addedAt, id: it.id }, cursor) > 0,
        );
        if (start === -1) start = all.length; // cursor past the end
      }
      const rest = all.slice(start);

      // Absent pageSize => return ALL remaining, nextCursor null.
      const items = pageSize == null ? rest : rest.slice(0, pageSize);
      const more = pageSize != null && rest.length > pageSize && items.length > 0;
      const nextCursor = more
        ? encodeCursor({
            addedAt: items[items.length - 1].addedAt,
            id: items[items.length - 1].id,
          })
        : null;
      return { items, nextCursor };
    },

    async metadata(id) {
      let item = items.get(id);
      if (!item) {
        await scan();
        item = items.get(id);
      }
      return item ?? null;
    },

    async resolveToFile(item) {
      let handle = index.get(item.id);
      if (!handle) {
        await scan();
        handle = index.get(item.id);
      }
      if (!handle) {
        throw new Error("Local file no longer present");
      }
      // A cached handle whose getFile() fails is a real error (permission
      // revoked, IO failure) — propagate it rather than masking it as
      // "no longer present", which is reserved for a genuinely absent entry.
      const file = await handle.getFile();
      return file;
    },

    async resolveToBlob(item) {
      return (await this.resolveToFile(item)).arrayBuffer();
    },
  };
}
