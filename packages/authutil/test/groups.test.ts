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

import { getUserGroups, isInGroup, ADMIN_GROUP_ID } from "../src/groups";
import type { Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";
import type { Namespace } from "@commons-systems/firestoreutil/namespace";

const NAMESPACE = "app/test" as Namespace;
const mockDb = { type: "mock-firestore" } as unknown as Firestore;
const mockUser = { uid: "user-123", email: "user@example.com" } as User;

describe("getUserGroups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue("mock-collection-ref");
    mockQuery.mockReturnValue("mock-query");
    mockWhere.mockReturnValue("mock-where");
  });

  it("returns groups sorted by name", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        { id: "work", data: () => ({ name: "work", members: ["user@example.com"] }) },
        { id: "household", data: () => ({ name: "household", members: ["user@example.com"] }) },
      ],
    });

    const groups = await getUserGroups(mockDb, NAMESPACE, mockUser);

    expect(groups).toEqual([
      { id: "household", name: "household" },
      { id: "work", name: "work" },
    ]);
    expect(mockCollection).toHaveBeenCalledWith(mockDb, "app/test/groups");
    expect(mockWhere).toHaveBeenCalledWith("members", "array-contains", "user@example.com");
  });

  it("returns empty array when no groups", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    const groups = await getUserGroups(mockDb, NAMESPACE, mockUser);

    expect(groups).toEqual([]);
  });

  it("throws when user has no email", async () => {
    const noEmailUser = { uid: "user-no-email" } as User;

    await expect(getUserGroups(mockDb, NAMESPACE, noEmailUser)).rejects.toThrow(
      /has no email/,
    );
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  it("throws DataIntegrityError for non-string group name", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{ id: "bad", data: () => ({ name: 123, members: ["user@example.com"] }) }],
    });

    const { DataIntegrityError } = await import("@commons-systems/firestoreutil/errors");
    await expect(getUserGroups(mockDb, NAMESPACE, mockUser)).rejects.toThrow(DataIntegrityError);
  });
});

describe("isInGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.mockReturnValue("mock-doc-ref");
  });

  it("returns true when user is in group members", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ name: "admin", members: ["user@example.com", "other@example.com"] }),
    });

    const result = await isInGroup(mockDb, NAMESPACE, mockUser, ADMIN_GROUP_ID);

    expect(result).toBe(true);
    expect(mockDoc).toHaveBeenCalledWith(mockDb, "app/test/groups", "admin");
  });

  it("returns false for null user", async () => {
    const result = await isInGroup(mockDb, NAMESPACE, null, ADMIN_GROUP_ID);

    expect(result).toBe(false);
    expect(mockGetDoc).not.toHaveBeenCalled();
  });

  it("throws when user has no email", async () => {
    const noEmailUser = { uid: "user-no-email" } as User;

    await expect(isInGroup(mockDb, NAMESPACE, noEmailUser, ADMIN_GROUP_ID)).rejects.toThrow(
      /has no email/,
    );
    expect(mockGetDoc).not.toHaveBeenCalled();
  });

  it("returns false when group does not exist", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => false,
      data: () => undefined,
    });

    const result = await isInGroup(mockDb, NAMESPACE, mockUser, ADMIN_GROUP_ID);

    expect(result).toBe(false);
  });

  it("returns false when user is not in members", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ name: "admin", members: ["other@example.com"] }),
    });

    const result = await isInGroup(mockDb, NAMESPACE, mockUser, ADMIN_GROUP_ID);

    expect(result).toBe(false);
  });

  it("returns false on permission-denied error", async () => {
    const error = Object.assign(new Error("permission denied"), { code: "permission-denied" });
    mockGetDoc.mockRejectedValue(error);

    const result = await isInGroup(mockDb, NAMESPACE, mockUser, ADMIN_GROUP_ID);

    expect(result).toBe(false);
  });

  it("rethrows non-permission errors", async () => {
    mockGetDoc.mockRejectedValue(new Error("network error"));

    await expect(isInGroup(mockDb, NAMESPACE, mockUser, ADMIN_GROUP_ID)).rejects.toThrow("network error");
  });
});
