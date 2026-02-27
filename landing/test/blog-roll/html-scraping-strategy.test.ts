import { describe, it, expect, vi, afterEach } from "vitest";
import { HtmlScrapingStrategy } from "../../src/blog-roll/html-scraping-strategy";

const PAGE_HTML = `<!doctype html>
<html>
<body>
  <a href="/other-page">Not a match</a>
  <a href="/engineering/infrastructure-noise">Quantifying infrastructure noise in agentic coding evals</a>
  <a href="/engineering/building-c-compiler">Building a C compiler</a>
</body>
</html>`;

describe("HtmlScrapingStrategy", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the first matching link as latest post", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(PAGE_HTML),
      }),
    );

    const strategy = new HtmlScrapingStrategy(
      "https://www.anthropic.com/engineering",
      /^\/engineering\/.+/,
    );
    const result = await strategy.fetchLatestPost();

    expect(result).toEqual({
      title: "Quantifying infrastructure noise in agentic coding evals",
      url: "https://www.anthropic.com/engineering/infrastructure-noise",
    });
  });

  it("resolves relative URLs to absolute using page URL as base", async () => {
    const html = `<html><body><a href="/engineering/test-post">Test</a></body></html>`;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(html),
      }),
    );

    const strategy = new HtmlScrapingStrategy(
      "https://www.anthropic.com/engineering",
      /^\/engineering\/.+/,
    );
    const result = await strategy.fetchLatestPost();

    expect(result?.url).toBe(
      "https://www.anthropic.com/engineering/test-post",
    );
  });

  it("returns null when no links match the pattern", async () => {
    const html = `<html><body><a href="/about">About</a></body></html>`;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(html),
      }),
    );

    const strategy = new HtmlScrapingStrategy(
      "https://www.anthropic.com/engineering",
      /^\/engineering\/.+/,
    );
    const result = await strategy.fetchLatestPost();

    expect(result).toBeNull();
  });

  it("returns null on fetch failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    const strategy = new HtmlScrapingStrategy(
      "https://www.anthropic.com/engineering",
      /^\/engineering\/.+/,
    );
    const result = await strategy.fetchLatestPost();

    expect(result).toBeNull();
  });

  it("skips links with empty text content", async () => {
    const html = `<html><body>
      <a href="/engineering/empty">  </a>
      <a href="/engineering/real">Real Post Title</a>
    </body></html>`;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(html),
      }),
    );

    const strategy = new HtmlScrapingStrategy(
      "https://www.anthropic.com/engineering",
      /^\/engineering\/.+/,
    );
    const result = await strategy.fetchLatestPost();

    expect(result).toEqual({
      title: "Real Post Title",
      url: "https://www.anthropic.com/engineering/real",
    });
  });

  it("returns null when response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve(""),
      }),
    );

    const strategy = new HtmlScrapingStrategy(
      "https://www.anthropic.com/engineering",
      /^\/engineering\/.+/,
    );
    const result = await strategy.fetchLatestPost();

    expect(result).toBeNull();
  });
});
