import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRef = vi.fn();
const mockGetDownloadURL = vi.fn();

vi.mock("firebase/storage", () => ({
  ref: (...args: unknown[]) => mockRef(...args),
  getDownloadURL: (...args: unknown[]) => mockGetDownloadURL(...args),
}));

vi.mock("../src/firebase.js", () => ({
  db: { type: "mock-firestore" },
  NAMESPACE: "app/test",
  storage: { type: "mock-storage" },
}));

import { getMediaDownloadUrl } from "../src/storage";

describe("getMediaDownloadUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRef.mockReturnValue("mock-storage-ref");
  });

  it("prepends NAMESPACE to the storage path", async () => {
    mockGetDownloadURL.mockResolvedValue("https://storage.example.com/file");

    await getMediaDownloadUrl("media/book.pdf");

    expect(mockRef).toHaveBeenCalledWith(
      { type: "mock-storage" },
      "app/test/media/book.pdf",
    );
  });

  it("calls getDownloadURL with the storage ref", async () => {
    mockGetDownloadURL.mockResolvedValue("https://storage.example.com/file");

    await getMediaDownloadUrl("media/book.pdf");

    expect(mockGetDownloadURL).toHaveBeenCalledWith("mock-storage-ref");
  });

  it("returns the download URL from getDownloadURL", async () => {
    const expectedUrl = "https://storage.example.com/file.pdf?token=abc123";
    mockGetDownloadURL.mockResolvedValue(expectedUrl);

    const url = await getMediaDownloadUrl("media/book.pdf");

    expect(url).toBe(expectedUrl);
  });

  it("propagates errors from getDownloadURL", async () => {
    mockGetDownloadURL.mockRejectedValue(new Error("storage/object-not-found"));

    await expect(getMediaDownloadUrl("missing/file.pdf")).rejects.toThrow(
      "storage/object-not-found",
    );
  });
});
