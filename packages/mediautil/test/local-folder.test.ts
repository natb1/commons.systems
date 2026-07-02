import { describe, it, expect } from "vitest";
import {
  createLocalFolderMediaSource,
  type LocalDirEntryLike,
} from "../src/local-folder";

interface TestItem {
  id: string;
  addedAt: string;
  name: string;
}

function toItem(file: File, name: string): TestItem | null {
  if (!name.endsWith(".txt")) return null;
  return {
    id: "id:" + name,
    addedAt: new Date(file.lastModified).toISOString(),
    name,
  };
}

type FakeEntry =
  | { kind: "file"; name: string; file: File; failGetFile?: boolean }
  | { kind: "directory"; name: string };

function makeFakeEntry(entry: FakeEntry): LocalDirEntryLike {
  if (entry.kind === "directory") {
    return { kind: "directory", name: entry.name };
  }
  const { name, file, failGetFile } = entry;
  return {
    kind: "file",
    name,
    getFile: failGetFile
      ? () => Promise.reject(new Error("getFile failed"))
      : () => Promise.resolve(file),
  } as LocalDirEntryLike;
}

function makeFakeDirectory(entries: FakeEntry[]) {
  return {
    values(): AsyncIterableIterator<LocalDirEntryLike> {
      const fakeEntries = entries.map(makeFakeEntry);
      return (async function* () {
        for (const e of fakeEntries) yield e;
      })();
    },
  };
}

describe("list", () => {
  it("filters out directory entries and unsupported-extension files", async () => {
    const txtFile = new File(["hello"], "doc.txt", { lastModified: 1000 });
    const pdfFile = new File(["bytes"], "image.png", { lastModified: 2000 });
    const dir = makeFakeDirectory([
      { kind: "file", name: "doc.txt", file: txtFile },
      { kind: "file", name: "image.png", file: pdfFile },
      { kind: "directory", name: "subfolder" },
    ]);
    const source = createLocalFolderMediaSource<TestItem>({ directory: dir, toItem });

    const items = (await source.list()).items;

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("id:doc.txt");
  });

  it("sorts items newest-first by addedAt", async () => {
    const older = new File(["a"], "older.txt", { lastModified: 1000 });
    const newer = new File(["b"], "newer.txt", { lastModified: 3000 });
    const middle = new File(["c"], "middle.txt", { lastModified: 2000 });
    const dir = makeFakeDirectory([
      { kind: "file", name: "older.txt", file: older },
      { kind: "file", name: "newer.txt", file: newer },
      { kind: "file", name: "middle.txt", file: middle },
    ]);
    const source = createLocalFolderMediaSource<TestItem>({ directory: dir, toItem });

    const items = (await source.list()).items;

    expect(items).toHaveLength(3);
    expect(items[0].id).toBe("id:newer.txt");
    expect(items[1].id).toBe("id:middle.txt");
    expect(items[2].id).toBe("id:older.txt");
  });

  it("skips an entry whose getFile() throws, still lists others", async () => {
    const good = new File(["ok"], "good.txt", { lastModified: 1000 });
    const dir = makeFakeDirectory([
      { kind: "file", name: "bad.txt", file: good, failGetFile: true },
      { kind: "file", name: "good.txt", file: good },
    ]);
    const source = createLocalFolderMediaSource<TestItem>({ directory: dir, toItem });

    const items = (await source.list()).items;

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("id:good.txt");
  });

  it("returns all items with a null nextCursor when no pageSize is given", async () => {
    const files = makePagingFiles();
    const dir = makeFakeDirectory(
      files.map((file) => ({ kind: "file" as const, name: file.name, file })),
    );
    const source = createLocalFolderMediaSource<TestItem>({ directory: dir, toItem });

    const page = await source.list();

    expect(page.items).toHaveLength(files.length);
    expect(page.nextCursor).toBeNull();
  });

  it("pages by (addedAt, id) with no gap or overlap across the cursor boundary", async () => {
    const files = makePagingFiles();
    const dir = makeFakeDirectory(
      files.map((file) => ({ kind: "file" as const, name: file.name, file })),
    );
    const source = createLocalFolderMediaSource<TestItem>({ directory: dir, toItem });

    // Full order for reference (newest-first, id-desc tiebreak). Pin the exact
    // order literally so the same-addedAt pair proves the id-DESC tiebreak
    // (f3b before f3a) rather than only cross-page self-consistency.
    const full = (await source.list()).items;
    expect(full).toHaveLength(files.length);
    expect(full.map((i) => i.id)).toEqual([
      "id:f1.txt",
      "id:f2.txt",
      "id:f3b.txt",
      "id:f3a.txt",
      "id:f4.txt",
    ]);

    const pageSize = 2;
    const first = await source.list({ pageSize });
    expect(first.items).toHaveLength(pageSize);
    expect(first.nextCursor).not.toBeNull();
    expect(first.items.map((i) => i.id)).toEqual(full.slice(0, pageSize).map((i) => i.id));

    const second = await source.list({ pageSize, cursor: first.nextCursor });
    // No overlap: second page starts exactly where the first ended.
    expect(second.items.map((i) => i.id)).toEqual(
      full.slice(pageSize, pageSize * 2).map((i) => i.id),
    );

    // Walking every page reconstructs the full order with no gap/overlap.
    const walked: string[] = [];
    let cursor: string | null = null;
    for (;;) {
      const p: { items: TestItem[]; nextCursor: string | null } = await source.list({
        pageSize,
        cursor,
      });
      for (const it of p.items) walked.push(it.id);
      if (!p.nextCursor) break;
      cursor = p.nextCursor;
    }
    expect(walked).toEqual(full.map((i) => i.id));
  });
});

