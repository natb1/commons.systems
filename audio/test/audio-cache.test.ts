import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  MAX_CACHE_BYTES,
  getFile,
  putFile,
  clearCache,
  closeDb,
  getCacheStats,
} from "../src/audio-cache";

beforeEach(async () => {
  await closeDb();
  const req = indexedDB.deleteDatabase("audio-media-cache");
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

    await putFile("tracks/song.mp3", buf);
    const result = await getFile("tracks/song.mp3");

    expect(result).not.toBeNull();
    expect(new Uint8Array(result!)).toEqual(view);
  });

  it("returns null for a cache miss", async () => {
    const result = await getFile("nonexistent/path.mp3");
    expect(result).toBeNull();
  });

  it("overwrites an existing entry with the same key", async () => {
    const buf1 = new ArrayBuffer(4);
    new Uint8Array(buf1).set([10, 20, 30, 40]);
    const buf2 = new ArrayBuffer(4);
    new Uint8Array(buf2).set([50, 60, 70, 80]);

    await putFile("tracks/song.mp3", buf1);
    await putFile("tracks/song.mp3", buf2);

    const result = await getFile("tracks/song.mp3");
    expect(new Uint8Array(result!)).toEqual(new Uint8Array([50, 60, 70, 80]));
  });
});

describe("LRU eviction", () => {
  it("evicts the oldest-accessed entry when cache exceeds MAX_CACHE_BYTES", { timeout: 30_000 }, async () => {
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

describe("lastAccessed update on get", () => {
  it("touching an entry via getFile prevents its eviction", { timeout: 30_000 }, async () => {
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

describe("clearCache", () => {
  it("removes all entries", async () => {
    await putFile("a.bin", new ArrayBuffer(32));
    await putFile("b.bin", new ArrayBuffer(32));

    await clearCache();

    expect(await getFile("a.bin")).toBeNull();
    expect(await getFile("b.bin")).toBeNull();
  });
});

describe("getCacheStats", () => {
  it("returns correct track count and total bytes", async () => {
    await putFile("a.bin", new ArrayBuffer(100));
    await putFile("b.bin", new ArrayBuffer(200));
    await putFile("c.bin", new ArrayBuffer(300));

    const stats = await getCacheStats();
    expect(stats.trackCount).toBe(3);
    expect(stats.totalBytes).toBe(600);
  });

  it("returns zeros on empty cache", async () => {
    const stats = await getCacheStats();
    expect(stats.trackCount).toBe(0);
    expect(stats.totalBytes).toBe(0);
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
