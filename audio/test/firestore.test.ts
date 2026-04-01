import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetDocs = vi.fn();
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockDoc = vi.fn();
const mockGetDoc = vi.fn();

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
}));

vi.mock("../src/firebase.js", () => ({
  db: { type: "mock-firestore" },
  NAMESPACE: "audio/test",
  storage: { type: "mock-storage" },
  STORAGE_NAMESPACE: "audio/test",
}));

import {
  getPublicMedia,
  getUserMedia,
  getAllAccessibleMedia,
  getMediaItem,
} from "../src/firestore";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";

function validAudioDoc(
  id: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id,
    data: () => ({
      title: `Title ${id}`,
      artist: "Test Artist",
      album: "Test Album",
      trackNumber: 1,
      genre: "Classical",
      year: 2026,
      duration: 180,
      format: "mp3",
      publicDomain: true,
      sourceNotes: "Public domain source",
      storagePath: `media/${id}.mp3`,
      groupId: null,
      memberEmails: ["user@example.com"],
      addedAt: "2026-01-01T00:00:00Z",
      ...overrides,
    }),
  };
}

describe("getPublicMedia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue("mock-collection-ref");
    mockWhere.mockReturnValue("mock-where");
    mockQuery.mockReturnValue("mock-query");
  });

  it("queries the correct namespaced collection path", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getPublicMedia();

    expect(mockCollection).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "audio/test/media",
    );
  });

  it("filters by publicDomain == true", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getPublicMedia();

    expect(mockWhere).toHaveBeenCalledWith("publicDomain", "==", true);
  });

  it("maps Firestore documents to AudioItem objects", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        validAudioDoc("doc-1"),
        validAudioDoc("doc-2", {
          title: "Second Item",
          artist: "Bach",
          format: "flac",
          addedAt: "2026-01-02T00:00:00Z",
        }),
      ],
    });

    const items = await getPublicMedia();

    expect(items).toEqual([
      {
        id: "doc-2",
        title: "Second Item",
        artist: "Bach",
        album: "Test Album",
        trackNumber: 1,
        genre: "Classical",
        year: 2026,
        duration: 180,
        format: "flac",
        publicDomain: true,
        sourceNotes: "Public domain source",
        storagePath: "media/doc-2.mp3",
        groupId: null,
        memberEmails: ["user@example.com"],
        addedAt: "2026-01-02T00:00:00Z",
      },
      {
        id: "doc-1",
        title: "Title doc-1",
        artist: "Test Artist",
        album: "Test Album",
        trackNumber: 1,
        genre: "Classical",
        year: 2026,
        duration: 180,
        format: "mp3",
        publicDomain: true,
        sourceNotes: "Public domain source",
        storagePath: "media/doc-1.mp3",
        groupId: null,
        memberEmails: ["user@example.com"],
        addedAt: "2026-01-01T00:00:00Z",
      },
    ]);
  });

  it("returns empty array when no documents exist", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    const items = await getPublicMedia();

    expect(items).toEqual([]);
  });

  it("sorts results by addedAt descending", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        validAudioDoc("older", { addedAt: "2026-01-01T00:00:00Z" }),
        validAudioDoc("newer", { addedAt: "2026-02-01T00:00:00Z" }),
      ],
    });

    const items = await getPublicMedia();

    expect(items[0].id).toBe("newer");
    expect(items[1].id).toBe("older");
  });

  it("throws DataIntegrityError for invalid format", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [validAudioDoc("bad-1", { format: "aac" })],
    });

    await expect(getPublicMedia()).rejects.toThrow(DataIntegrityError);
  });

  it("throws DataIntegrityError for non-string title", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [validAudioDoc("bad-2", { title: 123 })],
    });

    await expect(getPublicMedia()).rejects.toThrow(DataIntegrityError);
  });

  it("throws DataIntegrityError for non-boolean publicDomain", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [validAudioDoc("bad-3", { publicDomain: "yes" })],
    });

    await expect(getPublicMedia()).rejects.toThrow(DataIntegrityError);
  });

  it("throws DataIntegrityError for non-array memberEmails", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [validAudioDoc("bad-4", { memberEmails: "not-array" })],
    });

    await expect(getPublicMedia()).rejects.toThrow(DataIntegrityError);
  });

  it("throws DataIntegrityError for non-string element in memberEmails", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [validAudioDoc("bad-5", { memberEmails: [123] })],
    });

    await expect(getPublicMedia()).rejects.toThrow(DataIntegrityError);
  });

  it("throws DataIntegrityError for invalid addedAt format", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [validAudioDoc("bad-6", { addedAt: "not-a-date" })],
    });

    await expect(getPublicMedia()).rejects.toThrow(DataIntegrityError);
    await expect(getPublicMedia()).rejects.toThrow("Expected UTC ISO 8601 date");
  });

  it("throws DataIntegrityError for negative duration", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [validAudioDoc("bad-7", { duration: -1 })],
    });

    await expect(getPublicMedia()).rejects.toThrow(DataIntegrityError);
  });

  it("accepts null trackNumber and year", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [validAudioDoc("nullable", { trackNumber: null, year: null })],
    });

    const items = await getPublicMedia();

    expect(items[0].trackNumber).toBeNull();
    expect(items[0].year).toBeNull();
  });
});

