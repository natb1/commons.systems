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
  nsCollectionPath: vi.fn(() => "test/env/issue-samples"),
}));

import { getDemoIssueSamples, getOwnerIssueSamples } from "../src/issue-data.js";

const mockDb = {} as import("firebase/firestore").Firestore;
const mockNamespace = "test" as import("@commons-systems/firestoreutil/namespace").Namespace;
const mockOwner = { email: "owner@example.com" } as import("firebase/auth").User;

function makeIssueDoc(iso: string) {
  return {
    id: iso,
    data: () => ({
      sampledAt: { toDate: () => new Date(iso) },
      openSecurity: 1,
      openBug: 2,
      openEnhancement: 3,
      openOther: 4,
      groupId: "g1",
      memberEmails: ["owner@example.com"],
    }),
  };
}

describe("getOwnerIssueSamples", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockReturnValue("mock-query");
    mockOrderBy.mockReturnValue("mock-orderBy");
    mockLimit.mockReturnValue("mock-limit");
  });

  it("no email — returns [] without a Firestore read", async () => {
    const noEmailUser = { email: null } as import("firebase/auth").User;
    const result = await getOwnerIssueSamples(mockDb, mockNamespace, noEmailUser);
    expect(result).toEqual([]);
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  it("bounds the read: orders by sampledAt DESC and caps at limit(2000)", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });
    await getOwnerIssueSamples(mockDb, mockNamespace, mockOwner);
    expect(mockOrderBy).toHaveBeenCalledWith("sampledAt", "desc");
    expect(mockLimit).toHaveBeenCalledWith(2000);
  });

  it("happy path — reverses the DESC result into ascending time order for charting", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [makeIssueDoc("2026-06-29T00:00:00Z"), makeIssueDoc("2026-06-27T00:00:00Z")],
    });
    const result = await getOwnerIssueSamples(mockDb, mockNamespace, mockOwner);
    expect(result).toHaveLength(2);
    expect(result[0].sampledAt.toISOString()).toBe("2026-06-27T00:00:00.000Z");
    expect(result[1].sampledAt.toISOString()).toBe("2026-06-29T00:00:00.000Z");
  });
});

describe("getDemoIssueSamples", () => {
  const samples = getDemoIssueSamples();

  it("returns a non-empty array of ~14 samples", () => {
    expect(Array.isArray(samples)).toBe(true);
    expect(samples.length).toBeGreaterThanOrEqual(12);
    expect(samples.length).toBeLessThanOrEqual(16);
  });

  it("every sample has the correct fields with correct types and no auth field", () => {
    for (const s of samples) {
      expect(s.sampledAt).toBeInstanceOf(Date);
      expect(typeof s.openSecurity).toBe("number");
      expect(typeof s.openBug).toBe("number");
      expect(typeof s.openEnhancement).toBe("number");
      expect(typeof s.openOther).toBe("number");
      expect(typeof s.groupId).toBe("string");
      // memberEmails is an auth field that must never reach the public bundle.
      expect(s).not.toHaveProperty("memberEmails");
    }
  });

  it("renders a shrinking backlog (most-recent total < oldest total)", () => {
    const oldest = samples.reduce((a, b) =>
      a.sampledAt.getTime() < b.sampledAt.getTime() ? a : b
    );
    const mostRecent = samples.reduce((a, b) =>
      a.sampledAt.getTime() > b.sampledAt.getTime() ? a : b
    );
    const oldestTotal =
      oldest.openSecurity + oldest.openBug + oldest.openEnhancement + oldest.openOther;
    const recentTotal =
      mostRecent.openSecurity + mostRecent.openBug + mostRecent.openEnhancement + mostRecent.openOther;
    expect(recentTotal).toBeLessThan(oldestTotal);
  });
});
