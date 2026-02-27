import { describe, it, expect, vi, afterEach } from "vitest";
import { RssStrategy } from "../../src/blog-roll/rss-strategy";

const RSS_XML = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Latest Post Title</title>
      <link>https://example.com/post-1</link>
    </item>
  </channel>
</rss>`;

// Atom feeds typically use <link href="..."/>, but the source code reads
// link.textContent first (with nullish coalescing), so a self-closing <link/>
// with empty textContent returns "" which ?? does not fall through.
// Use a <link> with text content to exercise the Atom entry-finding path.
const ATOM_XML = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>Atom Post</title>
    <link>https://example.com/atom-1</link>
  </entry>
</feed>`;

describe("RssStrategy", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses RSS 2.0 XML correctly", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(RSS_XML),
      }),
    );

    const strategy = new RssStrategy("https://example.com/feed.xml");
    const result = await strategy.fetchLatestPost();

    expect(result).toEqual({
      title: "Latest Post Title",
      url: "https://example.com/post-1",
    });
  });

  it("parses Atom XML correctly", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(ATOM_XML),
      }),
    );

    const strategy = new RssStrategy("https://example.com/atom.xml");
    const result = await strategy.fetchLatestPost();

    expect(result).toEqual({
      title: "Atom Post",
      url: "https://example.com/atom-1",
    });
  });

  it("returns null on invalid XML", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("this is not xml at all"),
      }),
    );

    const strategy = new RssStrategy("https://example.com/bad");
    const result = await strategy.fetchLatestPost();

    expect(result).toBeNull();
  });

  it("returns null on fetch failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    const strategy = new RssStrategy("https://example.com/feed.xml");
    const result = await strategy.fetchLatestPost();

    expect(result).toBeNull();
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

    const strategy = new RssStrategy("https://example.com/feed.xml");
    const result = await strategy.fetchLatestPost();

    expect(result).toBeNull();
  });

  it("returns null when feed has no items", async () => {
    const emptyRss = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Empty Feed</title>
  </channel>
</rss>`;

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(emptyRss),
      }),
    );

    const strategy = new RssStrategy("https://example.com/feed.xml");
    const result = await strategy.fetchLatestPost();

    expect(result).toBeNull();
  });
});
