import { describe, it, expect, vi, beforeEach } from "vitest";
import type { User } from "firebase/auth";

vi.mock("../../src/firestore.js", () => ({
  getPosts: vi.fn(),
}));

import { renderHome } from "../../src/pages/home";
import { getPosts } from "../../src/firestore";

const mockGetPosts = vi.mocked(getPosts);

const publishedPost = {
  id: "hello-world",
  title: "Hello World",
  published: true,
  publishedAt: "2026-01-01T00:00:00Z",
  filename: "hello-world.md",
};

const draftPost = {
  id: "draft-post",
  title: "Draft Post",
  published: false,
  publishedAt: null,
  filename: "draft-post.md",
};

describe("renderHome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns HTML containing an h2 Home heading", async () => {
    mockGetPosts.mockResolvedValue([]);
    const html = await renderHome(null);
    expect(html).toContain("<h2>Home</h2>");
  });

  it("renders a post list element when there are posts", async () => {
    mockGetPosts.mockResolvedValue([publishedPost]);
    const html = await renderHome(null);
    expect(html).toContain('<ul id="posts">');
  });

  it("renders post titles as links to #/post/<slug>", async () => {
    mockGetPosts.mockResolvedValue([publishedPost]);
    const html = await renderHome(null);
    expect(html).toContain('href="#/post/hello-world"');
    expect(html).toContain("Hello World");
  });

  it("renders multiple posts", async () => {
    const secondPost = {
      id: "second-post",
      title: "Second Post",
      published: true,
      publishedAt: "2026-02-01T00:00:00Z",
      filename: "second-post.md",
    };
    mockGetPosts.mockResolvedValue([publishedPost, secondPost]);
    const html = await renderHome(null);
    expect(html).toContain('href="#/post/hello-world"');
    expect(html).toContain('href="#/post/second-post"');
    expect(html).toContain("Hello World");
    expect(html).toContain("Second Post");
  });

  it("shows [draft] badge for unpublished posts", async () => {
    mockGetPosts.mockResolvedValue([draftPost]);
    const html = await renderHome(null);
    expect(html).toContain("[draft]");
  });

  it("does not show [draft] badge for published posts", async () => {
    mockGetPosts.mockResolvedValue([publishedPost]);
    const html = await renderHome(null);
    expect(html).not.toContain("[draft]");
  });

  it("renders publishedAt in a time element", async () => {
    mockGetPosts.mockResolvedValue([publishedPost]);
    const html = await renderHome(null);
    expect(html).toContain('<time datetime="2026-01-01T00:00:00Z">');
  });

  it("shows 'No posts yet.' when the post list is empty", async () => {
    mockGetPosts.mockResolvedValue([]);
    const html = await renderHome(null);
    expect(html).toContain("No posts yet.");
  });

  it("renders error fallback when getPosts throws", async () => {
    mockGetPosts.mockRejectedValue(new Error("connection failed"));
    const html = await renderHome(null);
    expect(html).toContain("Could not load");
  });

  it("passes the user argument through to getPosts", async () => {
    mockGetPosts.mockResolvedValue([]);
    const user = { uid: "user-1" } as unknown as User;
    await renderHome(user);
    expect(mockGetPosts).toHaveBeenCalledWith(user);
  });

  it("passes null to getPosts when called with null", async () => {
    mockGetPosts.mockResolvedValue([]);
    await renderHome(null);
    expect(mockGetPosts).toHaveBeenCalledWith(null);
  });
});
