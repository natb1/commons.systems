import type { BlogRollStrategy, LatestPost } from "./types.js";

function parseAtomFeed(doc: Document): LatestPost | null {
  const entry = doc.querySelector("feed > entry");
  if (!entry) return null;
  const title = entry.querySelector("title")?.textContent ?? "";
  const linkEl = entry.querySelector("link[href]");
  const url = linkEl?.getAttribute("href") ?? "";
  const published =
    entry.querySelector("published")?.textContent ??
    entry.querySelector("updated")?.textContent ??
    undefined;
  if (!title || !url) return null;
  return { title, url, publishedAt: published };
}

function parseRssFeed(doc: Document): LatestPost | null {
  const item = doc.querySelector("rss > channel > item");
  if (!item) return null;
  const title = item.querySelector("title")?.textContent ?? "";
  const url = item.querySelector("link")?.textContent ?? "";
  const pubDate = item.querySelector("pubDate")?.textContent ?? undefined;
  if (!title || !url) return null;
  return { title, url, publishedAt: pubDate };
}

function parseXml(text: string): LatestPost | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "application/xml");
  if (doc.querySelector("parsererror")) return null;
  return parseAtomFeed(doc) ?? parseRssFeed(doc);
}

export class AtomStrategy implements BlogRollStrategy {
  constructor(private feedUrl: string) {}

  async fetchLatestPost(): Promise<LatestPost | null> {
    try {
      const response = await fetch(this.feedUrl);
      if (response.ok) {
        return parseXml(await response.text());
      }
      console.warn(`Feed fetch failed for ${this.feedUrl}: ${response.status}`);
    } catch (err) {
      // Network or CORS error — log and fall through to proxy
      console.warn(`Feed fetch error for ${this.feedUrl}:`, err);
    }

    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(this.feedUrl)}`;
    const proxyResponse = await fetch(proxyUrl);
    if (!proxyResponse.ok) {
      console.warn(`Proxy fetch failed for ${this.feedUrl}: ${proxyResponse.status}`);
      return null;
    }
    const json = (await proxyResponse.json()) as { contents?: string };
    if (!json.contents) return null;
    return parseXml(json.contents);
  }
}
