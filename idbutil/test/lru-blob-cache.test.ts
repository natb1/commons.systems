import "fake-indexeddb/auto";
import { describe, it, expect, vi } from "vitest";

if (typeof globalThis.reportError !== "function") {
  globalThis.reportError = () => {};
}

import { createLruBlobCache } from "../src/lru-blob-cache";

let testCounter = 0;
function uniqueDbName() {
  return `lru-blob-cache-test-${++testCounter}`;
}

async function deleteDb(name: string): Promise<void> {
  const req = indexedDB.deleteDatabase(name);
  await new Promise<void>((resolve, reject) => {
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error(`delete blocked: ${name}`));
  });
}

describe("getEntry / putEntry round-trip", () => {
  it("stores and retrieves an ArrayBuffer", async () => {
    const cache = createLruBlobCache({ name: uniqueDbName(), version: 1 });
    const buf = new ArrayBuffer(64);
    new Uint8Array(buf).set([1, 2, 3, 4]);

    await cache.putEntry("k1", buf);
    const result = await cache.getEntry("k1");

    expect(result).not.toBeNull();
    expect(new Uint8Array(result as ArrayBuffer).slice(0, 4))
      .toEqual(new Uint8Array([1, 2, 3, 4]));

    await cache.closeDb();
  });

  it("stores and retrieves a Uint8Array", async () => {
    const cache = createLruBlobCache({ name: uniqueDbName(), version: 1 });
    const data = new Uint8Array([10, 20, 30, 40, 50]);

    await cache.putEntry("chunk:0:5", data);
    const result = await cache.getEntry("chunk:0:5");

    expect(result).not.toBeNull();
    expect(result as Uint8Array).toEqual(data);

    await cache.closeDb();
  });

  it("returns null for a cache miss", async () => {
    const cache = createLruBlobCache({ name: uniqueDbName(), version: 1 });
    expect(await cache.getEntry("missing")).toBeNull();
    await cache.closeDb();
  });

  it("overwrites an existing entry and updates totalBytes", async () => {
    const cache = createLruBlobCache({ name: uniqueDbName(), version: 1 });
    await cache.putEntry("k", new ArrayBuffer(100));
    expect((await cache.getStats()).totalBytes).toBe(100);

    await cache.putEntry("k", new ArrayBuffer(250));
    const stats = await cache.getStats();
    expect(stats.totalBytes).toBe(250);
    expect(stats.entryCount).toBe(1);

    await cache.closeDb();
  });
});

describe("LRU eviction", () => {
  it("evicts the oldest-accessed entry when cache exceeds maxBytes", { timeout: 30_000 }, async () => {
    const cache = createLruBlobCache({ name: uniqueDbName(), version: 1 });
    const size = 300 * 1024 * 1024;

    vi.spyOn(Date, "now").mockReturnValue(1000);
    await cache.putEntry("first", new ArrayBuffer(size));

    vi.mocked(Date.now).mockReturnValue(2000);
    await cache.putEntry("second", new ArrayBuffer(size));

    expect(await cache.getEntry("first")).toBeNull();
    expect(await cache.getEntry("second")).not.toBeNull();

    vi.restoreAllMocks();
    await cache.closeDb();
  });

  it("evicts multiple entries when one large put requires it", { timeout: 30_000 }, async () => {
    const cache = createLruBlobCache({ name: uniqueDbName(), version: 1 });
    const small = 200 * 1024 * 1024;

    vi.spyOn(Date, "now").mockReturnValue(1000);
    await cache.putEntry("a", new ArrayBuffer(small));

    vi.mocked(Date.now).mockReturnValue(2000);
    await cache.putEntry("b", new ArrayBuffer(small));

    vi.mocked(Date.now).mockReturnValue(3000);
    await cache.putEntry("big", new ArrayBuffer(400 * 1024 * 1024));

    expect(await cache.getEntry("a")).toBeNull();
    expect(await cache.getEntry("b")).toBeNull();
    expect(await cache.getEntry("big")).not.toBeNull();

    vi.restoreAllMocks();
    await cache.closeDb();
  });

  it("touching an entry via getEntry prevents its eviction", { timeout: 30_000 }, async () => {
    const cache = createLruBlobCache({ name: uniqueDbName(), version: 1 });
    const size = 200 * 1024 * 1024;

    vi.spyOn(Date, "now").mockReturnValue(1000);
    await cache.putEntry("a", new ArrayBuffer(size));

    vi.mocked(Date.now).mockReturnValue(2000);
    await cache.putEntry("b", new ArrayBuffer(size));

    vi.mocked(Date.now).mockReturnValue(3000);
    await cache.getEntry("a");

    vi.mocked(Date.now).mockReturnValue(4000);
    await cache.putEntry("c", new ArrayBuffer(size));

    expect(await cache.getEntry("a")).not.toBeNull();
    expect(await cache.getEntry("b")).toBeNull();

    vi.restoreAllMocks();
    await cache.closeDb();
  });

  it("does not evict when cache has room", async () => {
    const cache = createLruBlobCache({ name: uniqueDbName(), version: 1 });
    await cache.putEntry("a", new ArrayBuffer(100));
    await cache.putEntry("b", new ArrayBuffer(100));

    expect(await cache.getEntry("a")).not.toBeNull();
    expect(await cache.getEntry("b")).not.toBeNull();

    await cache.closeDb();
  });

  it("honors a custom maxBytes override", async () => {
    const cache = createLruBlobCache({
      name: uniqueDbName(),
      version: 1,
      maxBytes: 1024,
    });
    expect(cache.maxBytes).toBe(1024);

    vi.spyOn(Date, "now").mockReturnValue(1000);
    await cache.putEntry("a", new ArrayBuffer(700));

    vi.mocked(Date.now).mockReturnValue(2000);
    await cache.putEntry("b", new ArrayBuffer(700));

    expect(await cache.getEntry("a")).toBeNull();
    expect(await cache.getEntry("b")).not.toBeNull();

    vi.restoreAllMocks();
    await cache.closeDb();
  });
});

