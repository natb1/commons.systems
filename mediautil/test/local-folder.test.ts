import { describe, it, expect } from "vitest";
import {
  createLocalFolderMediaSource,
  MediaItemMissingError,
  type LocalFolderEntry,
} from "../src/local-folder";

interface TestItem {
  id: string;
  addedAt: string;
  name: string;
}

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

function makeSource(
  entries: FakeEntry[],
  files: Record<string, ArrayBuffer> = {},
) {
  return createLocalFolderMediaSource<TestItem>({
    directoryHandle: fakeDir(entries, files),
    accept: (n) => n.endsWith(".mp3"),
    toItem: (entry: LocalFolderEntry): TestItem => ({
      id: "local:" + entry.name,
      addedAt: new Date(entry.lastModified).toISOString(),
      name: entry.name,
    }),
    fileName: (i) => i.name,
  });
}

function fileEntry(name: string, lastModified: number): FakeEntry {
  return {
    kind: "file",
    name,
    getFile: async () => ({ lastModified, arrayBuffer: async () => bytes(name) }),
  };
}

describe("list", () => {
  it("filters out non-file entries and names rejected by accept", async () => {
    const source = makeSource([
      fileEntry("song.mp3", 1000),
      { kind: "directory", name: "subfolder" },
      fileEntry("notes.txt", 2000),
    ]);
    const items = await source.list();
    expect(items.map((i) => i.name)).toEqual(["song.mp3"]);
  });

  it("returns items newest-first by addedAt", async () => {
    const source = makeSource([
      fileEntry("old.mp3", 1000),
      fileEntry("new.mp3", 3000),
      fileEntry("mid.mp3", 2000),
    ]);
    const items = await source.list();
    expect(items.map((i) => i.name)).toEqual(["new.mp3", "mid.mp3", "old.mp3"]);
  });

  it("skips a file that vanishes mid-scan without failing the listing", async () => {
    const source = makeSource([
      fileEntry("ok.mp3", 1000),
      {
        kind: "file",
        name: "gone.mp3",
        getFile: async () => {
          throw new Error("vanished");
        },
      },
    ]);
    const items = await source.list();
    expect(items.map((i) => i.name)).toEqual(["ok.mp3"]);
  });
});

describe("metadata", () => {
  it("returns the matching item by id", async () => {
    const source = makeSource([fileEntry("song.mp3", 1000)]);
    const item = await source.metadata("local:song.mp3");
    expect(item?.name).toBe("song.mp3");
  });

  it("returns null for an unknown id", async () => {
    const source = makeSource([fileEntry("song.mp3", 1000)]);
    expect(await source.metadata("local:missing.mp3")).toBeNull();
  });
});

describe("resolveToBlob", () => {
  it("returns the file's bytes", async () => {
    const body = bytes("audio-bytes");
    const source = makeSource([fileEntry("song.mp3", 1000)], { "song.mp3": body });
    const item = await source.metadata("local:song.mp3");
    const out = await source.resolveToBlob(item!);
    expect(new Uint8Array(out)).toEqual(new Uint8Array(body));
  });

  it("maps a NotFoundError to MediaItemMissingError carrying the file name", async () => {
    const source = makeSource([fileEntry("song.mp3", 1000)]);
    const item: TestItem = {
      id: "local:gone.mp3",
      addedAt: new Date(1000).toISOString(),
      name: "gone.mp3",
    };
    await expect(source.resolveToBlob(item)).rejects.toBeInstanceOf(
      MediaItemMissingError,
    );
    try {
      await source.resolveToBlob(item);
      expect.unreachable("resolveToBlob should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(MediaItemMissingError);
      expect((err as MediaItemMissingError).fileName).toBe("gone.mp3");
    }
  });
});
