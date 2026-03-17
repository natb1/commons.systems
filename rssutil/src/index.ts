import { escapeHtml } from "@commons-systems/htmlutil";

export interface RssPost {
  id: string;
  title: string;
  publishedAt?: string;
  previewDescription?: string;
}

export interface RssConfig {
  title: string;
  siteUrl: string;
  feedUrl: string;
  postLinkPrefix?: string;
}

export function generateRssXml(posts: RssPost[], config: RssConfig): string {
  const rawPrefix = config.postLinkPrefix ?? "/post/";
  const postLinkPrefix = rawPrefix.replace(/^\//, "");

  const lastBuildDate =
    posts.length > 0 && posts[0].publishedAt
      ? `\n    <lastBuildDate>${new Date(posts[0].publishedAt).toUTCString()}</lastBuildDate>`
      : "";

  const items = posts
    .map((p) => {
      const postUrl = `${escapeHtml(config.siteUrl)}/${escapeHtml(postLinkPrefix)}${escapeHtml(p.id)}`;
      const date = p.publishedAt ? new Date(p.publishedAt) : undefined;
      const pubDateTag =
        date && !isNaN(date.getTime())
          ? `\n      <pubDate>${date.toUTCString()}</pubDate>`
          : "";
      const descTag = p.previewDescription
        ? `\n      <description>${escapeHtml(p.previewDescription)}</description>`
        : "";
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
