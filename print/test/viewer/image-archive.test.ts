import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ZipEntry, ZipInfo } from "unzipit";

vi.stubGlobal("URL", {
  createObjectURL: vi.fn((blob: Blob) => `blob:mock-${Math.random()}`),
  revokeObjectURL: vi.fn(),
});

function makeMockEntry(data: Uint8Array): ZipEntry {
  return {
    blob: vi.fn().mockResolvedValue(new Blob([data])),
    arrayBuffer: vi.fn().mockResolvedValue(data.buffer),
    text: vi.fn().mockResolvedValue(""),
    json: vi.fn().mockResolvedValue(null),
    name: "",
    nameBytes: new Uint8Array(),
    size: data.length,
    compressedSize: data.length,
    comment: "",
    commentBytes: new Uint8Array(),
    lastModDate: new Date(),
    isDirectory: false,
    encrypted: false,
    externalFileAttributes: 0,
    versionMadeBy: 0,
  };
}

function makeMockEntries(files: Record<string, Uint8Array>): { entries: Record<string, ZipEntry> } {
  const entries: Record<string, ZipEntry> = {};
  for (const [name, data] of Object.entries(files)) {
    entries[name] = { ...makeMockEntry(data), name };
  }
  return { entries };
}

const mockUnzip = vi.fn<(src: unknown) => Promise<ZipInfo>>();

vi.mock("unzipit", () => ({
  unzip: (...args: unknown[]) => mockUnzip(...args),
  HTTPRangeReader: vi.fn(),
}));

function mockEntries(files: Record<string, Uint8Array>) {
  const result = makeMockEntries(files);
  mockUnzip.mockResolvedValue(result as unknown as ZipInfo);
  return result;
}

function makeContainer(): HTMLElement {
  return document.createElement("div");
}

import { createImageArchiveRenderer } from "../../src/viewer/image-archive.js";

