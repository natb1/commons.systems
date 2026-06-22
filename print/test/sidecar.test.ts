import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock errorutil/log so logError calls don't throw or produce noise
vi.mock("@commons-systems/errorutil/log", () => ({
  logError: vi.fn(),
}));

import {
  parseSidecar,
  serializeSidecar,
  mergeSidecar,
  readSidecar,
  writeSidecar,
  setLocalDirectory,
  getMetadata,
  cacheMetadata,
  flushWrites,
  makeSidecarPositionStore,
} from "../src/sidecar.js";
import type { SidecarData } from "../src/sidecar.js";

// ---------------------------------------------------------------------------
// Fake FileSystem directory/file infrastructure
// ---------------------------------------------------------------------------

/** In-memory writable buffer used by fake file handles. */
function makeFakeWritable(buffer: { value: string | null }, abortSpy: ReturnType<typeof vi.fn>, writeShouldFail = false, closeShouldFail = false) {
  return {
    write: writeShouldFail
      ? vi.fn().mockRejectedValue(new Error("write failed"))
      : vi.fn().mockImplementation((data: string) => {
          buffer.value = data;
          return Promise.resolve();
        }),
    close: closeShouldFail
      ? vi.fn().mockRejectedValue(new Error("close failed"))
      : vi.fn().mockResolvedValue(undefined),
    abort: abortSpy,
  };
}

interface FakeFileState {
  content: string | null;
}

function makeFakeFileHandle(state: FakeFileState, opts?: { writeShouldFail?: boolean; closeShouldFail?: boolean }) {
  const abortSpy = vi.fn().mockResolvedValue(undefined);
  const createWritable = vi.fn().mockImplementation(() => {
    const buf = { value: state.content };
    const w = makeFakeWritable(buf, abortSpy, opts?.writeShouldFail, opts?.closeShouldFail);
    // When close succeeds, commit to state
    const origClose = w.close;
    w.close = vi.fn().mockImplementation(async () => {
      await origClose();
      state.content = buf.value;
    });
    return Promise.resolve(w);
  });
  return {
    getFile: vi.fn().mockImplementation(() => {
      if (state.content === null) {
        return Promise.reject(new DOMException("File not found", "NotFoundError"));
      }
      return Promise.resolve({ text: () => Promise.resolve(state.content as string) });
    }),
    createWritable,
    _abortSpy: abortSpy,
    _state: state,
  };
}

type FakeDirFiles = Record<string, ReturnType<typeof makeFakeFileHandle>>;

function makeFakeSubdir(files: FakeDirFiles, missingIsNotFound = false) {
  return {
    getFileHandle: vi.fn().mockImplementation((name: string, opts?: { create?: boolean }) => {
      if (files[name]) return Promise.resolve(files[name]);
      if (!opts?.create) {
        return Promise.reject(new DOMException(`File not found: ${name}`, "NotFoundError"));
      }
      // Create a new empty file state
      const state: FakeFileState = { content: null };
      const handle = makeFakeFileHandle(state);
      files[name] = handle;
      return Promise.resolve(handle);
    }),
    _files: files,
  };
}

type FakeSubdirs = Record<string, ReturnType<typeof makeFakeSubdir>>;

function makeFakeDir(subdirs: FakeSubdirs): FileSystemDirectoryHandle {
  return {
    getDirectoryHandle: vi.fn().mockImplementation((name: string, opts?: { create?: boolean }) => {
      if (subdirs[name]) return Promise.resolve(subdirs[name]);
      if (!opts?.create) {
        return Promise.reject(new DOMException(`Directory not found: ${name}`, "NotFoundError"));
      }
      const newSubdir = makeFakeSubdir({});
      subdirs[name] = newSubdir;
      return Promise.resolve(newSubdir);
    }),
    _subdirs: subdirs,
  } as unknown as FileSystemDirectoryHandle;
}

