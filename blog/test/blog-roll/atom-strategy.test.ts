import { describe, it, expect, vi, afterEach } from "vitest";
import { AtomStrategy } from "../../src/blog-roll/atom-strategy";

const ATOM_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test Blog</title>
  <entry>
    <title>Latest Atom Post</title>
    <link href="https://example.com/atom-post"/>
    <published>2026-02-01T00:00:00Z</published>
  </entry>
</feed>`;

const RSS_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Blog</title>
    <item>
      <title>Latest RSS Post</title>
      <link>https://example.com/rss-post</link>
      <pubDate>Sun, 01 Feb 2026 00:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AtomStrategy", () => {
  it("parses Atom feed and returns latest post", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(ATOM_FEED),
    }));

    const strategy = new AtomStrategy("https://example.com/feed");
    const result = await strategy.fetchLatestPost();

    expect(result).toEqual({
      title: "Latest Atom Post",
      url: "https://example.com/atom-post",
      publishedAt: "2026-02-01T00:00:00Z",
    });

    vi.unstubAllGlobals();
  });

  it("parses RSS feed and returns latest post", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(RSS_FEED),
    }));

    const strategy = new AtomStrategy("https://example.com/feed");
    const result = await strategy.fetchLatestPost();

    expect(result).toEqual({
      title: "Latest RSS Post",
      url: "https://example.com/rss-post",
      publishedAt: "Sun, 01 Feb 2026 00:00:00 GMT",
    });

    vi.unstubAllGlobals();
  });

  it("falls back to allorigins proxy on CORS error", async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ contents: ATOM_FEED }),
      });
    vi.stubGlobal("fetch", mockFetch);

    const strategy = new AtomStrategy("https://example.com/feed");
    const result = await strategy.fetchLatestPost();

    expect(result).toEqual({
      title: "Latest Atom Post",
      url: "https://example.com/atom-post",
      publishedAt: "2026-02-01T00:00:00Z",
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const proxyUrl = mockFetch.mock.calls[1][0] as string;
    expect(proxyUrl).toContain("api.allorigins.win");
    expect(proxyUrl).toContain(encodeURIComponent("https://example.com/feed"));

    vi.unstubAllGlobals();
  });

  it("returns null when both direct fetch and proxy fail", async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce({ ok: false, status: 500 });
    vi.stubGlobal("fetch", mockFetch);

    const strategy = new AtomStrategy("https://example.com/feed");
    const result = await strategy.fetchLatestPost();

    expect(result).toBeNull();

    vi.unstubAllGlobals();
  });

  it("returns null for unparseable XML", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("not valid xml at all"),
    }));

    const strategy = new AtomStrategy("https://example.com/feed");
    const result = await strategy.fetchLatestPost();

    // Falls through to proxy since direct parse returns null
    expect(result).toBeNull();

    vi.unstubAllGlobals();
  });

  it("returns null for empty feed", async () => {
    const emptyFeed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Empty Blog</title>
</feed>`;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(emptyFeed),
    }));

    const strategy = new AtomStrategy("https://example.com/feed");
    const result = await strategy.fetchLatestPost();

    // Direct parse returns null, falls through to proxy
    expect(result).toBeNull();

    vi.unstubAllGlobals();
  });

  it("uses updated date when published is absent in Atom feed", async () => {
    const feedWithUpdated = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>Updated Post</title>
    <link href="https://example.com/updated"/>
    <updated>2026-03-01T00:00:00Z</updated>
  </entry>
</feed>`;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(feedWithUpdated),
    }));

    const strategy = new AtomStrategy("https://example.com/feed");
    const result = await strategy.fetchLatestPost();

    expect(result?.publishedAt).toBe("2026-03-01T00:00:00Z");

    vi.unstubAllGlobals();
  });
});
