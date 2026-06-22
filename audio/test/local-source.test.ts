import { describe, it, expect, vi, beforeEach } from "vitest";
import type { LibraryItem } from "../src/types.js";

const fakeStore = {
  isSupported: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  remove: vi.fn(),
  queryPermission: vi.fn(),
  requestPermission: vi.fn(),
  ensurePermission: vi.fn(),
  load: vi.fn(),
};

vi.mock("@commons-systems/local-first/fsa-handle-store", () => ({
  createFsaHandleStore: () => fakeStore,
}));

const mockLogError = vi.fn();
vi.mock("@commons-systems/errorutil/log", () => ({
  logError: (...args: unknown[]) => mockLogError(...args),
}));

const mockSetLocalDirectory = vi.fn();
const mockClearLocalDirectory = vi.fn();
const mockGetMetadata = vi.fn();
const mockCacheMetadataBatch = vi.fn();
vi.mock("../src/sidecar.js", () => ({
  setLocalDirectory: (...args: unknown[]) => mockSetLocalDirectory(...args),
  clearLocalDirectory: (...args: unknown[]) => mockClearLocalDirectory(...args),
  getMetadata: (...args: unknown[]) => mockGetMetadata(...args),
  cacheMetadataBatch: (...args: unknown[]) => mockCacheMetadataBatch(...args),
}));

const mockExtract = vi.fn();
vi.mock("../src/local-metadata.js", () => ({
  extractAudioMetadata: (...args: unknown[]) => mockExtract(...args),
}));

interface FakeEntry {
  kind: "file" | "directory";
  name: string;
  getFile?: () => Promise<{
    size: number;
    lastModified: number;
    arrayBuffer: () => Promise<ArrayBuffer>;
  }>;
}

function bytes(s: string): ArrayBuffer {
  return new TextEncoder().encode(s).buffer;
}

/** A fake top-level file. `size` defaults to the byte length of `name` (the
 * content the fake `arrayBuffer()` returns) but can be overridden so a test can
 * drive the content fingerprint independently of `lastModified`. */
function fileEntry(name: string, lastModified: number, size = bytes(name).byteLength): FakeEntry {
  return {
    kind: "file",
    name,
    getFile: async () => ({ size, lastModified, arrayBuffer: async () => bytes(name) }),
  };
}

function fakeDir(
  entries: FakeEntry[],
  files: Record<string, ArrayBuffer> = {},
): FileSystemDirectoryHandle {
  return {
    async *values() {
      for (const e of entries) yield e;
    },
    async getFileHandle(name: string) {
      if (!(name in files)) {
        const e = new Error("not found");
        e.name = "NotFoundError";
        throw e;
      }
      return {
        getFile: async () => ({ arrayBuffer: async () => files[name] }),
      };
    },
  } as unknown as FileSystemDirectoryHandle;
}

/** A directory handle whose enumeration throws, to exercise the swallow path. */
function throwingDir(): FileSystemDirectoryHandle {
  return {
    // eslint-disable-next-line require-yield
    async *values() {
      throw new Error("scan failed");
    },
  } as unknown as FileSystemDirectoryHandle;
}

async function loadModule() {
  vi.resetModules();
  return import("../src/local-source.js");
}