// Five files with distinct addedAt, plus a same-addedAt pair to exercise the
// id tiebreak in the shared (addedAt desc, id desc) order.
function makePagingFiles(): File[] {
  return [
    new File(["a"], "f1.txt", { lastModified: 5000 }),
    new File(["b"], "f2.txt", { lastModified: 4000 }),
    // Same lastModified -> same addedAt; id tiebreak decides order.
    new File(["c"], "f3a.txt", { lastModified: 3000 }),
    new File(["d"], "f3b.txt", { lastModified: 3000 }),
    new File(["e"], "f4.txt", { lastModified: 1000 }),
  ];
}

describe("metadata", () => {
  it("returns the item on a hit", async () => {
    const file = new File(["x"], "a.txt", { lastModified: 5000 });
    const dir = makeFakeDirectory([{ kind: "file", name: "a.txt", file }]);
    const source = createLocalFolderMediaSource<TestItem>({ directory: dir, toItem });

    const item = await source.metadata("id:a.txt");

    expect(item).not.toBeNull();
    expect(item?.id).toBe("id:a.txt");
  });

  it("returns null on a miss", async () => {
    const file = new File(["x"], "a.txt", { lastModified: 5000 });
    const dir = makeFakeDirectory([{ kind: "file", name: "a.txt", file }]);
    const source = createLocalFolderMediaSource<TestItem>({ directory: dir, toItem });

    const item = await source.metadata("id:missing.txt");

    expect(item).toBeNull();
  });
});

