import type { LatestPost } from "./types.ts";
import { isParseableDate } from "../date.ts";

function parseAtomFeed(doc: Document): LatestPost | null {
  const entry = doc.querySelector("feed > entry");
  if (!entry) return null;
  const title = entry.querySelector("title")?.textContent ?? "";
  // Prefer rel="alternate" (the human-readable permalink); on a miss, fall
  // back to any link that is NOT rel="self" — the rel="self" link is the
  // feed's own API URL, never a post permalink. Mirrors the equivalent fix
  // in vite-plugin-feed-fetch.ts's selectAtomLink.
  const linkEl =
    entry.querySelector('link[rel="alternate"][href]') ?? entry.querySelector('link[href]:not([rel="self"])');
  const url = linkEl?.getAttribute("href") ?? "";
  const rawPublished = entry.querySelector("published")?.textContent;
  const rawUpdated = entry.querySelector("updated")?.textContent;
  if (!title || !url) return null;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return null;
  // Prefer the first parseable source: when <published> is present but
  // unparseable, fall back to <updated> instead of dropping the date entirely.
  const publishedAt =
    rawPublished && isParseableDate(rawPublished)
      ? rawPublished
      : rawUpdated && isParseableDate(rawUpdated)
        ? rawUpdated
        : undefined;
  return { title, url, publishedAt };
}

function parseRssFeed(doc: Document): LatestPost | null {
  const item = doc.querySelector("rss > channel > item");
  if (!item) return null;
  const title = item.querySelector("title")?.textContent ?? "";
  const url = item.querySelector("link")?.textContent ?? "";
  const pubDate = item.querySelector("pubDate")?.textContent ?? undefined;
  if (!title || !url) return null;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return null;
  const publishedAt = pubDate && isParseableDate(pubDate) ? pubDate : undefined;
  return { title, url, publishedAt };
}

export function parseXml(text: string): LatestPost | null {
  // Strip default XML namespace declarations so querySelector matches element
  // local names in all browsers. Firefox requires null-namespace for unqualified
  // CSS selectors on XML documents; Chrome is lenient and ignores namespaces.
  // Match any whitespace (not just a literal space) before the attribute: a
  // pretty-printed `<feed\n  xmlns=...>` would otherwise slip through and leave
  // the namespace in place, making every selector miss.
  const cleaned = text.replace(/\s+xmlns=["'][^"']*["']/g, "");
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleaned, "application/xml");
  if (doc.querySelector("parsererror")) {
    return null;
  }
  return parseAtomFeed(doc) ?? parseRssFeed(doc);
}
