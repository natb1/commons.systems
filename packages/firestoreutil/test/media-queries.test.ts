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
import { encodeCursor, encodeMergedCursor, decodeMergedCursor } from "../src/paged-merge";
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

  // Global DESC order: P1,P2,P3,Ua,Ub,P4,P5,P6. The public stream holds the P*
  // docs; the user stream holds exactly Ua,Ub, sorting BELOW page 1's cut (P3).
  function mediaDoc(id: string, addedAt: string) {
    return { id, data: () => ({ title: id, addedAt, publicDomain: true }) };
  }
  const P1 = mediaDoc("P1", "2026-01-09T00:00:00Z");
  const P2 = mediaDoc("P2", "2026-01-08T00:00:00Z");
  const P3 = mediaDoc("P3", "2026-01-07T00:00:00Z");
  const Ua = mediaDoc("Ua", "2026-01-06T00:00:00Z");
  const Ub = mediaDoc("Ub", "2026-01-05T00:00:00Z");
  const P4 = mediaDoc("P4", "2026-01-04T00:00:00Z");
  const P5 = mediaDoc("P5", "2026-01-03T00:00:00Z");
  const P6 = mediaDoc("P6", "2026-01-02T00:00:00Z");

  it("defers an exhausted stream's skip until its tail is within the page cut", async () => {
    // --- Page 1 (no cursor): public [P1,P2,P3] hasMore; user [Ua,Ub] !hasMore.
    resetMocks();
    mockGetDocs
      .mockResolvedValueOnce({ docs: [P1, P2, P3] })
      .mockResolvedValueOnce({ docs: [Ua, Ub] });

    const page1 = await getAllAccessibleMedia("owner@example.com", { pageSize: 3 });

    // Top 3 are the public items; Ua,Ub sort below the cut (P3) and are not yet shown.
    expect(page1.items.map((i) => i.id)).toEqual(["P1", "P2", "P3"]);
    expect(page1.nextCursor).not.toBeNull();
    // User NOT yet skipped — its tail (Ub) is below the cut, so nothing dropped.
    // A naive `!hasMore` impl would wrongly emit [false, true] here.
    expect(decodeMergedCursor(page1.nextCursor as string).exhausted).toEqual([false, false]); // type-safety-ok: nextCursor verified non-null by expect above

    // --- Page 2 (page 1 cursor): both queried; Ua,Ub now surface.
    resetMocks();
    mockGetDocs
      .mockResolvedValueOnce({ docs: [P4, P5, P6] })
      .mockResolvedValueOnce({ docs: [Ua, Ub] });

    const page2 = await getAllAccessibleMedia("owner@example.com", {
      pageSize: 3,
      cursor: page1.nextCursor,
    });

    // Both streams queried — user not skipped (startAfter fired twice).
    expect(mockStartAfter).toHaveBeenCalledTimes(2);
    // Ua,Ub appear here; nothing was dropped.
    expect(page2.items.map((i) => i.id)).toEqual(["Ua", "Ub", "P4"]);
    expect(page2.nextCursor).not.toBeNull();
    // Now the user tail is within the cut (P4) → user flagged exhausted.
    expect(decodeMergedCursor(page2.nextCursor as string).exhausted[1]).toBe(true); // type-safety-ok: nextCursor verified non-null by expect above

    // --- Page 3 (page 2 cursor): user skipped — only the public stream queried.
    resetMocks();
    mockGetDocs.mockResolvedValueOnce({ docs: [P5, P6] });

    await getAllAccessibleMedia("owner@example.com", {
      pageSize: 3,
      cursor: page2.nextCursor,
    });

    expect(mockGetDocs.mock.calls.length).toBe(1);
  });

  it("self-propagates an already-exhausted flag and skips that stream", async () => {
    resetMocks();
    // Public already exhausted; only the user stream should be queried.
    mockGetDocs.mockResolvedValueOnce({ docs: [P4, P5, P6] });

    const cursor = encodeMergedCursor(
      { addedAt: "2026-01-07T00:00:00Z", id: "P3" },
      [true, false],
    );
    const result = await getAllAccessibleMedia("owner@example.com", {
      pageSize: 3,
      cursor,
    });

    // Public not queried — getDocs called once (user only).
    expect(mockGetDocs.mock.calls.length).toBe(1);
    expect(result.nextCursor).not.toBeNull();
    // Public stays flagged exhausted on the returned cursor.
    expect(decodeMergedCursor(result.nextCursor as string).exhausted[0]).toBe(true); // type-safety-ok: nextCursor verified non-null by expect above
  });
});
