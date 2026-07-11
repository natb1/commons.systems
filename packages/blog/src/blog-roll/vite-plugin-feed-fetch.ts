import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Plugin } from "vite";
import { classifyError } from "@commons-systems/errorutil";
import type { LatestPost } from "./types.ts";
import { isParseableDate } from "../date.ts";

export interface FeedConfig {
  id: string;
  url: string;
}

export interface FeedFetchPluginOptions {
  /** When set, the fetched feed snapshot is persisted to this absolute path at
   *  build end (`writeBundle`). The post-build tsx prerender reads the same file
   *  and passes it as `buildTimeFeeds`, so the prerendered info-panel hydrates
   *  from the SAME data the client's `virtual:blog-roll-feeds` bundle inlines —
   *  closing the SSR/client parity gap (the `virtual:` module only exists inside
   *  the vite build, so the standalone tsx prerender cannot import it). */
  emitPath?: string;
}

const VIRTUAL_MODULE_ID = "virtual:blog-roll-feeds";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

export function feedFetchPlugin(
  feeds: FeedConfig[],
  options: FeedFetchPluginOptions = {},
): Plugin {
  let feedData: Record<string, LatestPost | null> = {};

  return {
    name: "blog-roll-feed-fetch",
    async buildStart() {
      const results = await Promise.all(
        feeds.map(async ({ id, url }): Promise<[string, LatestPost | null]> => {
          try {
            const response = await fetch(url, {
              headers: { "User-Agent": "commons-systems-build/1.0" },
            });
            if (!response.ok) {
              console.warn(`[feed-fetch] ${id} (${url}): HTTP ${response.status}`);
              return [id, null];
            }
            const text = await response.text();
            const post = parseAtomFeedXml(text) ?? parseRssFeedXml(text);
            if (!post) {
              console.warn(`[feed-fetch] ${id} (${url}): no entries found in feed`);
            }
            return [id, post];
          } catch (err) {
            // undici (Node 22+) throws `TypeError: fetch failed` for network-level
            // failures (DNS, connection refused, temporary unreachability). These are
            // transient infrastructure errors, not a build misconfiguration — soft-warn
            // and skip the feed rather than fail the build. This early return MUST
            // precede the bad-URL re-throw AND the classifyError check below: classifyError
            // maps every TypeError to "programmer", so without this return a network
            // TypeError would be re-thrown there and fail the build. Do not collapse this
            // into a single inverted condition.
            if (err instanceof TypeError && err.message === "fetch failed") {
              console.warn(`[feed-fetch] ${id} (${url}): fetch error`, err);
              return [id, null];
            }
            // Other TypeErrors (e.g. `Failed to parse URL from <url>`) indicate a
            // genuinely invalid feed configuration — re-throw as a fatal build error.
            if (err instanceof TypeError) {
              throw new Error(`[feed-fetch] ${id} (${url}): invalid fetch configuration`, { cause: err });
            }
            if (classifyError(err) === "programmer") throw err;
            console.warn(`[feed-fetch] ${id} (${url}): fetch error`, err);
            return [id, null];
          }
        }),
      );

      feedData = Object.fromEntries(results);
    },
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID;
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        return `export default ${JSON.stringify(feedData)};`;
      }
    },
    // Persist the same snapshot the virtual module inlined so the post-build tsx
    // prerender can read it (it cannot import the `virtual:` module). Runs after
    // the bundle is written, so `feedData` from `buildStart` is fully populated.
    writeBundle() {
      const { emitPath } = options;
      if (!emitPath) return;
      mkdirSync(dirname(emitPath), { recursive: true });
      writeFileSync(emitPath, JSON.stringify(feedData, null, 2), "utf8");
    },
  };
}

// Regex-based XML parsing for build time. The browser-side parser
// (parse-feed.ts) uses DOMParser, which is only available at runtime.
// At build time in Node, we use regex extraction instead — sufficient
// for extracting the latest post title, URL, and date from the first
// entry/item of Atom and RSS feeds.

function xmlText(xml: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = xml.match(re);
  return m ? decodeXmlEntities(stripCdata(m[1].trim()).trim()) : undefined;
}

// Strip `<![CDATA[...]]>` wrappers, keeping their literal contents. WordPress
// and many other feeds wrap titles/links in CDATA; without this the wrapper
// markup ships verbatim into the rendered post title.
function stripCdata(text: string): string {
  return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

function decodeXmlEntities(text: string): string {
  return (
    text
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      // Numeric entities: hex (&#x2019;) and decimal (&#8217;, &#39;). WordPress
      // emits &#8217; (right single quote) and &#8230; (ellipsis) routinely.
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
        String.fromCodePoint(parseInt(hex, 16)),
      )
      .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
      // Decode &amp; LAST so an already-single-encoded `&amp;lt;` becomes
      // `&lt;`, not `<` — decoding it first would double-decode.
      .replace(/&amp;/g, "&")
  );
}

// Select the canonical post link from an Atom entry's <link> elements.
// Prefers rel="alternate" (the human-readable permalink) in either attribute
// ordering, then falls back to the first link that is not rel="self" — the
// rel="self" link is the feed's own API URL, never a post permalink.
function selectAtomLink(entry: string): string {
  const linkTags = entry.match(/<link\b[^>]*?\/?>/gi) ?? [];
  const links = linkTags.map((tag) => ({
    href: tag.match(/href=["']([^"']*)["']/i)?.[1] ?? "",
    rel: tag.match(/rel=["']([^"']*)["']/i)?.[1],
  }));
  const alternate = links.find((l) => l.rel === "alternate" && l.href);
  if (alternate) return alternate.href;
  const nonSelf = links.find((l) => l.href && l.rel !== "self");
  return nonSelf?.href ?? "";
}

export function parseAtomFeedXml(xml: string): LatestPost | null {
  const entryMatch = xml.match(/<entry[\s>]([\s\S]*?)<\/entry>/i);
  if (!entryMatch) return null;
  const entry = entryMatch[1];

  const title = xmlText(entry, "title") ?? "";
  const url = decodeXmlEntities(selectAtomLink(entry));
  const published = xmlText(entry, "published") ?? xmlText(entry, "updated");

  if (!title || !url) return null;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return null;
  const publishedAt = published && isParseableDate(published) ? published : undefined;
  return { title, url, publishedAt };
}

export function parseRssFeedXml(xml: string): LatestPost | null {
  const itemMatch = xml.match(/<item[\s>]([\s\S]*?)<\/item>/i);
  if (!itemMatch) return null;
  const item = itemMatch[1];

  const title = xmlText(item, "title") ?? "";
  const url = xmlText(item, "link") ?? "";
  const pubDate = xmlText(item, "pubDate");

  if (!title || !url) return null;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return null;
  const publishedAt = pubDate && isParseableDate(pubDate) ? pubDate : undefined;
  return { title, url, publishedAt };
}
