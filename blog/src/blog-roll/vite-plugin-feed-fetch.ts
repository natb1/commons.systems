import type { Plugin } from "vite";
import type { LatestPost } from "./types.ts";

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

// Regex-based XML parsing for build time. The browser-side parser
// (parse-feed.ts) uses DOMParser, which is only available at runtime.
// At build time in Node, we use regex extraction instead — sufficient
// for extracting the latest post title, URL, and date from the first
// entry/item of Atom and RSS feeds.

function xmlText(xml: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = xml.match(re);
  return m ? decodeXmlEntities(m[1].trim()) : undefined;
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

export function parseAtomFeedXml(xml: string): LatestPost | null {
  const entryMatch = xml.match(/<entry[\s>]([\s\S]*?)<\/entry>/i);
  if (!entryMatch) return null;
  const entry = entryMatch[1];

  const title = xmlText(entry, "title") ?? "";
  // Prefer link[rel="alternate"] when rel precedes href in element attributes.
  // Falls back to any link with href if alternate match fails (e.g., reversed attribute order).
  // Both single and double quoted attributes accepted (Blogger uses single quotes).
  const altLinkMatch = entry.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']*)["'][^>]*\/?>/i);
  const anyLinkMatch = entry.match(/<link[^>]*href=["']([^"']*)["'][^>]*\/?>/i);
  const url = decodeXmlEntities((altLinkMatch ?? anyLinkMatch)?.[1] ?? "");
  const published = xmlText(entry, "published") ?? xmlText(entry, "updated");

  if (!title || !url) return null;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return null;
  return { title, url, publishedAt: published };
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
  return { title, url, publishedAt: pubDate };
}
