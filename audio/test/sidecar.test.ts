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
  clearLocalDirectory,
  getMetadata,
  cacheMetadata,
  cacheMetadataBatch,
  flushWrites,
  getPlayerState,
  savePlayerState,
  getPlaylists,
  savePlaylist,
} from "../src/sidecar.js";
import type { SidecarData } from "../src/sidecar.js";

// ---------------------------------------------------------------------------
// Fake FileSystem directory/file infrastructure (mirrored from print's tests,
// renamed .commons-print → .commons-audio)
// ---------------------------------------------------------------------------

/** In-memory writable buffer used by fake file handles. */
function makeFakeWritable(
  buffer: { value: string | null },
  abortSpy: ReturnType<typeof vi.fn>,
  writeShouldFail = false,
  closeShouldFail = false,
) {
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

function makeFakeFileHandle(
  state: FakeFileState,
  opts?: { writeShouldFail?: boolean; closeShouldFail?: boolean },
) {
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
      return Promise.resolve({ text: () => Promise.resolve(state.content as string) }); // type-safety-ok: in-memory FSA fake content is a string in test
    }),
    createWritable,
    _abortSpy: abortSpy,
    _state: state,
  };
}

type FakeDirFiles = Record<string, ReturnType<typeof makeFakeFileHandle>>;

function makeFakeSubdir(files: FakeDirFiles, missingIsNotFound = false) {
  void missingIsNotFound; // param kept for compat but unused
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
  } as unknown as FileSystemDirectoryHandle; // type-safety-ok: in-memory FSA directory-handle fake for test
}

/** Build a fake directory that already has a `.commons-audio/index.json` with given content. */
function makePreloadedDir(content: string): {
  dir: FileSystemDirectoryHandle;
  fileHandle: ReturnType<typeof makeFakeFileHandle>;
} {
  const state: FakeFileState = { content };
  const fileHandle = makeFakeFileHandle(state);
  const subdir = makeFakeSubdir({ "index.json": fileHandle });
  const dir = makeFakeDir({ ".commons-audio": subdir });
  return { dir, fileHandle };
}

/**
 * Build a preloaded dir whose FIRST getDirectoryHandle(".commons-audio") call
 * parks until release() is called, gating the read at the first FSA round-trip
 * — the exact window the mid-read folder-switch TOCTOU exploits. Later calls
 * delegate to the real preloaded behavior.
 */
function makeGatedPreloadedDir(content: string): {
  dir: FileSystemDirectoryHandle;
  release: () => void;
} {
  const { dir } = makePreloadedDir(content);
  const realGetDirectoryHandle = dir.getDirectoryHandle.bind(dir);
  let released: (() => void) | null = null;
  let gated = false;
  (dir as unknown as { getDirectoryHandle: unknown }).getDirectoryHandle = vi // type-safety-ok: test fake overrides getDirectoryHandle to gate the first FSA round-trip
    .fn()
    .mockImplementation((name: string, opts?: { create?: boolean }) => {
      if (!gated) {
        gated = true;
        return new Promise((res) => {
          released = () => res(realGetDirectoryHandle(name, opts));
        });
      }
      return realGetDirectoryHandle(name, opts);
    });
  return {
    dir,
    release: () => {
      if (released === null)
        throw new Error("release() called before the gated read was reached");
      released();
    },
  };
}

/** Build a fake directory with `.commons-audio` dir but NO `index.json`. */
function makeDirWithMissingFile(): FileSystemDirectoryHandle {
  const subdir = makeFakeSubdir({}, true);
  return makeFakeDir({ ".commons-audio": subdir });
}

/** Build a fake directory with NO `.commons-audio` dir. */
function makeEmptyDir(): FileSystemDirectoryHandle {
  return makeFakeDir({});
}

// ---------------------------------------------------------------------------
// A. parseSidecar — pure, never throws
// ---------------------------------------------------------------------------

