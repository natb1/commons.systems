import { describe, it, expect, vi, beforeEach } from "vitest";
import type { User } from "firebase/auth";

const mockGetDocs = vi.fn();
const mockGetDoc = vi.fn();
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockOrderBy = vi.fn();
const mockWhere = vi.fn();
const mockDoc = vi.fn();

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
}));

vi.mock("../src/firebase.js", () => ({
  db: { type: "mock-firestore" },
  NAMESPACE: "landing/test",
}));

import { getPosts, getPostMeta } from "../src/firestore";

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

const natb1UserByScreenName = {
  reloadUserInfo: { screenName: "natb1" },
  providerData: [],
} as unknown as User;

const natb1UserByProviderData = {
  reloadUserInfo: {},
  providerData: [{ uid: "natb1" }],
} as unknown as User;

const otherUser = {
  reloadUserInfo: { screenName: "other" },
  providerData: [{ uid: "other-uid" }],
} as unknown as User;

describe("getPosts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue("mock-collection-ref");
    mockOrderBy.mockReturnValue("mock-order");
    mockWhere.mockReturnValue("mock-where");
    mockQuery.mockReturnValue("mock-query");
  });

  it("queries the correct namespaced collection path", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getPosts(null);

    expect(mockCollection).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "landing/test/posts",
    );
  });

  it("uses where filter for non-admin queries", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getPosts(null);

    expect(mockWhere).toHaveBeenCalledWith("published", "==", true);
    expect(mockOrderBy).not.toHaveBeenCalled();
  });

  it("orders results by publishedAt for admin", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getPosts(natb1UserByScreenName);

    expect(mockOrderBy).toHaveBeenCalledWith("publishedAt");
    expect(mockWhere).not.toHaveBeenCalled();
  });

  it("returns only published posts when user is null", async () => {
    mockGetDocs.mockResolvedValue({ docs: [publishedPost, draftPost] });

    const posts = await getPosts(null);

    expect(posts).toHaveLength(1);
    expect(posts[0].id).toBe("hello-world");
    expect(posts[0].published).toBe(true);
  });

  it("returns all posts including drafts for natb1 user identified by screenName", async () => {
    mockGetDocs.mockResolvedValue({ docs: [publishedPost, draftPost] });

    const posts = await getPosts(natb1UserByScreenName);

    expect(posts).toHaveLength(2);
  });

  it("returns all posts including drafts for natb1 user identified by providerData uid", async () => {
    mockGetDocs.mockResolvedValue({ docs: [publishedPost, draftPost] });

    const posts = await getPosts(natb1UserByProviderData);

    expect(posts).toHaveLength(2);
  });

  it("returns only published posts for a non-natb1 signed-in user", async () => {
    mockGetDocs.mockResolvedValue({ docs: [publishedPost, draftPost] });

    const posts = await getPosts(otherUser);

    expect(posts).toHaveLength(1);
    expect(posts[0].id).toBe("hello-world");
  });

  it("maps Firestore documents to PostMeta objects", async () => {
    mockGetDocs.mockResolvedValue({ docs: [publishedPost] });

    const posts = await getPosts(null);

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
    mockGetDocs.mockResolvedValue({ docs: [draftPost] });

    const posts = await getPosts(null);

    expect(posts).toEqual([]);
  });
});

describe("getPostMeta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.mockReturnValue("mock-doc-ref");
  });

  it("queries the correct namespaced document path", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    await getPostMeta("hello-world");

    expect(mockDoc).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "landing/test/posts",
      "hello-world",
    );
  });

  it("returns null when the document does not exist", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    const result = await getPostMeta("nonexistent");

    expect(result).toBeNull();
  });

  it("returns PostMeta when the document exists", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: "hello-world",
      data: () => ({
        title: "Hello World",
        published: true,
        publishedAt: "2026-01-01T00:00:00Z",
        filename: "hello-world.md",
      }),
    });

    const result = await getPostMeta("hello-world");

    expect(result).toEqual({
      id: "hello-world",
      title: "Hello World",
      published: true,
      publishedAt: "2026-01-01T00:00:00Z",
      filename: "hello-world.md",
    });
  });

  it("sets publishedAt to null when field is missing", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: "draft-post",
      data: () => ({
        title: "Draft Post",
        published: false,
        filename: "draft-post.md",
      }),
    });

    const result = await getPostMeta("draft-post");

    expect(result).not.toBeNull();
    expect(result!.publishedAt).toBeNull();
  });
});
