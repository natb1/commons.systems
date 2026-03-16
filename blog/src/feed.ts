import { escapeHtml } from "@commons-systems/htmlutil";
import { isPublished, type PostMeta } from "./post-types.js";

export interface RssConfig {
  title: string;
  siteUrl: string;
  feedUrl: string;
  postLinkPrefix?: string;
}

export function generateRssXml(posts: PostMeta[], config: RssConfig): string {
  const rawPrefix = config.postLinkPrefix ?? "/post/";
  const postLinkPrefix = rawPrefix.replace(/^\//, "");
  const published = posts
    .filter(isPublished)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const lastBuildDate =
    published.length > 0
      ? `\n    <lastBuildDate>${new Date(published[0].publishedAt).toUTCString()}</lastBuildDate>`
      : "";

  const items = published
    .map((p) => {
      const date = new Date(p.publishedAt);
      const pubDateTag = isNaN(date.getTime())
        ? ""
        : `\n      <pubDate>${date.toUTCString()}</pubDate>`;
      const descTag = p.previewDescription
        ? `\n      <description>${escapeHtml(p.previewDescription)}</description>`
        : "";
      const postUrl = `${escapeHtml(config.siteUrl)}/${escapeHtml(postLinkPrefix)}${escapeHtml(p.id)}`;
      return `    <item>
      <title>${escapeHtml(p.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>${pubDateTag}${descTag}
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(config.title)}</title>
    <link>${escapeHtml(config.siteUrl)}</link>
    <description>${escapeHtml(config.title)} blog</description>
    <atom:link href="${escapeHtml(config.feedUrl)}" rel="self" type="application/rss+xml" />${lastBuildDate}
    <docs>https://www.rssboard.org/rss-specification</docs>
    <generator>commons.systems</generator>
${items}
  </channel>
</rss>`;
}
