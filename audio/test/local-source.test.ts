import { describe, it, expect, vi, beforeEach } from "vitest";

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
  it("zero-click when permission is already granted", async () => {
    fakeStore.get.mockResolvedValue(fakeDir([]));
    fakeStore.queryPermission.mockResolvedValue("granted");
    const mod = await loadModule();
    await mod.ensureLocalFolderRestored();
    expect(mod.getLocalFolderState()).toBe("granted");
    expect(mod.hasLocalFolder()).toBe(true);
    expect(fakeStore.requestPermission).not.toHaveBeenCalled();
    expect(fakeStore.ensurePermission).not.toHaveBeenCalled();
  });

  it("does not request permission at startup when in prompt state", async () => {
    fakeStore.get.mockResolvedValue(fakeDir([]));
    fakeStore.queryPermission.mockResolvedValue("prompt");
    const mod = await loadModule();
    await mod.ensureLocalFolderRestored();
    expect(mod.getLocalFolderState()).toBe("prompt");
    expect(mod.hasLocalFolder()).toBe(false);
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
  it("returns true and connects when permission is granted", async () => {
    fakeStore.get.mockResolvedValue(fakeDir([]));
    fakeStore.ensurePermission.mockResolvedValue("granted");
    const mod = await loadModule();
    expect(await mod.regrantLocalFolder()).toBe(true);
    expect(mod.getLocalFolderState()).toBe("granted");
    expect(mod.hasLocalFolder()).toBe(true);
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
    expect(fakeStore.put).toHaveBeenCalledWith("library-folder", handle);
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
