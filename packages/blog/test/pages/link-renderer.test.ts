// @vitest-environment happy-dom
//
// The marked link/image renderer attributes (target/rel/external-link-icon,
// href escaping, title) flow through the markdown render + DOMPurify sanitize
// path that used to live in hydrateHome and now lives in HomeRegion's effect.
// These cases mount HomeRegion with a fetchPost stub returning the markdown,
// await the effect, and assert the same sanitized innerHTML — so the coverage
// (including that DOMPurify's ADD_ATTR preserves target="_blank"/rel) is
// preserved against the real Marked instance (no marked mock here).
import { describe, it, expect, vi, afterEach } from "vitest";
import { createElement } from "react";
import { render, cleanup, waitFor } from "@testing-library/react";
import { HomeRegion } from "../../src/pages/HomeRegion";
import type { PostMeta } from "../../src/post-types";

if (typeof globalThis.reportError !== "function") {
  globalThis.reportError = () => {};
}

const post: PostMeta = {
  id: "test-post",
  title: "Test Post",
  published: true,
  publishedAt: "2026-01-01T00:00:00Z",
  filename: "test-post.md",
};

describe("link renderer (real Marked instance)", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  /** Mount HomeRegion with the given markdown, await the hydrate effect, and
   * return the sanitized content element. */
  async function renderAndHydrate(markdown: string): Promise<Element> {
    const { container } = render(
      createElement(HomeRegion, {
        posts: [post],
        postLinkPrefix: "/post/",
        fetchPost: vi.fn().mockResolvedValue(markdown),
      }),
    );
    let content: Element | null = null;
    await waitFor(() => {
      content = container.querySelector("#post-content-test-post");
      expect(content?.innerHTML).not.toContain("Loading...");
    });
    return content!;
  }

  it("renders links with target=_blank and rel=noopener noreferrer", async () => {
    const content = await renderAndHydrate(
      "Check [example](https://example.com) link",
    );
    expect(content.innerHTML).toContain('target="_blank"');
    expect(content.innerHTML).toContain('rel="noopener noreferrer"');
    expect(content.innerHTML).toContain('href="https://example.com"');
    expect(content.innerHTML).toContain(">example");
    expect(content.innerHTML).toContain('class="external-link-icon"');
  });

  it("omits external-link-icon for internal/relative links", async () => {
    const content = await renderAndHydrate("Check [post](/post/x) link");
    expect(content.innerHTML).toContain('href="/post/x"');
    expect(content.innerHTML).not.toContain("external-link-icon");
    expect(content.innerHTML).not.toContain('target="_blank"');
    expect(content.innerHTML).not.toContain('rel="noopener noreferrer"');
  });

  it("escapes special characters in href", async () => {
    const content = await renderAndHydrate(
      '[click](https://example.com/a&b "")',
    );
    expect(content.innerHTML).toContain("&amp;");
  });

  it("renders title attribute when link has title text", async () => {
    const content = await renderAndHydrate(
      '[example](https://example.com "Example Title") link',
    );
    expect(content.innerHTML).toContain('title="Example Title"');
  });

  it("omits title attribute when link has no title", async () => {
    const content = await renderAndHydrate(
      "[example](https://example.com) link",
    );
    const anchor = content.querySelector("a");
    expect(anchor).toBeTruthy();
    expect(anchor?.hasAttribute("title")).toBe(false);
  });
});
