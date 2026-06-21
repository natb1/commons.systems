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
      version: 1,
      metadata: { "song.mp3": { title: "My Song", duration: 200 } },
      playlists: { Favs: ["song.mp3"] },
    };
    const result = parseSidecar(JSON.stringify(data));
    expect(result).toEqual(data);
  });

  it("returns empty model for empty string", () => {
    expect(parseSidecar("")).toEqual({ version: 1, metadata: {}, playlists: {} });
  });

  it("returns empty model for corrupt JSON", () => {
    expect(parseSidecar("{not json")).toEqual({ version: 1, metadata: {}, playlists: {} });
  });

  it("returns empty model for non-object top-level: number", () => {
    expect(parseSidecar("42")).toEqual({ version: 1, metadata: {}, playlists: {} });
  });

  it("returns empty model for non-object top-level: null", () => {
    expect(parseSidecar("null")).toEqual({ version: 1, metadata: {}, playlists: {} });
  });

  it("returns empty model for non-object top-level: string", () => {
    expect(parseSidecar('"a string"')).toEqual({ version: 1, metadata: {}, playlists: {} });
  });

  it("returns empty model for non-object top-level: array", () => {
    expect(parseSidecar("[1,2,3]")).toEqual({ version: 1, metadata: {}, playlists: {} });
  });

  it("forces version to 1 regardless of input", () => {
    const json = JSON.stringify({ version: 99, metadata: {}, playlists: {} });
    expect(parseSidecar(json).version).toBe(1);
  });

  it("coerces missing metadata to {} while preserving valid playerState", () => {
    const json = JSON.stringify({
      version: 1,
      playerState: { queue: ["a.mp3"], currentLocalName: "a.mp3", positionSeconds: 10 },
    });
    const result = parseSidecar(json);
    expect(result.metadata).toEqual({});
    expect(result.playerState?.queue).toEqual(["a.mp3"]);
  });

  it("coerces wrong-typed metadata (array) to {} but preserves playerState", () => {
    const json = JSON.stringify({
      version: 1,
      metadata: [1, 2],
      playerState: { queue: ["b.mp3"] },
    });
    const result = parseSidecar(json);
    expect(result.metadata).toEqual({});
    expect(result.playerState?.queue).toEqual(["b.mp3"]);
  });

  it("drops wrong-typed duration but keeps string title in metadata", () => {
    const json = JSON.stringify({
      version: 1,
      metadata: { "song.mp3": { title: "Keep", duration: "bad" } },
      playlists: {},
    });
    const result = parseSidecar(json);
    expect(result.metadata["song.mp3"]?.title).toBe("Keep");
    expect("duration" in (result.metadata["song.mp3"] ?? {})).toBe(false);
  });

  describe("playlists coercion", () => {
    it("filters non-array playlist values", () => {
      const json = JSON.stringify({
        version: 1,
        metadata: {},
        playlists: { Good: ["a.mp3", "b.mp3"], Bad: "not-an-array" },
      });
      const result = parseSidecar(json);
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
      expect(result.playlists?.["Mix"]).toEqual(["a.mp3", "b.mp3"]);
    });
  });

  describe("playerState coercion", () => {
    it("non-array queue defaults to []", () => {
      const json = JSON.stringify({ version: 1, metadata: {}, playerState: { queue: "bad" } });
      const result = parseSidecar(json);
      expect(result.playerState?.queue).toEqual([]);
    });

    it("drops wrong-typed currentLocalName", () => {
      const json = JSON.stringify({
        version: 1,
        metadata: {},
        playerState: { queue: [], currentLocalName: 42 },
      });
      const result = parseSidecar(json);
      expect("currentLocalName" in (result.playerState ?? {})).toBe(false);
    });

    it("drops wrong-typed positionSeconds", () => {
      const json = JSON.stringify({
        version: 1,
        metadata: {},
        playerState: { queue: [], positionSeconds: "bad" },
      });
      const result = parseSidecar(json);
      expect("positionSeconds" in (result.playerState ?? {})).toBe(false);
    });

    it("a plain-object playerState always yields at least { queue: [] }", () => {
      const json = JSON.stringify({ version: 1, metadata: {}, playerState: {} });
      const result = parseSidecar(json);
      expect(result.playerState).toEqual({ queue: [] });
    });

    it("a non-object playerState yields undefined", () => {
      const json = JSON.stringify({ version: 1, metadata: {}, playerState: "invalid" });
      const result = parseSidecar(json);
      expect(result.playerState).toBeUndefined();
    });

    it("malformed playerState does not discard good metadata (independence, vice-versa)", () => {
      const json = JSON.stringify({
        version: 1,
        metadata: { "song.mp3": { title: "Keep" } },
        playerState: 42,
      });
      const result = parseSidecar(json);
      expect(result.metadata["song.mp3"]?.title).toBe("Keep");
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
      version: 1,
      metadata: {
        "song.mp3": { title: "Old" },
        "other.mp3": { title: "Other" },
      },
      playerState: { queue: ["song.mp3"], currentLocalName: "song.mp3", positionSeconds: 30 },
      playlists: { Favs: ["song.mp3"] },
    };
    const result = mergeSidecar(existing, { metadata: { "song.mp3": { title: "New" } } });

    expect(result.metadata["song.mp3"]?.title).toBe("New");
    // Sibling preserved
    expect(result.metadata["other.mp3"]?.title).toBe("Other");
    // playerState preserved
    expect(result.playerState).toEqual(existing.playerState);
    // Playlists preserved
    expect(result.playlists).toEqual(existing.playlists);
    expect(result.version).toBe(1);
  });

  it("playerState partial patch keeps existing queue + currentLocalName", () => {
    const existing: SidecarData = {
      version: 1,
      metadata: { "a.mp3": { title: "A" } },
      playerState: { queue: ["a.mp3"], currentLocalName: "a.mp3", positionSeconds: 10 },
      playlists: {},
    };
    const result = mergeSidecar(existing, { playerState: { positionSeconds: 99 } });

    expect(result.playerState?.queue).toEqual(["a.mp3"]);
    expect(result.playerState?.currentLocalName).toBe("a.mp3");
    expect(result.playerState?.positionSeconds).toBe(99);
    // Metadata preserved
    expect(result.metadata["a.mp3"]?.title).toBe("A");
  });

  it("playlist patch preserves metadata + playerState", () => {
    const existing: SidecarData = {
      version: 1,
      metadata: { "b.mp3": { title: "B" } },
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
      version: 1,
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
      version: 1,
      metadata: {
        "song.mp3": { title: "Song", artist: "Artist", duration: 180 },
        "tune.flac": { title: "Tune", year: 2020 },
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
    const empty: SidecarData = { version: 1, metadata: {}, playlists: {} };
    expect(parseSidecar(serializeSidecar(empty))).toEqual(empty);
  });

  it("serializes to valid JSON (parseable by JSON.parse)", () => {
    const data: SidecarData = { version: 1, metadata: { "a.mp3": { duration: 5 } }, playlists: {} };
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
      metadata: { "song.mp3": { title: "Found", duration: 100 } },
      playlists: { Favs: ["song.mp3"] },
    };
    const { dir } = makePreloadedDir(serializeSidecar(data));

    const result = await readSidecar(dir);
    expect(result).toEqual(data);
  });

  it("returns empty model when the .commons-audio directory is absent (NotFoundError)", async () => {
    const dir = makeEmptyDir();
    const result = await readSidecar(dir);
    expect(result).toEqual({ version: 1, metadata: {}, playlists: {} });
  });

  it("returns empty model when index.json is absent (NotFoundError)", async () => {
    const dir = makeDirWithMissingFile();
    const result = await readSidecar(dir);
    expect(result).toEqual({ version: 1, metadata: {}, playlists: {} });
  });

  it("returns empty model when content is corrupt JSON", async () => {
    const { dir } = makePreloadedDir("{not json");
    await expect(readSidecar(dir)).resolves.toEqual({ version: 1, metadata: {}, playlists: {} });
  });
});