describe("resolveToBlob", () => {
  it("returns the file bytes for a present item", async () => {
    const content = "hello world";
    const file = new File([content], "doc.txt", { lastModified: 1000 });
    const dir = makeFakeDirectory([{ kind: "file", name: "doc.txt", file }]);
    const source = createLocalFolderMediaSource<TestItem>({ directory: dir, toItem });

    const items = (await source.list()).items;
    const buf = await source.resolveToBlob(items[0]);
    const text = new TextDecoder().decode(buf);

    expect(text).toBe(content);
  });

  it("throws with 'Local file no longer present' when id is absent after re-scan", async () => {
    const dir = {
      values(): AsyncIterableIterator<LocalDirEntryLike> {
        // Return an empty directory on every call (file is already gone)
        return (async function* () {})();
      },
    };
    const source = createLocalFolderMediaSource<TestItem>({ directory: dir, toItem });

    const missingItem: TestItem = {
      id: "id:gone.txt",
      addedAt: new Date(1000).toISOString(),
      name: "gone.txt",
    };

    await expect(source.resolveToBlob(missingItem)).rejects.toThrow(
      /Local file no longer present/,
    );
  });

  it("coalesces concurrent list() calls into a single directory scan", async () => {
    const file = new File(["hello"], "doc.txt", { lastModified: 1000 });
    const dir = makeFakeDirectory([{ kind: "file", name: "doc.txt", file }]);
    let valuesCalls = 0;
    const originalValues = dir.values.bind(dir);
    dir.values = function (): AsyncIterableIterator<LocalDirEntryLike> {
      valuesCalls += 1;
      return originalValues();
    };
    const source = createLocalFolderMediaSource<TestItem>({ directory: dir, toItem });

    await Promise.all([source.list(), source.list()]);

    expect(valuesCalls).toBe(1);
  });

  it("does not throw 'no longer present' for a present item while a scan is in flight", async () => {
    const content = "hello world";
    const file = new File([content], "doc.txt", { lastModified: 1000 });
    const dir = makeFakeDirectory([{ kind: "file", name: "doc.txt", file }]);
    const source = createLocalFolderMediaSource<TestItem>({ directory: dir, toItem });

    const presentItem: TestItem = {
      id: "id:doc.txt",
      addedAt: new Date(1000).toISOString(),
      name: "doc.txt",
    };

    // Start a scan but do not await it: the index has just been cleared and is
    // being repopulated. resolveToBlob must coalesce onto this in-flight scan
    // rather than observe the momentarily-empty index and re-scan.
    const p1 = source.list();
    const buf = await source.resolveToBlob(presentItem);
    const text = new TextDecoder().decode(buf);

    expect(text).toBe(content);
    await p1;
  });

  it("propagates getFile() failure for a cached handle after initial scan", async () => {
    let shouldFail = false;
    const file = new File(["data"], "flaky.txt", { lastModified: 1000 });
    const fakeHandle = {
      kind: "file" as const,
      name: "flaky.txt",
      getFile: () =>
        shouldFail
          ? Promise.reject(new Error("file removed"))
          : Promise.resolve(file),
    };

    const dir = {
      values(): AsyncIterableIterator<LocalDirEntryLike> {
        return (async function* () {
          yield fakeHandle;
        })();
      },
    };
    const source = createLocalFolderMediaSource<TestItem>({ directory: dir, toItem });

    // Populate the index
    await source.list();

    // Now make getFile reject — the handle is still in the index
    shouldFail = true;

    const item: TestItem = {
      id: "id:flaky.txt",
      addedAt: new Date(1000).toISOString(),
      name: "flaky.txt",
    };

    await expect(source.resolveToBlob(item)).rejects.toThrow("file removed");
  });
});

describe("resolveToFile", () => {
  it("returns the File for a present item with correct name, size, and lastModified", async () => {
    const content = "hello world";
    const file = new File([content], "doc.txt", { lastModified: 12345678 });
    const dir = makeFakeDirectory([{ kind: "file", name: "doc.txt", file }]);
    const source = createLocalFolderMediaSource<TestItem>({
      directory: dir,
      toItem,
    });

    const items = (await source.list()).items;
    const result = await source.resolveToFile(items[0]);

    expect(result.name).toBe("doc.txt");
    expect(result.size).toBe(new TextEncoder().encode(content).byteLength);
    expect(result.lastModified).toBe(12345678);
  });

  it("throws with 'Local file no longer present' when id is absent after re-scan", async () => {
    const dir = {
      values(): AsyncIterableIterator<LocalDirEntryLike> {
        return (async function* () {})();
      },
    };
    const source = createLocalFolderMediaSource<TestItem>({
      directory: dir,
      toItem,
    });

    const missingItem: TestItem = {
      id: "id:gone.txt",
      addedAt: new Date(1000).toISOString(),
      name: "gone.txt",
    };

    await expect(source.resolveToFile(missingItem)).rejects.toThrow(
      /Local file no longer present/,
    );
  });

  it("coalesces onto an in-flight scan", async () => {
    const content = "hello world";
    const file = new File([content], "doc.txt", { lastModified: 1000 });
    const dir = makeFakeDirectory([{ kind: "file", name: "doc.txt", file }]);
    const source = createLocalFolderMediaSource<TestItem>({
      directory: dir,
      toItem,
    });

    const presentItem: TestItem = {
      id: "id:doc.txt",
      addedAt: new Date(1000).toISOString(),
      name: "doc.txt",
    };

    // Start a scan but do not await it: resolveToFile must coalesce onto this
    // in-flight scan rather than observe the momentarily-empty index and re-scan.
    const p1 = source.list();
    const result = await source.resolveToFile(presentItem);

    expect(result.name).toBe("doc.txt");
    await p1;
  });
});