describe("parseSidecar", () => {
  it("parses a valid sidecar JSON into the model", () => {
    const data: SidecarData = {
      version: 2,
      metadata: {
        "song.mp3": { tags: { title: "My Song", duration: 200 }, size: 1024, lastModified: 111 },
      },
      playlists: { Favs: ["song.mp3"] },
    };
    const result = parseSidecar(JSON.stringify(data));
    expect(result).toEqual(data);
  });

  it("returns null for empty string", () => {
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

  it("forces version to 2 regardless of input", () => {
    const json = JSON.stringify({ version: 99, metadata: {}, playlists: {} });
    const result = parseSidecar(json);
    if (!result) throw new Error("expected non-null for valid input");
    expect(result.version).toBe(2);
  });

  it("coerces missing metadata to {} while preserving valid playerState", () => {
    const json = JSON.stringify({
      version: 2,
      playerState: { queue: ["a.mp3"], currentLocalName: "a.mp3", positionSeconds: 10 },
    });
    const result = parseSidecar(json);
    if (!result) throw new Error("expected non-null for valid input");
    expect(result.metadata).toEqual({});
    expect(result.playerState?.queue).toEqual(["a.mp3"]);
  });

  it("coerces wrong-typed metadata (array) to {} but preserves playerState", () => {
    const json = JSON.stringify({
      version: 2,
      metadata: [1, 2],
      playerState: { queue: ["b.mp3"] },
    });
    const result = parseSidecar(json);
    if (!result) throw new Error("expected non-null for valid input");
    expect(result.metadata).toEqual({});
    expect(result.playerState?.queue).toEqual(["b.mp3"]);
  });

  it("drops wrong-typed duration but keeps string title in a wrapper entry's tags", () => {
    const json = JSON.stringify({
      version: 2,
      metadata: { "song.mp3": { tags: { title: "Keep", duration: "bad" }, size: 10, lastModified: 5 } },
      playlists: {},
    });
    const result = parseSidecar(json);
    if (!result) throw new Error("expected non-null for valid input");
    expect(result.metadata["song.mp3"]?.tags.title).toBe("Keep");
    expect("duration" in (result.metadata["song.mp3"]?.tags ?? {})).toBe(false);
  });

  describe("v1→v2 migration + fingerprint coercion", () => {
    it("drops legacy v1 bare-AudioTags metadata entries (cache miss) while keeping playerState + playlists", () => {
      const json = JSON.stringify({
        version: 1,
        // Legacy shape: bare AudioTags, no tags/size/lastModified wrapper.
        metadata: { "old.mp3": { title: "Legacy", duration: 200 } },
        playerState: { queue: ["old.mp3"], currentLocalName: "old.mp3", positionSeconds: 7 },
        playlists: { Favs: ["old.mp3"] },
      });
      const result = parseSidecar(json);
      if (!result) throw new Error("expected non-null for valid input");
      expect(result.version).toBe(2);
      // The legacy metadata entry is dropped → a cache miss → re-extraction later.
      expect(result.metadata).toEqual({});
      // Sibling state survives the migration untouched.
      expect(result.playerState?.queue).toEqual(["old.mp3"]);
      expect(result.playlists?.["Favs"]).toEqual(["old.mp3"]);
    });

    it("drops an entry with a non-numeric or missing size/lastModified, keeps a well-formed wrapper", () => {
      const json = JSON.stringify({
        version: 2,
        metadata: {
          "bad-size.mp3": { tags: { title: "A" }, size: "nope", lastModified: 5 },
          "missing-lm.mp3": { tags: { title: "B" }, size: 10 },
          "no-tags.mp3": { size: 10, lastModified: 5 },
          "good.mp3": { tags: { title: "Good", duration: "bad" }, size: 20, lastModified: 9 },
        },
        playlists: {},
      });
      const result = parseSidecar(json);
      if (!result) throw new Error("expected non-null for valid input");
      expect("bad-size.mp3" in result.metadata).toBe(false);
      expect("missing-lm.mp3" in result.metadata).toBe(false);
      expect("no-tags.mp3" in result.metadata).toBe(false);
      // Well-formed wrapper kept; inner tags still coerced per-leaf (bad duration dropped).
      expect(result.metadata["good.mp3"]).toEqual({
        tags: { title: "Good" },
        size: 20,
        lastModified: 9,
      });
    });
  });

  describe("playlists coercion", () => {
    it("filters non-array playlist values", () => {
      const json = JSON.stringify({
        version: 1,
        metadata: {},
        playlists: { Good: ["a.mp3", "b.mp3"], Bad: "not-an-array" },
      });
      const result = parseSidecar(json);
      if (!result) throw new Error("expected non-null for valid input");
      expect(result.playlists?.["Good"]).toEqual(["a.mp3", "b.mp3"]);
      expect("Bad" in (result.playlists ?? {})).toBe(false);
    });

    it("filters non-string elements from playlist arrays", () => {
      const json = JSON.stringify({
        version: 1,
        metadata: {},
        playlists: { Mix: ["a.mp3", 42, null, "b.mp3"] },
      });
      const result = parseSidecar(json);
      if (!result) throw new Error("expected non-null for valid input");
      expect(result.playlists?.["Mix"]).toEqual(["a.mp3", "b.mp3"]);
    });
  });

  describe("playerState coercion", () => {
    it("non-array queue defaults to []", () => {
      const json = JSON.stringify({ version: 1, metadata: {}, playerState: { queue: "bad" } });
      const result = parseSidecar(json);
      if (!result) throw new Error("expected non-null for valid input");
      expect(result.playerState?.queue).toEqual([]);
    });

    it("drops wrong-typed currentLocalName", () => {
      const json = JSON.stringify({
        version: 1,
        metadata: {},
        playerState: { queue: [], currentLocalName: 42 },
      });
      const result = parseSidecar(json);
      if (!result) throw new Error("expected non-null for valid input");
      expect("currentLocalName" in (result.playerState ?? {})).toBe(false);
    });

    it("drops wrong-typed positionSeconds", () => {
      const json = JSON.stringify({
        version: 1,
        metadata: {},
        playerState: { queue: [], positionSeconds: "bad" },
      });
      const result = parseSidecar(json);
      if (!result) throw new Error("expected non-null for valid input");
      expect("positionSeconds" in (result.playerState ?? {})).toBe(false);
    });

    it("a plain-object playerState always yields at least { queue: [] }", () => {
      const json = JSON.stringify({ version: 1, metadata: {}, playerState: {} });
      const result = parseSidecar(json);
      if (!result) throw new Error("expected non-null for valid input");
      expect(result.playerState).toEqual({ queue: [] });
    });

    it("a non-object playerState yields undefined", () => {
      const json = JSON.stringify({ version: 1, metadata: {}, playerState: "invalid" });
      const result = parseSidecar(json);
      if (!result) throw new Error("expected non-null for valid input");
      expect(result.playerState).toBeUndefined();
    });

    it("malformed playerState does not discard good metadata (independence, vice-versa)", () => {
      const json = JSON.stringify({
        version: 2,
        metadata: { "song.mp3": { tags: { title: "Keep" }, size: 10, lastModified: 1 } },
        playerState: 42,
      });
      const result = parseSidecar(json);
      if (!result) throw new Error("expected non-null for valid input");
      expect(result.metadata["song.mp3"]?.tags.title).toBe("Keep");
      expect(result.playerState).toBeUndefined();
    });
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
  it("metadata patch wins per-key while untouched siblings + playerState + playlists are preserved", () => {
    const existing: SidecarData = {
      version: 2,
      metadata: {
        "song.mp3": { tags: { title: "Old" }, size: 10, lastModified: 1 },
        "other.mp3": { tags: { title: "Other" }, size: 20, lastModified: 2 },
      },
      playerState: { queue: ["song.mp3"], currentLocalName: "song.mp3", positionSeconds: 30 },
      playlists: { Favs: ["song.mp3"] },
    };
    const result = mergeSidecar(existing, {
      metadata: { "song.mp3": { tags: { title: "New" }, size: 11, lastModified: 3 } },
    });

    expect(result.metadata["song.mp3"]?.tags.title).toBe("New");
    expect(result.metadata["song.mp3"]?.size).toBe(11);
    // Sibling preserved
    expect(result.metadata["other.mp3"]?.tags.title).toBe("Other");
    // playerState preserved
    expect(result.playerState).toEqual(existing.playerState);
    // Playlists preserved
    expect(result.playlists).toEqual(existing.playlists);
    expect(result.version).toBe(2);
  });

  it("playerState partial patch keeps existing queue + currentLocalName", () => {
    const existing: SidecarData = {
      version: 2,
      metadata: { "a.mp3": { tags: { title: "A" }, size: 10, lastModified: 1 } },
      playerState: { queue: ["a.mp3"], currentLocalName: "a.mp3", positionSeconds: 10 },
      playlists: {},
    };
    const result = mergeSidecar(existing, { playerState: { positionSeconds: 99 } });

    expect(result.playerState?.queue).toEqual(["a.mp3"]);
    expect(result.playerState?.currentLocalName).toBe("a.mp3");
    expect(result.playerState?.positionSeconds).toBe(99);
    // Metadata preserved
    expect(result.metadata["a.mp3"]?.tags.title).toBe("A");
  });

  it("playlist patch preserves metadata + playerState", () => {
    const existing: SidecarData = {
      version: 2,
      metadata: { "b.mp3": { tags: { title: "B" }, size: 10, lastModified: 1 } },
      playerState: { queue: ["b.mp3"] },
      playlists: { Old: ["b.mp3"] },
    };
    const result = mergeSidecar(existing, { playlists: { New: ["b.mp3"] } });

    expect(result.playlists?.["Old"]).toEqual(["b.mp3"]);
    expect(result.playlists?.["New"]).toEqual(["b.mp3"]);
    expect(result.metadata).toEqual(existing.metadata);
    expect(result.playerState).toEqual(existing.playerState);
  });

  it("returns a new object (does not mutate existing)", () => {
    const existing: SidecarData = {
      version: 2,
      metadata: {},
      playlists: { Favs: ["x.mp3"] },
    };
    const result = mergeSidecar(existing, { playlists: { Favs: ["x.mp3", "y.mp3"] } });

    expect(existing.playlists?.["Favs"]).toEqual(["x.mp3"]);
    expect(result.playlists?.["Favs"]).toEqual(["x.mp3", "y.mp3"]);
  });
});

// ---------------------------------------------------------------------------
// C. serializeSidecar + parseSidecar round-trip
// ---------------------------------------------------------------------------

describe("serializeSidecar + parseSidecar round-trip", () => {
  it("round-trips a complete model (metadata + playerState + playlists)", () => {
    const data: SidecarData = {
      version: 2,
      metadata: {
        "song.mp3": {
          tags: { title: "Song", artist: "Artist", duration: 180 },
          size: 1000,
          lastModified: 111,
        },
        "tune.flac": { tags: { title: "Tune", year: 2020 }, size: 2000, lastModified: 222 },
      },
      playerState: {
        queue: ["song.mp3", "tune.flac"],
        currentLocalName: "song.mp3",
        positionSeconds: 42,
      },
      playlists: { Favs: ["song.mp3"], All: ["song.mp3", "tune.flac"] },
    };
    const serialized = serializeSidecar(data);
    expect(parseSidecar(serialized)).toEqual(data);
  });

  it("round-trips an empty model", () => {
    const empty: SidecarData = { version: 2, metadata: {}, playlists: {} };
    expect(parseSidecar(serializeSidecar(empty))).toEqual(empty);
  });

  it("serializes to valid JSON (parseable by JSON.parse)", () => {
    const data: SidecarData = {
      version: 2,
      metadata: { "a.mp3": { tags: { duration: 5 }, size: 10, lastModified: 1 } },
      playlists: {},
    };
    expect(() => JSON.parse(serializeSidecar(data))).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// D. readSidecar / writeSidecar over fake FileSystemDirectoryHandle
// ---------------------------------------------------------------------------

describe("readSidecar", () => {
  it("reads and parses a present sidecar file", async () => {
    const data: SidecarData = {
      version: 2,
      metadata: { "song.mp3": { tags: { title: "Found", duration: 100 }, size: 50, lastModified: 7 } },
      playlists: { Favs: ["song.mp3"] },
    };
    const { dir } = makePreloadedDir(serializeSidecar(data));

    const result = await readSidecar(dir);
    expect(result).toEqual(data);
  });

  it("returns empty model when the .commons-audio directory is absent (NotFoundError)", async () => {
    const dir = makeEmptyDir();
    const result = await readSidecar(dir);
    expect(result).toEqual({ version: 2, metadata: {}, playlists: {} });
  });

  it("returns empty model when index.json is absent (NotFoundError)", async () => {
    const dir = makeDirWithMissingFile();
    const result = await readSidecar(dir);
    expect(result).toEqual({ version: 2, metadata: {}, playlists: {} });
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
      version: 2,
      metadata: { "song.mp3": { tags: { title: "Written" }, size: 33, lastModified: 4 } },
      playlists: {},
    };

    await writeSidecar(dir, data);
    const readBack = await readSidecar(dir);
    expect(readBack).toEqual(data);
  });

  it("calls abort() and rethrows when write() rejects", async () => {
    const state: FakeFileState = { content: null };
    const fileHandle = makeFakeFileHandle(state, { writeShouldFail: true });
    const subdir = makeFakeSubdir({ "index.json": fileHandle });
    const dir = makeFakeDir({ ".commons-audio": subdir });

    await expect(
      writeSidecar(dir, { version: 2, metadata: {}, playlists: {} }),
    ).rejects.toThrow("write failed");
    expect(fileHandle._abortSpy).toHaveBeenCalled();
  });

  it("calls abort() and rethrows when close() rejects", async () => {
    const state: FakeFileState = { content: null };
    const fileHandle = makeFakeFileHandle(state, { closeShouldFail: true });
    const subdir = makeFakeSubdir({ "index.json": fileHandle });
    const dir = makeFakeDir({ ".commons-audio": subdir });

    await expect(
      writeSidecar(dir, { version: 2, metadata: {}, playlists: {} }),
    ).rejects.toThrow("close failed");
    expect(fileHandle._abortSpy).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// E. Stateful core: setLocalDirectory + writable gating + accessors
// ---------------------------------------------------------------------------

describe("cacheMetadata / getMetadata — writable=true", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("caches metadata and persists to disk", async () => {
    const dir = makeEmptyDir();
    setLocalDirectory(dir, true);

    await cacheMetadata("song.mp3", {
      tags: { title: "Test Song", duration: 180 },
      size: 1024,
      lastModified: 111,
    });
    await flushWrites();

    expect(await getMetadata("song.mp3")).toEqual({
      tags: { title: "Test Song", duration: 180 },
      size: 1024,
      lastModified: 111,
    });

    const readBack = await readSidecar(dir);
    if (!readBack) throw new Error("expected non-null sidecar");
    expect(readBack.metadata["song.mp3"]).toEqual({
      tags: { title: "Test Song", duration: 180 },
      size: 1024,
      lastModified: 111,
    });
  });

  it("key is the bare filename, no 'local:' prefix on disk", async () => {
    const dir = makeEmptyDir();
    setLocalDirectory(dir, true);

    await cacheMetadata("song.mp3", { tags: { title: "My Song" }, size: 10, lastModified: 1 });
    await flushWrites();

    const readBack = await readSidecar(dir);
    if (!readBack) throw new Error("expected non-null sidecar");
    expect(readBack.metadata["song.mp3"]).toEqual({
      tags: { title: "My Song" },
      size: 10,
      lastModified: 1,
    });
    expect(Object.keys(readBack.metadata).some((k) => k.startsWith("local:"))).toBe(false);
  });

  it("single-flight chain: two un-awaited cacheMetadata calls both persist", async () => {
    const dir = makeEmptyDir();
    setLocalDirectory(dir, true);

    void cacheMetadata("a.mp3", { tags: { title: "A", duration: 100 }, size: 1, lastModified: 1 });
    void cacheMetadata("b.mp3", { tags: { title: "B", duration: 200 }, size: 2, lastModified: 2 });
    await flushWrites();

    const readBack = await readSidecar(dir);
    if (!readBack) throw new Error("expected non-null sidecar");
    expect(readBack.metadata["a.mp3"]).toEqual({
      tags: { title: "A", duration: 100 },
      size: 1,
      lastModified: 1,
    });
    expect(readBack.metadata["b.mp3"]).toEqual({
      tags: { title: "B", duration: 200 },
      size: 2,
      lastModified: 2,
    });
  });
});

describe("cacheMetadata / getMetadata — writable=false", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates in-memory model but writes NOTHING to disk", async () => {
    const dir = makeEmptyDir();
    setLocalDirectory(dir, false);

    await cacheMetadata("song.mp3", { tags: { title: "In-memory" }, size: 10, lastModified: 1 });
    await flushWrites();

    // In-memory accessible
    expect(await getMetadata("song.mp3")).toEqual({
      tags: { title: "In-memory" },
      size: 10,
      lastModified: 1,
    });

    // .commons-audio dir was never created
    const anySubdirs = (dir as unknown as { _subdirs: Record<string, unknown> })._subdirs; // type-safety-ok: test fake internals (_subdirs) access
    expect(anySubdirs[".commons-audio"]).toBeUndefined();
  });
});

describe("clearLocalDirectory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("drops the handle and resets the model so the next access is empty", async () => {
    const dir = makeEmptyDir();
    setLocalDirectory(dir, true);
    await cacheMetadata("song.mp3", { tags: { title: "Cached" }, size: 10, lastModified: 1 });
    await flushWrites();
    expect(await getMetadata("song.mp3")).toEqual({
      tags: { title: "Cached" },
      size: 10,
      lastModified: 1,
    });

    clearLocalDirectory();

    // Unbound: the next access re-loads the empty model, not the stale cache.
    expect(await getMetadata("song.mp3")).toBeUndefined();
  });

  it("a write enqueued after clear does not touch the disconnected folder", async () => {
    const dir = makeEmptyDir();
    setLocalDirectory(dir, true);

    clearLocalDirectory();

    await cacheMetadata("late.mp3", { tags: { title: "Late" }, size: 10, lastModified: 1 });
    await flushWrites();

    // No disk write hit the now-disconnected folder.
    const anySubdirs = (dir as unknown as { _subdirs: Record<string, unknown> })._subdirs; // type-safety-ok: test fake internals (_subdirs) access
    expect(anySubdirs[".commons-audio"]).toBeUndefined();
  });
});

describe("folder switch — stale-handle TOCTOU", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper: read a dir's sidecar without disturbing the module's bound handle.
  const subdirsOf = (dir: FileSystemDirectoryHandle) =>
    (dir as unknown as { _subdirs: Record<string, unknown> })._subdirs; // type-safety-ok: test fake internals (_subdirs) access

  it("drops an in-flight stale write after a synchronous folder switch", async () => {
    const dirA = makeEmptyDir();
    const dirB = makeEmptyDir();

    setLocalDirectory(dirA, true);
    // task_A snapshots A; its body is a pending microtask.
    void cacheMetadata("a.mp3", { tags: { title: "A", duration: 100 }, size: 1, lastModified: 1 });
    // Switch to B synchronously, before task_A's body runs.
    setLocalDirectory(dirB, true);
    void cacheMetadata("b.mp3", { tags: { title: "B", duration: 200 }, size: 2, lastModified: 2 });
    await flushWrites();

    // A's stale write was skipped — its sidecar dir was never created.
    expect(subdirsOf(dirA)[".commons-audio"]).toBeUndefined();
    // B got its write.
    const readB = await readSidecar(dirB);
    expect(readB.metadata["b.mp3"]).toEqual({
      tags: { title: "B", duration: 200 },
      size: 2,
      lastModified: 2,
    });
  });

  it("in-memory model reflects the new folder, not the stale one", async () => {
    const dirA = makeEmptyDir();
    const dirB = makeEmptyDir();

    setLocalDirectory(dirA, true);
    void cacheMetadata("a.mp3", { tags: { title: "A" }, size: 1, lastModified: 1 });
    setLocalDirectory(dirB, true);
    void cacheMetadata("b.mp3", { tags: { title: "B" }, size: 2, lastModified: 2 });
    await flushWrites();

    // A's patch never merged into B's model.
    expect(await getMetadata("a.mp3")).toBeUndefined();
    expect(await getMetadata("b.mp3")).toEqual({
      tags: { title: "B" },
      size: 2,
      lastModified: 2,
    });
  });

  it("a mid-session switch writes player-state to the correct folder", async () => {
    const dirA = makeEmptyDir();
    const dirB = makeEmptyDir();

    setLocalDirectory(dirA, true);
    void savePlayerState({ queue: ["a.mp3"], currentLocalName: "a.mp3", positionSeconds: 5 });
    setLocalDirectory(dirB, true);
    void savePlayerState({ queue: ["b.mp3"], currentLocalName: "b.mp3", positionSeconds: 7 });
    await flushWrites();

    const readB = await readSidecar(dirB);
    expect(readB.playerState).toEqual({
      queue: ["b.mp3"],
      currentLocalName: "b.mp3",
      positionSeconds: 7,
    });
    // A's stale player-state write was skipped.
    expect(subdirsOf(dirA)[".commons-audio"]).toBeUndefined();
  });

  it("a stale-skip does not wedge the chain: subsequent writes still drain", async () => {
    const dirA = makeEmptyDir();
    const dirB = makeEmptyDir();

    setLocalDirectory(dirA, true);
    void cacheMetadata("a.mp3", { tags: { title: "A" }, size: 1, lastModified: 1 });
    setLocalDirectory(dirB, true);
    void cacheMetadata("b.mp3", { tags: { title: "B" }, size: 2, lastModified: 2 });
    // A further write on the current folder after the stale-skip.
    void cacheMetadata("c.mp3", { tags: { title: "C" }, size: 3, lastModified: 3 });
    await flushWrites();

    const readB = await readSidecar(dirB);
    expect(readB.metadata["b.mp3"]).toEqual({ tags: { title: "B" }, size: 2, lastModified: 2 });
    expect(readB.metadata["c.mp3"]).toEqual({ tags: { title: "C" }, size: 3, lastModified: 3 });
    expect(subdirsOf(dirA)[".commons-audio"]).toBeUndefined();
  });

  it("drops an in-flight stale write when the switch lands mid-read", async () => {
    const { dir: dirA, release } = makeGatedPreloadedDir(
      serializeSidecar({
        version: 2,
        metadata: { "diskA.mp3": { tags: { title: "DiskA" }, size: 9, lastModified: 9 } },
        playlists: {},
      }),
    );
    const dirB = makeEmptyDir();

    setLocalDirectory(dirA, true);
    // task_A snapshots dirA + generation; capture its promise directly — the
    // switch below resets writeChain, so a post-switch flushWrites() would drain
    // only the new chain, not task_A.
    const pA = cacheMetadata("a.mp3", { tags: { title: "A" }, size: 1, lastModified: 1 });
    // One microtask tick parks task_A on the gated read (the chain body runs as a
    // single microtask; ensureLoaded → readSidecar → getDirectoryHandle is
    // synchronous up to the gated await, so the body suspends on the gate).
    await Promise.resolve();
    // Switch to dirB DURING the in-flight dirA read: increments generation, nulls cache.
    setLocalDirectory(dirB, true);
    // Resolve dirA's read, letting task_A run past both contamination sites.
    release();
    // Safe: the per-link .catch in enqueueWrite swallows; awaiting guarantees both
    // sites executed (site 1 inside the loadPromise ensureLoaded awaits, site 2 right after).
    await pA;

    // Site 2: task_A's merged patch must NOT have leaked into dirB's cache.
    expect(await getMetadata("a.mp3")).toBeUndefined();
    // Site 1: dirA's raw disk model must NOT have leaked into dirB's cache.
    expect(await getMetadata("diskA.mp3")).toBeUndefined();

    // dirB's cache is clean + usable: a fresh dirB write lands and the stale keys stay gone.
    await cacheMetadata("b.mp3", { tags: { title: "B" }, size: 2, lastModified: 2 });
    await flushWrites();
    expect(await getMetadata("b.mp3")).toEqual({ tags: { title: "B" }, size: 2, lastModified: 2 });
    expect(await getMetadata("a.mp3")).toBeUndefined();
    expect(await getMetadata("diskA.mp3")).toBeUndefined();
  });
});

describe("cacheMetadataBatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("empty batch is a no-op (no disk write)", async () => {
    const dir = makeEmptyDir();
    setLocalDirectory(dir, true);

    await cacheMetadataBatch({});
    await flushWrites();

    // .commons-audio dir was never created (no write happened)
    const anySubdirs = (dir as unknown as { _subdirs: Record<string, unknown> })._subdirs; // type-safety-ok: test fake internals (_subdirs) access
    expect(anySubdirs[".commons-audio"]).toBeUndefined();
  });

  it("batch with entries persists all entries in a single write", async () => {
    const dir = makeEmptyDir();
    setLocalDirectory(dir, true);

    await cacheMetadataBatch({
      "a.mp3": { tags: { title: "A", duration: 100 }, size: 1, lastModified: 1 },
      "b.mp3": { tags: { title: "B", duration: 200 }, size: 2, lastModified: 2 },
    });
    await flushWrites();

    const readBack = await readSidecar(dir);
    if (!readBack) throw new Error("expected non-null sidecar");
    expect(readBack.metadata["a.mp3"]).toEqual({
      tags: { title: "A", duration: 100 },
      size: 1,
      lastModified: 1,
    });
    expect(readBack.metadata["b.mp3"]).toEqual({
      tags: { title: "B", duration: 200 },
      size: 2,
      lastModified: 2,
    });
  });
});