/** Build a fake directory that already has a `.commons-print/index.json` with given content. */
function makePreloadedDir(content: string): {
  dir: FileSystemDirectoryHandle;
  fileHandle: ReturnType<typeof makeFakeFileHandle>;
} {
  const state: FakeFileState = { content };
  const fileHandle = makeFakeFileHandle(state);
  const subdir = makeFakeSubdir({ "index.json": fileHandle });
  const dir = makeFakeDir({ ".commons-print": subdir });
  return { dir, fileHandle };
}

/** Build a fake directory with `.commons-print` dir but NO `index.json`. */
function makeDirWithMissingFile(): FileSystemDirectoryHandle {
  const subdir = makeFakeSubdir({}, true);
  return makeFakeDir({ ".commons-print": subdir });
}

/** Build a fake directory with NO `.commons-print` dir. */
function makeEmptyDir(): FileSystemDirectoryHandle {
  return makeFakeDir({});
}

// ---------------------------------------------------------------------------
// A. parseSidecar — pure, never throws
// ---------------------------------------------------------------------------

describe("parseSidecar", () => {
  it("parses a valid sidecar JSON into the model", () => {
    const data: SidecarData = {
      version: 1,
      metadata: { "book.pdf": { title: "My Book", pageCount: 42 } },
      positions: { "book.pdf": "7" },
    };
    const result = parseSidecar(JSON.stringify(data));
    expect(result).toEqual(data);
  });

  it("returns null for missing/empty string", () => {
    expect(parseSidecar("")).toBeNull();
  });

  it("returns null for corrupt JSON", () => {
    expect(parseSidecar("{not json")).toBeNull();
  });

  it("returns null for non-object top-level: number", () => {
    expect(parseSidecar("42")).toBeNull();
  });

  it("returns null for non-object top-level: null", () => {
    expect(parseSidecar("null")).toBeNull();
  });

  it("returns null for non-object top-level: string", () => {
    expect(parseSidecar('"a string"')).toBeNull();
  });

  it("returns null for non-object top-level: array", () => {
    expect(parseSidecar("[1,2,3]")).toBeNull();
  });

  it("coerces missing metadata to {} while preserving valid positions", () => {
    const json = JSON.stringify({ version: 1, positions: { "book.pdf": "3" } });
    const result = parseSidecar(json);
    expect(result.metadata).toEqual({});
    expect(result.positions).toEqual({ "book.pdf": "3" });
  });

  it("coerces missing positions to {} while preserving valid metadata", () => {
    const json = JSON.stringify({ version: 1, metadata: { "book.pdf": { title: "X" } } });
    const result = parseSidecar(json);
    expect(result.metadata).toEqual({ "book.pdf": { title: "X" } });
    expect(result.positions).toEqual({});
  });

  it("coerces wrong-typed metadata (array) to {} but preserves positions", () => {
    const json = JSON.stringify({ version: 1, metadata: [1, 2], positions: { "a.pdf": "1" } });
    const result = parseSidecar(json);
    expect(result.metadata).toEqual({});
    expect(result.positions).toEqual({ "a.pdf": "1" });
  });

  it("coerces wrong-typed positions (string) to {} but preserves metadata", () => {
    const json = JSON.stringify({ version: 1, metadata: { "a.pdf": { pageCount: 5 } }, positions: "bad" });
    const result = parseSidecar(json);
    expect(result.positions).toEqual({});
    expect(result.metadata).toEqual({ "a.pdf": { pageCount: 5 } });
  });

  it("forces version to 1 regardless of input", () => {
    const json = JSON.stringify({ version: 99, metadata: {}, positions: {} });
    expect(parseSidecar(json).version).toBe(1);
  });

  it("never throws for any input", () => {
    const inputs = ["", "{", "null", "42", '"str"', "[1]", "undefined", "\x00"];
    for (const input of inputs) {
      expect(() => parseSidecar(input)).not.toThrow();
    }
  });
});

// ---------------------------------------------------------------------------
// B. mergeSidecar — no-clobber guarantee
// ---------------------------------------------------------------------------

