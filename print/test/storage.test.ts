import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRef = vi.fn((_storage: unknown, path: string) => ({ path }));
const mockGetDownloadURL = vi.fn();

vi.mock("firebase/storage", () => ({
  ref: (...args: unknown[]) => mockRef(...args),
  getDownloadURL: (...args: unknown[]) => mockGetDownloadURL(...args),
}));

vi.mock("../src/firebase.js", () => ({
  storage: { type: "mock-storage" },
}));

import { mediaStoragePath, getMediaDownloadUrl } from "../src/storage";

describe("mediaStoragePath", () => {
  it("returns correct path for pdf", () => {
    expect(mediaStoragePath("phaedrus", "pdf")).toBe("print/phaedrus.pdf");
  });

  it("returns correct path for epub", () => {
    expect(mediaStoragePath("test", "epub")).toBe("print/test.epub");
  });

  it("returns correct path for cbz", () => {
    expect(mediaStoragePath("comic", "cbz")).toBe("print/comic.cbz");
  });
});

describe("getMediaDownloadUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls ref with storage and correct path", async () => {
    mockGetDownloadURL.mockResolvedValue("https://storage.example.com/print/book.epub");

    await getMediaDownloadUrl("book", "epub");

    expect(mockRef).toHaveBeenCalledWith(
      { type: "mock-storage" },
      "print/book.epub",
    );
  });

  it("calls getDownloadURL with the storage ref", async () => {
    mockGetDownloadURL.mockResolvedValue("https://storage.example.com/print/book.pdf");

    await getMediaDownloadUrl("book", "pdf");

    expect(mockGetDownloadURL).toHaveBeenCalledWith({ path: "print/book.pdf" });
  });

  it("returns the download URL", async () => {
    const expectedUrl = "https://storage.example.com/print/comic.cbz";
    mockGetDownloadURL.mockResolvedValue(expectedUrl);

    const url = await getMediaDownloadUrl("comic", "cbz");

    expect(url).toBe(expectedUrl);
  });
});
