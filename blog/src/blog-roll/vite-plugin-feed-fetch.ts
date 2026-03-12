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
      const { Window } = await import("happy-dom");
      const window = new Window();

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
            const parser = new window.DOMParser();
            const doc = parser.parseFromString(text, "application/xml");
            if (doc.querySelector("parsererror")) {
              console.warn(`[feed-fetch] ${id}: XML parse error`);
              return [id, null];
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const post = parseAtomFeed(doc as any) ?? parseRssFeed(doc as any);
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

// Duplicated parsing logic (runs in Node at build time — cannot share browser DOMParser code)
function parseAtomFeed(doc: Document): LatestPost | null {
  const entry = doc.querySelector("feed > entry");
  if (!entry) return null;
  const title = entry.querySelector("title")?.textContent ?? "";
  const linkEl = entry.querySelector('link[rel="alternate"][href]') ?? entry.querySelector("link[href]");
  const url = linkEl?.getAttribute("href") ?? "";
  const published =
    entry.querySelector("published")?.textContent ??
    entry.querySelector("updated")?.textContent ??
    undefined;
  if (!title || !url) return null;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return null;
  return { title, url, publishedAt: published };
}

function parseRssFeed(doc: Document): LatestPost | null {
  const item = doc.querySelector("rss > channel > item");
  if (!item) return null;
  const title = item.querySelector("title")?.textContent ?? "";
  const url = item.querySelector("link")?.textContent ?? "";
  const pubDate = item.querySelector("pubDate")?.textContent ?? undefined;
  if (!title || !url) return null;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return null;
  return { title, url, publishedAt: pubDate };
}
