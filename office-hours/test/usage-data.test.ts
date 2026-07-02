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
  nsCollectionPath: vi.fn(() => "test/env/usage-samples"),
}));

import { getOwnerSamples, getDemoSamples } from "../src/usage-data.js";

const mockDb = {} as import("firebase/firestore").Firestore;
const mockNamespace = "test" as import("@commons-systems/firestoreutil/namespace").Namespace;
const mockUser = { email: "owner@example.com" } as import("firebase/auth").User;

function makeDoc(iso: string) {
  const ts = { toDate: () => new Date(iso) };
  return {
    id: iso,
    data: () => ({
      sampledAt: ts,
      fiveHourUsedPct: 10,
      weeklyUsedPct: 20,
      fiveHourResetsAt: ts,
      weeklyResetsAt: ts,
      activeWorkers: 3,
      targetWorkers: 5,
      groupId: "g1",
      memberEmails: ["owner@example.com"],
    }),
  };
}

describe("getOwnerSamples", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockReturnValue("mock-query");
    mockOrderBy.mockReturnValue("mock-orderBy");
    mockLimit.mockReturnValue("mock-limit");
  });

  it("no email — returns [] without a Firestore read", async () => {
    const noEmailUser = { email: null } as import("firebase/auth").User;
    const result = await getOwnerSamples(mockDb, mockNamespace, noEmailUser);
    expect(result).toEqual([]);
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  it("bounds the read: orders by sampledAt DESC and caps at limit(2000)", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });
    await getOwnerSamples(mockDb, mockNamespace, mockUser);
    expect(mockOrderBy).toHaveBeenCalledWith("sampledAt", "desc");
    expect(mockLimit).toHaveBeenCalledWith(2000);
  });

  it("happy path — reverses the DESC result into ascending time order for charting", async () => {
    // Firestore returns newest-first (DESC); the getter reverses to ASC.
    mockGetDocs.mockResolvedValue({
      docs: [makeDoc("2026-06-29T00:00:00Z"), makeDoc("2026-06-28T00:00:00Z"), makeDoc("2026-06-27T00:00:00Z")],
    });
    const result = await getOwnerSamples(mockDb, mockNamespace, mockUser);
    expect(result).toHaveLength(3);
    expect(result[0].sampledAt.toISOString()).toBe("2026-06-27T00:00:00.000Z");
    expect(result[2].sampledAt.toISOString()).toBe("2026-06-29T00:00:00.000Z");
  });

  it("malformed docs are silently dropped", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [makeDoc("2026-06-29T00:00:00Z"), { id: "bad", data: () => ({ groupId: 42 }) }],
    });
    const result = await getOwnerSamples(mockDb, mockNamespace, mockUser);
    expect(result).toHaveLength(1);
  });
});

describe("getDemoSamples", () => {
  it("returns the bundled seed samples", () => {
    const samples = getDemoSamples();
    expect(Array.isArray(samples)).toBe(true);
    expect(samples.length).toBeGreaterThan(0);
  });
});
