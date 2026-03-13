import type { Plugin } from "vite";
import type { LatestPost } from "./types.js";

export interface FeedConfig {
  id: string;
  url: string;
}

const VIRTUAL_MODULE_ID = "virtual:blog-roll-feeds";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

export function feedFetchPlugin(feeds: FeedConfig[]): Plugin {
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
              console.warn(`[feed-fetch] ${id}: HTTP ${response.status}`);
              return [id, null];
            }
            const text = await response.text();
            const post = parseAtomFeedXml(text) ?? parseRssFeedXml(text);
            if (!post) {
              console.warn(`[feed-fetch] ${id}: no entries found in feed`);
            }
            return [id, post];
          } catch (err) {
            console.warn(`[feed-fetch] ${id}: fetch error`, err);
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
  };
}

// Regex-based XML parsing for build time. happy-dom's DOMParser cannot
// parse Atom feeds with XML namespaces (it produces false parseerror
// results and parses as HTML). These functions extract the first entry/item
// from Atom and RSS feeds using regex, which is sufficient for extracting
// the latest post title, URL, and date.

function xmlText(xml: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = xml.match(re);
  return m ? decodeXmlEntities(m[1].trim()) : undefined;
}

function xmlAttr(xml: string, tag: string, attr: string): string | undefined {
  const tagRe = new RegExp(`<${tag}\\s[^>]*${attr}=["']([^"']*)["'][^>]*/?>`, "i");
  const m = xml.match(tagRe);
  return m ? decodeXmlEntities(m[1]) : undefined;
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'");
}

function parseAtomFeedXml(xml: string): LatestPost | null {
  // Match the first <entry>...</entry> block
  const entryMatch = xml.match(/<entry[\s>]([\s\S]*?)<\/entry>/i);
  if (!entryMatch) return null;
  const entry = entryMatch[1];

  const title = xmlText(entry, "title") ?? "";
  // Prefer link[rel="alternate"], fall back to any link with href.
  // Handles both single and double quoted attributes (Blogger uses single quotes).
  const altLinkMatch = entry.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']*)["'][^>]*\/?>/i);
  const anyLinkMatch = entry.match(/<link[^>]*href=["']([^"']*)["'][^>]*\/?>/i);
  const url = decodeXmlEntities((altLinkMatch ?? anyLinkMatch)?.[1] ?? "");
  const published = xmlText(entry, "published") ?? xmlText(entry, "updated");

  if (!title || !url) return null;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return null;
  return { title, url, publishedAt: published };
}

function parseRssFeedXml(xml: string): LatestPost | null {
  // Match the first <item>...</item> block
  const itemMatch = xml.match(/<item[\s>]([\s\S]*?)<\/item>/i);
  if (!itemMatch) return null;
  const item = itemMatch[1];

  const title = xmlText(item, "title") ?? "";
  const url = xmlText(item, "link") ?? "";
  const pubDate = xmlText(item, "pubDate");

  if (!title || !url) return null;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return null;
  return { title, url, publishedAt: pubDate };
}
