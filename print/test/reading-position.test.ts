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

import { getReadingPosition, saveReadingPosition } from "../src/reading-position";

describe("reading-position", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.mockReturnValue("mock-doc-ref");
    mockSetDoc.mockResolvedValue(undefined);
  });

  describe("getReadingPosition", () => {
    it("returns position when document exists", async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ uid: "user-1", mediaId: "media-1", position: "42" }),
      });

      const result = await getReadingPosition("user-1", "media-1");

      expect(result).toBe("42");
      expect(mockDoc).toHaveBeenCalledWith(
        { type: "mock-firestore" },
        "print/test/reading-position",
        "user-1_media-1",
      );
    });

    it("returns null when document does not exist", async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await getReadingPosition("user-1", "media-1");

      expect(result).toBeNull();
    });
  });

  describe("saveReadingPosition", () => {
    it("writes uid, mediaId, and position to Firestore", async () => {
      await saveReadingPosition("user-1", "media-1", "epubcfi(/6/4)");

      expect(mockSetDoc).toHaveBeenCalledWith("mock-doc-ref", {
        uid: "user-1",
        mediaId: "media-1",
        position: "epubcfi(/6/4)",
      });
      expect(mockDoc).toHaveBeenCalledWith(
        { type: "mock-firestore" },
        "print/test/reading-position",
        "user-1_media-1",
      );
    });
  });
});
