import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EmptyFeed, PostFeed } from "../../src/pages/Home.tsx";
import type { PostContent } from "../../src/pages/home";
import type { PostMeta } from "../../src/post-types";

// Local static-markup helper reproducing the former renderHomeHtml bridge
// (deleted with the imperative code in src/pages/home.ts). It renders the frozen
// presentational components directly so every assertion body below stays
// identical — preserving the rendered-markup coverage. The hydrateHome behavior
// (fetch/parse/sanitize, h1-title update, error fallback, scroll-to-post,
// staleness) now lives in HomeRegion and is covered in ../home-region.test.tsx.
function renderHomeHtml(
  posts: PostMeta[],
  postLinkPrefix = "/post/",
  contentMap?: Record<string, PostContent>,
): string {
  return posts.length === 0
    ? renderToStaticMarkup(createElement(EmptyFeed))
    : renderToStaticMarkup(createElement(PostFeed, { posts, postLinkPrefix, contentMap }));
}

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

  it("does not include link-icon span or link emoji in rendered titles", () => {
    const html = renderHomeHtml([publishedPost]);
    expect(html).not.toContain("link-icon");
    expect(html).not.toContain("&#x1F517;");
  });

  it("renders publishedAt in a time element", () => {
    const html = renderHomeHtml([publishedPost]);
    // React's static renderer emits the datetime attribute as `dateTime`
    // (camelCase). HTML attribute names are case-insensitive, so the browser
    // parses `<time dateTime="...">` as `datetime`; the hydrator never queries
    // this attribute, so the casing is cosmetic.
    expect(html).toMatch(/<time [^>]*=["']2026-01-01T00:00:00Z["']/i);
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

  it("inlines content HTML with data-hydrated when contentMap is provided", () => {
    const contentMap: Record<string, PostContent> = {
      "hello-world": { html: "<p>Pre-rendered body</p>", title: "Hello World" },
    };
    const html = renderHomeHtml([publishedPost], "/post/", contentMap);
    expect(html).toContain("<p>Pre-rendered body</p>");
    expect(html).toContain("data-hydrated");
    expect(html).not.toContain("Loading...");
  });

  it("uses contentMap title over post metadata title when provided", () => {
    const contentMap: Record<string, PostContent> = {
      "hello-world": { html: "<p>Body</p>", title: "Override Title" },
    };
    const html = renderHomeHtml([publishedPost], "/post/", contentMap);
    expect(html).toContain('<span class="post-title">Override Title</span>');
  });

  it("falls back to metadata title when contentMap title is null", () => {
    const contentMap: Record<string, PostContent> = {
      "hello-world": { html: "<p>Body</p>", title: null },
    };
    const html = renderHomeHtml([publishedPost], "/post/", contentMap);
    expect(html).toContain('<span class="post-title">Hello World</span>');
  });

  it("renders Loading placeholder for posts not in contentMap", () => {
    const contentMap: Record<string, PostContent> = {
      "some-other-post": { html: "<p>Other</p>", title: "Other" },
    };
    const html = renderHomeHtml([publishedPost], "/post/", contentMap);
    expect(html).toContain("Loading...");
  });
});