describe("savePlayerState / getPlayerState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writable=true: saves playerState and persists to disk", async () => {
    const dir = makeEmptyDir();
    setLocalDirectory(dir, true);

    await savePlayerState({ queue: ["a.mp3"], currentLocalName: "a.mp3", positionSeconds: 12 });
    await flushWrites();

    expect(await getPlayerState()).toEqual({
      queue: ["a.mp3"],
      currentLocalName: "a.mp3",
      positionSeconds: 12,
    });

    const readBack = await readSidecar(dir);
    if (!readBack) throw new Error("expected non-null sidecar");
    expect(readBack.playerState).toEqual({
      queue: ["a.mp3"],
      currentLocalName: "a.mp3",
      positionSeconds: 12,
    });
  });

  it("partial positionSeconds-only patch keeps queue + currentLocalName", async () => {
    const dir = makeEmptyDir();
    setLocalDirectory(dir, true);

    await savePlayerState({ queue: ["a.mp3"], currentLocalName: "a.mp3", positionSeconds: 12 });
    await flushWrites();

    await savePlayerState({ positionSeconds: 30 });
    await flushWrites();

    const state = await getPlayerState();
    expect(state?.queue).toEqual(["a.mp3"]);
    expect(state?.currentLocalName).toBe("a.mp3");
    expect(state?.positionSeconds).toBe(30);
  });

  it("writable=false: updates in-memory but does not write to disk", async () => {
    const dir = makeEmptyDir();
    setLocalDirectory(dir, false);

    await savePlayerState({ queue: ["b.mp3"], positionSeconds: 5 });
    await flushWrites();

    expect(await getPlayerState()).toMatchObject({ queue: ["b.mp3"] });

    const anySubdirs = (dir as unknown as { _subdirs: Record<string, unknown> })._subdirs; // type-safety-ok: test fake internals (_subdirs) access
    expect(anySubdirs[".commons-audio"]).toBeUndefined();
  });
});

