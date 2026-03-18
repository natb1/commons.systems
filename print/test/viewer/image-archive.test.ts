import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ZipEntry, ZipInfo } from "unzipit";

// ResizeObserver mock — stores callbacks so tests can trigger resize events
let resizeObserverCallbacks: Array<() => void> = [];

function stubBrowserGlobals() {
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn((blob: Blob) => `blob:mock-${Math.random()}`),
    revokeObjectURL: vi.fn(),
  });
  vi.stubGlobal("ResizeObserver", class {
    constructor(cb: () => void) { resizeObserverCallbacks.push(cb); }
    observe() {}
    disconnect() {}
  });
}

stubBrowserGlobals();

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

/** Re-apply global stubs after tests that call vi.stubGlobal("fetch", ...). */
function restoreGlobalStubs() {
  vi.unstubAllGlobals();
  stubBrowserGlobals();
}

function makeContainer(): HTMLElement {
  return document.createElement("div");
}

import { createImageArchiveRenderer } from "../../src/viewer/image-archive.js";

describe("createImageArchiveRenderer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resizeObserverCallbacks = [];
  });

  async function initZoomableRenderer(opts: { pageCount?: number } = {}) {
    const { pageCount = 2 } = opts;
    const files: Record<string, Uint8Array> = {};
    for (let i = 1; i <= pageCount; i++) {
      files[`image-${String(i).padStart(3, "0")}.png`] = new Uint8Array([i]);
    }
    mockEntries(files);
    const container = makeContainer();
    const parent = document.createElement("div");
    parent.appendChild(container);
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");
    const img = container.querySelector("img") as HTMLImageElement;
    Object.defineProperty(img, "clientWidth", { value: 400, configurable: true });
    Object.defineProperty(img, "clientHeight", { value: 300, configurable: true });
    return { container, renderer, img, parent };
  }

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

  it("goToPage returns silently when destroyed during blob fetch", async () => {
    const entries = makeMockEntries({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });
    let resolveBlob!: (value: Blob) => void;
    entries.entries["image-002.png"]!.blob = vi.fn().mockReturnValue(
      new Promise((resolve) => { resolveBlob = resolve; }),
    );
    mockUnzip.mockResolvedValue(entries as unknown as ZipInfo);

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    const goToPromise = renderer.goToPage(2);
    renderer.destroy();
    resolveBlob(new Blob([new Uint8Array([2])]));
    await goToPromise;
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

    restoreGlobalStubs();
  });

  it("throws on non-ok HTTP response in fallback path", async () => {
    mockUnzip.mockRejectedValueOnce(new Error("Range not supported"));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await expect(renderer.init(container, "https://example.com/archive.zip")).rejects.toThrow(
      "Failed to fetch archive: 404",
    );

    restoreGlobalStubs();
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

  it("calls onError when prefetch fails", async () => {
    const onError = vi.fn();
    const entries = makeMockEntries({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });
    const prefetchError = new Error("blob failed");
    entries.entries["image-002.png"]!.blob = vi.fn().mockRejectedValue(prefetchError);
    mockUnzip.mockResolvedValue(entries as unknown as ZipInfo);

    const container = makeContainer();
    const renderer = createImageArchiveRenderer(onError);
    await renderer.init(container, "https://example.com/archive.zip");

    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(prefetchError));
  });

  it("logs warning when prefetch fails without onError", async () => {
    const entries = makeMockEntries({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });
    const prefetchError = new Error("blob failed");
    entries.entries["image-002.png"]!.blob = vi.fn().mockRejectedValue(prefetchError);
    mockUnzip.mockResolvedValue(entries as unknown as ZipInfo);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    await vi.waitFor(() => expect(warnSpy).toHaveBeenCalledWith(
      "Image prefetch failed for page", 2, prefetchError,
    ));
    warnSpy.mockRestore();
  });

  it("retries after a failed blob fetch (poisoned cache cleared)", async () => {
    const entries = makeMockEntries({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });
    const prefetchError = new Error("blob failed");
    entries.entries["image-002.png"]!.blob = vi.fn()
      .mockRejectedValueOnce(prefetchError)
      .mockResolvedValueOnce(new Blob([new Uint8Array([2])]));
    mockUnzip.mockResolvedValue(entries as unknown as ZipInfo);

    const onError = vi.fn();
    const container = makeContainer();
    const renderer = createImageArchiveRenderer(onError);
    await renderer.init(container, "https://example.com/archive.zip");

    // Wait for prefetch error
    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(prefetchError));

    // Navigate to page 2 — should retry since cache was cleared
    await renderer.goToPage(2);
    expect(entries.entries["image-002.png"]!.blob).toHaveBeenCalledTimes(2);
    expect(renderer.currentPage).toBe(2);
  });

  it("zoomIn() adds zoomed class to container", async () => {
    const { container, renderer } = await initZoomableRenderer();
    renderer.zoomIn!();
    expect(container.classList.contains("zoomed")).toBe(true);
  });

  it("resetZoom() removes zoomed class from container", async () => {
    const { container, renderer } = await initZoomableRenderer();
    renderer.zoomIn!();
    renderer.resetZoom!();
    expect(container.classList.contains("zoomed")).toBe(false);
  });

  it("isZoomed reflects current state", async () => {
    const { renderer } = await initZoomableRenderer();
    expect(renderer.isZoomed).toBe(false);
    renderer.zoomIn!();
    expect(renderer.isZoomed).toBe(true);
    renderer.resetZoom!();
    expect(renderer.isZoomed).toBe(false);
  });

  it("goToPage resets zoom", async () => {
    const { container, renderer } = await initZoomableRenderer();
    renderer.zoomIn!();
    await renderer.goToPage(2);
    expect(container.classList.contains("zoomed")).toBe(false);
    expect(renderer.isZoomed).toBe(false);
  });

  it("next() resets zoom", async () => {
    const { container, renderer } = await initZoomableRenderer();
    renderer.zoomIn!();
    await renderer.next();
    expect(container.classList.contains("zoomed")).toBe(false);
    expect(renderer.isZoomed).toBe(false);
  });

  it("prev() resets zoom", async () => {
    const { container, renderer } = await initZoomableRenderer();
    await renderer.goToPage(2);
    renderer.zoomIn!();
    await renderer.prev();
    expect(container.classList.contains("zoomed")).toBe(false);
    expect(renderer.isZoomed).toBe(false);
  });

  it("zoomIn supports multiple zoom levels", async () => {
    const { img, renderer } = await initZoomableRenderer();

    renderer.zoomIn!();
    expect(renderer.isZoomed).toBe(true);
    const widthAfterFirst = parseFloat(img.style.width);

    renderer.zoomIn!();
    expect(renderer.isZoomed).toBe(true);
    const widthAfterSecond = parseFloat(img.style.width);

    // Zoom scales relative to fitted size, 1.2x per step
    expect(widthAfterSecond).toBeGreaterThan(widthAfterFirst);
    expect(widthAfterFirst).toBeCloseTo(400 * 1.2);
    expect(widthAfterSecond).toBeCloseTo(400 * 1.2 * 1.2);
  });

  it("resetZoom clears inline size styles", async () => {
    const { img, renderer } = await initZoomableRenderer();
    renderer.zoomIn!();
    renderer.zoomIn!();
    renderer.resetZoom!();

    expect(img.style.width).toBe("");
    expect(img.style.height).toBe("");
    expect(renderer.isZoomed).toBe(false);
  });

  it("zoomOut decreases zoom by one step", async () => {
    const { img, renderer } = await initZoomableRenderer();
    renderer.zoomIn!();
    renderer.zoomIn!();
    const widthAtLevel2 = parseFloat(img.style.width);

    renderer.zoomOut!();
    const widthAtLevel1 = parseFloat(img.style.width);
    expect(widthAtLevel1).toBeLessThan(widthAtLevel2);
    expect(widthAtLevel1).toBeCloseTo(400 * 1.2);
    expect(renderer.isZoomed).toBe(true);
  });

  it("zoomOut to level 0 returns to fit-to-view", async () => {
    const { container, img, renderer, parent } = await initZoomableRenderer();

    renderer.zoomIn!();
    parent.scrollTop = 100;
    parent.scrollLeft = 50;

    renderer.zoomOut!();
    expect(renderer.isZoomed).toBe(false);
    expect(container.classList.contains("zoomed")).toBe(false);
    expect(img.style.width).toBe("");
    expect(parent.scrollTop).toBe(0);
    expect(parent.scrollLeft).toBe(0);
  });

  it("zoomOut at level 0 is a no-op", async () => {
    const { renderer } = await initZoomableRenderer();
    expect(renderer.isZoomed).toBe(false);
    renderer.zoomOut!();
    expect(renderer.isZoomed).toBe(false);
  });

  it("zoomIn after destroy throws", async () => {
    const { renderer } = await initZoomableRenderer();
    renderer.destroy();
    expect(() => renderer.zoomIn!()).toThrow("zoomIn called on uninitialized or destroyed renderer");
  });

  it("resetZoom scrolls parent to top-left", async () => {
    const { renderer, parent } = await initZoomableRenderer();

    renderer.zoomIn!();
    parent.scrollTop = 150;
    parent.scrollLeft = 75;

    renderer.resetZoom!();
    expect(parent.scrollTop).toBe(0);
    expect(parent.scrollLeft).toBe(0);
  });

  it("resize resets zoom to fit-to-view", async () => {
    const { container, renderer } = await initZoomableRenderer();
    renderer.zoomIn!();
    expect(renderer.isZoomed).toBe(true);

    // Trigger the ResizeObserver callback
    for (const cb of resizeObserverCallbacks) cb();

    expect(renderer.isZoomed).toBe(false);
    expect(container.classList.contains("zoomed")).toBe(false);
  });

  it("resize while zoomed triggers onZoomChange", async () => {
    const { renderer } = await initZoomableRenderer();
    const onChange = vi.fn();
    renderer.onZoomChange = onChange;

    renderer.zoomIn!();
    expect(renderer.isZoomed).toBe(true);

    // Trigger the ResizeObserver callback
    for (const cb of resizeObserverCallbacks) cb();

    expect(renderer.isZoomed).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("resize at level 0 does not trigger onZoomChange", async () => {
    const { renderer } = await initZoomableRenderer();
    const onChange = vi.fn();
    renderer.onZoomChange = onChange;

    // Trigger the ResizeObserver callback at level 0
    for (const cb of resizeObserverCallbacks) cb();

    expect(onChange).not.toHaveBeenCalled();
  });

  it("resize at level 0 is a no-op", async () => {
    const { renderer } = await initZoomableRenderer();
    expect(renderer.isZoomed).toBe(false);

    // Trigger the ResizeObserver callback — should not throw
    for (const cb of resizeObserverCallbacks) cb();
    expect(renderer.isZoomed).toBe(false);
  });

  describe("renderPageInto", () => {
    it("creates an img element in the target container with correct src and alt", async () => {
      mockEntries({
        "image-001.png": new Uint8Array([1]),
        "image-002.png": new Uint8Array([2]),
      });

      const container = makeContainer();
      const renderer = createImageArchiveRenderer();
      await renderer.init(container, "https://example.com/archive.zip");

      const target = makeContainer();
      await renderer.renderPageInto(2, target);

      const img = target.querySelector("img") as HTMLImageElement;
      expect(img).not.toBeNull();
      expect(img.alt).toBe("Page 2");
      expect(img.src).toMatch(/^blob:mock-/);
    });

    it("triggers prefetch for adjacent pages", async () => {
      const result = mockEntries({
        "image-001.png": new Uint8Array([1]),
        "image-002.png": new Uint8Array([2]),
        "image-003.png": new Uint8Array([3]),
      });

      const container = makeContainer();
      const renderer = createImageArchiveRenderer();
      await renderer.init(container, "https://example.com/archive.zip");

      // After init: page 1 fetched, page 2 prefetched
      expect(result.entries["image-003.png"]!.blob).not.toHaveBeenCalled();

      const target = makeContainer();
      await renderer.renderPageInto(2, target);

      // renderPageInto(2) should prefetch page 3
      expect(result.entries["image-003.png"]!.blob).toHaveBeenCalledTimes(1);
    });

    it("is a no-op for out-of-range page numbers", async () => {
      mockEntries({
        "image-001.png": new Uint8Array([1]),
        "image-002.png": new Uint8Array([2]),
      });

      const container = makeContainer();
      const renderer = createImageArchiveRenderer();
      await renderer.init(container, "https://example.com/archive.zip");

      const target = makeContainer();
      await renderer.renderPageInto(0, target);
      expect(target.querySelector("img")).toBeNull();

      const target2 = makeContainer();
      await renderer.renderPageInto(3, target2);
      expect(target2.querySelector("img")).toBeNull();
    });

    it("returns without appending if destroyed during blob fetch", async () => {
      const entries = makeMockEntries({
        "image-001.png": new Uint8Array([1]),
        "image-002.png": new Uint8Array([2]),
      });
      let resolveBlob!: (value: Blob) => void;
      entries.entries["image-002.png"]!.blob = vi.fn().mockReturnValue(
        new Promise((resolve) => { resolveBlob = resolve; }),
      );
      mockUnzip.mockResolvedValue(entries as unknown as ZipInfo);

      const container = makeContainer();
      const renderer = createImageArchiveRenderer();
      await renderer.init(container, "https://example.com/archive.zip");

      const target = makeContainer();
      const renderPromise = renderer.renderPageInto(2, target);
      renderer.destroy();
      resolveBlob(new Blob([new Uint8Array([2])]));
      await renderPromise;

      expect(target.querySelector("img")).toBeNull();
    });
  });
});
