import { describe, it, expect, vi } from "vitest";
import { seed, type SeedSpec } from "../src/seed.js";

function createMockFirestore(
  existingDocs: Record<string, string[]> = {},
  overrides?: {
    listDocumentsError?: Error;
    deleteErrors?: Record<string, Error>;
    setError?: Error;
  },
) {
  const deletedRefs: string[] = [];

  const mockSet = vi.fn(async () => {
    if (overrides?.setError) throw overrides.setError;
  });

  const mockDoc = vi.fn((path: string) => {
    return { set: mockSet };
  });

  const mockCollection = vi.fn((path: string) => ({
    listDocuments: vi.fn(async () => {
      if (overrides?.listDocumentsError) throw overrides.listDocumentsError;
      return (existingDocs[path] ?? []).map((id) => ({
        id,
        delete: vi.fn(async () => {
          if (overrides?.deleteErrors?.[id]) throw overrides.deleteErrors[id];
          deletedRefs.push(`${path}/${id}`);
        }),
      }));
    }),
  }));

  const db = { doc: mockDoc, collection: mockCollection } as unknown as import("firebase-admin/firestore").Firestore;

  return { db, mockDoc, mockSet, mockCollection, deletedRefs };
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

  it("runs convergent deletion for testOnly collections when includeTestOnly is true", async () => {
    const { db, mockDoc, mockCollection, deletedRefs } = createMockFirestore({
      "app/test/groups": ["admin", "stale-group"],
    });

    const spec: SeedSpec = {
      namespace: "app/test",
      collections: [
        {
          name: "groups",
          testOnly: true,
          convergent: true,
          documents: [{ id: "admin", data: { name: "admin" } }],
        },
      ],
    };

    await seed(db, spec, { includeTestOnly: true });

    expect(mockDoc).toHaveBeenCalledWith("app/test/groups/admin");
    expect(mockCollection).toHaveBeenCalled();
    expect(deletedRefs).toEqual(["app/test/groups/stale-group"]);
  });

  it("throws on convergent collection with empty documents array", async () => {
    const { db } = createMockFirestore({
      "app/prod/posts": ["existing-doc"],
    });

    const spec: SeedSpec = {
      namespace: "app/prod",
      collections: [
        { name: "posts", convergent: true, documents: [] },
      ],
    };

    await expect(seed(db, spec)).rejects.toThrow(
      'Convergent collection "posts" has no documents',
    );
  });

  it("throws on duplicate document ids", async () => {
    const { db } = createMockFirestore();

    const spec: SeedSpec = {
      namespace: "app/prod",
      collections: [
        {
          name: "posts",
          documents: [
            { id: "dupe", data: { title: "First" } },
            { id: "dupe", data: { title: "Second" } },
          ],
        },
      ],
    };

    await expect(seed(db, spec)).rejects.toThrow(
      'duplicate document ids in "posts": dupe',
    );
  });

  it("throws with context when set() fails", async () => {
    const { db } = createMockFirestore({}, {
      setError: new Error("PERMISSION_DENIED"),
    });

    const spec: SeedSpec = {
      namespace: "app/prod",
      collections: [
        {
          name: "posts",
          documents: [{ id: "p1", data: { title: "Post" } }],
        },
      ],
    };

    await expect(seed(db, spec)).rejects.toThrow(
      'Failed to write seed document "p1" in "posts"',
    );
  });

  it("throws with context when listDocuments() fails", async () => {
    const { db } = createMockFirestore({}, {
      listDocumentsError: new Error("UNAVAILABLE"),
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

    await expect(seed(db, spec)).rejects.toThrow(
      'Failed to list documents in "app/prod/posts" during convergent seed of "posts"',
    );
  });

  it("throws with context when delete() fails", async () => {
    const { db } = createMockFirestore(
      { "app/prod/posts": ["p1", "stale"] },
      { deleteErrors: { stale: new Error("PERMISSION_DENIED") } },
    );

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

    await expect(seed(db, spec)).rejects.toThrow(
      'Failed to delete stale document "stale" in "posts"',
    );
  });
});
