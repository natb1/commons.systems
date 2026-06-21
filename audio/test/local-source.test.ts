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
    lastModified: number;
    arrayBuffer: () => Promise<ArrayBuffer>;
  }>;
}

function bytes(s: string): ArrayBuffer {
  return new TextEncoder().encode(s).buffer;
}

function fileEntry(name: string, lastModified: number): FakeEntry {
  return {
    kind: "file",
    name,
    getFile: async () => ({ lastModified, arrayBuffer: async () => bytes(name) }),
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

describe("resolveLocalBytes", () => {
  it("returns the bytes for a listed local item", async () => {
    const handle = fakeDir([fileEntry("tune.flac", 3000)]);
    (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker = // type-safety-ok: test stubs window.showDirectoryPicker global
      vi.fn().mockResolvedValue(handle);
    fakeStore.put.mockResolvedValue(undefined);

    const mod = await loadModule();
    await mod.connectLocalFolder();

    const buf = await mod.resolveLocalBytes({
      id: "local:tune.flac",
    } as LibraryItem); // type-safety-ok: partial LibraryItem fixture for test
    expect(buf).not.toBeNull();
    expect(new TextDecoder().decode(buf!)).toBe("tune.flac"); // type-safety-ok: buffer asserted non-null on the preceding line
  });

  it("returns null (not a throw) when the item is no longer present", async () => {
    const handle = fakeDir([fileEntry("tune.flac", 3000)]);
    (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker = // type-safety-ok: test stubs window.showDirectoryPicker global
      vi.fn().mockResolvedValue(handle);
    fakeStore.put.mockResolvedValue(undefined);

    const mod = await loadModule();
    await mod.connectLocalFolder();

    const buf = await mod.resolveLocalBytes({
      id: "local:missing.flac",
    } as LibraryItem); // type-safety-ok: partial LibraryItem fixture for test
    expect(buf).toBeNull();
    expect(mockLogError).toHaveBeenCalledWith(expect.anything(), {
      operation: "resolve-local-bytes",
    });
  });

  it("returns null when no folder is connected", async () => {
    const mod = await loadModule();
    const buf = await mod.resolveLocalBytes({
      id: "local:tune.flac",
    } as LibraryItem); // type-safety-ok: partial LibraryItem fixture for test
    expect(buf).toBeNull();
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

    // Cache returns tags for song.mp3
    mockGetMetadata.mockImplementation(async (name: string) => {
      if (name === "song.mp3") return { artist: "Real Artist", duration: 100 };
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
    const handle = fakeDir([fileEntry("song.mp3", 1000), fileEntry("tune.flac", 2000)]);
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
    // Single batched write
    expect(mockCacheMetadataBatch).toHaveBeenCalledTimes(1);
    const batchArg = mockCacheMetadataBatch.mock.calls[0][0] as Record<string, unknown>; // type-safety-ok: mock-call introspection in test
    expect(batchArg["song.mp3"]).toEqual({ artist: "X" });
    expect(batchArg["tune.flac"]).toEqual({ artist: "X" });
  });

  it("focus-rescan write suppression: all cached → cacheMetadataBatch called with {}", async () => {
    const handle = fakeDir([fileEntry("song.mp3", 1000)]);
    connectDir(handle);

    // Everything already cached (even an empty entry signals 'present')
    mockGetMetadata.mockResolvedValue({});
    mockCacheMetadataBatch.mockResolvedValue(undefined);

    const mod = await loadModule();
    await mod.connectLocalFolder();
    await mod.enrichLocalTracks();

    // extract was never called (all cached)
    expect(mockExtract).not.toHaveBeenCalled();
    // cacheMetadataBatch called with empty (real impl no-ops; mock records the call)
    expect(mockCacheMetadataBatch).toHaveBeenCalledWith({});
  });

  it("unreadable file is not included in the batch (null bytes → retry later)", async () => {
    // Build a dir where song.mp3's getFile rejects
    const failingEntry: FakeEntry = {
      kind: "file",
      name: "song.mp3",
      getFile: async () => {
        throw new Error("read error");
      },
    };
    const goodEntry = fileEntry("tune.flac", 2000);
    const handle = fakeDir([failingEntry, goodEntry]);
    connectDir(handle);

    mockGetMetadata.mockResolvedValue(undefined);
    mockExtract.mockResolvedValue({ artist: "Y" });
    mockCacheMetadataBatch.mockResolvedValue(undefined);

    const mod = await loadModule();
    await mod.connectLocalFolder();
    await mod.enrichLocalTracks();

    // batch arg must not include the failing file
    const batchArg = mockCacheMetadataBatch.mock.calls[0][0] as Record<string, unknown>; // type-safety-ok: mock-call introspection in test
    expect("song.mp3" in batchArg).toBe(false);
    // good file is present
    expect(batchArg["tune.flac"]).toEqual({ artist: "Y" });
  });
});
