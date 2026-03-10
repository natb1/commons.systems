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

  it("renders links with target=_blank and rel=noopener noreferrer", async () => {
    outlet.innerHTML = renderHomeHtml([post]);
    const fetchPost = vi
      .fn()
      .mockResolvedValue("Check [example](https://example.com) link");

    hydrateHome(outlet, [post], fetchPost);
    await vi.waitFor(() => {
      const content = outlet.querySelector("#post-content-test-post");
      expect(content?.innerHTML).toContain('target="_blank"');
      expect(content?.innerHTML).toContain('rel="noopener noreferrer"');
      expect(content?.innerHTML).toContain('href="https://example.com"');
      expect(content?.innerHTML).toContain(">example</a>");
    });
  });

  it("escapes special characters in href", async () => {
    outlet.innerHTML = renderHomeHtml([post]);
    const fetchPost = vi
      .fn()
      .mockResolvedValue('[click](https://example.com/a&b "")');

    hydrateHome(outlet, [post], fetchPost);
    await vi.waitFor(() => {
      const content = outlet.querySelector("#post-content-test-post");
      expect(content?.innerHTML).toContain("&amp;");
    });
  });

  it("renders title attribute when link has title text", async () => {
    outlet.innerHTML = renderHomeHtml([post]);
    const fetchPost = vi
      .fn()
      .mockResolvedValue(
        '[example](https://example.com "Example Title") link',
      );

    hydrateHome(outlet, [post], fetchPost);
    await vi.waitFor(() => {
      const content = outlet.querySelector("#post-content-test-post");
      expect(content?.innerHTML).toContain('title="Example Title"');
    });
  });

  it("omits title attribute when link has no title", async () => {
    outlet.innerHTML = renderHomeHtml([post]);
    const fetchPost = vi
      .fn()
      .mockResolvedValue("[example](https://example.com) link");

    hydrateHome(outlet, [post], fetchPost);
    await vi.waitFor(() => {
      const content = outlet.querySelector("#post-content-test-post");
      const anchor = content?.querySelector("a");
      expect(anchor).toBeTruthy();
      expect(anchor?.hasAttribute("title")).toBe(false);
    });
  });
});
