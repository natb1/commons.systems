import { describe, it, expect, vi } from "vitest";
import { deleteNamespace } from "../src/delete-namespace.js";

function createMockFirestore() {
  const mockRecursiveDelete = vi.fn(async () => {});

  const mockDoc = vi.fn((path: string) => ({ path }));

  const db = {
    doc: mockDoc,
    recursiveDelete: mockRecursiveDelete,
  } as unknown as import("firebase-admin/firestore").Firestore;

  return { db, mockDoc, mockRecursiveDelete };
}

describe("deleteNamespace", () => {
  it("calls recursiveDelete with the correct namespace path", async () => {
    const { db, mockDoc, mockRecursiveDelete } = createMockFirestore();

    await deleteNamespace(db, "preview-pr-49");

    expect(mockDoc).toHaveBeenCalledWith("ns/preview-pr-49");
    expect(mockRecursiveDelete).toHaveBeenCalledWith({ path: "ns/preview-pr-49" });
  });

  it("throws on empty namespace", async () => {
    const { db } = createMockFirestore();

    await expect(deleteNamespace(db, "")).rejects.toThrow(
      "namespace must not be empty",
    );
  });

  it("refuses to delete the prod namespace", async () => {
    const { db } = createMockFirestore();

    await expect(deleteNamespace(db, "prod")).rejects.toThrow(
      "refusing to delete the prod namespace",
    );
  });
});
