import { describe, it, expect, vi } from "vitest";
import { deleteNamespace } from "../src/delete-namespace.js";
import { validateNamespace } from "../src/namespace.js";

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
    const ns = validateNamespace("app/preview-pr-49");

    await deleteNamespace(db, ns);

    expect(mockDoc).toHaveBeenCalledWith("app/preview-pr-49");
    expect(mockRecursiveDelete).toHaveBeenCalledWith({ path: "app/preview-pr-49" });
  });

  it("rejects production namespace", async () => {
    const { db } = createMockFirestore();
    const ns = validateNamespace("landing/prod");

    await expect(deleteNamespace(db, ns)).rejects.toThrow(
      "refusing to delete production namespace: landing/prod",
    );
  });
});
