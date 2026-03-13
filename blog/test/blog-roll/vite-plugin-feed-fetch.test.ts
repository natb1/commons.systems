import { describe, it, expect } from "vitest";
import {
  parseAtomFeedXml,
  parseRssFeedXml,
} from "../../src/blog-roll/vite-plugin-feed-fetch";

describe("parseAtomFeedXml", () => {
  it("extracts title, URL, and publishedAt from an Atom entry", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <entry>
          <title>First Post</title>
          <link rel="alternate" href="https://example.com/post-1" />
          <published>2026-01-15T10:00:00Z</published>
        </entry>
      </feed>`;
    expect(parseAtomFeedXml(xml)).toEqual({
      title: "First Post",
      url: "https://example.com/post-1",
      publishedAt: "2026-01-15T10:00:00Z",
    });
  });

  it("handles Blogger-style single-quoted attributes", () => {
    const xml = `<feed>
        <entry>
          <title>Blogger Post</title>
          <link rel='alternate' href='https://example.blogspot.com/2026/01/post.html' />
          <published>2026-01-20T12:00:00Z</published>
        </entry>
      </feed>`;
    expect(parseAtomFeedXml(xml)).toEqual({
      title: "Blogger Post",
      url: "https://example.blogspot.com/2026/01/post.html",
      publishedAt: "2026-01-20T12:00:00Z",
    });
  });

  it("prefers rel='alternate' link over generic link", () => {
    const xml = `<feed>
        <entry>
          <title>Multi-link Post</title>
          <link href="https://example.com/generic" />
          <link rel="alternate" href="https://example.com/alternate" />
          <published>2026-02-01T00:00:00Z</published>
        </entry>
      </feed>`;
    expect(parseAtomFeedXml(xml)?.url).toBe("https://example.com/alternate");
  });

  it("falls back to updated when published is absent", () => {
    const xml = `<feed>
        <entry>
          <title>Updated Only</title>
          <link rel="alternate" href="https://example.com/updated" />
          <updated>2026-03-01T00:00:00Z</updated>
        </entry>
      </feed>`;
    expect(parseAtomFeedXml(xml)?.publishedAt).toBe("2026-03-01T00:00:00Z");
  });

  it("returns null for empty feed", () => {
    expect(parseAtomFeedXml("<feed></feed>")).toBeNull();
  });

  it("returns null for malformed XML with no entry", () => {
    expect(parseAtomFeedXml("not xml at all")).toBeNull();
  });

  it("returns null when URL is not http(s)", () => {
    const xml = `<feed>
        <entry>
          <title>Bad URL</title>
          <link rel="alternate" href="ftp://example.com/file" />
        </entry>
      </feed>`;
    expect(parseAtomFeedXml(xml)).toBeNull();
  });

  it("decodes XML entities in title and URL", () => {
    const xml = `<feed>
        <entry>
          <title>Tom &amp; Jerry&apos;s &#39;Adventure&#39;</title>
          <link rel="alternate" href="https://example.com/post?a=1&amp;b=2" />
          <published>2026-01-01T00:00:00Z</published>
        </entry>
      </feed>`;
    const result = parseAtomFeedXml(xml);
    expect(result?.title).toBe("Tom & Jerry's 'Adventure'");
    expect(result?.url).toBe("https://example.com/post?a=1&b=2");
  });
});

describe("parseRssFeedXml", () => {
  it("extracts title, URL, and pubDate from an RSS item", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>RSS Post</title>
            <link>https://example.com/rss-post</link>
            <pubDate>Mon, 15 Jan 2026 10:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>`;
    expect(parseRssFeedXml(xml)).toEqual({
      title: "RSS Post",
      url: "https://example.com/rss-post",
      publishedAt: "Mon, 15 Jan 2026 10:00:00 GMT",
    });
  });

  it("returns null for empty channel", () => {
    const xml = `<rss><channel></channel></rss>`;
    expect(parseRssFeedXml(xml)).toBeNull();
  });

  it("returns null for non-http URL", () => {
    const xml = `<rss><channel>
        <item>
          <title>Bad</title>
          <link>file:///etc/passwd</link>
        </item>
      </channel></rss>`;
    expect(parseRssFeedXml(xml)).toBeNull();
  });

  it("returns null when title is empty", () => {
    const xml = `<rss><channel>
        <item>
          <title></title>
          <link>https://example.com/post</link>
        </item>
      </channel></rss>`;
    expect(parseRssFeedXml(xml)).toBeNull();
  });

  it("decodes XML entities in RSS content", () => {
    const xml = `<rss><channel>
        <item>
          <title>A &amp; B &lt;3</title>
          <link>https://example.com/a&amp;b</link>
        </item>
      </channel></rss>`;
    const result = parseRssFeedXml(xml);
    expect(result?.title).toBe("A & B <3");
    expect(result?.url).toBe("https://example.com/a&b");
  });
});