describe("clearCache", () => {
  it("empties both stores", async () => {
    const cache = createLruBlobCache({ name: uniqueDbName(), version: 1 });
    await cache.putEntry("a", new ArrayBuffer(32));
    await cache.putEntry("b", new ArrayBuffer(32));

    await cache.clearCache();

    expect(await cache.getEntry("a")).toBeNull();
    expect(await cache.getEntry("b")).toBeNull();
    const stats = await cache.getStats();
    expect(stats.entryCount).toBe(0);
    expect(stats.totalBytes).toBe(0);

    await cache.closeDb();
  });
});

describe("closeDb", () => {
  it("is idempotent and allows reopening", async () => {
    const name = uniqueDbName();
    const cache = createLruBlobCache({ name, version: 1 });
    await cache.putEntry("k", new ArrayBuffer(8));
    await cache.closeDb();
    await cache.closeDb();
    await cache.closeDb();

    expect(await cache.getEntry("k")).not.toBeNull();
    await cache.closeDb();
  });
});

describe("getStats", () => {
  it("returns correct entry count and total bytes", async () => {
    const cache = createLruBlobCache({ name: uniqueDbName(), version: 1 });
    await cache.putEntry("a", new ArrayBuffer(100));
    await cache.putEntry("b", new ArrayBuffer(200));
    await cache.putEntry("c", new ArrayBuffer(300));

    const stats = await cache.getStats();
    expect(stats.entryCount).toBe(3);
    expect(stats.totalBytes).toBe(600);

    await cache.closeDb();
  });

  it("returns zeros on empty cache", async () => {
    const cache = createLruBlobCache({ name: uniqueDbName(), version: 1 });
    const stats = await cache.getStats();
    expect(stats.entryCount).toBe(0);
    expect(stats.totalBytes).toBe(0);
    await cache.closeDb();
  });

  it("excludes the __total__ sentinel from entryCount", async () => {
    const cache = createLruBlobCache({ name: uniqueDbName(), version: 1 });
    await cache.putEntry("only", new ArrayBuffer(42));
    const stats = await cache.getStats();
    expect(stats.entryCount).toBe(1);
    await cache.closeDb();
  });
});

describe("onUpgrade hook", () => {
  it("runs on first open with oldVersion=0", async () => {
    const onUpgrade = vi.fn();
    const cache = createLruBlobCache({
      name: uniqueDbName(),
      version: 1,
      onUpgrade,
    });
    await cache.putEntry("k", new ArrayBuffer(4));
    expect(onUpgrade).toHaveBeenCalledTimes(1);
    expect(onUpgrade).toHaveBeenCalledWith(expect.any(IDBDatabase), 0);
    await cache.closeDb();
  });

  it("runs before shared stores are ensured (legacy store can be dropped on v1→v2 upgrade)", async () => {
    const name = uniqueDbName();
    // Seed a v1 schema with a legacy "media" store.
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open(name, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore("media", { keyPath: "key" });
      };
      req.onsuccess = () => { req.result.close(); resolve(); };
      req.onerror = () => reject(req.error);
    });

    const onUpgrade = vi.fn((db: IDBDatabase, oldVersion: number) => {
      if (oldVersion < 2 && db.objectStoreNames.contains("media")) {
        db.deleteObjectStore("media");
      }
    });

    const cache = createLruBlobCache({ name, version: 2, onUpgrade });
    await cache.putEntry("k", new ArrayBuffer(4));

    expect(onUpgrade).toHaveBeenCalledWith(expect.any(IDBDatabase), 1);
    // Confirm legacy store is gone and the cache works.
    const result = await cache.getEntry("k");
    expect(result).not.toBeNull();

    await cache.closeDb();
    await deleteDb(name);
  });
});
