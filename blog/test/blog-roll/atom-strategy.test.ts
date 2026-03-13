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
  vi.unstubAllGlobals();
});

describe("AtomStrategy", () => {
  it("parses Atom feed via proxy and returns latest post", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(ATOM_FEED),
    });
    vi.stubGlobal("fetch", mockFetch);

    const strategy = new AtomStrategy("https://example.com/feed");
    const result = await strategy.fetchLatestPost();

    expect(result).toEqual({
      title: "Latest Atom Post",
      url: "https://example.com/atom-post",
      publishedAt: "2026-02-01T00:00:00Z",
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe(
      `/api/feed-proxy?url=${encodeURIComponent("https://example.com/feed")}`,
    );
  });

  it("parses RSS feed via proxy and returns latest post", async () => {
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
  });

  it("uses custom proxy path", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(ATOM_FEED),
    });
    vi.stubGlobal("fetch", mockFetch);

    const strategy = new AtomStrategy("https://example.com/feed", "/custom/proxy");
    const result = await strategy.fetchLatestPost();

    expect(result).toEqual({
      title: "Latest Atom Post",
      url: "https://example.com/atom-post",
      publishedAt: "2026-02-01T00:00:00Z",
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe(
      `/custom/proxy?url=${encodeURIComponent("https://example.com/feed")}`,
    );
  });

  it("returns null when proxy returns non-ok status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const strategy = new AtomStrategy("https://example.com/feed");
    const result = await strategy.fetchLatestPost();

    expect(result).toBeNull();
  });

  it("returns null when proxy fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Network error")));

    const strategy = new AtomStrategy("https://example.com/feed");
    const result = await strategy.fetchLatestPost();

    expect(result).toBeNull();
  });

  it("returns null for unparseable XML", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("not valid xml at all"),
    }));

    const strategy = new AtomStrategy("https://example.com/feed");
    const result = await strategy.fetchLatestPost();

    expect(result).toBeNull();
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

    expect(result).toBeNull();
  });

  it("prefers rel=alternate link over rel=self in Atom feed", async () => {
    const bloggerFeed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>Blogger Post</title>
    <link rel="self" type="application/atom+xml" href="https://example.blogspot.com/feeds/posts/default/123"/>
    <link rel="alternate" type="text/html" href="https://example.blogspot.com/2026/03/blogger-post.html"/>
    <link rel="replies" type="application/atom+xml" href="https://example.blogspot.com/feeds/123/comments/default"/>
    <published>2026-03-01T00:00:00Z</published>
  </entry>
</feed>`;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(bloggerFeed),
    }));

    const strategy = new AtomStrategy("https://example.com/feed");
    const result = await strategy.fetchLatestPost();

    expect(result).toEqual({
      title: "Blogger Post",
      url: "https://example.blogspot.com/2026/03/blogger-post.html",
      publishedAt: "2026-03-01T00:00:00Z",
    });
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
  });
});
