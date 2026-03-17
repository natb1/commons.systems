import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((db, path, id) => ({ path, id })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));
vi.mock("@commons-systems/firestoreutil/namespace", () => ({
  nsCollectionPath: vi.fn(() => "print/test/reading-position"),
}));
vi.mock("../src/firebase.js", () => ({
  db: {},
  NAMESPACE: "print/test",
}));

import { getReadingPosition, saveReadingPosition } from "../src/reading-position.js";
import { doc, getDoc, setDoc } from "firebase/firestore";

const mockDoc = vi.mocked(doc);
const mockGetDoc = vi.mocked(getDoc);
const mockSetDoc = vi.mocked(setDoc);

beforeEach(() => {
  mockDoc.mockClear();
  mockGetDoc.mockReset();
  mockSetDoc.mockReset();
});

describe("getReadingPosition", () => {
  it("returns null when doc doesn't exist", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false } as any);

    const result = await getReadingPosition("u1", "m1");

    expect(result).toBeNull();
  });

  it("returns position string when doc exists", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ uid: "u1", mediaId: "m1", position: "5" }),
    } as any);

    const result = await getReadingPosition("u1", "m1");

    expect(result).toBe("5");
  });

  it("returns null when position field missing", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ uid: "u1", mediaId: "m1" }),
    } as any);

    const result = await getReadingPosition("u1", "m1");

    expect(result).toBeNull();
  });
});

describe("saveReadingPosition", () => {
  it("calls setDoc with correct payload", async () => {
    mockSetDoc.mockResolvedValue(undefined);

    await saveReadingPosition("u1", "m1", "7");

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      { uid: "u1", mediaId: "m1", position: "7" },
    );
  });

  it("uses composite doc ID from uid and mediaId", async () => {
    mockSetDoc.mockResolvedValue(undefined);

    await saveReadingPosition("u1", "m1", "3");

    expect(mockDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "u1_m1",
    );
  });
});