describe("createImageArchiveRenderer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts images from ZIP, sorts by filename, shows first on init", async () => {
    mockEntries({
      "image-002.png": new Uint8Array([2]),
      "image-001.png": new Uint8Array([1]),
    });

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    expect(renderer.pageCount).toBe(2);
    expect(renderer.currentPage).toBe(1);

    const img = container.querySelector("img") as HTMLImageElement;
    expect(img).not.toBeNull();
    // First page blob URL created on init; prefetch creates the second
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
  });

  it("appends img element to container on init", async () => {
    mockEntries({ "image-001.png": new Uint8Array([1]) });

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    expect(container.querySelector("img")).not.toBeNull();
  });

  it("sets alt attribute on img element for accessibility", async () => {
    mockEntries({ "image-001.png": new Uint8Array([1]) });

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    const img = container.querySelector("img") as HTMLImageElement;
    expect(img.alt).toBe("Page 1");
  });

  it("goToPage changes displayed image", async () => {
    mockEntries({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    const img = container.querySelector("img") as HTMLImageElement;
    const firstSrc = img.src;

    await renderer.goToPage(2);
    expect(renderer.currentPage).toBe(2);
    expect(img.src).not.toBe(firstSrc);
    expect(img.alt).toBe("Page 2");
  });

  it("next() advances to next page", async () => {
    mockEntries({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    await renderer.next();
    expect(renderer.currentPage).toBe(2);
    expect(renderer.canGoNext).toBe(false);
    expect(renderer.canGoPrev).toBe(true);
  });

  it("prev() goes to previous page", async () => {
    mockEntries({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    await renderer.next();
    await renderer.prev();
    expect(renderer.currentPage).toBe(1);
    expect(renderer.canGoPrev).toBe(false);
    expect(renderer.canGoNext).toBe(true);
  });

  it("positionLabel returns 'Page X / Y' format", async () => {
    mockEntries({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    expect(renderer.positionLabel).toBe("Page 1 / 2");
    await renderer.next();
    expect(renderer.positionLabel).toBe("Page 2 / 2");
  });

  it("ignores non-image entries in ZIP", async () => {
    mockEntries({
      "readme.txt": new Uint8Array([0]),
      "image-001.png": new Uint8Array([1]),
      "data.json": new Uint8Array([0]),
    });

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    expect(renderer.pageCount).toBe(1);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it("pageCount returns correct count", async () => {
    mockEntries({
      "a.jpg": new Uint8Array([1]),
      "b.jpeg": new Uint8Array([2]),
      "c.gif": new Uint8Array([3]),
      "d.webp": new Uint8Array([4]),
    });

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    expect(renderer.pageCount).toBe(4);
  });

  it("currentPage tracks position", async () => {
    mockEntries({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
      "image-003.png": new Uint8Array([3]),
    });

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    expect(renderer.currentPage).toBe(1);
    await renderer.goToPage(3);
    expect(renderer.currentPage).toBe(3);
    await renderer.goToPage(2);
    expect(renderer.currentPage).toBe(2);
  });

  it("destroy revokes object URLs and removes img element", async () => {
    mockEntries({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    expect(container.querySelector("img")).not.toBeNull();

    renderer.destroy();

    // Page 1 created on init, page 2 prefetched — both revoked
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(container.querySelector("img")).toBeNull();
  });

  it("goToPage is a no-op for out-of-range values", async () => {
    mockEntries({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    await renderer.goToPage(0);
    expect(renderer.currentPage).toBe(1);

    await renderer.goToPage(3);
    expect(renderer.currentPage).toBe(1);
  });

  it("position getter returns current page as string", async () => {
    mockEntries({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    expect(renderer.position).toBe("1");
    await renderer.goToPage(2);
    expect(renderer.position).toBe("2");
  });

  it("initialPosition restores to correct image on init", async () => {
    mockEntries({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
      "image-003.png": new Uint8Array([3]),
    });

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip", "3");

    expect(renderer.currentPage).toBe(3);
    expect(renderer.position).toBe("3");
  });

  it("throws when ZIP contains no image files", async () => {
    mockEntries({
      "readme.txt": new Uint8Array([0]),
      "data.json": new Uint8Array([0]),
    });

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();

    await expect(renderer.init(container, "https://example.com/archive.zip")).rejects.toThrow(
      "No images found in archive",
    );
  });

  it("destroy during in-flight init prevents DOM mutations", async () => {
    let resolveUnzip!: (value: unknown) => void;
    mockUnzip.mockReturnValue(
      new Promise((resolve) => { resolveUnzip = resolve; }),
    );

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();

    const initPromise = renderer.init(container, "https://example.com/archive.zip");
    renderer.destroy();

    // Resolve unzip after destroy
    resolveUnzip(makeMockEntries({ "image-001.png": new Uint8Array([1]) }));
    await initPromise;

    expect(container.querySelector("img")).toBeNull();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("goToPage throws after destroy", async () => {
    mockEntries({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");
    renderer.destroy();

    await expect(renderer.goToPage(1)).rejects.toThrow("goToPage called after renderer was destroyed");
  });

  it("ignores out-of-range initialPosition and starts at page 1", async () => {
    mockEntries({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip", "99");

    expect(renderer.currentPage).toBe(1);
  });

  it("uses HTTPRangeReader with the provided URL", async () => {
    mockEntries({ "image-001.png": new Uint8Array([1]) });
    const { HTTPRangeReader } = await import("unzipit");

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    expect(HTTPRangeReader).toHaveBeenCalledWith("https://example.com/archive.zip");
  });

  it("falls back to full fetch when HTTPRangeReader fails", async () => {
    const fallbackEntries = makeMockEntries({ "image-001.png": new Uint8Array([1]) });
    // First call (HTTPRangeReader path) rejects; second call (ArrayBuffer path) resolves
    mockUnzip
      .mockRejectedValueOnce(new Error("Range not supported"))
      .mockResolvedValueOnce(fallbackEntries as unknown as ZipInfo);

    const mockArrayBuffer = new ArrayBuffer(8);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
    }));

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    expect(renderer.pageCount).toBe(1);
    expect(container.querySelector("img")).not.toBeNull();
    expect(fetch).toHaveBeenCalledWith("https://example.com/archive.zip");
    expect(mockUnzip).toHaveBeenCalledTimes(2);
    expect(mockUnzip).toHaveBeenLastCalledWith(mockArrayBuffer);

    vi.unstubAllGlobals();
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn((blob: Blob) => `blob:mock-${Math.random()}`),
      revokeObjectURL: vi.fn(),
    });
  });

  it("prefetches next page after init", async () => {
    const result = mockEntries({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
      "image-003.png": new Uint8Array([3]),
    });

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    // Page 1 fetched for display, page 2 prefetched
    expect(result.entries["image-001.png"]!.blob).toHaveBeenCalledTimes(1);
    expect(result.entries["image-002.png"]!.blob).toHaveBeenCalledTimes(1);
    expect(result.entries["image-003.png"]!.blob).not.toHaveBeenCalled();
  });

  it("prefetches next page after navigation", async () => {
    const result = mockEntries({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
      "image-003.png": new Uint8Array([3]),
    });

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    await renderer.goToPage(2);

    // Page 3 should now be prefetched
    expect(result.entries["image-003.png"]!.blob).toHaveBeenCalledTimes(1);
  });

  it("does not re-fetch cached pages", async () => {
    const result = mockEntries({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    // Go to page 2 (already prefetched), then back to page 1 (already cached)
    await renderer.goToPage(2);
    await renderer.goToPage(1);

    expect(result.entries["image-001.png"]!.blob).toHaveBeenCalledTimes(1);
    expect(result.entries["image-002.png"]!.blob).toHaveBeenCalledTimes(1);
  });
});
