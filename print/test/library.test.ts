import { describe, it, expect, vi } from "vitest";

import type { LocalDirEntryLike } from "@commons-systems/mediautil/local-folder";

// Importing library.ts transitively imports print/src/firebase.ts, which calls
// initializeApp at module load. Mock the firebase-touching modules so the
// library module — the pure aggregation seam under test — imports cleanly with
// no real firebase init.
vi.mock("../src/firebase.js", () => ({ storage: {}, STORAGE_NAMESPACE: "media" }));
vi.mock("../src/media-cache.js", () => ({ blobCache: {} }));
vi.mock("../src/firestore.js", () => ({
  getPublicMedia: () => Promise.resolve([]),
  getAllAccessibleMedia: () => Promise.resolve([]),
  getMediaItem: () => Promise.resolve(null),
}));

import {
  fileToLocalItem,
  isLocalId,
  createLocalSource,
  listLocal,
  getLocalItem,
  resolveLocalBlob,
  hasLocalSource,
  LOCAL_ID_PREFIX,
} from "../src/library.js";
import type { MediaItem } from "../src/types.js";

type FakeEntry =
  | { kind: "file"; name: string; file: File }
  | { kind: "directory"; name: string };

function makeFakeEntry(entry: FakeEntry): LocalDirEntryLike {
  if (entry.kind === "directory") {
    return { kind: "directory", name: entry.name };
  }
  const { name, file } = entry;
  return {
    kind: "file",
    name,
    getFile: () => Promise.resolve(file),
  } as LocalDirEntryLike;
}

function makeFakeDirectory(name: string, entries: FakeEntry[]): FileSystemDirectoryHandle {
  return {
    name,
    values(): AsyncIterableIterator<LocalDirEntryLike> {
      const fakeEntries = entries.map(makeFakeEntry);
      return (async function* () {
        for (const e of fakeEntries) yield e;
      })();
    },
  } as unknown as FileSystemDirectoryHandle;
}

describe("fileToLocalItem", () => {
  it("maps a .pdf file to a local pdf item", () => {
    const file = new File(["bytes"], "book.pdf", { lastModified: 1000 });
    const item = fileToLocalItem(file, "book.pdf", "books");

    expect(item).not.toBeNull();
    expect(item?.mediaType).toBe("pdf");
    expect(item?.title).toBe("book");
    expect(item?.id).toBe(LOCAL_ID_PREFIX + "books/book.pdf");
    expect(item?.origin).toBe("local");
    expect(item?.addedAt).toBe(new Date(1000).toISOString());
  });

  it("maps a .epub file to a local epub item", () => {
    const file = new File(["bytes"], "novel.epub", { lastModified: 2000 });
    const item = fileToLocalItem(file, "novel.epub", "books");

    expect(item?.mediaType).toBe("epub");
    expect(item?.title).toBe("novel");
  });

  it("matches the extension case-insensitively (book.PDF → pdf)", () => {
    const file = new File(["bytes"], "book.PDF", { lastModified: 3000 });
    const item = fileToLocalItem(file, "book.PDF", "books");

    expect(item?.mediaType).toBe("pdf");
    expect(item?.title).toBe("book");
    expect(item?.id).toBe(LOCAL_ID_PREFIX + "books/book.PDF");
  });

  it("returns null for an unsupported extension", () => {
    const file = new File(["bytes"], "notes.txt", { lastModified: 1000 });
    expect(fileToLocalItem(file, "notes.txt", "books")).toBeNull();
  });

  it("returns null for a name with no dot", () => {
    const file = new File(["bytes"], "README", { lastModified: 1000 });
    expect(fileToLocalItem(file, "README", "books")).toBeNull();
  });

  it("produces non-colliding ids for the same filename in differently-named folders", () => {
    const file = new File(["bytes"], "Notes.pdf", { lastModified: 1000 });
    const itemA = fileToLocalItem(file, "Notes.pdf", "folderA");
    const itemB = fileToLocalItem(file, "Notes.pdf", "folderB");

    expect(itemA?.id).toBe(LOCAL_ID_PREFIX + "folderA/Notes.pdf");
    expect(itemB?.id).toBe(LOCAL_ID_PREFIX + "folderB/Notes.pdf");
    expect(itemA?.id).not.toBe(itemB?.id);
  });
});

describe("isLocalId", () => {
  it("returns true for a local-prefixed id", () => {
    expect(isLocalId("local:book.pdf")).toBe(true);
  });

  it("returns false for a plain firestore-style id", () => {
    expect(isLocalId("abc123XYZ")).toBe(false);
  });
});

// Module state is shared across these tests, so the "no source bound" assertions
// run BEFORE createLocalSource binds a source.
describe("local source — before binding", () => {
  it("hasLocalSource() is false", () => {
    expect(hasLocalSource()).toBe(false);
  });

  it("listLocal() returns [] with no source", async () => {
    expect(await listLocal()).toEqual([]);
  });

  it("getLocalItem() returns null with no source", async () => {
    expect(await getLocalItem("local:anything.pdf")).toBeNull();
  });

  it("resolveLocalBlob() throws with no source bound", async () => {
    const item = { id: "local:x.pdf" } as unknown as MediaItem;
    // Callers guard with isLocalId before reaching here, so an unbound source
    // is a misconfiguration — surface it as a clear error, not a silent null.
    await expect(resolveLocalBlob(item)).rejects.toThrow(/No local source bound/);
  });
});

describe("local source — after binding", () => {
  it("lists, round-trips metadata, and resolves bytes for a bound folder", async () => {
    const content = "pdf-bytes-here";
    const pdf = new File([content], "book.pdf", { lastModified: 1000 });
    const epub = new File(["epub-bytes"], "novel.epub", { lastModified: 2000 });
    const dir = makeFakeDirectory("library", [
      { kind: "file", name: "book.pdf", file: pdf },
      { kind: "file", name: "novel.epub", file: epub },
      { kind: "file", name: "skip.txt", file: new File(["t"], "skip.txt", { lastModified: 500 }) },
      { kind: "directory", name: "subfolder" },
    ]);

    createLocalSource(dir);
    expect(hasLocalSource()).toBe(true);

    const items = await listLocal();
    expect(items).toHaveLength(2);
    // newest-first by addedAt: epub (2000) before pdf (1000)
    expect(items[0].id).toBe(LOCAL_ID_PREFIX + "library/novel.epub");
    expect(items[1].id).toBe(LOCAL_ID_PREFIX + "library/book.pdf");
    expect(items.every((i) => i.origin === "local")).toBe(true);

    const fetched = await getLocalItem(LOCAL_ID_PREFIX + "library/book.pdf");
    expect(fetched?.id).toBe(LOCAL_ID_PREFIX + "library/book.pdf");
    expect(fetched?.mediaType).toBe("pdf");

    const pdfItem = items.find((i) => i.id === LOCAL_ID_PREFIX + "library/book.pdf")!;
    const buf = await resolveLocalBlob(pdfItem);
    expect(buf).not.toBeNull();
    expect(new TextDecoder().decode(buf!)).toBe(content);
  });
});