describe("mergeSidecar", () => {
  it("patch positions win per-key while untouched keys are preserved", () => {
    const existing: SidecarData = {
      version: 1,
      metadata: { "book.pdf": { title: "Book" }, "novel.epub": { title: "Novel" } },
      positions: { "book.pdf": "3", "novel.epub": "5" },
    };
    const result = mergeSidecar(existing, { positions: { "book.pdf": "7" } });

    // Updated key wins
    expect(result.positions["book.pdf"]).toBe("7");
    // Untouched sibling position is not dropped
    expect(result.positions["novel.epub"]).toBe("5");
    // Metadata is fully preserved
    expect(result.metadata).toEqual(existing.metadata);
    // Version preserved
    expect(result.version).toBe(1);
  });

  it("patch metadata wins per-key while untouched positions are preserved", () => {
    const existing: SidecarData = {
      version: 1,
      metadata: { "book.pdf": { title: "Old Title" } },
      positions: { "book.pdf": "2", "other.pdf": "9" },
    };
    const result = mergeSidecar(existing, { metadata: { "book.pdf": { title: "New Title", pageCount: 10 } } });

    expect(result.metadata["book.pdf"]).toEqual({ title: "New Title", pageCount: 10 });
    // All positions preserved
    expect(result.positions).toEqual(existing.positions);
  });

  it("applies both metadata and positions patch simultaneously", () => {
    const existing: SidecarData = {
      version: 1,
      metadata: { "a.pdf": { title: "A" } },
      positions: { "a.pdf": "1" },
    };
    const result = mergeSidecar(existing, {
      metadata: { "b.pdf": { title: "B" } },
      positions: { "b.pdf": "8" },
    });

    expect(result.metadata["a.pdf"]).toEqual({ title: "A" });
    expect(result.metadata["b.pdf"]).toEqual({ title: "B" });
    expect(result.positions["a.pdf"]).toBe("1");
    expect(result.positions["b.pdf"]).toBe("8");
  });

  it("returns a new object (does not mutate existing)", () => {
    const existing: SidecarData = {
      version: 1,
      metadata: {},
      positions: { "x.pdf": "1" },
    };
    const result = mergeSidecar(existing, { positions: { "x.pdf": "2" } });

    expect(existing.positions["x.pdf"]).toBe("1");
    expect(result.positions["x.pdf"]).toBe("2");
  });
});

// ---------------------------------------------------------------------------
// C. serializeSidecar + parseSidecar round-trip
// ---------------------------------------------------------------------------