describe("writeSidecar", () => {
  it("write-then-read round-trip", async () => {
    const dir = makeEmptyDir();
    const data: SidecarData = {
      version: 1,
      metadata: { "song.mp3": { title: "Written" } },
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
      writeSidecar(dir, { version: 1, metadata: {}, playlists: {} }),
    ).rejects.toThrow("write failed");
    expect(fileHandle._abortSpy).toHaveBeenCalled();
  });

  it("calls abort() and rethrows when close() rejects", async () => {
    const state: FakeFileState = { content: null };
    const fileHandle = makeFakeFileHandle(state, { closeShouldFail: true });
    const subdir = makeFakeSubdir({ "index.json": fileHandle });
    const dir = makeFakeDir({ ".commons-audio": subdir });

    await expect(
      writeSidecar(dir, { version: 1, metadata: {}, playlists: {} }),
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

    await cacheMetadata("song.mp3", { title: "Test Song", duration: 180 });
    await flushWrites();

    expect(await getMetadata("song.mp3")).toEqual({ title: "Test Song", duration: 180 });

    const readBack = await readSidecar(dir);
    expect(readBack.metadata["song.mp3"]).toEqual({ title: "Test Song", duration: 180 });
  });

  it("key is the bare filename, no 'local:' prefix on disk", async () => {
    const dir = makeEmptyDir();
    setLocalDirectory(dir, true);

    await cacheMetadata("song.mp3", { title: "My Song" });
    await flushWrites();

    const readBack = await readSidecar(dir);
    expect(readBack.metadata["song.mp3"]).toEqual({ title: "My Song" });
    expect(Object.keys(readBack.metadata).some((k) => k.startsWith("local:"))).toBe(false);
  });

  it("single-flight chain: two un-awaited cacheMetadata calls both persist", async () => {
    const dir = makeEmptyDir();
    setLocalDirectory(dir, true);

    void cacheMetadata("a.mp3", { title: "A", duration: 100 });
    void cacheMetadata("b.mp3", { title: "B", duration: 200 });
    await flushWrites();

    const readBack = await readSidecar(dir);
    expect(readBack.metadata["a.mp3"]).toEqual({ title: "A", duration: 100 });
    expect(readBack.metadata["b.mp3"]).toEqual({ title: "B", duration: 200 });
  });
});

describe("cacheMetadata / getMetadata — writable=false", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates in-memory model but writes NOTHING to disk", async () => {
    const dir = makeEmptyDir();
    setLocalDirectory(dir, false);

    await cacheMetadata("song.mp3", { title: "In-memory" });
    await flushWrites();

    // In-memory accessible
    expect(await getMetadata("song.mp3")).toEqual({ title: "In-memory" });

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
    await cacheMetadata("song.mp3", { title: "Cached" });
    await flushWrites();
    expect(await getMetadata("song.mp3")).toEqual({ title: "Cached" });

    clearLocalDirectory();

    // Unbound: the next access re-loads the empty model, not the stale cache.
    expect(await getMetadata("song.mp3")).toBeUndefined();
  });

  it("a write enqueued after clear does not touch the disconnected folder", async () => {
    const dir = makeEmptyDir();
    setLocalDirectory(dir, true);

    clearLocalDirectory();

    await cacheMetadata("late.mp3", { title: "Late" });
    await flushWrites();

    // No disk write hit the now-disconnected folder.
    const anySubdirs = (dir as unknown as { _subdirs: Record<string, unknown> })._subdirs; // type-safety-ok: test fake internals (_subdirs) access
    expect(anySubdirs[".commons-audio"]).toBeUndefined();
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
      "a.mp3": { title: "A", duration: 100 },
      "b.mp3": { title: "B", duration: 200 },
    });
    await flushWrites();

    const readBack = await readSidecar(dir);
    expect(readBack.metadata["a.mp3"]).toEqual({ title: "A", duration: 100 });
    expect(readBack.metadata["b.mp3"]).toEqual({ title: "B", duration: 200 });
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
    expect(readBack.playlists?.["Favs"]).toEqual(["a.mp3", "b.mp3"]);
  });
});

describe("sidecar — loads from pre-existing file", () => {
  it("reads existing sidecar from disk on first access", async () => {
    const existingData: SidecarData = {
      version: 1,
      metadata: { "existing.mp3": { title: "Existing", duration: 200 } },
      playerState: { queue: ["existing.mp3"], currentLocalName: "existing.mp3", positionSeconds: 25 },
      playlists: { Old: ["existing.mp3"] },
    };
    const { dir } = makePreloadedDir(serializeSidecar(existingData));
    setLocalDirectory(dir, true);

    expect(await getMetadata("existing.mp3")).toEqual({ title: "Existing", duration: 200 });
    expect(await getPlayerState()).toEqual({
      queue: ["existing.mp3"],
      currentLocalName: "existing.mp3",
      positionSeconds: 25,
    });
    expect(await getPlaylists()).toEqual({ Old: ["existing.mp3"] });
  });
});
