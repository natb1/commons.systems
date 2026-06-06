import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

if (typeof globalThis.reportError !== "function") {
  globalThis.reportError = () => {};
}

vi.mock("firebase/storage", () => ({
  ref: (_storage: unknown, path: string) => ({ path }),
  getDownloadURL: vi.fn(async (r: { path: string }) => `https://files.test/${r.path}`),
}));

import { getDownloadURL } from "firebase/storage";
import { createLruBlobCache } from "@commons-systems/idbutil/lru-blob-cache";
import {
  createFirebaseMediaSource,
  type MediaQueries,
} from "../src/firebase";

interface TestItem {
  id: string;
  addedAt: string;
  storagePath: string;
  title: string;
}

const ITEM: TestItem = {
  id: "a1",
  addedAt: "2026-01-01T00:00:00Z",
  storagePath: "books/a1.pdf",
  title: "A",
};

let cacheCounter = 0;
function freshCache() {
  return createLruBlobCache({ name: `mediautil-test-${++cacheCounter}`, version: 1 });
}

function fakeQueries(): MediaQueries<TestItem> {
  return {
    getPublicMedia: vi.fn(async () => [ITEM]),
    getAllAccessibleMedia: vi.fn(async (_email: string) => [ITEM, { ...ITEM, id: "a2" }]),
    getMediaItem: vi.fn(async (id: string) => (id === ITEM.id ? ITEM : null)),
  };
}

function makeSource(
  opts: { viewerEmail?: () => string | null; queries?: MediaQueries<TestItem> } = {},
) {
  const cache = freshCache();
  const queries = opts.queries ?? fakeQueries();
  const source = createFirebaseMediaSource<TestItem>({
    queries,
    cache,
    storage: {} as never,
    storageNamespace: "print",
    viewerEmail: opts.viewerEmail,
  });
  return { source, queries, cache };
}

beforeEach(() => {
  vi.mocked(getDownloadURL).mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("list", () => {
  it("returns public media when no viewer email", async () => {
    const { source, queries } = makeSource();
    const items = await source.list();
    expect(queries.getPublicMedia).toHaveBeenCalledOnce();
    expect(queries.getAllAccessibleMedia).not.toHaveBeenCalled();
    expect(items).toEqual([ITEM]);
  });

  it("returns all accessible media for an authenticated viewer", async () => {
    const { source, queries } = makeSource({ viewerEmail: () => "u@test" });
    const items = await source.list();
    expect(queries.getAllAccessibleMedia).toHaveBeenCalledWith("u@test");
    expect(queries.getPublicMedia).not.toHaveBeenCalled();
    expect(items).toHaveLength(2);
  });

  it("treats a null viewer email as public", async () => {
    const { source, queries } = makeSource({ viewerEmail: () => null });
    await source.list();
    expect(queries.getPublicMedia).toHaveBeenCalledOnce();
  });
});

describe("metadata", () => {
  it("returns the item by id", async () => {
    const { source } = makeSource();
    expect(await source.metadata("a1")).toEqual(ITEM);
  });

  it("returns null for an unknown id", async () => {
    const { source } = makeSource();
    expect(await source.metadata("nope")).toBeNull();
  });
});

describe("resolveToBlob", () => {
  function stubFetch(body: ArrayBuffer, ok = true, status = 200) {
    const f = vi.fn(async () => ({ ok, status, arrayBuffer: async () => body }));
    vi.stubGlobal("fetch", f);
    return f;
  }

  it("fetches via the namespaced storage path on a cache miss, then caches", async () => {
    const { source, cache } = makeSource();
    const body = new TextEncoder().encode("pdf-bytes").buffer;
    const f = stubFetch(body);

    const out = await source.resolveToBlob(ITEM);

    expect(getDownloadURL).toHaveBeenCalledWith({ path: "print/books/a1.pdf" });
    expect(f).toHaveBeenCalledWith("https://files.test/print/books/a1.pdf");
    expect(new Uint8Array(out)).toEqual(new Uint8Array(body));
    expect(await cache.getEntry<ArrayBuffer>("print/books/a1.pdf")).not.toBeNull();
  });

  it("returns cached bytes without fetching on a cache hit", async () => {
    const { source, cache } = makeSource();
    const cached = new TextEncoder().encode("cached").buffer;
    await cache.putEntry("print/books/a1.pdf", cached);
    const f = stubFetch(new ArrayBuffer(0));

    const out = await source.resolveToBlob(ITEM);

    expect(f).not.toHaveBeenCalled();
    expect(getDownloadURL).not.toHaveBeenCalled();
    expect(new Uint8Array(out)).toEqual(new Uint8Array(cached));
  });

  it("throws when the fetch response is not ok", async () => {
    const { source } = makeSource();
    stubFetch(new ArrayBuffer(0), false, 404);
    await expect(source.resolveToBlob(ITEM)).rejects.toThrow("Media fetch failed: 404 (books/a1.pdf)");
  });
});
