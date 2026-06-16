import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();

vi.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
}));

vi.mock("../src/firebase.js", () => ({
  db: { type: "mock-firestore" },
  NAMESPACE: "print/test",
}));

vi.mock("@commons-systems/firestoreutil/namespace", () => ({
  nsCollectionPath: vi.fn(() => "print/test/bookmarks"),
}));

import { getBookmarks, saveBookmarks } from "../src/bookmarks.js";

describe("bookmarks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.mockReturnValue("mock-doc-ref");
    mockSetDoc.mockResolvedValue(undefined);
  });

  describe("getBookmarks", () => {
    it("returns parsed Bookmark[] when doc exists with valid bookmarks array", async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          uid: "user-1",
          mediaId: "media-1",
          bookmarks: [
            { position: "42", label: "Page 42" },
            { position: "7", label: "Page 7" },
          ],
        }),
      });

      const result = await getBookmarks("user-1", "media-1");

      expect(result).toEqual([
        { position: "42", label: "Page 42" },
        { position: "7", label: "Page 7" },
      ]);
      expect(mockDoc).toHaveBeenCalledWith(
        { type: "mock-firestore" },
        "print/test/bookmarks",
        "user-1_media-1",
      );
    });

    it("returns [] when document does not exist", async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await getBookmarks("user-1", "media-1");

      expect(result).toEqual([]);
    });

    it("returns [] when bookmarks field is missing", async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ uid: "user-1", mediaId: "media-1" }),
      });

      const result = await getBookmarks("user-1", "media-1");

      expect(result).toEqual([]);
    });

    it("returns [] when bookmarks field is not an array", async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ uid: "user-1", mediaId: "media-1", bookmarks: "bad" }),
      });

      const result = await getBookmarks("user-1", "media-1");

      expect(result).toEqual([]);
    });

    it("filters out malformed entries missing position or label", async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          uid: "user-1",
          mediaId: "media-1",
          bookmarks: [
            { position: "42", label: "Page 42" },
            { position: 99, label: "bad position type" },
            { position: "7" },
            { label: "no position" },
            {},
          ],
        }),
      });

      const result = await getBookmarks("user-1", "media-1");

      expect(result).toEqual([{ position: "42", label: "Page 42" }]);
    });
  });

  describe("saveBookmarks", () => {
    it("writes uid, mediaId, and bookmarks array to Firestore", async () => {
      const bookmarks = [{ position: "42", label: "Page 42" }];
      await saveBookmarks("user-1", "media-1", bookmarks);

      expect(mockSetDoc).toHaveBeenCalledWith("mock-doc-ref", {
        uid: "user-1",
        mediaId: "media-1",
        bookmarks: [{ position: "42", label: "Page 42" }],
      });
      expect(mockDoc).toHaveBeenCalledWith(
        { type: "mock-firestore" },
        "print/test/bookmarks",
        "user-1_media-1",
      );
    });

    it("writes an empty bookmarks array when given an empty list", async () => {
      await saveBookmarks("user-1", "media-1", []);

      expect(mockSetDoc).toHaveBeenCalledWith("mock-doc-ref", {
        uid: "user-1",
        mediaId: "media-1",
        bookmarks: [],
      });
    });
  });
});
