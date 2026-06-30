import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockCollection = vi.fn();
const mockGetDocs = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();

vi.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
}));

vi.mock("@commons-systems/firestoreutil/namespace", () => ({
  nsCollectionPath: vi.fn(() => "test/metrics"),
}));

vi.mock("../src/queue-metrics.js", () => ({
  parseQueueMetrics: vi.fn((data: unknown) => data),
}));

// These virtual modules are imported by data.ts at module load time
vi.mock("virtual:office-hours-seed-data", () => ({ default: [] }));
vi.mock("virtual:office-hours-queue-seed", () => ({
  default: {
    openHelpWanted: 0,
    closedPerDay: 0,
    createdPerDay: 0,
    netDrainPerDay: 0,
    runwayDays: null,
    windowDays: 14,
    computedAt: new Date(),
    groupId: "test",
    memberEmails: [],
  },
}));

import { getOwnerQueueMetrics } from "../src/data.js";

const mockUser = { email: "owner@example.com" } as import("firebase/auth").User;
const mockDb = {} as import("firebase/firestore").Firestore;
const mockNamespace = "test" as import("@commons-systems/firestoreutil/namespace").Namespace;

describe("getOwnerQueueMetrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.mockReturnValue("mock-doc-ref");
  });

  it("(a) permission-denied error resolves to null (AC1 + AC4)", async () => {
    const permErr = Object.assign(new Error("Missing or insufficient permissions."), {
      code: "permission-denied",
    });
    mockGetDoc.mockRejectedValue(permErr);

    const result = await getOwnerQueueMetrics(mockDb, mockNamespace, mockUser);
    expect(result).toBeNull();
  });

  it("(b) non-permission error is rethrown (AC3)", async () => {
    const unavailableErr = Object.assign(new Error("unavailable"), { code: "unavailable" });
    mockGetDoc.mockRejectedValue(unavailableErr);

    await expect(getOwnerQueueMetrics(mockDb, mockNamespace, mockUser)).rejects.toThrow(
      "unavailable",
    );
  });

  it("(c) happy path: exists() true — returns parsed snapshot", async () => {
    const payload = { openHelpWanted: 5, groupId: "g1" };
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => payload,
    });

    const result = await getOwnerQueueMetrics(mockDb, mockNamespace, mockUser);
    expect(result).toBe(payload);
  });

  it("(d) happy path: exists() false — returns null", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => false,
      data: () => undefined,
    });

    const result = await getOwnerQueueMetrics(mockDb, mockNamespace, mockUser);
    expect(result).toBeNull();
  });

  it("(e) falsy email — returns null without a Firestore read (AC1)", async () => {
    const noEmailUser = { email: null } as import("firebase/auth").User;

    const result = await getOwnerQueueMetrics(mockDb, mockNamespace, noEmailUser);
    expect(result).toBeNull();
    expect(mockGetDoc).not.toHaveBeenCalled();
    expect(mockDoc).not.toHaveBeenCalled();
  });
});
