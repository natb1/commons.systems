import { escapeHtml } from "./escape-html.js";
import type { PostMeta } from "./firestore.js";

export function generateRssXml(posts: PostMeta[]): string {
  const published = posts
    .filter((p): p is PostMeta & { published: true; publishedAt: string } => p.published)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const items = published
    .map((p) => {
      const date = new Date(p.publishedAt);
      const pubDateTag = isNaN(date.getTime())
        ? ""
        : `\n      <pubDate>${date.toUTCString()}</pubDate>`;
      return `    <item>
      <title>${escapeHtml(p.title)}</title>
      <link>https://commons.systems/#/post/${escapeHtml(p.id)}</link>
      <guid>https://commons.systems/#/post/${escapeHtml(p.id)}</guid>${pubDateTag}
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>commons.systems</title>
    <link>https://commons.systems</link>
    <description>commons.systems blog</description>
${items}
  </channel>
</rss>`;
}

export function createRssBlobUrl(posts: PostMeta[]): string {
  const xml = generateRssXml(posts);
  const blob = new Blob([xml], { type: "application/rss+xml" });
  return URL.createObjectURL(blob);
}
