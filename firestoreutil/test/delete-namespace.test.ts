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

    await deleteNamespace(db, "app/preview-pr-49");

    expect(mockDoc).toHaveBeenCalledWith("app/preview-pr-49");
    expect(mockRecursiveDelete).toHaveBeenCalledWith({ path: "app/preview-pr-49" });
  });

  it("throws on empty namespace", async () => {
    const { db } = createMockFirestore();

    await expect(deleteNamespace(db, "")).rejects.toThrow(
      "namespace must not be empty",
    );
  });

  it("rejects namespace without app/env format", async () => {
    const { db } = createMockFirestore();

    await expect(deleteNamespace(db, "prod")).rejects.toThrow(
      "namespace must be in '{app}/{env}' format",
    );
  });
});
