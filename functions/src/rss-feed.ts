import { onRequest } from "firebase-functions/v2/https";
import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

interface AppConfig {
  namespace: string;
  siteUrl: string;
  title: string;
  postLinkPrefix: string;
}

const APP_CONFIGS: Record<string, AppConfig> = {
  "fellspiral.commons.systems": {
    namespace: "fellspiral/prod",
    siteUrl: "https://fellspiral.commons.systems",
    title: "fellspiral",
    postLinkPrefix: "post/",
  },
  "commons.systems": {
    namespace: "landing/prod",
    siteUrl: "https://commons.systems",
    title: "commons.systems",
    postLinkPrefix: "post/",
  },
  "www.commons.systems": {
    namespace: "landing/prod",
    siteUrl: "https://commons.systems",
    title: "commons.systems",
    postLinkPrefix: "post/",
  },
};

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function handleRssFeed(req: Request, res: Response) {
  const host = (req.headers["x-forwarded-host"] as string | undefined) ?? req.hostname;
  const appConfig = APP_CONFIGS[host];
  if (!appConfig) {
    res.status(400).send(`Unknown host: ${host}`);
    return;
  }

  if (getApps().length === 0) initializeApp();
  const db = getFirestore();

  const snapshot = await db
    .collection(`${appConfig.namespace}/posts`)
    .where("published", "==", true)
    .orderBy("publishedAt", "desc")
    .get();

  const feedUrl = `${appConfig.siteUrl}/feed.xml`;

  const lastBuildDate =
    snapshot.docs.length > 0
      ? `\n    <lastBuildDate>${new Date(snapshot.docs[0].data().publishedAt).toUTCString()}</lastBuildDate>`
      : "";

  const items = snapshot.docs
    .map((doc) => {
      const d = doc.data();
      const postUrl = `${escapeXml(appConfig.siteUrl)}/${escapeXml(appConfig.postLinkPrefix)}${escapeXml(doc.id)}`;
      const date = new Date(d.publishedAt);
      const pubDateTag = isNaN(date.getTime())
        ? ""
        : `\n      <pubDate>${date.toUTCString()}</pubDate>`;
      const descTag = d.previewDescription
        ? `\n      <description>${escapeXml(d.previewDescription)}</description>`
        : "";
      return `    <item>
      <title>${escapeXml(d.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>${pubDateTag}${descTag}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(appConfig.title)}</title>
    <link>${escapeXml(appConfig.siteUrl)}</link>
    <description>${escapeXml(appConfig.title)} blog</description>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />${lastBuildDate}
    <docs>https://www.rssboard.org/rss-specification</docs>
    <generator>commons.systems</generator>
${items}
  </channel>
</rss>`;

  res.set("Content-Type", "application/rss+xml; charset=utf-8");
  res.set("Cache-Control", "public, max-age=3600");
  res.send(xml);
}

export const rssFeed = onRequest(handleRssFeed);
