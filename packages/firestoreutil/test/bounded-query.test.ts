import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetDocs = vi.fn();
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockOrderBy = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  limit: (...args: unknown[]) => mockLimit(...args),
}));

import { boundedQuery } from "../src/bounded-query";
import type { Firestore } from "firebase/firestore";

const mockDb = { type: "mock-firestore" } as unknown as Firestore; // type-safety-ok: test mock — no real Firestore instance available in unit tests
const path = "test/ns/items";

describe("boundedQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue("mock-collection-ref");
    mockQuery.mockReturnValue("mock-query");
    mockLimit.mockReturnValue("mock-limit");
    mockWhere.mockReturnValue("mock-where");
    mockOrderBy.mockReturnValue("mock-order");
  });

  it(".limit(n).getDocs() composes a limit constraint and returns the snapshot", async () => {
    const sentinelSnapshot = { docs: [{ id: "doc1" }] };
    mockGetDocs.mockResolvedValue(sentinelSnapshot);

    const result = await boundedQuery(mockDb, path).limit(10).getDocs();

    expect(mockCollection).toHaveBeenCalledWith(mockDb, path);
    expect(mockLimit).toHaveBeenCalledWith(10);
    expect(mockQuery).toHaveBeenCalled();
    expect(result).toBe(sentinelSnapshot);
  });

  it(".unbounded(reason).getDocs() does NOT compose a limit constraint and returns the snapshot", async () => {
    const sentinelSnapshot = { docs: [] };
    mockGetDocs.mockResolvedValue(sentinelSnapshot);

    const result = await boundedQuery(mockDb, path).unbounded("full scan intentional for admin listing").getDocs();

    expect(mockLimit).not.toHaveBeenCalled();
    expect(mockCollection).toHaveBeenCalledWith(mockDb, path);
    expect(mockQuery).toHaveBeenCalled();
    expect(result).toBe(sentinelSnapshot);
  });

  it(".where().orderBy().limit().getDocs() composes constraints in order", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await boundedQuery(mockDb, path)
      .where("field", "==", 1)
      .orderBy("field", "desc")
      .limit(5)
      .getDocs();

    expect(mockWhere).toHaveBeenCalledWith("field", "==", 1);
    expect(mockOrderBy).toHaveBeenCalledWith("field", "desc");
    expect(mockLimit).toHaveBeenCalledWith(5);
  });

  it(".unbounded('') throws", () => {
    expect(() => boundedQuery(mockDb, path).unbounded("")).toThrow();
  });

  it(".unbounded('   ') (whitespace-only) throws", () => {
    expect(() => boundedQuery(mockDb, path).unbounded("   ")).toThrow();
  });

  it(".unbounded('real reason') does NOT throw", () => {
    expect(() => boundedQuery(mockDb, path).unbounded("real reason")).not.toThrow();
  });
});
