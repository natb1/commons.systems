import { describe, it, expect, vi, beforeEach } from "vitest";

if (typeof globalThis.reportError !== "function") {
  globalThis.reportError = () => {};
}

vi.mock("marked", () => ({
  Marked: class {
    parse = vi.fn((md: string) => Promise.resolve(`<p>${md}</p>`));
  },
}));

import { renderHomeHtml, hydrateHome } from "../../src/pages/home";
import type { PostMeta } from "../../src/post-types";

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
    expect(html).toContain("Hello World</span></a>");
    expect(html).toContain('href="/post/hello-world"');
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

  it("displays UTC date regardless of local timezone", () => {
    const utcBoundaryPost: PostMeta = {
      id: "utc-test",
      title: "UTC Test",
      published: true,
      publishedAt: "2026-02-01T00:00:00Z",
      filename: "utc-test.md",
    };
    const html = renderHomeHtml([utcBoundaryPost]);
    expect(html).toContain("February 1, 2026");
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

  it("uses custom postLinkPrefix in article links", () => {
    const html = renderHomeHtml([publishedPost], "/post/");
    expect(html).toContain('href="/post/hello-world"');
    expect(html).not.toContain("#/post/");
  });
});

describe("hydrateHome", () => {
  let outlet: HTMLDivElement;
  let mockFetchPost: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    outlet = document.createElement("div");
    mockFetchPost = vi.fn();
  });

  it("injects fetched content into the placeholder div", async () => {
    outlet.innerHTML = renderHomeHtml([publishedPost]);
    mockFetchPost.mockResolvedValue("# Hello");

    hydrateHome(outlet, [publishedPost], mockFetchPost);
    await vi.waitFor(() => {
      const content = outlet.querySelector("#post-content-hello-world");
      expect(content?.innerHTML).toContain("<p>");
      expect(content?.innerHTML).not.toContain("Loading...");
    });
  });

  it("shows error message when fetch fails", async () => {
    outlet.innerHTML = renderHomeHtml([publishedPost]);
    mockFetchPost.mockRejectedValue(new Error("network error"));

    hydrateHome(outlet, [publishedPost], mockFetchPost);
    await vi.waitFor(() => {
      const content = outlet.querySelector("#post-content-hello-world");
      expect(content?.innerHTML).toContain("Could not load post content. Try refreshing.");
    });
  });

  it("does not write to DOM if outlet no longer contains the posts container", async () => {
    outlet.innerHTML = renderHomeHtml([publishedPost]);

    // Simulate navigation away by clearing outlet
    let resolveFetch!: (value: string) => void;
    mockFetchPost.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    hydrateHome(outlet, [publishedPost], mockFetchPost);
    outlet.innerHTML = "<p>Navigated away</p>";
    resolveFetch("# Hello");

    await new Promise((r) => setTimeout(r, 50));
    expect(outlet.innerHTML).toBe("<p>Navigated away</p>");
  });

  it("strips h1 from markdown and updates h2 title", async () => {
    outlet.innerHTML = renderHomeHtml([publishedPost]);
    mockFetchPost.mockResolvedValue("# Markdown Title\nBody text here.");

    hydrateHome(outlet, [publishedPost], mockFetchPost);
    await vi.waitFor(() => {
      const content = outlet.querySelector("#post-content-hello-world");
      expect(content?.innerHTML).not.toContain("Markdown Title");
      expect(content?.innerHTML).toContain("Body text here.");
    });

    const titleSpan = outlet.querySelector(
      "#post-hello-world h2 .post-title",
    );
    expect(titleSpan?.textContent).toBe("Markdown Title");
  });

  it("scrolls to target article when scrollTo is provided", async () => {
    // Add a header so hydrateHome can measure its height
    const header = document.createElement("header");
    Object.defineProperty(header, "offsetHeight", { value: 60, configurable: true });
    document.body.appendChild(header);

    outlet.innerHTML = renderHomeHtml([publishedPost]);
    mockFetchPost.mockResolvedValue("# Hello");

    const scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    try {
      hydrateHome(outlet, [publishedPost], mockFetchPost, "hello-world");
      await vi.waitFor(() => {
        expect(scrollSpy).toHaveBeenCalled();
      });

      // getBoundingClientRect().top is 0 in happy-dom, so Math.max(0, 0 + 0 - 60 - 16) = 0
      const call = scrollSpy.mock.calls[0][0] as ScrollToOptions;
      expect(call.top).toBe(0);
      expect(call.behavior).toBe("instant");
    } finally {
      scrollSpy.mockRestore();
      document.body.removeChild(header);
    }
  });

  it("skips scroll from stale hydration when outlet is re-rendered between calls", async () => {
    const header = document.createElement("header");
    Object.defineProperty(header, "offsetHeight", { value: 60, configurable: true });
    document.body.appendChild(header);

    const scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    try {
      // --- First hydration with a deferred fetch ---
      outlet.innerHTML = renderHomeHtml([publishedPost]);
      let resolveFirst!: (value: string) => void;
      const firstFetch = vi.fn(
        () => new Promise<string>((resolve) => { resolveFirst = resolve; }),
      );
      hydrateHome(outlet, [publishedPost], firstFetch, "hello-world");

      // --- Simulate re-render (auth state change replaces outlet contents) ---
      outlet.innerHTML = renderHomeHtml([publishedPost]);

      // --- Second hydration with its own deferred fetch ---
      let resolveSecond!: (value: string) => void;
      const secondFetch = vi.fn(
        () => new Promise<string>((resolve) => { resolveSecond = resolve; }),
      );
      hydrateHome(outlet, [publishedPost], secondFetch, "hello-world");

      // Resolve both fetches — first hydration's container is no longer in the DOM
      resolveFirst("# Hello");
      resolveSecond("# Hello");

      await vi.waitFor(() => {
        expect(scrollSpy).toHaveBeenCalledTimes(1);
      });

      // The single scroll call should come from the second hydration
      const call = scrollSpy.mock.calls[0][0] as ScrollToOptions;
      expect(call.behavior).toBe("instant");
    } finally {
      scrollSpy.mockRestore();
      document.body.removeChild(header);
    }
  });
});