describe("savePlaylist / getPlaylists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves a playlist and persists to disk", async () => {
    const dir = makeEmptyDir();
    setLocalDirectory(dir, true);

    await savePlaylist("Favs", ["a.mp3", "b.mp3"]);
    await flushWrites();

    expect(await getPlaylists()).toEqual({ Favs: ["a.mp3", "b.mp3"] });

    const readBack = await readSidecar(dir);
    if (!readBack) throw new Error("expected non-null sidecar");
    expect(readBack.playlists?.["Favs"]).toEqual(["a.mp3", "b.mp3"]);
  });
});

describe("sidecar — loads from pre-existing file", () => {
  it("reads existing sidecar from disk on first access", async () => {
    const existingData: SidecarData = {
      version: 2,
      metadata: {
        "existing.mp3": { tags: { title: "Existing", duration: 200 }, size: 99, lastModified: 8 },
      },
      playerState: { queue: ["existing.mp3"], currentLocalName: "existing.mp3", positionSeconds: 25 },
      playlists: { Old: ["existing.mp3"] },
    };
    const { dir } = makePreloadedDir(serializeSidecar(existingData));
    setLocalDirectory(dir, true);

    expect(await getMetadata("existing.mp3")).toEqual({
      tags: { title: "Existing", duration: 200 },
      size: 99,
      lastModified: 8,
    });
    expect(await getPlayerState()).toEqual({
      queue: ["existing.mp3"],
      currentLocalName: "existing.mp3",
      positionSeconds: 25,
    });
    expect(await getPlaylists()).toEqual({ Old: ["existing.mp3"] });
  });
});

