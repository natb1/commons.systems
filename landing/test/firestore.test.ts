import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeUser } from "./helpers/make-user";

const mockGetDocs = vi.fn();
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockOrderBy = vi.fn();
const mockWhere = vi.fn();

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  where: (...args: unknown[]) => mockWhere(...args),
}));

vi.mock("../src/firebase.js", () => ({
  db: { type: "mock-firestore" },
  NAMESPACE: "landing/test",
}));

import { getPosts } from "../src/firestore";

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

const natb1UserByScreenName = makeUser({ screenName: "natb1" });
const natb1UserByProviderData = makeUser({ providerUid: "natb1" });
const otherUser = makeUser({ screenName: "other", providerUid: "other-uid" });

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

  it("sorts published posts by publishedAt ascending for non-admin", async () => {
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
    mockGetDocs.mockResolvedValue({ docs: [feb, jan] });

    const posts = await getPosts(null);

    expect(posts[0].id).toBe("jan");
    expect(posts[1].id).toBe("feb");
  });

  it("filters out documents with missing title", async () => {
    const noTitle = {
      id: "no-title",
      data: () => ({ published: true, publishedAt: null, filename: "f.md" }),
    };
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetDocs.mockResolvedValue({ docs: [publishedPost, noTitle] });

    const posts = await getPosts(natb1UserByScreenName);

    expect(posts).toHaveLength(1);
    expect(posts[0].id).toBe("hello-world");
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("no-title"),
      expect.anything(),
    );
    consoleError.mockRestore();
  });

  it("filters out documents with missing filename", async () => {
    const noFilename = {
      id: "no-filename",
      data: () => ({ title: "Title", published: true, publishedAt: null }),
    };
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetDocs.mockResolvedValue({ docs: [noFilename] });

    const posts = await getPosts(natb1UserByScreenName);

    expect(posts).toHaveLength(0);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("treats non-boolean published as false", async () => {
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

    const posts = await getPosts(natb1UserByScreenName);

    expect(posts).toHaveLength(1);
    expect(posts[0].published).toBe(false);
  });

  it("sorts posts with null publishedAt to the end for non-admin", async () => {
    const withDate = {
      id: "dated",
      data: () => ({
        title: "Dated",
        published: true,
        publishedAt: "2026-01-01T00:00:00Z",
        filename: "dated.md",
      }),
    };
    const noDate = {
      id: "no-date",
      data: () => ({
        title: "No Date",
        published: true,
        publishedAt: null,
        filename: "no-date.md",
      }),
    };
    mockGetDocs.mockResolvedValue({ docs: [noDate, withDate] });

    const posts = await getPosts(null);

    expect(posts[0].id).toBe("dated");
    expect(posts[1].id).toBe("no-date");
  });
});