describe("serializeSidecar + parseSidecar round-trip", () => {
  it("round-trips a complete model", () => {
    const data: SidecarData = {
      version: 1,
      metadata: {
        "book.pdf": { title: "My Book", pageCount: 100 },
        "novel.epub": { title: "Novel" },
      },
      positions: { "book.pdf": "42", "novel.epub": "cfi(/6/2)" },
    };
    const serialized = serializeSidecar(data);
    expect(parseSidecar(serialized)).toEqual(data);
  });

  it("round-trips an empty model", () => {
    const empty: SidecarData = { version: 1, metadata: {}, positions: {} };
    expect(parseSidecar(serializeSidecar(empty))).toEqual(empty);
  });

  it("serializes to valid JSON (parseable by JSON.parse)", () => {
    const data: SidecarData = { version: 1, metadata: { "a.pdf": { pageCount: 5 } }, positions: {} };
    expect(() => JSON.parse(serializeSidecar(data))).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// D. readSidecar / writeSidecar over fake FileSystemDirectoryHandle
// ---------------------------------------------------------------------------

describe("readSidecar", () => {
  it("reads and parses a present sidecar file", async () => {
    const data: SidecarData = {
      version: 1,
      metadata: { "book.pdf": { title: "Found", pageCount: 10 } },
      positions: { "book.pdf": "3" },
    };
    const { dir } = makePreloadedDir(serializeSidecar(data));

    const result = await readSidecar(dir);
    expect(result).toEqual(data);
  });

  it("returns empty model when the .commons-print directory is absent (NotFoundError)", async () => {
    const dir = makeEmptyDir();
    const result = await readSidecar(dir);
    expect(result).toEqual({ version: 1, metadata: {}, positions: {} });
  });

  it("returns empty model when index.json is absent (NotFoundError)", async () => {
    const dir = makeDirWithMissingFile();
    const result = await readSidecar(dir);
    expect(result).toEqual({ version: 1, metadata: {}, positions: {} });
  });

  it("returns null when content is corrupt JSON", async () => {
    const { dir } = makePreloadedDir("{not json");
    await expect(readSidecar(dir)).resolves.toBeNull();
  });
});

describe("writeSidecar", () => {
  it("write-then-read round-trip", async () => {
    const dir = makeEmptyDir();
    const data: SidecarData = {
      version: 1,
      metadata: { "book.pdf": { title: "Written" } },
      positions: { "book.pdf": "5" },
    };

    await writeSidecar(dir, data);
    const readBack = await readSidecar(dir);
    expect(readBack).toEqual(data);
  });

  it("calls abort() and rethrows when write() rejects", async () => {
    const state: FakeFileState = { content: null };
    const abortSpy = vi.fn().mockResolvedValue(undefined);
    const fileHandle = {
      getFile: vi.fn(),
      createWritable: vi.fn().mockResolvedValue({
        write: vi.fn().mockRejectedValue(new Error("disk full")),
        close: vi.fn().mockResolvedValue(undefined),
        abort: abortSpy,
      }),
      _abortSpy: abortSpy,
      _state: state,
    };
    const subdir = makeFakeSubdir({ "index.json": fileHandle as any });
    const dir = makeFakeDir({ ".commons-print": subdir });

    await expect(writeSidecar(dir, { version: 1, metadata: {}, positions: {} })).rejects.toThrow("disk full");
    expect(abortSpy).toHaveBeenCalled();
  });

  it("calls abort() and rethrows when close() rejects", async () => {
    const abortSpy = vi.fn().mockResolvedValue(undefined);
    const fileHandle = {
      getFile: vi.fn(),
      createWritable: vi.fn().mockResolvedValue({
        write: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockRejectedValue(new Error("close error")),
        abort: abortSpy,
      }),
      _abortSpy: abortSpy,
    };
    const subdir = makeFakeSubdir({ "index.json": fileHandle as any });
    const dir = makeFakeDir({ ".commons-print": subdir });

    await expect(writeSidecar(dir, { version: 1, metadata: {}, positions: {} })).rejects.toThrow("close error");
    expect(abortSpy).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// E. Stateful module: setLocalDirectory + writable gating + makeSidecarPositionStore
// ---------------------------------------------------------------------------

describe("makeSidecarPositionStore — writable=true", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("save persists to the fake dir; load returns the saved position", async () => {
    const dir = makeEmptyDir();
    setLocalDirectory(dir, true);

    const store = makeSidecarPositionStore("book.pdf");
    await store.save("12");
    await flushWrites();

    // Confirm the file was written
    const readBack = await readSidecar(dir);
    expect(readBack.positions["book.pdf"]).toBe("12");

    // load() reflects in-memory model
    expect(await store.load()).toBe("12");
  });

  it("key is the bare filename, not a local: id", async () => {
    const dir = makeEmptyDir();
    setLocalDirectory(dir, true);

    const store = makeSidecarPositionStore("book.pdf");
    await store.save("7");
    await flushWrites();

    const readBack = await readSidecar(dir);
    // Keyed on bare filename
    expect(readBack.positions["book.pdf"]).toBe("7");
    // The local:<folderId>/book.pdf key does NOT appear
    expect(Object.keys(readBack.positions).some((k) => k.startsWith("local:"))).toBe(false);
  });

  it("load() returns null when no position has been saved", async () => {
    const dir = makeEmptyDir();
    setLocalDirectory(dir, true);

    const store = makeSidecarPositionStore("novel.epub");
    expect(await store.load()).toBeNull();
  });
});

describe("makeSidecarPositionStore — writable=false (no-write gating)", () => {
  it("save does NOT call createWritable on the fake dir (no disk write)", async () => {
    const dir = makeEmptyDir();
    setLocalDirectory(dir, false);

    const store = makeSidecarPositionStore("book.pdf");
    await store.save("9");
    await flushWrites();

    // Introspect: because writeSidecar is never called, the .commons-print dir
    // was never created, so getDirectoryHandle was only called (with no {create:true})
    // by readSidecar. Check no writable was opened.
    const anySubdir = (dir as any)._subdirs;
    const commonsDir = anySubdir[".commons-print"];
    // No .commons-print subdir was created at all (neither read nor write needed)
    expect(commonsDir).toBeUndefined();
  });

  it("load() still reflects the in-memory position after a non-writing save", async () => {
    const dir = makeEmptyDir();
    setLocalDirectory(dir, false);

    const store = makeSidecarPositionStore("book.pdf");
    await store.save("3");
    await flushWrites();

    // In-memory model is updated
    expect(await store.load()).toBe("3");
  });
});

describe("cacheMetadata — writable gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writable=true: caches and persists metadata to the fake dir", async () => {
    const dir = makeEmptyDir();
    setLocalDirectory(dir, true);

    await cacheMetadata("book.pdf", { title: "The Book", pageCount: 300 });
    await flushWrites();

    const result = await getMetadata("book.pdf");
    expect(result).toEqual({ title: "The Book", pageCount: 300 });

    // Also verify it was written to disk
    const readBack = await readSidecar(dir);
    expect(readBack.metadata["book.pdf"]).toEqual({ title: "The Book", pageCount: 300 });
  });

  it("writable=false: caches in-memory but does NOT write to disk", async () => {
    const dir = makeEmptyDir();
    setLocalDirectory(dir, false);

    await cacheMetadata("novel.epub", { title: "Novel" });
    await flushWrites();

    // In-memory is accessible
    expect(await getMetadata("novel.epub")).toEqual({ title: "Novel" });

    // .commons-print dir was never created on write
    const anySubdir = (dir as any)._subdirs;
    expect(anySubdir[".commons-print"]).toBeUndefined();
  });
});

describe("sidecar — multiple writes are serialized (no-clobber chain)", () => {
  it("two concurrent cacheMetadata calls both persist without clobbering", async () => {
    const dir = makeEmptyDir();
    setLocalDirectory(dir, true);

    // Fire both without awaiting in between (tests the write chain serialization)
    void cacheMetadata("a.pdf", { title: "A", pageCount: 1 });
    void cacheMetadata("b.pdf", { title: "B", pageCount: 2 });
    await flushWrites();

    const readBack = await readSidecar(dir);
    expect(readBack.metadata["a.pdf"]).toEqual({ title: "A", pageCount: 1 });
    expect(readBack.metadata["b.pdf"]).toEqual({ title: "B", pageCount: 2 });
  });

  it("position save does not drop existing metadata (no-clobber across units)", async () => {
    const dir = makeEmptyDir();
    setLocalDirectory(dir, true);

    await cacheMetadata("book.pdf", { title: "My Book", pageCount: 50 });
    await flushWrites();

    const store = makeSidecarPositionStore("book.pdf");
    await store.save("25");
    await flushWrites();

    const readBack = await readSidecar(dir);
    expect(readBack.metadata["book.pdf"]).toEqual({ title: "My Book", pageCount: 50 });
    expect(readBack.positions["book.pdf"]).toBe("25");
  });
});

describe("sidecar — loads from pre-existing file", () => {
  it("ensureLoaded reads the existing sidecar from disk on first access", async () => {
    const existingData: SidecarData = {
      version: 1,
      metadata: { "existing.pdf": { title: "Existing", pageCount: 20 } },
      positions: { "existing.pdf": "10" },
    };
    const { dir } = makePreloadedDir(serializeSidecar(existingData));
    setLocalDirectory(dir, true);

    const meta = await getMetadata("existing.pdf");
    expect(meta).toEqual({ title: "Existing", pageCount: 20 });

    const store = makeSidecarPositionStore("existing.pdf");
    expect(await store.load()).toBe("10");
  });
});
