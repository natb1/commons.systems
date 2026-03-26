import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  MAX_CACHE_BYTES,
  getFile,
  putFile,
  getChunk,
  putChunk,
  clearCache,
  closeDb,
} from "../src/media-cache";

beforeEach(async () => {
  await closeDb();
  const req = indexedDB.deleteDatabase("print-media-cache");
  await new Promise<void>((resolve) => {
    req.onsuccess = () => resolve();
  });
});

afterEach(async () => {
  await closeDb();
});

describe("putFile / getFile round-trip", () => {
  it("stores and retrieves an ArrayBuffer", async () => {
    const buf = new ArrayBuffer(64);
    const view = new Uint8Array(buf);
    view.set([1, 2, 3, 4]);

    await putFile("images/photo.jpg", buf);
    const result = await getFile("images/photo.jpg");

    expect(result).not.toBeNull();
    expect(new Uint8Array(result!)).toEqual(view);
  });

  it("returns null for a cache miss", async () => {
    const result = await getFile("nonexistent/path.png");
    expect(result).toBeNull();
  });

  it("overwrites an existing entry with the same key", async () => {
    const buf1 = new ArrayBuffer(4);
    new Uint8Array(buf1).set([10, 20, 30, 40]);
    const buf2 = new ArrayBuffer(4);
    new Uint8Array(buf2).set([50, 60, 70, 80]);

    await putFile("images/photo.jpg", buf1);
    await putFile("images/photo.jpg", buf2);

    const result = await getFile("images/photo.jpg");
    expect(new Uint8Array(result!)).toEqual(new Uint8Array([50, 60, 70, 80]));
  });
});

describe("putChunk / getChunk round-trip", () => {
  it("stores and retrieves a chunk", async () => {
    const data = new Uint8Array([10, 20, 30, 40, 50]);
    await putChunk("archive.zip", 0, 5, data);

    const result = await getChunk("archive.zip", 0, 5);
    expect(result).not.toBeNull();
    expect(result!).toEqual(data);
  });

  it("returns null for a chunk cache miss", async () => {
    const result = await getChunk("archive.zip", 0, 100);
    expect(result).toBeNull();
  });

  it("stores chunks with different offsets independently", async () => {
    const chunk1 = new Uint8Array([1, 2, 3]);
    const chunk2 = new Uint8Array([4, 5, 6]);

    await putChunk("archive.zip", 0, 3, chunk1);
    await putChunk("archive.zip", 3, 3, chunk2);

    const result1 = await getChunk("archive.zip", 0, 3);
    const result2 = await getChunk("archive.zip", 3, 3);

    expect(result1!).toEqual(chunk1);
    expect(result2!).toEqual(chunk2);
  });

  it("stores chunks with different lengths independently", async () => {
    const chunk1 = new Uint8Array([1, 2]);
    const chunk2 = new Uint8Array([1, 2, 3, 4]);

    await putChunk("archive.zip", 0, 2, chunk1);
    await putChunk("archive.zip", 0, 4, chunk2);

    const result1 = await getChunk("archive.zip", 0, 2);
    const result2 = await getChunk("archive.zip", 0, 4);

    expect(result1!).toEqual(chunk1);
    expect(result2!).toEqual(chunk2);
  });

  it("returns null when path matches but offset differs", async () => {
    const data = new Uint8Array([1, 2, 3]);
    await putChunk("archive.zip", 0, 3, data);

    const result = await getChunk("archive.zip", 10, 3);
    expect(result).toBeNull();
  });
});

describe("lastAccessed update on get", () => {
  it("touching an entry via getFile prevents its eviction", { timeout: 30_000 }, async () => {
    // Use entries that together exceed MAX_CACHE_BYTES so the third put
    // triggers eviction. Entry A (200MB) + Entry B (200MB) = 400MB < 500MB.
    // Then touch A so B becomes the oldest. Put C (200MB) => total would be
    // 600MB, so eviction removes B (oldest accessed) first.
    const sizeA = 200 * 1024 * 1024;
    const sizeB = 200 * 1024 * 1024;
    const sizeC = 200 * 1024 * 1024;

    const bufA = new ArrayBuffer(sizeA);
    const bufB = new ArrayBuffer(sizeB);
    const bufC = new ArrayBuffer(sizeC);

    // Stagger timestamps so lastAccessed ordering is deterministic
    vi.spyOn(Date, "now").mockReturnValue(1000);
    await putFile("a.bin", bufA);

    vi.mocked(Date.now).mockReturnValue(2000);
    await putFile("b.bin", bufB);

    // Touch A — moves its lastAccessed ahead of B
    vi.mocked(Date.now).mockReturnValue(3000);
    await getFile("a.bin");

    // Put C — triggers eviction. B (lastAccessed=2000) is oldest, so B is evicted.
    vi.mocked(Date.now).mockReturnValue(4000);
    await putFile("c.bin", bufC);

    // A should survive, B should be evicted
    const resultA = await getFile("a.bin");
    const resultB = await getFile("b.bin");

    expect(resultA).not.toBeNull();
    expect(resultB).toBeNull();

    vi.restoreAllMocks();
  });
});