// ---------------------------------------------------------------------------
// F. Corrupt sidecar — fail-closed acceptance criteria
// ---------------------------------------------------------------------------

describe("corrupt sidecar — fail-closed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("corrupt sidecar: savePlayerState does NOT overwrite the file (AC4)", async () => {
    const { dir, fileHandle } = makePreloadedDir("{not json");
    setLocalDirectory(dir, true);

    await savePlayerState({ queue: ["a.mp3"], currentLocalName: "a.mp3", positionSeconds: 12 });
    await flushWrites();

    // File on disk is untouched — corrupt bytes preserved for recovery.
    expect(fileHandle._state.content).toBe("{not json");
    expect(fileHandle.createWritable).not.toHaveBeenCalled();

    // In-memory session still works (the merge applied to an empty model).
    expect(await getPlayerState()).toMatchObject({ queue: ["a.mp3"], positionSeconds: 12 });
  });

  it("missing sidecar (NotFoundError): savePlayerState DOES write (AC5)", async () => {
    const dir = makeDirWithMissingFile();
    setLocalDirectory(dir, true);

    await savePlayerState({ queue: ["a.mp3"], positionSeconds: 5 });
    await flushWrites();

    const readBack = await readSidecar(dir);
    expect(readBack).not.toBeNull();
    expect(readBack?.playerState).toMatchObject({ queue: ["a.mp3"], positionSeconds: 5 });
  });

  it("rebinding a clean dir after a corrupt one re-enables disk writes", async () => {
    // Corrupt folder: writes are suppressed, corrupt bytes preserved.
    const { dir: corruptDir, fileHandle: corruptFile } = makePreloadedDir("{not json");
    setLocalDirectory(corruptDir, true);
    await savePlayerState({ queue: ["x.mp3"], positionSeconds: 1 });
    await flushWrites();
    expect(corruptFile._state.content).toBe("{not json");
    expect(corruptFile.createWritable).not.toHaveBeenCalled();

    // Rebind a clean folder → corrupt flag cleared → writes resume.
    const cleanDir = makeEmptyDir();
    setLocalDirectory(cleanDir, true);
    await savePlayerState({ queue: ["a.mp3"], currentLocalName: "a.mp3", positionSeconds: 12 });
    await flushWrites();

    const readBack = await readSidecar(cleanDir);
    if (!readBack) throw new Error("expected non-null sidecar");
    expect(readBack.playerState).toMatchObject({ queue: ["a.mp3"], positionSeconds: 12 });
  });
});
