import { describe, expect, it } from "vitest";
import {
  auditSurfaces,
  parseFeedItems,
  unescapeHtml,
  formatReport,
  type FetchText,
  type Surface,
} from "../scripts/audit-publishing.js";

/** Build a minimal RSS feed matching `packages/blog/src/feed-rss.ts`'s shape. */
function feed(items: { title: string; link: string; pubDate?: string }[]): string {
  const body = items
    .map(
      (i) => `    <item>
      <title>${i.title}</title>
      <link>${i.link}</link>
      <guid isPermaLink="true">${i.link}</guid>${
        i.pubDate ? `\n      <pubDate>${i.pubDate}</pubDate>` : ""
      }
    </item>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>Test</title>
${body}
</channel></rss>`;
}

const SURFACES: Surface[] = [
  { name: "landing", siteUrl: "https://commons.systems" },
  { name: "fellspiral", siteUrl: "https://fellspiral.commons.systems" },
];

describe("unescapeHtml", () => {
  it("reverses the five entities escapeHtml produces", () => {
    expect(unescapeHtml("Tom &amp; Jerry &lt;3 &gt; &quot;q&quot; &#39;s")).toBe(
      "Tom & Jerry <3 > \"q\" 's",
    );
  });

  it("undoes &amp; last so double-escaped entities round-trip", () => {
    // escapeHtml("&lt;") === "&amp;lt;"; unescape must yield "&lt;", not "<".
    expect(unescapeHtml("&amp;lt;")).toBe("&lt;");
  });
});

describe("parseFeedItems", () => {
  it("extracts title, link, and pubDate from each item", () => {
    const items = parseFeedItems(
      feed([
        { title: "First", link: "https://x/post/a", pubDate: "Wed, 01 Jan 2025 00:00:00 GMT" },
        { title: "Second", link: "https://x/post/b" },
      ]),
    );
    expect(items).toEqual([
      { title: "First", link: "https://x/post/a", pubDate: "Wed, 01 Jan 2025 00:00:00 GMT" },
      { title: "Second", link: "https://x/post/b", pubDate: "" },
    ]);
  });

  it("unescapes entities in titles", () => {
    const items = parseFeedItems(
      feed([{ title: "Bloat &amp; the &quot;platform&quot;", link: "https://x/post/a" }]),
    );
    expect(items[0].title).toBe('Bloat & the "platform"');
  });

  it("returns an empty list for a feed with no items", () => {
    expect(parseFeedItems(feed([]))).toEqual([]);
  });
});

/**
 * Build a fetchText fixture from a URL→response map. Any URL absent from the map
 * rejects (simulating a network failure).
 */
function fixtureFetch(map: Record<string, { status: number; body: string }>): FetchText {
  return async (url: string) => {
    if (!(url in map)) throw new Error(`no fixture for ${url}`);
    return map[url];
  };
}

describe("auditSurfaces", () => {
  it("enumerates pieces across both surfaces and marks all readable", async () => {
    const map = {
      "https://commons.systems/feed.xml": {
        status: 200,
        body: feed([{ title: "Landing One", link: "https://commons.systems/post/one" }]),
      },
      "https://commons.systems/post/one": {
        status: 200,
        body: "<html><h1>Landing One</h1></html>",
      },
      "https://fellspiral.commons.systems/feed.xml": {
        status: 200,
        body: feed([{ title: "Fell One", link: "https://fellspiral.commons.systems/post/f1" }]),
      },
      "https://fellspiral.commons.systems/post/f1": {
        status: 200,
        body: "<html><h1>Fell One</h1></html>",
      },
    };
    const summary = await auditSurfaces(SURFACES, fixtureFetch(map));
    expect(summary.allPass).toBe(true);
    expect(summary.surfaces.map((s) => s.name)).toEqual(["landing", "fellspiral"]);
    expect(summary.surfaces[0].pieces).toHaveLength(1);
    expect(summary.surfaces[0].pieces[0]).toMatchObject({
      title: "Landing One",
      url: "https://commons.systems/post/one",
      noAccountReadable: true,
    });
    expect(summary.surfaces[1].pieces[0].noAccountReadable).toBe(true);
  });

  it("classifies pass (200+title), 404, and 200-without-title", async () => {
    const single: Surface[] = [{ name: "landing", siteUrl: "https://commons.systems" }];
    const map = {
      "https://commons.systems/feed.xml": {
        status: 200,
        body: feed([
          { title: "Good", link: "https://commons.systems/post/good" },
          { title: "Gone", link: "https://commons.systems/post/gone" },
          { title: "Empty", link: "https://commons.systems/post/empty" },
        ]),
      },
      "https://commons.systems/post/good": { status: 200, body: "<h1>Good</h1>" },
      "https://commons.systems/post/gone": { status: 404, body: "Not Found" },
      "https://commons.systems/post/empty": { status: 200, body: "<h1>unrelated</h1>" },
    };
    const summary = await auditSurfaces(single, fixtureFetch(map));
    expect(summary.allPass).toBe(false);
    const readable = summary.surfaces[0].pieces.map((p) => p.noAccountReadable);
    expect(readable).toEqual([true, false, false]);
  });

  it("treats a piece fetch failure as a non-fatal finding", async () => {
    const single: Surface[] = [{ name: "landing", siteUrl: "https://commons.systems" }];
    const map = {
      "https://commons.systems/feed.xml": {
        status: 200,
        body: feed([{ title: "Broken", link: "https://commons.systems/post/broken" }]),
      },
      // piece URL absent → fixtureFetch rejects
    };
    const summary = await auditSurfaces(single, fixtureFetch(map));
    expect(summary.allPass).toBe(false);
    expect(summary.surfaces[0].pieces[0].noAccountReadable).toBe(false);
  });

  it("throws a fatal error naming the URL on a non-200 feed", async () => {
    const single: Surface[] = [{ name: "landing", siteUrl: "https://commons.systems" }];
    const map = {
      "https://commons.systems/feed.xml": { status: 500, body: "" },
    };
    await expect(auditSurfaces(single, fixtureFetch(map))).rejects.toThrow(
      "https://commons.systems/feed.xml",
    );
  });

  it("throws a fatal error naming the URL on an unreachable feed", async () => {
    const single: Surface[] = [{ name: "landing", siteUrl: "https://commons.systems" }];
    await expect(auditSurfaces(single, fixtureFetch({}))).rejects.toThrow(
      "https://commons.systems/feed.xml",
    );
  });

  it("throws a fatal error naming the URL on a feed with zero items", async () => {
    const single: Surface[] = [{ name: "landing", siteUrl: "https://commons.systems" }];
    const map = {
      "https://commons.systems/feed.xml": { status: 200, body: feed([]) },
    };
    await expect(auditSurfaces(single, fixtureFetch(map))).rejects.toThrow(
      "zero published pieces",
    );
  });
});

describe("formatReport", () => {
  it("renders a per-surface table and an attestation checklist line per piece", () => {
    const report = formatReport({
      allPass: false,
      surfaces: [
        {
          name: "landing",
          siteUrl: "https://commons.systems",
          pieces: [
            {
              title: "Only Piece",
              url: "https://commons.systems/post/one",
              pubDate: "Wed, 01 Jan 2025 00:00:00 GMT",
              noAccountReadable: false,
            },
          ],
        },
      ],
    });
    expect(report).toContain("| Only Piece | https://commons.systems/post/one |");
    expect(report).toContain("| no |");
    expect(report).toContain(
      "- [ ] landing: Only Piece — platform-first?",
    );
    expect(report).toContain("intentions/strategy-recover-publishing.md");
  });
});
