import { describe, it, expect, vi, beforeEach } from "vitest";
import { seedStorage } from "../src/seed-storage.js";
import type { StorageSeedItem, SeedStorageOptions } from "../src/seed-storage.js";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

function makeOpts(overrides?: Partial<SeedStorageOptions>): SeedStorageOptions {
  return {
    items: [{ path: "audio/test.wav", metadata: { contentType: "audio/wav" }, content: Buffer.from("stub") }],
    bucket: "test-bucket",
    emulatorHost: "localhost:9199",
    ...overrides,
  };
}

function mockExistenceCheck(status: 200 | 404): void {
  mockFetch.mockImplementationOnce((_url: string, opts: RequestInit) => {
    if (opts?.method === "GET") {
      return Promise.resolve({ status, ok: status === 200, text: () => Promise.resolve("") });
    }
    return Promise.reject(new Error("unexpected fetch call"));
  });
}

function mockUpload(ok = true): void {
  mockFetch.mockImplementationOnce(() =>
    Promise.resolve({
      ok,
      status: ok ? 200 : 500,
      text: () => Promise.resolve(ok ? "" : "internal server error"),
    }),
  );
}

function mockSourceFetch(body: Buffer, ok = true): void {
  mockFetch.mockImplementationOnce(() =>
    Promise.resolve({
      ok,
      status: ok ? 200 : 404,
      statusText: ok ? "OK" : "Not Found",
      arrayBuffer: () => Promise.resolve(body.buffer as ArrayBuffer),
      text: () => Promise.resolve(""),
    }),
  );
}

