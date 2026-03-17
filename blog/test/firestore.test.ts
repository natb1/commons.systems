import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetDocs = vi.fn();
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockOrderBy = vi.fn();
const mockWhere = vi.fn();
const mockIsInGroup = vi.fn();

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  where: (...args: unknown[]) => mockWhere(...args),
}));

vi.mock("@commons-systems/authutil/groups", () => ({
  isInGroup: (...args: unknown[]) => mockIsInGroup(...args),
  ADMIN_GROUP_ID: "admin",
}));

import { getPosts } from "../src/firestore";
import type { User } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

const mockDb = { type: "mock-firestore" } as unknown as Firestore;
import type { Namespace } from "@commons-systems/firestoreutil/namespace";

const NAMESPACE = "test/ns" as Namespace;

const publishedPost = {
  id: "hello-world",
  data: () => ({
    title: "Hello World",
    published: true,
    publishedAt: "2026-01-01T00:00:00Z",
    filename: "hello-world.md",
  }),
};

const draftPost = {
  id: "draft-post",
  data: () => ({
    title: "Draft Post",
    published: false,
    publishedAt: null,
    filename: "draft-post.md",
  }),
};

const adminUser = { uid: "admin-uid" } as User;
const regularUser = { uid: "regular-uid" } as User;

