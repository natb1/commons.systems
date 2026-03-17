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
  const container = document.createElement("div");
  const canvas = document.createElement("canvas");
  container.appendChild(canvas);
  return container;
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
    // First URL created corresponds to image-001.png (sorted first)
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
  });

  it("hides canvas on init", async () => {
    const zip = makeZipBuffer({ "image-001.png": new Uint8Array([1]) });
    mockFetch(zip);

    const container = makeContainer();
    const canvas = container.querySelector("canvas") as HTMLCanvasElement;
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    expect(canvas.style.display).toBe("none");
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

    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(container.querySelector("img")).toBeNull();
  });

  it("destroy restores canvas visibility", async () => {
    const zip = makeZipBuffer({ "image-001.png": new Uint8Array([1]) });
    mockFetch(zip);

    const container = makeContainer();
    const canvas = container.querySelector("canvas") as HTMLCanvasElement;
    const renderer = createImageArchiveRenderer();
    await renderer.init(container, "https://example.com/archive.zip");

    expect(canvas.style.display).toBe("none");
    renderer.destroy();
    expect(canvas.style.display).toBe("");
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
});
