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

    const items = await source.list();

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

    const items = await source.list();

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

    const items = await source.list();

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("id:good.txt");
  });
});

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

    const items = await source.list();
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