describe("getPosts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue("mock-collection-ref");
    mockOrderBy.mockReturnValue("mock-order");
    mockWhere.mockReturnValue("mock-where");
    mockQuery.mockReturnValue("mock-query");
    mockIsInGroup.mockResolvedValue(false);
  });

  it("queries the correct namespaced collection path", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getPosts(mockDb, NAMESPACE, null);

    expect(mockCollection).toHaveBeenCalledWith(
      mockDb,
      "test/ns/posts",
    );
  });

  it("uses where filter for non-admin queries", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getPosts(mockDb, NAMESPACE, null);

    expect(mockWhere).toHaveBeenCalledWith("published", "==", true);
    expect(mockOrderBy).not.toHaveBeenCalled();
  });

  it("orders results by publishedAt for admin", async () => {
    mockIsInGroup.mockResolvedValue(true);
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getPosts(mockDb, NAMESPACE, adminUser);

    expect(mockIsInGroup).toHaveBeenCalledWith(
      mockDb,
      NAMESPACE,
      adminUser,
      "admin",
    );
    expect(mockOrderBy).toHaveBeenCalledWith("publishedAt", "desc");
    expect(mockWhere).not.toHaveBeenCalled();
  });

  it("returns only published posts when user is null", async () => {
    mockGetDocs.mockResolvedValue({ docs: [publishedPost] });

    const { posts } = await getPosts(mockDb, NAMESPACE, null);

    expect(posts).toHaveLength(1);
    expect(posts[0].id).toBe("hello-world");
    expect(posts[0].published).toBe(true);
  });

  it("returns all posts including drafts for admin user", async () => {
    mockIsInGroup.mockResolvedValue(true);
    mockGetDocs.mockResolvedValue({ docs: [publishedPost, draftPost] });

    const { posts } = await getPosts(mockDb, NAMESPACE, adminUser);

    expect(posts).toHaveLength(2);
  });

  it("returns only published posts for a non-admin signed-in user", async () => {
    mockIsInGroup.mockResolvedValue(false);
    mockGetDocs.mockResolvedValue({ docs: [publishedPost] });

    const { posts } = await getPosts(mockDb, NAMESPACE, regularUser);

    expect(posts).toHaveLength(1);
    expect(posts[0].id).toBe("hello-world");
  });

  it("maps Firestore documents to PostMeta objects", async () => {
    mockGetDocs.mockResolvedValue({ docs: [publishedPost] });

    const { posts } = await getPosts(mockDb, NAMESPACE, null);

    expect(posts).toEqual([
      {
        id: "hello-world",
        title: "Hello World",
        published: true,
        publishedAt: "2026-01-01T00:00:00Z",
        filename: "hello-world.md",
      },
    ]);
  });

  it("returns empty array when there are no published posts and user is null", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    const { posts } = await getPosts(mockDb, NAMESPACE, null);

    expect(posts).toEqual([]);
  });

  it("sorts published posts by publishedAt descending for non-admin", async () => {
    const jan = {
      id: "jan",
      data: () => ({
        title: "January",
        published: true,
        publishedAt: "2026-01-15T00:00:00Z",
        filename: "jan.md",
      }),
    };
    const feb = {
      id: "feb",
      data: () => ({
        title: "February",
        published: true,
        publishedAt: "2026-02-15T00:00:00Z",
        filename: "feb.md",
      }),
    };
    mockGetDocs.mockResolvedValue({ docs: [jan, feb] });

    const { posts } = await getPosts(mockDb, NAMESPACE, null);

    expect(posts[0].id).toBe("feb");
    expect(posts[1].id).toBe("jan");
  });

  it("filters out documents with missing title", async () => {
    mockIsInGroup.mockResolvedValue(true);
    const noTitle = {
      id: "no-title",
      data: () => ({ published: true, publishedAt: null, filename: "f.md" }),
    };
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetDocs.mockResolvedValue({ docs: [publishedPost, noTitle] });

    const { posts, skippedCount } = await getPosts(mockDb, NAMESPACE, adminUser);

    expect(posts).toHaveLength(1);
    expect(posts[0].id).toBe("hello-world");
    expect(skippedCount).toBe(1);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("no-title"),
      expect.anything(),
    );
    consoleError.mockRestore();
  });

  it("filters out documents with missing filename", async () => {
    mockIsInGroup.mockResolvedValue(true);
    const noFilename = {
      id: "no-filename",
      data: () => ({ title: "Title", published: true, publishedAt: null }),
    };
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetDocs.mockResolvedValue({ docs: [noFilename] });

    const { posts, skippedCount } = await getPosts(mockDb, NAMESPACE, adminUser);

    expect(posts).toHaveLength(0);
    expect(skippedCount).toBe(1);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("treats non-boolean published as false", async () => {
    mockIsInGroup.mockResolvedValue(true);
    const badPublished = {
      id: "bad-pub",
      data: () => ({
        title: "Bad",
        published: "yes",
        publishedAt: null,
        filename: "bad.md",
      }),
    };
    mockGetDocs.mockResolvedValue({ docs: [badPublished] });

    const { posts } = await getPosts(mockDb, NAMESPACE, adminUser);

    expect(posts).toHaveLength(1);
    expect(posts[0].published).toBe(false);
  });

  it("filters out published posts with invalid publishedAt date", async () => {
    mockIsInGroup.mockResolvedValue(true);
    const invalidDate = {
      id: "bad-date",
      data: () => ({
        title: "Bad Date",
        published: true,
        publishedAt: "not-a-date",
        filename: "bad-date.md",
      }),
    };
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetDocs.mockResolvedValue({ docs: [invalidDate] });

    const { posts, skippedCount } = await getPosts(mockDb, NAMESPACE, adminUser);

    expect(posts).toHaveLength(0);
    expect(skippedCount).toBe(1);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("bad-date"),
      expect.anything(),
    );
    consoleError.mockRestore();
  });

  it("filters out published posts without publishedAt date", async () => {
    mockIsInGroup.mockResolvedValue(true);
    const badPublished = {
      id: "published-no-date",
      data: () => ({
        title: "Published No Date",
        published: true,
        publishedAt: null,
        filename: "bad.md",
      }),
    };
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetDocs.mockResolvedValue({ docs: [badPublished] });

    const { posts, skippedCount } = await getPosts(mockDb, NAMESPACE, adminUser);

    expect(posts).toHaveLength(0);
    expect(skippedCount).toBe(1);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("published-no-date"),
      expect.anything(),
    );
    consoleError.mockRestore();
  });
});
