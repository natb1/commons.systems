import { describe, it, expect, vi, beforeEach } from "vitest";
import { zipSync } from "fflate";

vi.stubGlobal("URL", {
  createObjectURL: vi.fn((blob: Blob) => `blob:mock-${Math.random()}`),
  revokeObjectURL: vi.fn(),
});

function makeZipBuffer(files: Record<string, Uint8Array>): ArrayBuffer {
  const zipped = zipSync(files);
  return zipped.buffer.slice(zipped.byteOffset, zipped.byteOffset + zipped.byteLength) as ArrayBuffer;
}

function mockFetch(buffer: ArrayBuffer) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(buffer),
    }),
  );
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
    const zip = makeZipBuffer({
      "image-002.png": new Uint8Array([2]),
      "image-001.png": new Uint8Array([1]),
    });
    mockFetch(zip);

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    expect(renderer.pageCount).toBe(2);
    expect(renderer.currentPage).toBe(1);

    const img = container.querySelector("img") as HTMLImageElement;
    expect(img).not.toBeNull();
    // Only the first page's URL is created on init (remaining URLs deferred until that page is visited)
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it("appends img element to container on init", async () => {
    const zip = makeZipBuffer({ "image-001.png": new Uint8Array([1]) });
    mockFetch(zip);

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    expect(container.querySelector("img")).not.toBeNull();
  });

  it("sets alt attribute on img element for accessibility", async () => {
    const zip = makeZipBuffer({ "image-001.png": new Uint8Array([1]) });
    mockFetch(zip);

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    const img = container.querySelector("img") as HTMLImageElement;
    expect(img.alt).toBe("Page 1");
  });

  it("goToPage changes displayed image", async () => {
    const zip = makeZipBuffer({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });
    mockFetch(zip);

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
    const zip = makeZipBuffer({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });
    mockFetch(zip);

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    await renderer.next();
    expect(renderer.currentPage).toBe(2);
    expect(renderer.canGoNext).toBe(false);
    expect(renderer.canGoPrev).toBe(true);
  });

  it("prev() goes to previous page", async () => {
    const zip = makeZipBuffer({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });
    mockFetch(zip);

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
    const zip = makeZipBuffer({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });
    mockFetch(zip);

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    expect(renderer.positionLabel).toBe("Page 1 / 2");
    await renderer.next();
    expect(renderer.positionLabel).toBe("Page 2 / 2");
  });

  it("ignores non-image entries in ZIP", async () => {
    const zip = makeZipBuffer({
      "readme.txt": new Uint8Array([0]),
      "image-001.png": new Uint8Array([1]),
      "data.json": new Uint8Array([0]),
    });
    mockFetch(zip);

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    expect(renderer.pageCount).toBe(1);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it("pageCount returns correct count", async () => {
    const zip = makeZipBuffer({
      "a.jpg": new Uint8Array([1]),
      "b.jpeg": new Uint8Array([2]),
      "c.gif": new Uint8Array([3]),
      "d.webp": new Uint8Array([4]),
    });
    mockFetch(zip);

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    expect(renderer.pageCount).toBe(4);
  });

  it("currentPage tracks position", async () => {
    const zip = makeZipBuffer({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
      "image-003.png": new Uint8Array([3]),
    });
    mockFetch(zip);

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
    const zip = makeZipBuffer({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });
    mockFetch(zip);

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    expect(container.querySelector("img")).not.toBeNull();

    renderer.destroy();

    // Only URLs that were actually created (page 1 on init, no goToPage calls) are revoked
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(container.querySelector("img")).toBeNull();
  });

  it("goToPage is a no-op for out-of-range values", async () => {
    const zip = makeZipBuffer({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });
    mockFetch(zip);

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    await renderer.goToPage(0);
    expect(renderer.currentPage).toBe(1);

    await renderer.goToPage(3);
    expect(renderer.currentPage).toBe(1);
  });

  it("position getter returns current page as string", async () => {
    const zip = makeZipBuffer({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });
    mockFetch(zip);

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    expect(renderer.position).toBe("1");
    await renderer.goToPage(2);
    expect(renderer.position).toBe("2");
  });

  it("initialPosition restores to correct image on init", async () => {
    const zip = makeZipBuffer({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
      "image-003.png": new Uint8Array([3]),
    });
    mockFetch(zip);

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip", "3");

    expect(renderer.currentPage).toBe(3);
    expect(renderer.position).toBe("3");
  });

  it("throws on non-ok HTTP response with status code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();

    await expect(renderer.init(container, "https://example.com/archive.zip")).rejects.toThrow(
      "Failed to fetch archive: 404",
    );
  });

  it("throws when ZIP contains no image files", async () => {
    const zip = makeZipBuffer({
      "readme.txt": new Uint8Array([0]),
      "data.json": new Uint8Array([0]),
    });
    mockFetch(zip);

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();

    await expect(renderer.init(container, "https://example.com/archive.zip")).rejects.toThrow(
      "No images found in archive",
    );
  });

  it("destroy during in-flight init prevents DOM mutations", async () => {
    const zip = makeZipBuffer({ "image-001.png": new Uint8Array([1]) });
    let resolveFetch!: (value: unknown) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(
        new Promise((resolve) => { resolveFetch = resolve; }),
      ),
    );

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();

    const initPromise = renderer.init(container, "https://example.com/archive.zip");
    renderer.destroy();

    // Resolve fetch after destroy
    resolveFetch({ ok: true, arrayBuffer: () => Promise.resolve(zip) });
    await initPromise;

    expect(container.querySelector("img")).toBeNull();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("goToPage throws after destroy", async () => {
    const zip = makeZipBuffer({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });
    mockFetch(zip);

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");
    renderer.destroy();

    await expect(renderer.goToPage(1)).rejects.toThrow("goToPage called after renderer was destroyed");
  });

  it("ignores out-of-range initialPosition and starts at page 1", async () => {
    const zip = makeZipBuffer({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });
    mockFetch(zip);

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip", "99");

    expect(renderer.currentPage).toBe(1);
  });

  it("zoomIn() adds zoomed class to container", async () => {
    const zip = makeZipBuffer({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });
    mockFetch(zip);

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    renderer.zoomIn!();
    expect(container.classList.contains("zoomed")).toBe(true);
  });

  it("resetZoom() removes zoomed class from container", async () => {
    const zip = makeZipBuffer({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });
    mockFetch(zip);

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    renderer.zoomIn!();
    renderer.resetZoom!();
    expect(container.classList.contains("zoomed")).toBe(false);
  });

  it("isZoomed reflects current state", async () => {
    const zip = makeZipBuffer({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });
    mockFetch(zip);

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    expect(renderer.isZoomed).toBe(false);
    renderer.zoomIn!();
    expect(renderer.isZoomed).toBe(true);
    renderer.resetZoom!();
    expect(renderer.isZoomed).toBe(false);
  });

  it("goToPage resets zoom", async () => {
    const zip = makeZipBuffer({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });
    mockFetch(zip);

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    renderer.zoomIn!();
    await renderer.goToPage(2);
    expect(container.classList.contains("zoomed")).toBe(false);
    expect(renderer.isZoomed).toBe(false);
  });

  it("next() resets zoom", async () => {
    const zip = makeZipBuffer({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });
    mockFetch(zip);

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    renderer.zoomIn!();
    await renderer.next();
    expect(container.classList.contains("zoomed")).toBe(false);
    expect(renderer.isZoomed).toBe(false);
  });

  it("prev() resets zoom", async () => {
    const zip = makeZipBuffer({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });
    mockFetch(zip);

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    await renderer.goToPage(2);
    renderer.zoomIn!();
    await renderer.prev();
    expect(container.classList.contains("zoomed")).toBe(false);
    expect(renderer.isZoomed).toBe(false);
  });

  it("zoomIn after destroy is a no-op", async () => {
    const zip = makeZipBuffer({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });
    mockFetch(zip);

    const container = makeContainer();
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    renderer.destroy();
    expect(() => renderer.zoomIn!()).not.toThrow();
  });

  it("resetZoom scrolls parent to top-left", async () => {
    const zip = makeZipBuffer({
      "image-001.png": new Uint8Array([1]),
      "image-002.png": new Uint8Array([2]),
    });
    mockFetch(zip);

    const parent = document.createElement("div");
    const container = makeContainer();
    parent.appendChild(container);

    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    renderer.zoomIn!();
    parent.scrollTop = 150;
    parent.scrollLeft = 75;

    renderer.resetZoom!();
    expect(parent.scrollTop).toBe(0);
    expect(parent.scrollLeft).toBe(0);
  });
});