describe("getUserMedia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue("mock-collection-ref");
    mockWhere.mockReturnValue("mock-where");
    mockQuery.mockReturnValue("mock-query");
  });

  it("queries the correct namespaced collection path", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getUserMedia("user@example.com");

    expect(mockCollection).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "audio/test/media",
    );
  });

  it("filters by memberEmails array-contains email", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getUserMedia("user@example.com");

    expect(mockWhere).toHaveBeenCalledWith(
      "memberEmails",
      "array-contains",
      "user@example.com",
    );
  });

  it("maps Firestore documents to AudioItem objects", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [validAudioDoc("user-doc-1", { publicDomain: false })],
    });

    const items = await getUserMedia("user@example.com");

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("user-doc-1");
    expect(items[0].publicDomain).toBe(false);
  });
});

describe("getAllAccessibleMedia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue("mock-collection-ref");
    mockWhere.mockReturnValue("mock-where");
    mockQuery.mockReturnValue("mock-query");
  });

  it("deduplicates items that appear in both public and user queries", async () => {
    mockGetDocs
      .mockResolvedValueOnce({
        docs: [validAudioDoc("shared-doc")],
      })
      .mockResolvedValueOnce({
        docs: [validAudioDoc("shared-doc")],
      });

    const items = await getAllAccessibleMedia("user@example.com");

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("shared-doc");
  });

  it("merges public and user items", async () => {
    mockGetDocs
      .mockResolvedValueOnce({
        docs: [validAudioDoc("public-only")],
      })
      .mockResolvedValueOnce({
        docs: [validAudioDoc("user-only", { publicDomain: false })],
      });

    const items = await getAllAccessibleMedia("user@example.com");

    expect(items).toHaveLength(2);
    const ids = items.map((i) => i.id);
    expect(ids).toContain("public-only");
    expect(ids).toContain("user-only");
  });

  it("sorts results by addedAt descending", async () => {
    mockGetDocs
      .mockResolvedValueOnce({
        docs: [
          validAudioDoc("older", { addedAt: "2026-01-01T00:00:00Z" }),
        ],
      })
      .mockResolvedValueOnce({
        docs: [
          validAudioDoc("newer", { addedAt: "2026-02-01T00:00:00Z" }),
        ],
      });

    const items = await getAllAccessibleMedia("user@example.com");

    expect(items[0].id).toBe("newer");
    expect(items[1].id).toBe("older");
  });

  it("returns empty array when both queries return no results", async () => {
    mockGetDocs
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [] });

    const items = await getAllAccessibleMedia("user@example.com");

    expect(items).toEqual([]);
  });
});

describe("getMediaItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.mockReturnValue("mock-doc-ref");
  });

  it("queries the correct namespaced doc path", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    });

    await getMediaItem("doc-1");

    expect(mockDoc).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "audio/test/media",
      "doc-1",
    );
  });

  it("returns null when document does not exist", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    });

    const result = await getMediaItem("missing");

    expect(result).toBeNull();
  });

  it("returns an AudioItem when document exists", async () => {
    const docData = validAudioDoc("doc-1");
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: docData.id,
      data: docData.data,
    });

    const result = await getMediaItem("doc-1");

    expect(result).toEqual({
      id: "doc-1",
      title: "Title doc-1",
      artist: "Test Artist",
      album: "Test Album",
      trackNumber: 1,
      genre: "Classical",
      year: 2026,
      duration: 180,
      format: "mp3",
      publicDomain: true,
      sourceNotes: "Public domain source",
      storagePath: "media/doc-1.mp3",
      groupId: null,
      memberEmails: ["user@example.com"],
      addedAt: "2026-01-01T00:00:00Z",
    });
  });

  it("throws DataIntegrityError for corrupt document data", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: "corrupt",
      data: () => ({ title: 999 }),
    });

    await expect(getMediaItem("corrupt")).rejects.toThrow(DataIntegrityError);
  });

  it("accepts valid groupId string", async () => {
    const docData = validAudioDoc("grouped", { groupId: "group-abc" });
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: docData.id,
      data: docData.data,
    });

    const result = await getMediaItem("grouped");

    expect(result!.groupId).toBe("group-abc");
  });

  it("throws DataIntegrityError for non-string non-null groupId", async () => {
    const docData = validAudioDoc("bad-group", { groupId: 42 });
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: docData.id,
      data: docData.data,
    });

    await expect(getMediaItem("bad-group")).rejects.toThrow(
      DataIntegrityError,
    );
  });
});
