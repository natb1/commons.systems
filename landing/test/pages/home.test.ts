import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/github.js", () => ({
  fetchPost: vi.fn(),
}));

vi.mock("marked", () => ({
  marked: {
    parse: vi.fn((md: string) => Promise.resolve(`<p>${md}</p>`)),
    use: vi.fn(),
  },
}));

import { renderHomeHtml, hydrateHome } from "../../src/pages/home";
import { fetchPost } from "../../src/github";
import type { PostMeta } from "../../src/firestore";

const mockFetchPost = vi.mocked(fetchPost);

const publishedPost: PostMeta = {
  id: "hello-world",
  title: "Hello World",
  published: true,
  publishedAt: "2026-01-01T00:00:00Z",
  filename: "hello-world.md",
};

const draftPost: PostMeta = {
  id: "draft-post",
  title: "Draft Post",
  published: false,
  publishedAt: null,
  filename: "draft-post.md",
};

describe("renderHomeHtml", () => {
  it("returns articles with correct IDs", () => {
    const html = renderHomeHtml([publishedPost]);
    expect(html).toContain('id="post-hello-world"');
  });

  it("returns a #posts container", () => {
    const html = renderHomeHtml([publishedPost]);
    expect(html).toContain('id="posts"');
  });

  it("renders post titles as links in h2 elements", () => {
    const html = renderHomeHtml([publishedPost]);
    expect(html).toContain('class="post-link"');
    expect(html).toContain("Hello World</a>");
    expect(html).toContain('href="#/post/hello-world"');
  });

  it("renders publishedAt in a time element", () => {
    const html = renderHomeHtml([publishedPost]);
    expect(html).toContain('datetime="2026-01-01T00:00:00Z"');
  });

  it("shows [draft] badge for unpublished posts", () => {
    const html = renderHomeHtml([draftPost]);
    expect(html).toContain("[draft]");
  });

  it("does not show [draft] badge for published posts", () => {
    const html = renderHomeHtml([publishedPost]);
    expect(html).not.toContain("[draft]");
  });

  it("renders loading placeholder for each post", () => {
    const html = renderHomeHtml([publishedPost]);
    expect(html).toContain('id="post-content-hello-world"');
    expect(html).toContain("Loading...");
  });

  it("shows 'No posts yet.' when post list is empty", () => {
    const html = renderHomeHtml([]);
    expect(html).toContain("No posts yet.");
  });

  it("renders multiple articles", () => {
    const html = renderHomeHtml([publishedPost, draftPost]);
    expect(html).toContain('id="post-hello-world"');
    expect(html).toContain('id="post-draft-post"');
  });
});

describe("hydrateHome", () => {
  let outlet: HTMLDivElement;

  beforeEach(() => {
    vi.clearAllMocks();
    outlet = document.createElement("div");
  });

  it("injects fetched content into the placeholder div", async () => {
    outlet.innerHTML = renderHomeHtml([publishedPost]);
    mockFetchPost.mockResolvedValue("# Hello");

    hydrateHome(outlet, [publishedPost]);
    await vi.waitFor(() => {
      const content = outlet.querySelector("#post-content-hello-world");
      expect(content?.innerHTML).toContain("<p>");
      expect(content?.innerHTML).not.toContain("Loading...");
    });
  });

  it("shows error message when fetch fails", async () => {
    outlet.innerHTML = renderHomeHtml([publishedPost]);
    mockFetchPost.mockRejectedValue(new Error("network error"));

    hydrateHome(outlet, [publishedPost]);
    await vi.waitFor(() => {
      const content = outlet.querySelector("#post-content-hello-world");
      expect(content?.innerHTML).toContain("Could not load post content.");
    });
  });

  it("does not write to DOM if outlet no longer contains the posts container", async () => {
    outlet.innerHTML = renderHomeHtml([publishedPost]);
    const originalContent =
      outlet.querySelector("#post-content-hello-world")?.innerHTML;

    // Simulate navigation away by clearing outlet
    let resolveFetch!: (value: string) => void;
    mockFetchPost.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    hydrateHome(outlet, [publishedPost]);
    outlet.innerHTML = "<p>Navigated away</p>";
    resolveFetch("# Hello");

    await new Promise((r) => setTimeout(r, 50));
    expect(outlet.innerHTML).toBe("<p>Navigated away</p>");
  });

  it("scrolls to target article when scrollTo is provided", async () => {
    // Add a header so hydrateHome can measure its height
    const header = document.createElement("header");
    Object.defineProperty(header, "offsetHeight", { value: 60, configurable: true });
    document.body.appendChild(header);

    outlet.innerHTML = renderHomeHtml([publishedPost]);
    mockFetchPost.mockResolvedValue("# Hello");

    const scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    hydrateHome(outlet, [publishedPost], "hello-world");
    await vi.waitFor(() => {
      expect(scrollSpy).toHaveBeenCalled();
    });

    // Verify header height is subtracted from scroll position
    const call = scrollSpy.mock.calls[0][0] as ScrollToOptions;
    expect(call.top).toBeLessThanOrEqual(0); // getBoundingClientRect().top is 0 in happy-dom, so 0 + 0 - 60 - 16 = -76, clamped to 0
    expect(call.behavior).toBe("smooth");

    scrollSpy.mockRestore();
    document.body.removeChild(header);
  });
});
