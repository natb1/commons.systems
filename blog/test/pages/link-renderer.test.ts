import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHomeHtml, hydrateHome } from "../../src/pages/home";
import type { PostMeta } from "../../src/post-types";

const post: PostMeta = {
  id: "test-post",
  title: "Test Post",
  published: true,
  publishedAt: "2026-01-01T00:00:00Z",
  filename: "test-post.md",
};

describe("link renderer (real Marked instance)", () => {
  let outlet: HTMLDivElement;

  beforeEach(() => {
    outlet = document.createElement("div");
  });

  /** Render and hydrate with the given markdown, returning the content element. */
  async function renderAndHydrate(markdown: string): Promise<Element> {
    outlet.innerHTML = renderHomeHtml([post]);
    hydrateHome(outlet, [post], vi.fn().mockResolvedValue(markdown));
    let content: Element | null = null;
    await vi.waitFor(() => {
      content = outlet.querySelector("#post-content-test-post");
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
    expect(content.innerHTML).toContain(">example</a>");
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
