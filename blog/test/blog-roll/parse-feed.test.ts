import { describe, it, expect } from "vitest";
import { parseXml } from "../../src/blog-roll/parse-feed";

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

describe("parseXml", () => {
  it("parses valid Atom feed", () => {
    const result = parseXml(ATOM_FEED);
    expect(result).toEqual({
      title: "Latest Atom Post",
      url: "https://example.com/atom-post",
      publishedAt: "2026-02-01T00:00:00Z",
    });
  });

  it("parses valid RSS feed", () => {
    const result = parseXml(RSS_FEED);
    expect(result).toEqual({
      title: "Latest RSS Post",
      url: "https://example.com/rss-post",
      publishedAt: "Sun, 01 Feb 2026 00:00:00 GMT",
    });
  });

  it("returns null for invalid XML", () => {
    const result = parseXml("not valid xml at all");
    expect(result).toBeNull();
  });

  it("returns null for empty Atom feed with no entries", () => {
    const emptyFeed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Empty Blog</title>
</feed>`;
    const result = parseXml(emptyFeed);
    expect(result).toBeNull();
  });

  it("prefers rel=alternate link over other links in Atom feed", () => {
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
    const result = parseXml(bloggerFeed);
    expect(result).toEqual({
      title: "Blogger Post",
      url: "https://example.blogspot.com/2026/03/blogger-post.html",
      publishedAt: "2026-03-01T00:00:00Z",
    });
  });

  it("uses updated date when published is absent", () => {
    const feedWithUpdated = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>Updated Post</title>
    <link href="https://example.com/updated"/>
    <updated>2026-03-01T00:00:00Z</updated>
  </entry>
</feed>`;
    const result = parseXml(feedWithUpdated);
    expect(result?.publishedAt).toBe("2026-03-01T00:00:00Z");
  });
});
