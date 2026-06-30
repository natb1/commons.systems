import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCollection = vi.fn();
const mockGetDocs = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  limit: (...args: unknown[]) => mockLimit(...args),
}));

vi.mock("@commons-systems/firestoreutil/namespace", () => ({
  nsCollectionPath: vi.fn(() => "test/env/topic-usage"),
}));

import { getOwnerTopicUsage, getDemoTopicUsage } from "../src/topic-usage-data.js";

const mockDb = {} as import("firebase/firestore").Firestore;
const mockNamespace = "test" as import("@commons-systems/firestoreutil/namespace").Namespace;
const mockUser = { email: "owner@example.com" } as import("firebase/auth").User;

const validBucket = {
  priceProxyUsd: 0.05,
  input: 1000,
  cacheRead: 500,
  cacheCreation: 200,
  output: 300,
};

function makeDoc(date: string) {
  return {
    data: () => ({
      date,
      byTopic: { dispatch: { ...validBucket } },
      byType: { bug: { ...validBucket } },
    }),
  };
}

describe("getOwnerTopicUsage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockReturnValue("mock-query");
  });

  it("(a) no email — returns [] without a Firestore read", async () => {
    const noEmailUser = { email: null } as import("firebase/auth").User;

    const result = await getOwnerTopicUsage(mockDb, mockNamespace, noEmailUser);
    expect(result).toEqual([]);
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  it("(b) permission-denied error — returns []", async () => {
    const permErr = Object.assign(new Error("Missing or insufficient permissions."), {
      code: "permission-denied",
    });
    mockGetDocs.mockRejectedValue(permErr);

    const result = await getOwnerTopicUsage(mockDb, mockNamespace, mockUser);
    expect(result).toEqual([]);
  });

  it("(c) failed-precondition error (missing index) — throws", async () => {
    const indexErr = Object.assign(new Error("The query requires an index."), {
      code: "failed-precondition",
    });
    mockGetDocs.mockRejectedValue(indexErr);

    await expect(getOwnerTopicUsage(mockDb, mockNamespace, mockUser)).rejects.toThrow(
      "The query requires an index.",
    );
  });

  it("(d) happy path — maps docs through toTopicUsage, drops nulls, returns ascending date order", async () => {
    // Query returns DESC order; the function should reverse to ASC for charting.
    const docDesc = [
      makeDoc("2026-06-29"), // newest first (DESC from Firestore)
      makeDoc("2026-06-28"),
      makeDoc("2026-06-27"),
    ];
    mockGetDocs.mockResolvedValue({ docs: docDesc });

    const result = await getOwnerTopicUsage(mockDb, mockNamespace, mockUser);

    expect(result).toHaveLength(3);
    expect(result[0].date).toBe("2026-06-27"); // oldest first (ASC after reverse)
    expect(result[1].date).toBe("2026-06-28");
    expect(result[2].date).toBe("2026-06-29");
  });

  it("(e) malformed docs are silently dropped", async () => {
    const docs = [
      makeDoc("2026-06-29"),
      { data: () => ({ date: 12345, byTopic: {}, byType: {} }) }, // invalid: date is a number
      makeDoc("2026-06-27"),
    ];
    mockGetDocs.mockResolvedValue({ docs });

    const result = await getOwnerTopicUsage(mockDb, mockNamespace, mockUser);

    expect(result).toHaveLength(2);
    // After dropping the invalid one and reversing
    expect(result[0].date).toBe("2026-06-27");
    expect(result[1].date).toBe("2026-06-29");
  });
});

describe("getDemoTopicUsage", () => {
  it("returns an empty array (demo tier is unauthenticated)", async () => {
    const result = await getDemoTopicUsage();
    expect(result).toEqual([]);
  });
});