describe("LRU eviction", () => {
  it("evicts the oldest-accessed file entry when cache exceeds MAX_CACHE_BYTES", { timeout: 30_000 }, async () => {
    const size = 300 * 1024 * 1024;
    const buf1 = new ArrayBuffer(size);
    const buf2 = new ArrayBuffer(size);

    vi.spyOn(Date, "now").mockReturnValue(1000);
    await putFile("first.bin", buf1);

    vi.mocked(Date.now).mockReturnValue(2000);
    await putFile("second.bin", buf2);

    // first.bin should have been evicted (300 + 300 = 600 > 500)
    const result1 = await getFile("first.bin");
    const result2 = await getFile("second.bin");

    expect(result1).toBeNull();
    expect(result2).not.toBeNull();

    vi.restoreAllMocks();
  });

  it("evicts the oldest-accessed chunk entry when cache exceeds MAX_CACHE_BYTES", { timeout: 30_000 }, async () => {
    const size = 300 * 1024 * 1024;
    const chunk1 = new Uint8Array(size);
    const chunk2 = new Uint8Array(size);

    vi.spyOn(Date, "now").mockReturnValue(1000);
    await putChunk("file.bin", 0, size, chunk1);

    vi.mocked(Date.now).mockReturnValue(2000);
    await putChunk("file.bin", size, size, chunk2);

    const result1 = await getChunk("file.bin", 0, size);
    const result2 = await getChunk("file.bin", size, size);

    expect(result1).toBeNull();
    expect(result2).not.toBeNull();

    vi.restoreAllMocks();
  });

  it("evicts multiple entries if needed to fit incoming data", { timeout: 30_000 }, async () => {
    const size = 200 * 1024 * 1024;
    const bufA = new ArrayBuffer(size);
    const bufB = new ArrayBuffer(size);
    const bigBuf = new ArrayBuffer(400 * 1024 * 1024);

    vi.spyOn(Date, "now").mockReturnValue(1000);
    await putFile("a.bin", bufA);

    vi.mocked(Date.now).mockReturnValue(2000);
    await putFile("b.bin", bufB);

    // 200 + 200 + 400 = 800 > 500, need to free 300MB, so both a and b evicted
    vi.mocked(Date.now).mockReturnValue(3000);
    await putFile("big.bin", bigBuf);

    expect(await getFile("a.bin")).toBeNull();
    expect(await getFile("b.bin")).toBeNull();
    expect(await getFile("big.bin")).not.toBeNull();

    vi.restoreAllMocks();
  });

  it("does not evict when cache has room", async () => {
    const size = 100 * 1024 * 1024;
    const buf1 = new ArrayBuffer(size);
    const buf2 = new ArrayBuffer(size);

    await putFile("a.bin", buf1);
    await putFile("b.bin", buf2);

    // 100 + 100 = 200 < 500, no eviction
    expect(await getFile("a.bin")).not.toBeNull();
    expect(await getFile("b.bin")).not.toBeNull();
  });
});

describe("clearCache", () => {
  it("removes all file entries", async () => {
    await putFile("a.bin", new ArrayBuffer(32));
    await putFile("b.bin", new ArrayBuffer(32));
    await putChunk("c.bin", 0, 16, new Uint8Array(16));

    await clearCache();

    expect(await getFile("a.bin")).toBeNull();
    expect(await getFile("b.bin")).toBeNull();
    expect(await getChunk("c.bin", 0, 16)).toBeNull();
  });
});

describe("closeDb", () => {
  it("allows re-opening the database after close", async () => {
    const buf = new ArrayBuffer(8);
    new Uint8Array(buf).set([99, 88, 77]);

    await putFile("test.bin", buf);
    await closeDb();

    // Operations should work again after closeDb
    const result = await getFile("test.bin");
    expect(result).not.toBeNull();
    expect(new Uint8Array(result!).slice(0, 3)).toEqual(
      new Uint8Array([99, 88, 77]),
    );
  });

  it("is safe to call multiple times", async () => {
    await closeDb();
    await closeDb();
    // Should not throw; subsequent operations still work
    await putFile("test.bin", new ArrayBuffer(4));
    expect(await getFile("test.bin")).not.toBeNull();
  });
});

describe("MAX_CACHE_BYTES", () => {
  it("equals 500MB", () => {
    expect(MAX_CACHE_BYTES).toBe(500 * 1024 * 1024);
  });
});
