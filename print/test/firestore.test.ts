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
  NAMESPACE: "app/test",
  storage: { type: "mock-storage" },
}));

import {
  getPublicMedia,
  getUserMedia,
  getAllAccessibleMedia,
  getMediaItem,
} from "../src/firestore";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";

function validMediaDoc(
  id: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id,
    data: () => ({
      title: `Title ${id}`,
      mediaType: "pdf",
      tags: { genre: "nonfiction" },
      publicDomain: true,
      sourceNotes: "Public domain source",
      storagePath: `media/${id}.pdf`,
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
      "app/test/media",
    );
  });

  it("filters by publicDomain == true", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getPublicMedia();

    expect(mockWhere).toHaveBeenCalledWith("publicDomain", "==", true);
  });

  it("maps Firestore documents to MediaItem objects", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        validMediaDoc("doc-1"),
        validMediaDoc("doc-2", {
          title: "Second Item",
          mediaType: "epub",
          addedAt: "2026-01-02T00:00:00Z",
        }),
      ],
    });

    const items = await getPublicMedia();

    expect(items).toEqual([
      {
        id: "doc-2",
        title: "Second Item",
        mediaType: "epub",
        tags: { genre: "nonfiction" },
        publicDomain: true,
        sourceNotes: "Public domain source",
        storagePath: "media/doc-2.pdf",
        groupId: null,
        memberEmails: ["user@example.com"],
        addedAt: "2026-01-02T00:00:00Z",
      },
      {
        id: "doc-1",
        title: "Title doc-1",
        mediaType: "pdf",
        tags: { genre: "nonfiction" },
        publicDomain: true,
        sourceNotes: "Public domain source",
        storagePath: "media/doc-1.pdf",
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
        validMediaDoc("older", { addedAt: "2026-01-01T00:00:00Z" }),
        validMediaDoc("newer", { addedAt: "2026-02-01T00:00:00Z" }),
      ],
    });

    const items = await getPublicMedia();

    expect(items[0].id).toBe("newer");
    expect(items[1].id).toBe("older");
  });

  it("throws DataIntegrityError for invalid title type", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [validMediaDoc("bad-1", { title: 123 })],
    });

    await expect(getPublicMedia()).rejects.toThrow(DataIntegrityError);
  });

  it("throws DataIntegrityError for invalid mediaType", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [validMediaDoc("bad-2", { mediaType: "video" })],
    });

    await expect(getPublicMedia()).rejects.toThrow(DataIntegrityError);
  });

  it("throws DataIntegrityError for invalid tags", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [validMediaDoc("bad-3", { tags: "not-an-object" })],
    });

    await expect(getPublicMedia()).rejects.toThrow(DataIntegrityError);
  });

  it("throws DataIntegrityError for non-string tag value", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [validMediaDoc("bad-4", { tags: { genre: 42 } })],
    });

    await expect(getPublicMedia()).rejects.toThrow(DataIntegrityError);
  });

  it("throws DataIntegrityError for non-boolean publicDomain", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [validMediaDoc("bad-5", { publicDomain: "yes" })],
    });

    await expect(getPublicMedia()).rejects.toThrow(DataIntegrityError);
  });

  it("throws DataIntegrityError for non-array memberEmails", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [validMediaDoc("bad-6", { memberEmails: "not-array" })],
    });

    await expect(getPublicMedia()).rejects.toThrow(DataIntegrityError);
  });

  it("throws DataIntegrityError for non-string element in memberEmails", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [validMediaDoc("bad-7", { memberEmails: [123] })],
    });

    await expect(getPublicMedia()).rejects.toThrow(DataIntegrityError);
  });

  it("throws DataIntegrityError for invalid addedAt format", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [validMediaDoc("bad-8", { addedAt: "not-a-date" })],
    });

    await expect(getPublicMedia()).rejects.toThrow(DataIntegrityError);
    await expect(getPublicMedia()).rejects.toThrow("Invalid ISO 8601 date");
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
      "app/test/media",
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

  it("maps Firestore documents to MediaItem objects", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [validMediaDoc("user-doc-1", { publicDomain: false })],
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
    // First getDocs call (public), second getDocs call (user)
    mockGetDocs
      .mockResolvedValueOnce({
        docs: [validMediaDoc("shared-doc")],
      })
      .mockResolvedValueOnce({
        docs: [validMediaDoc("shared-doc")],
      });

    const items = await getAllAccessibleMedia("user@example.com");

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("shared-doc");
  });

  it("merges public and user items", async () => {
    mockGetDocs
      .mockResolvedValueOnce({
        docs: [validMediaDoc("public-only")],
      })
      .mockResolvedValueOnce({
        docs: [validMediaDoc("user-only", { publicDomain: false })],
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
          validMediaDoc("older", { addedAt: "2026-01-01T00:00:00Z" }),
        ],
      })
      .mockResolvedValueOnce({
        docs: [
          validMediaDoc("newer", { addedAt: "2026-02-01T00:00:00Z" }),
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
      "app/test/media",
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

  it("returns a MediaItem when document exists", async () => {
    const docData = validMediaDoc("doc-1");
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: docData.id,
      data: docData.data,
    });

    const result = await getMediaItem("doc-1");

    expect(result).toEqual({
      id: "doc-1",
      title: "Title doc-1",
      mediaType: "pdf",
      tags: { genre: "nonfiction" },
      publicDomain: true,
      sourceNotes: "Public domain source",
      storagePath: "media/doc-1.pdf",
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
    const docData = validMediaDoc("grouped", { groupId: "group-abc" });
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: docData.id,
      data: docData.data,
    });

    const result = await getMediaItem("grouped");

    expect(result!.groupId).toBe("group-abc");
  });

  it("throws DataIntegrityError for non-string non-null groupId", async () => {
    const docData = validMediaDoc("bad-group", { groupId: 42 });
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