beforeEach(() => {
  vi.clearAllMocks();
  fakeStore.isSupported.mockReturnValue(true);
  // Default: support detection sees the picker.
  (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker =
    vi.fn();
});

describe("unsupported", () => {
  it("reports unsupported and yields no tracks", async () => {
    fakeStore.isSupported.mockReturnValue(false);
    const mod = await loadModule();
    expect(mod.isLocalFolderSupported()).toBe(false);
    await mod.ensureLocalFolderRestored();
    expect(mod.getLocalFolderState()).toBe("unsupported");
    expect(await mod.listLocalTracks()).toEqual([]);
  });
});

describe("restore", () => {
  it("zero-click writable bind when readwrite is already granted", async () => {
    const dir = fakeDir([]);
    fakeStore.get.mockResolvedValue(dir);
    // "granted" for any mode → the readwrite branch binds first.
    fakeStore.queryPermission.mockResolvedValue("granted");
    const mod = await loadModule();
    await mod.ensureLocalFolderRestored();
    expect(mod.getLocalFolderState()).toBe("granted");
    expect(mod.hasLocalFolder()).toBe(true);
    expect(mockSetLocalDirectory).toHaveBeenCalledWith(dir, true);
    expect(fakeStore.requestPermission).not.toHaveBeenCalled();
    expect(fakeStore.ensurePermission).not.toHaveBeenCalled();
  });

  it("read-only bind when only read is granted (readwrite in prompt)", async () => {
    const dir = fakeDir([]);
    fakeStore.get.mockResolvedValue(dir);
    fakeStore.queryPermission.mockImplementation(
      (_h: unknown, mode: string) => (mode === "readwrite" ? "prompt" : "granted"),
    );
    const mod = await loadModule();
    await mod.ensureLocalFolderRestored();
    expect(mod.getLocalFolderState()).toBe("granted");
    expect(mod.hasLocalFolder()).toBe(true);
    expect(mockSetLocalDirectory).toHaveBeenCalledWith(dir, false);
    expect(fakeStore.requestPermission).not.toHaveBeenCalled();
    expect(fakeStore.ensurePermission).not.toHaveBeenCalled();
  });

  it("does not request permission at startup when in prompt state", async () => {
    fakeStore.get.mockResolvedValue(fakeDir([]));
    // Both readwrite and read queries return "prompt".
    fakeStore.queryPermission.mockResolvedValue("prompt");
    const mod = await loadModule();
    await mod.ensureLocalFolderRestored();
    expect(mod.getLocalFolderState()).toBe("prompt");
    expect(mod.hasLocalFolder()).toBe(false);
    expect(mockSetLocalDirectory).not.toHaveBeenCalled();
    expect(fakeStore.requestPermission).not.toHaveBeenCalled();
    expect(fakeStore.ensurePermission).not.toHaveBeenCalled();
  });

  it("stays at none when no handle is persisted", async () => {
    fakeStore.get.mockResolvedValue(null);
    const mod = await loadModule();
    await mod.ensureLocalFolderRestored();
    expect(mod.getLocalFolderState()).toBe("none");
    expect(mod.hasLocalFolder()).toBe(false);
  });
});

describe("regrant", () => {
  it("returns true and binds writable when readwrite is granted", async () => {
    const dir = fakeDir([]);
    fakeStore.get.mockResolvedValue(dir);
    fakeStore.ensurePermission.mockResolvedValue("granted");
    const mod = await loadModule();
    expect(await mod.regrantLocalFolder()).toBe(true);
    expect(mod.getLocalFolderState()).toBe("granted");
    expect(mod.hasLocalFolder()).toBe(true);
    expect(mockSetLocalDirectory).toHaveBeenCalledWith(dir, true);
  });

  it("returns false when there is no persisted handle", async () => {
    fakeStore.get.mockResolvedValue(null);
    const mod = await loadModule();
    expect(await mod.regrantLocalFolder()).toBe(false);
    expect(mod.getLocalFolderState()).toBe("none");
  });
});

describe("connect + list", () => {
  it("picks a folder, persists it, and lists audio tracks newest-first", async () => {
    const handle = fakeDir([
      fileEntry("song.mp3", 1000),
      fileEntry("tune.flac", 3000),
      fileEntry("notes.txt", 2000),
    ]);
    (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker =
      vi.fn().mockResolvedValue(handle);
    fakeStore.put.mockResolvedValue(undefined);

    const mod = await loadModule();
    await mod.connectLocalFolder();
    expect(
      (window as unknown as { showDirectoryPicker: ReturnType<typeof vi.fn> }) // type-safety-ok: test stubs window.showDirectoryPicker global
        .showDirectoryPicker,
    ).toHaveBeenCalledWith({ mode: "readwrite" });
    expect(fakeStore.put).toHaveBeenCalledWith("library-folder", handle);
    expect(mockSetLocalDirectory).toHaveBeenCalledWith(handle, true);
    expect(mod.hasLocalFolder()).toBe(true);

    const items = await mod.listLocalTracks();
    expect(items.map((i) => i.localName)).toEqual(["tune.flac", "song.mp3"]);
    for (const i of items) {
      expect(i.origin).toBe("local");
    }
    const flac = items[0];
    expect(flac.id).toBe("local:tune.flac");
    expect(flac.format).toBe("flac");
    expect(flac.title).toBe("tune");
    expect(flac.localName).toBe("tune.flac");
    const mp3 = items[1];
    expect(mp3.id).toBe("local:song.mp3");
    expect(mp3.format).toBe("mp3");
    expect(mp3.title).toBe("song");
  });
});

describe("resolveLocalAudioSource", () => {
  it("resolves to a blob URL with the correct MIME type", async () => {
    const handle = fakeDir([fileEntry("tune.flac", 3000)]);
    (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker =
      vi.fn().mockResolvedValue(handle);
    fakeStore.put.mockResolvedValue(undefined);

    const created: Blob[] = [];
    const createObjectURL = vi.fn((blob: Blob) => {
      created.push(blob);
      return "blob:fake-url";
    });
    (URL as unknown as { createObjectURL: unknown }).createObjectURL =
      createObjectURL;

    const mod = await loadModule();
    await mod.connectLocalFolder();

    const url = await mod.resolveLocalAudioSource("tune.flac");
    expect(url).toBe("blob:fake-url");
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(created[0].type).toBe("audio/flac");
  });

  it("throws when no folder is connected", async () => {
    const mod = await loadModule();
    await expect(mod.resolveLocalAudioSource("tune.flac")).rejects.toThrow(
      /no connected local folder/,
    );
  });

  it("propagates a not-found error when the file handle lookup misses", async () => {
    const handle = fakeDir([fileEntry("tune.flac", 3000)]);
    (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker =
      vi.fn().mockResolvedValue(handle);
    fakeStore.put.mockResolvedValue(undefined);

    const mod = await loadModule();
    await mod.connectLocalFolder();

    await expect(mod.resolveLocalAudioSource("missing.flac")).rejects.toThrow(
      /no longer present/,
    );
  });
});

describe("resolveLocalFile", () => {
  it("returns the File (size/lastModified/arrayBuffer) for a listed local item", async () => {
    const handle = fakeDir([fileEntry("tune.flac", 3000, 42)]);
    (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker = // type-safety-ok: test stubs window.showDirectoryPicker global
      vi.fn().mockResolvedValue(handle);
    fakeStore.put.mockResolvedValue(undefined);

    const mod = await loadModule();
    await mod.connectLocalFolder();

    const file = await mod.resolveLocalFile({
      id: "local:tune.flac",
    } as LibraryItem); // type-safety-ok: partial LibraryItem fixture for test
    expect(file).not.toBeNull();
    if (file == null) throw new Error("Expected file to be non-null");
    expect(file.size).toBe(42);
    expect(file.lastModified).toBe(3000);
    expect(new TextDecoder().decode(await file.arrayBuffer())).toBe("tune.flac");
  });

  it("returns null (not a throw) when the item is no longer present", async () => {
    const handle = fakeDir([fileEntry("tune.flac", 3000)]);
    (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker = // type-safety-ok: test stubs window.showDirectoryPicker global
      vi.fn().mockResolvedValue(handle);
    fakeStore.put.mockResolvedValue(undefined);

    const mod = await loadModule();
    await mod.connectLocalFolder();

    const file = await mod.resolveLocalFile({
      id: "local:missing.flac",
    } as LibraryItem); // type-safety-ok: partial LibraryItem fixture for test
    expect(file).toBeNull();
    expect(mockLogError).toHaveBeenCalledWith(expect.anything(), {
      operation: "resolve-local-file",
    });
  });

  it("returns null when no folder is connected", async () => {
    const mod = await loadModule();
    const file = await mod.resolveLocalFile({
      id: "local:tune.flac",
    } as LibraryItem); // type-safety-ok: partial LibraryItem fixture for test
    expect(file).toBeNull();
  });
});

describe("scan errors", () => {
  it("swallows a scan failure and logs it", async () => {
    (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker =
      vi.fn().mockResolvedValue(throwingDir());
    fakeStore.put.mockResolvedValue(undefined);

    const mod = await loadModule();
    await mod.connectLocalFolder();
    expect(await mod.listLocalTracks()).toEqual([]);
    expect(mockLogError).toHaveBeenCalledWith(expect.anything(), {
      operation: "list-local-tracks",
    });
  });
});

describe("enrichment", () => {
  function connectDir(handle: FileSystemDirectoryHandle) {
    (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker = vi // type-safety-ok: test stubs window.showDirectoryPicker global
      .fn()
      .mockResolvedValue(handle);
    fakeStore.put.mockResolvedValue(undefined);
  }

  it("cache-first overlay in listLocalTracks: cached entry overlays artist/duration", async () => {
    const handle = fakeDir([fileEntry("song.mp3", 1000)]);
    connectDir(handle);

    // Cache returns a wrapper entry for song.mp3 (listLocalTracks overlays
    // .tags and does NOT validate the fingerprint).
    mockGetMetadata.mockImplementation(async (name: string) => {
      if (name === "song.mp3")
        return { tags: { artist: "Real Artist", duration: 100 }, size: 8, lastModified: 1000 };
      return undefined;
    });

    const mod = await loadModule();
    await mod.connectLocalFolder();
    const items = await mod.listLocalTracks();

    const song = items.find((i) => i.localName === "song.mp3");
    expect(song?.artist).toBe("Real Artist");
    expect(song?.duration).toBe(100);
    // title not in cache, keeps filename-stem placeholder
    expect(song?.title).toBe("song");
  });

  it("uncached item in listLocalTracks keeps placeholder artist", async () => {
    const handle = fakeDir([fileEntry("song.mp3", 1000)]);
    connectDir(handle);

    mockGetMetadata.mockResolvedValue(undefined);

    const mod = await loadModule();
    await mod.connectLocalFolder();
    const items = await mod.listLocalTracks();

    const song = items.find((i) => i.localName === "song.mp3");
    expect(song?.artist).toBe("Unknown artist");
  });

  it("enrichLocalTracks extracts uncached items and writes a single batch", async () => {
    const handle = fakeDir([fileEntry("song.mp3", 1000, 8), fileEntry("tune.flac", 2000, 9)]);
    connectDir(handle);

    // Nothing cached
    mockGetMetadata.mockResolvedValue(undefined);
    // Extract returns a tag
    mockExtract.mockResolvedValue({ artist: "X" });
    mockCacheMetadataBatch.mockResolvedValue(undefined);

    const mod = await loadModule();
    await mod.connectLocalFolder();
    await mod.enrichLocalTracks();

    // One extract call per file
    expect(mockExtract).toHaveBeenCalledTimes(2);
    // Single batched write; each entry is a fingerprinted wrapper.
    expect(mockCacheMetadataBatch).toHaveBeenCalledTimes(1);
    const batchArg = mockCacheMetadataBatch.mock.calls[0][0] as Record<string, unknown>; // type-safety-ok: mock-call introspection in test
    expect(batchArg["song.mp3"]).toEqual({ tags: { artist: "X" }, size: 8, lastModified: 1000 });
    expect(batchArg["tune.flac"]).toEqual({ tags: { artist: "X" }, size: 9, lastModified: 2000 });
  });

  it("focus-rescan write suppression: all fresh cache hits → cacheMetadataBatch called with {}", async () => {
    const handle = fakeDir([fileEntry("song.mp3", 1000, 8)]);
    connectDir(handle);

    // Cached with a fingerprint matching the file → fresh hit, no extraction.
    mockGetMetadata.mockResolvedValue({ tags: {}, size: 8, lastModified: 1000 });
    mockCacheMetadataBatch.mockResolvedValue(undefined);

    const mod = await loadModule();
    await mod.connectLocalFolder();
    await mod.enrichLocalTracks();

    // extract was never called (fingerprint matched)
    expect(mockExtract).not.toHaveBeenCalled();
    // cacheMetadataBatch called with empty (real impl no-ops; mock records the call)
    expect(mockCacheMetadataBatch).toHaveBeenCalledWith({});
  });

  it("file whose arrayBuffer() fails (TOCTOU) is not in the batch; cached stale tags overlaid", async () => {
    // song.mp3 lists + resolves to a File, but reading its bytes throws (the
    // file vanished between getFile() and the byte read). Its arrayBuffer
    // failure must be caught: no new entry, and the (stale) cached tags overlay.
    const failingEntry: FakeEntry = {
      kind: "file",
      name: "song.mp3",
      getFile: async () => ({
        size: 8,
        lastModified: 1000,
        arrayBuffer: async () => {
          throw new Error("read error");
        },
      }),
    };
    const goodEntry = fileEntry("tune.flac", 2000, 9);
    const handle = fakeDir([failingEntry, goodEntry]);
    connectDir(handle);

    // song.mp3 has a STALE cached entry (fingerprint differs → triggers a
    // re-extract attempt, whose byte read then fails).
    mockGetMetadata.mockImplementation(async (name: string) => {
      if (name === "song.mp3")
        return { tags: { artist: "Stale" }, size: 999, lastModified: 1 };
      return undefined;
    });
    mockExtract.mockResolvedValue({ artist: "Y" });
    mockCacheMetadataBatch.mockResolvedValue(undefined);

    const mod = await loadModule();
    await mod.connectLocalFolder();
    await mod.enrichLocalTracks();

    // batch arg must not include the failing file (no new entry → retry later)
    const batchArg = mockCacheMetadataBatch.mock.calls[0][0] as Record<string, unknown>; // type-safety-ok: mock-call introspection in test
    expect("song.mp3" in batchArg).toBe(false);
    // good file is present, fingerprinted
    expect(batchArg["tune.flac"]).toEqual({ tags: { artist: "Y" }, size: 9, lastModified: 2000 });
  });

  it("file whose getFile() fails on resolve (resolveLocalFile null) is not in the batch; cached stale tags stay visible", async () => {
    // song.mp3 lists fine (the scan's getFile succeeds), but the LATER resolve
    // for enrichment fails: getFile() itself throws (not just arrayBuffer) so
    // resolveLocalFile returns null. Orthogonal to the TOCTOU case, where
    // getFile succeeds and only arrayBuffer throws. With a stale cache entry
    // present, no new entry is contributed (do NOT cache `{}`), and the stale
    // tags must remain visible to the user via listLocalTracks's cache overlay.
    // getFile must succeed for the listing scans (so the item is listed and
    // stays visible) but fail for the enrichment resolve in between, modelling a
    // transient getFile failure. resolveLocalFile catches that throw → null.
    let songGetFileCalls = 0;
    const failingEntry: FakeEntry = {
      kind: "file",
      name: "song.mp3",
      // Call 1 = enrich's listing scan (succeeds → item listed).
      // Call 2 = enrich's resolveLocalFile (throws → null, the path under test).
      // Call 3 = the final listLocalTracks re-scan (succeeds → item still listed).
      getFile: async () => {
        songGetFileCalls += 1;
        if (songGetFileCalls === 2) throw new Error("getFile error");
        return { size: 8, lastModified: 1000, arrayBuffer: async () => bytes("song.mp3") };
      },
    };
    const goodEntry = fileEntry("tune.flac", 2000, 9);
    const handle = fakeDir([failingEntry, goodEntry]);
    connectDir(handle);

    // song.mp3 has a STALE cached entry; tune.flac is uncached.
    mockGetMetadata.mockImplementation(async (name: string) => {
      if (name === "song.mp3")
        return { tags: { artist: "Stale" }, size: 999, lastModified: 1 };
      return undefined;
    });
    mockExtract.mockResolvedValue({ artist: "Y" });
    mockCacheMetadataBatch.mockResolvedValue(undefined);

    const mod = await loadModule();
    await mod.connectLocalFolder();
    await mod.enrichLocalTracks();

    // song.mp3 never reached extraction (resolveLocalFile returned null).
    expect(mockExtract).toHaveBeenCalledTimes(1);
    // batch arg must not include the failing file (no new entry → retry later).
    const batchArg = mockCacheMetadataBatch.mock.calls[0][0] as Record<string, unknown>; // type-safety-ok: mock-call introspection in test
    expect("song.mp3" in batchArg).toBe(false);
    expect(batchArg["tune.flac"]).toEqual({ tags: { artist: "Y" }, size: 9, lastModified: 2000 });

    // The stale cached tags stay user-visible (listLocalTracks overlays cache).
    const items = await mod.listLocalTracks();
    const song = items.find((i) => i.localName === "song.mp3");
    expect(song?.artist).toBe("Stale");
  });

  // -------------------------------------------------------------------------
  // Acceptance criteria 5(a)-(c): fingerprint re-validation in enrichment.
  // -------------------------------------------------------------------------

  it("(a) fresh cache hit (matching size + lastModified) → no extraction, cached tags overlaid", async () => {
    const handle = fakeDir([fileEntry("song.mp3", 1000, 8)]);
    connectDir(handle);

    // Cached fingerprint matches the file exactly.
    mockGetMetadata.mockResolvedValue({
      tags: { artist: "Cached Artist", duration: 120 },
      size: 8,
      lastModified: 1000,
    });
    mockCacheMetadataBatch.mockResolvedValue(undefined);

    const mod = await loadModule();
    await mod.connectLocalFolder();
    await mod.enrichLocalTracks();

    // extractAudioMetadata NOT called on a fresh hit.
    expect(mockExtract).not.toHaveBeenCalled();
    // No new entry written.
    expect(mockCacheMetadataBatch).toHaveBeenCalledWith({});
    // Cached tags are overlaid onto the listed item (the user-visible result).
    const items = await mod.listLocalTracks();
    const song = items.find((i) => i.localName === "song.mp3");
    expect(song?.artist).toBe("Cached Artist");
    expect(song?.duration).toBe(120);
  });

  it("(b) mismatched fingerprint (file size/lastModified changed) → re-extract + new fingerprinted entry", async () => {
    // File now has size 50 / lastModified 9999.
    const handle = fakeDir([fileEntry("song.mp3", 9999, 50)]);
    connectDir(handle);

    // Stale cache: fingerprint from a prior version of the file.
    mockGetMetadata.mockResolvedValue({
      tags: { artist: "Old" },
      size: 8,
      lastModified: 1000,
    });
    mockExtract.mockResolvedValue({ artist: "Fresh" });
    mockCacheMetadataBatch.mockResolvedValue(undefined);

    const mod = await loadModule();
    await mod.connectLocalFolder();
    await mod.enrichLocalTracks();

    // Mismatch → extraction ran.
    expect(mockExtract).toHaveBeenCalledTimes(1);
    // The new entry carries the NEW fingerprint.
    const batchArg = mockCacheMetadataBatch.mock.calls[0][0] as Record<string, unknown>; // type-safety-ok: mock-call introspection in test
    expect(batchArg["song.mp3"]).toEqual({
      tags: { artist: "Fresh" },
      size: 50,
      lastModified: 9999,
    });
  });

  // (b1)/(b2): the fingerprint gate is `cached.size === fp.size &&
  // cached.lastModified === fp.lastModified`. Exercise each sub-condition
  // independently so a regression from `&&` to `||` is caught.
  it.each([
    {
      label: "(b1) same size, different lastModified → re-extract",
      live: { lastModified: 9999, size: 8 },
      cached: { size: 8, lastModified: 1000 },
    },
    {
      label: "(b2) different size, same lastModified → re-extract",
      live: { lastModified: 1000, size: 50 },
      cached: { size: 8, lastModified: 1000 },
    },
  ])("$label", async ({ live, cached }) => {
    const handle = fakeDir([fileEntry("song.mp3", live.lastModified, live.size)]);
    connectDir(handle);

    // Stale cache: exactly one fingerprint field differs from the live file.
    mockGetMetadata.mockResolvedValue({
      tags: { artist: "Old" },
      size: cached.size,
      lastModified: cached.lastModified,
    });
    mockExtract.mockResolvedValue({ artist: "Fresh" });
    mockCacheMetadataBatch.mockResolvedValue(undefined);

    const mod = await loadModule();
    await mod.connectLocalFolder();
    await mod.enrichLocalTracks();

    // One field differing must still be treated as a mismatch → extraction ran.
    expect(mockExtract).toHaveBeenCalledTimes(1);
    // The new entry carries the NEW (live) fingerprint.
    const batchArg = mockCacheMetadataBatch.mock.calls[0][0] as Record<string, unknown>; // type-safety-ok: mock-call introspection in test
    expect(batchArg["song.mp3"]).toEqual({
      tags: { artist: "Fresh" },
      size: live.size,
      lastModified: live.lastModified,
    });
  });

  it("(c) missing fingerprint (getMetadata undefined, e.g. legacy entry dropped at parse) → re-extract + fresh entry", async () => {
    const handle = fakeDir([fileEntry("song.mp3", 1000, 8)]);
    connectDir(handle);

    // Post-parse state for a legacy v1 entry: dropped → cache miss.
    mockGetMetadata.mockResolvedValue(undefined);
    mockExtract.mockResolvedValue({ artist: "Extracted" });
    mockCacheMetadataBatch.mockResolvedValue(undefined);

    const mod = await loadModule();
    await mod.connectLocalFolder();
    await mod.enrichLocalTracks();

    expect(mockExtract).toHaveBeenCalledTimes(1);
    const batchArg = mockCacheMetadataBatch.mock.calls[0][0] as Record<string, unknown>; // type-safety-ok: mock-call introspection in test
    expect(batchArg["song.mp3"]).toEqual({
      tags: { artist: "Extracted" },
      size: 8,
      lastModified: 1000,
    });
  });

  it("bounded enrichment over many files: entry-set identical to unbounded (cached excluded, uncached extracted)", async () => {
    // 40 files > ENRICH_READ_CONCURRENCY (16) so multiple windows run.
    const entries = Array.from({ length: 40 }, (_, i) => fileEntry(`track${i}.mp3`, 1000 + i));
    const handle = fakeDir(entries);
    connectDir(handle);

    // Even-indexed files are already cached; odd-indexed are uncached.
    const preCached = new Set<string>();
    const uncached = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const name = `track${i}.mp3`;
      if (i % 2 === 0) preCached.add(name);
      else uncached.add(name);
    }

    mockGetMetadata.mockImplementation(async (name: string) =>
      preCached.has(name) ? { artist: "cached" } : undefined,
    );
    mockExtract.mockResolvedValue({ artist: "fresh" });
    mockCacheMetadataBatch.mockResolvedValue(undefined);

    const mod = await loadModule();
    await mod.connectLocalFolder();
    await mod.enrichLocalTracks();

    // Exactly one batched write.
    expect(mockCacheMetadataBatch).toHaveBeenCalledTimes(1);
    const batchArg = mockCacheMetadataBatch.mock.calls[0][0] as Record<string, unknown>; // type-safety-ok: mock-call introspection in test

    // Batch key set equals the uncached set exactly (cached excluded).
    expect(new Set(Object.keys(batchArg))).toEqual(uncached);
    for (const name of preCached) {
      expect(name in batchArg).toBe(false);
    }
    // Each uncached entry carries its extracted tag.
    for (const name of uncached) {
      expect(batchArg[name]).toEqual({ artist: "fresh" });
    }
  });
});
