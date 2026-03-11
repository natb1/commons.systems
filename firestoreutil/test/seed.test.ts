import { describe, it, expect, vi } from "vitest";
import { seed, type SeedSpec } from "../src/seed.js";

function createMockFirestore(existingDocs: Record<string, string[]> = {}) {
  const setCalls: { path: string; data: Record<string, unknown> }[] = [];
  const deletedRefs: string[] = [];

  const mockSet = vi.fn(async (data: Record<string, unknown>) => {
    // Data is captured in the doc() call below
    setCalls[setCalls.length - 1].data = data;
  });

  const mockDoc = vi.fn((path: string) => {
    setCalls.push({ path, data: {} });
    return { set: mockSet };
  });

  const mockCollection = vi.fn((path: string) => ({
    listDocuments: vi.fn(async () =>
      (existingDocs[path] ?? []).map((id) => ({
        id,
        delete: vi.fn(async () => {
          deletedRefs.push(`${path}/${id}`);
        }),
      })),
    ),
  }));

  const db = { doc: mockDoc, collection: mockCollection } as unknown as import("firebase-admin/firestore").Firestore;

  return { db, mockDoc, mockSet, mockCollection, setCalls, deletedRefs };
}

describe("seed", () => {
  it("writes documents to namespaced collection paths", async () => {
    const { db, mockDoc, mockSet } = createMockFirestore();

    const spec: SeedSpec = {
      namespace: "app/emulator",
      collections: [
        {
          name: "messages",
          documents: [
            { id: "msg-1", data: { text: "Hello" } },
            { id: "msg-2", data: { text: "World" } },
          ],
        },
      ],
    };

    await seed(db, spec);

    expect(mockDoc).toHaveBeenCalledTimes(2);
    expect(mockDoc).toHaveBeenCalledWith("app/emulator/messages/msg-1");
    expect(mockDoc).toHaveBeenCalledWith("app/emulator/messages/msg-2");
    expect(mockSet).toHaveBeenCalledTimes(2);
    expect(mockSet).toHaveBeenCalledWith({ text: "Hello" });
    expect(mockSet).toHaveBeenCalledWith({ text: "World" });
  });

  it("handles multiple collections", async () => {
    const { db, mockDoc } = createMockFirestore();

    const spec: SeedSpec = {
      namespace: "app/test",
      collections: [
        {
          name: "messages",
          documents: [{ id: "m1", data: { text: "Hi" } }],
        },
        {
          name: "users",
          documents: [{ id: "u1", data: { name: "Alice" } }],
        },
      ],
    };

    await seed(db, spec);

    expect(mockDoc).toHaveBeenCalledWith("app/test/messages/m1");
    expect(mockDoc).toHaveBeenCalledWith("app/test/users/u1");
  });

  it("skips testOnly collections when includeTestOnly is not set", async () => {
    const { db, mockDoc } = createMockFirestore();

    const spec: SeedSpec = {
      namespace: "app/prod",
      collections: [
        { name: "posts", documents: [{ id: "p1", data: { title: "Post" } }] },
        { name: "groups", testOnly: true, documents: [{ id: "admin", data: { name: "admin" } }] },
      ],
    };

    await seed(db, spec);

    expect(mockDoc).toHaveBeenCalledTimes(1);
    expect(mockDoc).toHaveBeenCalledWith("app/prod/posts/p1");
  });

  it("includes testOnly collections when includeTestOnly is true", async () => {
    const { db, mockDoc } = createMockFirestore();

    const spec: SeedSpec = {
      namespace: "app/test",
      collections: [
        { name: "posts", documents: [{ id: "p1", data: { title: "Post" } }] },
        { name: "groups", testOnly: true, documents: [{ id: "admin", data: { name: "admin" } }] },
      ],
    };

    await seed(db, spec, { includeTestOnly: true });

    expect(mockDoc).toHaveBeenCalledTimes(2);
    expect(mockDoc).toHaveBeenCalledWith("app/test/posts/p1");
    expect(mockDoc).toHaveBeenCalledWith("app/test/groups/admin");
  });

  it("skips testOnly collections when includeTestOnly is explicitly false", async () => {
    const { db, mockDoc } = createMockFirestore();

    const spec: SeedSpec = {
      namespace: "app/prod",
      collections: [
        { name: "groups", testOnly: true, documents: [{ id: "admin", data: { name: "admin" } }] },
      ],
    };

    await seed(db, spec, { includeTestOnly: false });

    expect(mockDoc).not.toHaveBeenCalled();
  });

  it("handles empty collections array", async () => {
    const { db, mockDoc } = createMockFirestore();

    const spec: SeedSpec = {
      namespace: "app/empty",
      collections: [],
    };

    await seed(db, spec);

    expect(mockDoc).not.toHaveBeenCalled();
  });

  it("deletes stale documents when convergent is true", async () => {
    const { db, mockDoc, deletedRefs } = createMockFirestore({
      "app/prod/posts": ["keep-me", "stale-post", "another-stale"],
    });

    const spec: SeedSpec = {
      namespace: "app/prod",
      collections: [
        {
          name: "posts",
          convergent: true,
          documents: [{ id: "keep-me", data: { title: "Keeper" } }],
        },
      ],
    };

    await seed(db, spec);

    expect(mockDoc).toHaveBeenCalledWith("app/prod/posts/keep-me");
    expect(deletedRefs).toEqual(["app/prod/posts/stale-post", "app/prod/posts/another-stale"]);
  });

  it("does not delete when convergent is not set", async () => {
    const { db, mockCollection } = createMockFirestore({
      "app/prod/posts": ["keep-me", "also-keep"],
    });

    const spec: SeedSpec = {
      namespace: "app/prod",
      collections: [
        {
          name: "posts",
          documents: [{ id: "keep-me", data: { title: "Keeper" } }],
        },
      ],
    };

    await seed(db, spec);

    expect(mockCollection).not.toHaveBeenCalled();
  });

  it("skips convergent phase for testOnly collections that are skipped", async () => {
    const { db, mockDoc, mockCollection } = createMockFirestore({
      "app/prod/groups": ["admin", "stale-group"],
    });

    const spec: SeedSpec = {
      namespace: "app/prod",
      collections: [
        {
          name: "groups",
          testOnly: true,
          convergent: true,
          documents: [{ id: "admin", data: { name: "admin" } }],
        },
      ],
    };

    await seed(db, spec);

    expect(mockDoc).not.toHaveBeenCalled();
    expect(mockCollection).not.toHaveBeenCalled();
  });

  it("handles convergent with empty existing collection", async () => {
    const { db, deletedRefs } = createMockFirestore({
      "app/prod/posts": [],
    });

    const spec: SeedSpec = {
      namespace: "app/prod",
      collections: [
        {
          name: "posts",
          convergent: true,
          documents: [{ id: "p1", data: { title: "Post" } }],
        },
      ],
    };

    await seed(db, spec);

    expect(deletedRefs).toEqual([]);
  });
});