describe("seedStorage", () => {
  // 1. Throws when bucket is empty string
  it("throws when bucket is empty string", async () => {
    await expect(seedStorage(makeOpts({ bucket: "" }))).rejects.toThrow("bucket is required");
  });

  // 2. Throws when emulatorHost is empty string
  it("throws when emulatorHost is empty string", async () => {
    await expect(seedStorage(makeOpts({ emulatorHost: "" }))).rejects.toThrow("emulatorHost is required");
  });

  // 3. Throws when items is empty array
  it("throws when items is empty", async () => {
    await expect(seedStorage(makeOpts({ items: [] }))).rejects.toThrow("items must be a non-empty array");
  });

  // 3b. Throws when an item has neither content nor sourceUrl
  it("throws when an item has neither content nor sourceUrl", async () => {
    const item: StorageSeedItem = { path: "audio/missing.wav", metadata: { contentType: "audio/wav" } };
    mockExistenceCheck(404);
    await expect(seedStorage(makeOpts({ items: [item] }))).rejects.toThrow(
      "audio/missing.wav has neither content nor sourceUrl",
    );
  });

  // 4. Filters out testOnly items when includeTestOnly is false
  it("filters out testOnly items when includeTestOnly is false", async () => {
    const item: StorageSeedItem = {
      path: "audio/test-only.wav",
      metadata: { contentType: "audio/wav" },
      content: Buffer.from("stub"),
      testOnly: true,
    };
    const result = await seedStorage(makeOpts({ items: [item], includeTestOnly: false }));
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result).toEqual({ uploaded: 0, skipped: 0 });
  });

  // 5. Includes testOnly items when includeTestOnly is true
  it("includes testOnly items when includeTestOnly is true", async () => {
    const item: StorageSeedItem = {
      path: "audio/test-only.wav",
      metadata: { contentType: "audio/wav" },
      content: Buffer.from("stub"),
      testOnly: true,
    };
    mockExistenceCheck(404);
    mockUpload();
    const result = await seedStorage(makeOpts({ items: [item], includeTestOnly: true }));
    expect(result.uploaded).toBe(1);
  });

  // 6. Uses content (not sourceUrl) when includeTestOnly is true and both are present
  it("uses content (not sourceUrl) when includeTestOnly is true and both are present", async () => {
    const contentBytes = Buffer.from("stub-content");
    const item: StorageSeedItem = {
      path: "audio/dual.wav",
      metadata: { contentType: "audio/wav" },
      content: contentBytes,
      sourceUrl: "https://example.com/real.wav",
    };
    mockExistenceCheck(404);
    mockUpload();

    await seedStorage(makeOpts({ items: [item], includeTestOnly: true }));

    // The upload call (second fetch) should have a body containing the stub content
    const uploadCall = mockFetch.mock.calls[1];
    const body = uploadCall[1].body as Buffer;
    expect(body.includes(contentBytes)).toBe(true);

    // No fetch to sourceUrl should have been made
    const allUrls = mockFetch.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(allUrls.every((u: string) => !u.includes("example.com"))).toBe(true);
  });

  // 7. Fetches sourceUrl when includeTestOnly is false and sourceUrl is set
  it("fetches sourceUrl when includeTestOnly is false and sourceUrl is set", async () => {
    const item: StorageSeedItem = {
      path: "audio/real.wav",
      metadata: { contentType: "audio/wav" },
      sourceUrl: "https://example.com/real.wav",
    };
    mockExistenceCheck(404);
    mockSourceFetch(Buffer.from("real-audio-data"));
    mockUpload();

    await seedStorage(makeOpts({ items: [item], includeTestOnly: false }));

    const allUrls = mockFetch.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(allUrls.some((u: string) => u.includes("example.com"))).toBe(true);
  });

  // 8. Skips items that already exist (GET 200 → no upload POST)
  it("skips items that already exist", async () => {
    const item: StorageSeedItem = {
      path: "audio/existing.wav",
      metadata: { contentType: "audio/wav" },
      content: Buffer.from("stub"),
    };
    mockExistenceCheck(200);

    const result = await seedStorage(makeOpts({ items: [item] }));

    expect(result.skipped).toBe(1);
    expect(result.uploaded).toBe(0);
    // Only the GET existence check — no upload POST
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][1].method).toBe("GET");
  });

  // 9. Uploads new items (GET 404 → POST to /upload endpoint)
  it("uploads new items: GET 404 triggers POST to upload endpoint", async () => {
    const item: StorageSeedItem = {
      path: "audio/new.wav",
      metadata: { contentType: "audio/wav" },
      content: Buffer.from("stub"),
    };
    mockExistenceCheck(404);
    mockUpload();

    const result = await seedStorage(makeOpts({ items: [item], includeTestOnly: true }));

    expect(result.uploaded).toBe(1);
    expect(result.skipped).toBe(0);

    const uploadCall = mockFetch.mock.calls[1];
    const uploadUrl = uploadCall[0] as string;
    expect(uploadUrl).toContain("/upload/storage/v1/b/test-bucket/o");
    expect(uploadCall[1].method).toBe("POST");
  });

  // 10. Throws on upload failure with response text included in error message
  it("throws on upload failure with response text in error", async () => {
    const item: StorageSeedItem = {
      path: "audio/fail.wav",
      metadata: { contentType: "audio/wav" },
      content: Buffer.from("stub"),
    };
    mockExistenceCheck(404);
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        text: () => Promise.resolve("bucket quota exceeded"),
      }),
    );

    await expect(
      seedStorage(makeOpts({ items: [item], includeTestOnly: true })),
    ).rejects.toThrow("bucket quota exceeded");
  });

  // 11. Accepts string content (markdown case)
  it("accepts string content and uploads correct bytes", async () => {
    const markdownContent = "# heading";
    const item: StorageSeedItem = {
      path: "docs/readme.md",
      metadata: { contentType: "text/markdown" },
      content: markdownContent,
    };
    mockExistenceCheck(404);
    mockUpload();

    const result = await seedStorage(makeOpts({ items: [item], includeTestOnly: true }));

    expect(result.uploaded).toBe(1);
    const uploadCall = mockFetch.mock.calls[1];
    const body = uploadCall[1].body as Buffer;
    const expected = Buffer.from(markdownContent);
    expect(body.includes(expected)).toBe(true);
  });

  // Existence check throws on unexpected status
  it("throws when existence check returns unexpected status", async () => {
    const item: StorageSeedItem = {
      path: "audio/weird.wav",
      metadata: { contentType: "audio/wav" },
      content: Buffer.from("stub"),
    };
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({ status: 403, ok: false, text: () => Promise.resolve("forbidden") }),
    );

    await expect(seedStorage(makeOpts({ items: [item] }))).rejects.toThrow(
      "Unexpected status 403 checking existence of audio/weird.wav",
    );
  });

  // Returns correct counts for mixed skip/upload
  it("returns correct uploaded and skipped counts for a mix of new and existing items", async () => {
    const existing: StorageSeedItem = {
      path: "audio/exists.wav",
      metadata: { contentType: "audio/wav" },
      content: Buffer.from("stub"),
    };
    const newItem: StorageSeedItem = {
      path: "audio/new.wav",
      metadata: { contentType: "audio/wav" },
      content: Buffer.from("stub"),
    };

    // Existence check for both (order is parallel, so mock both)
    mockFetch
      .mockImplementationOnce((_url: string, opts: RequestInit) => {
        void opts;
        return Promise.resolve({ status: 200, ok: true, text: () => Promise.resolve("") });
      })
      .mockImplementationOnce((_url: string, opts: RequestInit) => {
        void opts;
        return Promise.resolve({ status: 404, ok: false, text: () => Promise.resolve("") });
      })
      .mockImplementationOnce(() =>
        Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve("") }),
      );

    const result = await seedStorage(
      makeOpts({ items: [existing, newItem], includeTestOnly: true }),
    );

    expect(result.uploaded).toBe(1);
    expect(result.skipped).toBe(1);
  });
});
