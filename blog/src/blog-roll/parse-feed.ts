import type { LatestPost } from "./types.js";

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

export function parseXml(text: string): LatestPost | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "application/xml");
  if (doc.querySelector("parsererror")) {
    console.warn("XML parse error in feed response");
    return null;
  }
  return parseAtomFeed(doc) ?? parseRssFeed(doc);
}
