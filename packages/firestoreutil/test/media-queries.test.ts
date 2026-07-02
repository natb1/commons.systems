import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetDocs = vi.fn();
const mockGetDoc = vi.fn();
const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
}));

import { createMediaQueries } from "../src/media-queries";
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

const { getPublicMedia, getUserMedia } = createMediaQueries(mockDb, NAMESPACE, "media", toItem);

const itemA = {
  id: "item-a",
  data: () => ({ title: "Alpha", addedAt: "2026-01-01T00:00:00Z", publicDomain: true }),
};

const itemB = {
  id: "item-b",
  data: () => ({ title: "Beta", addedAt: "2026-02-01T00:00:00Z", publicDomain: true }),
};

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

    expect(mockCollection).toHaveBeenCalledWith(mockDb, "test/ns/media");
  });

  it("composes where publicDomain == true", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getPublicMedia();

    expect(mockWhere).toHaveBeenCalledWith("publicDomain", "==", true);
  });

  it("returns items mapped via toItem and sorted by addedAt descending", async () => {
    mockGetDocs.mockResolvedValue({ docs: [itemA, itemB] });

    const items = await getPublicMedia();

    expect(items).toHaveLength(2);
    expect(items[0].id).toBe("item-b");
    expect(items[1].id).toBe("item-a");
    expect(items[0].title).toBe("Beta");
  });

  it("returns empty array when no results", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    const items = await getPublicMedia();

    expect(items).toEqual([]);
  });
});

describe("getUserMedia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue("mock-collection-ref");
    mockWhere.mockReturnValue("mock-where");
    mockQuery.mockReturnValue("mock-query");
  });

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

  it("returns items sorted by addedAt descending", async () => {
    mockGetDocs.mockResolvedValue({ docs: [itemA, itemB] });

    const items = await getUserMedia("owner@example.com");

    expect(items[0].id).toBe("item-b");
    expect(items[1].id).toBe("item-a");
  });
});
