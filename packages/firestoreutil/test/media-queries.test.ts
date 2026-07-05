import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetDocs = vi.fn();
const mockGetDoc = vi.fn();
const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockStartAfter = vi.fn();
const mockDocumentId = vi.fn();

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  limit: (...args: unknown[]) => mockLimit(...args),
  startAfter: (...args: unknown[]) => mockStartAfter(...args),
  documentId: (...args: unknown[]) => mockDocumentId(...args),
}));

import { createMediaQueries } from "../src/media-queries";
import { encodeCursor } from "../src/paged-merge";
import type { Firestore } from "firebase/firestore";
import type { Namespace } from "../src/namespace";

const mockDb = { type: "mock-firestore" } as unknown as Firestore; // type-safety-ok: test mock — no real Firestore instance available in unit tests
const NAMESPACE = "test/ns" as Namespace; // type-safety-ok: test fixture — casting string literal to branded Namespace type

interface TestItem {
  id: string;
  addedAt: string;
  title: string;
}

function toItem(id: string, data: Record<string, unknown>): TestItem {
  return { id, addedAt: data.addedAt as string, title: data.title as string }; // type-safety-ok: data.addedAt and data.title are Record<string,unknown> fields that are strings in the test fixture
}

const { getPublicMedia, getUserMedia, getAllAccessibleMedia } = createMediaQueries(
  mockDb,
  NAMESPACE,
  "media",
  toItem,
);

// itemB is newer than itemA, so DESC order is [item-b, item-a].
const itemA = {
  id: "item-a",
  data: () => ({ title: "Alpha", addedAt: "2026-01-01T00:00:00Z", publicDomain: true }),
};

const itemB = {
  id: "item-b",
  data: () => ({ title: "Beta", addedAt: "2026-02-01T00:00:00Z", publicDomain: true }),
};

function resetMocks() {
  vi.clearAllMocks();
  mockCollection.mockReturnValue("mock-collection-ref");
  mockWhere.mockReturnValue("mock-where");
  mockOrderBy.mockReturnValue("mock-order-by");
  mockLimit.mockReturnValue("mock-limit");
  mockStartAfter.mockReturnValue("mock-start-after");
  mockDocumentId.mockReturnValue("mock-document-id");
  mockDoc.mockReturnValue("mock-doc-ref");
  mockQuery.mockReturnValue("mock-query");
}

describe("getPublicMedia", () => {
  beforeEach(resetMocks);

  it("queries the correct namespaced collection path", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getPublicMedia();

    expect(mockCollection).toHaveBeenCalledWith(mockDb, "test/ns/media");
  });

  it("composes where publicDomain == true", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getPublicMedia();

    expect(mockWhere).toHaveBeenCalledWith("publicDomain", "==", true);
  });

  it("builds the ordered, bounded query", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getPublicMedia();

    expect(mockOrderBy).toHaveBeenCalledWith("addedAt", "desc");
    expect(mockOrderBy).toHaveBeenCalledWith("mock-document-id", "desc");
    expect(mockLimit).toHaveBeenCalledWith(24);
  });

  it("returns a MediaPage with items sorted by addedAt descending", async () => {
    mockGetDocs.mockResolvedValue({ docs: [itemB, itemA] });

    const result = await getPublicMedia();

    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe("item-b");
    expect(result.items[1].id).toBe("item-a");
    expect(result.items[0].title).toBe("Beta");
  });

  it("returns an empty page with null nextCursor when no results", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    const result = await getPublicMedia();

    expect(result.items).toEqual([]);
    expect(result.nextCursor).toBeNull();
  });

  it("returns a non-null nextCursor encoding the last item on a full page", async () => {
    mockGetDocs.mockResolvedValue({ docs: [itemB, itemA] });

    const result = await getPublicMedia({ pageSize: 2 });

    expect(mockLimit).toHaveBeenCalledWith(2);
    expect(result.nextCursor).toBe(
      encodeCursor({ addedAt: "2026-01-01T00:00:00Z", id: "item-a" }),
    );
  });

  it("returns a null nextCursor on a short (partial) page", async () => {
    mockGetDocs.mockResolvedValue({ docs: [itemB] });

    const result = await getPublicMedia({ pageSize: 2 });

    expect(result.nextCursor).toBeNull();
  });

  it("applies startAfter when given a cursor", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    const cursor = encodeCursor({ addedAt: "2026-01-01T00:00:00Z", id: "item-a" });
    await getPublicMedia({ cursor });

    expect(mockDoc).toHaveBeenCalledWith(mockDb, "test/ns/media", "item-a");
    expect(mockStartAfter).toHaveBeenCalledWith("2026-01-01T00:00:00Z", "mock-doc-ref");
  });

  it("does not call startAfter without a cursor", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getPublicMedia();

    expect(mockStartAfter).not.toHaveBeenCalled();
  });
});

describe("getUserMedia", () => {
  beforeEach(resetMocks);

  it("composes where memberEmails array-contains email", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getUserMedia("owner@example.com");

    expect(mockWhere).toHaveBeenCalledWith("memberEmails", "array-contains", "owner@example.com");
  });

  it("queries the correct namespaced collection path", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getUserMedia("owner@example.com");

    expect(mockCollection).toHaveBeenCalledWith(mockDb, "test/ns/media");
  });

  it("returns a MediaPage with items sorted by addedAt descending", async () => {
    mockGetDocs.mockResolvedValue({ docs: [itemB, itemA] });

    const result = await getUserMedia("owner@example.com");

    expect(result.items[0].id).toBe("item-b");
    expect(result.items[1].id).toBe("item-a");
  });
});

describe("getAllAccessibleMedia", () => {
  beforeEach(resetMocks);

  it("merges both streams, dedups a shared item, and orders by addedAt desc", async () => {
    // Public stream returns [item-b, item-a]; user stream returns [item-a]
    // again (item-a is both public and owned). item-a must appear once.
    mockGetDocs
      .mockResolvedValueOnce({ docs: [itemB, itemA] })
      .mockResolvedValueOnce({ docs: [itemA] });

    const result = await getAllAccessibleMedia("owner@example.com");

    expect(result.items.map((i) => i.id)).toEqual(["item-b", "item-a"]);
  });

  it("broadcasts the same cursor to both streams", async () => {
    mockGetDocs
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [] });

    const cursor = encodeCursor({ addedAt: "2026-02-01T00:00:00Z", id: "item-b" });
    await getAllAccessibleMedia("owner@example.com", { cursor });

    // startAfter fired once per stream with the same decoded key.
    expect(mockStartAfter).toHaveBeenCalledTimes(2);
    expect(mockStartAfter).toHaveBeenCalledWith("2026-02-01T00:00:00Z", "mock-doc-ref");
  });
});
