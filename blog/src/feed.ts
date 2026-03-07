import { escapeHtml } from "@commons-systems/htmlutil";
import { isPublished, type PostMeta } from "./post-types.js";

export interface RssConfig {
  title: string;
  siteUrl: string;
}

export function generateRssXml(posts: PostMeta[], config: RssConfig): string {
  const published = posts
    .filter(isPublished)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const items = published
    .map((p) => {
      const date = new Date(p.publishedAt);
      const pubDateTag = isNaN(date.getTime())
        ? ""
        : `\n      <pubDate>${date.toUTCString()}</pubDate>`;
      return `    <item>
      <title>${escapeHtml(p.title)}</title>
      <link>${escapeHtml(config.siteUrl)}/#/post/${escapeHtml(p.id)}</link>
      <guid isPermaLink="false">${escapeHtml(config.siteUrl)}/#/post/${escapeHtml(p.id)}</guid>${pubDateTag}
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeHtml(config.title)}</title>
    <link>${escapeHtml(config.siteUrl)}</link>
    <description>${escapeHtml(config.title)} blog</description>
${items}
  </channel>
</rss>`;
}

export function createRssBlobUrl(posts: PostMeta[], config: RssConfig): string {
  const xml = generateRssXml(posts, config);
  const blob = new Blob([xml], { type: "application/rss+xml" });
  return URL.createObjectURL(blob);
}
