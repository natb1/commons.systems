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

// Maps Firebase Hosting site IDs to their production hostnames
const SITE_TO_HOST: Record<string, string> = {
  "cs-fellspiral-4e12": "fellspiral.commons.systems",
  "commons-systems": "commons.systems",
};

function resolveAppConfig(host: string): AppConfig | undefined {
  // Exact match (production hostnames)
  if (APP_CONFIGS[host]) return APP_CONFIGS[host];

  // Preview channel: <site>--<channel>.web.app
  // Always reads from the production Firestore namespace since the RSS feed
  // shows published content regardless of preview environment.
  const previewMatch = host.match(/^([a-z0-9-]+)--[a-z0-9-]+\.web\.app$/);
  if (previewMatch) {
    const productionHost = SITE_TO_HOST[previewMatch[1]];
    if (productionHost) {
      return APP_CONFIGS[productionHost];
    }
  }

  // Emulator: localhost or 127.0.0.1 (stripped of port).
  // Use FIRESTORE_NAMESPACE env var (set by the acceptance test harness) to
  // read from the same Firestore path that was seeded.
  const hostWithoutPort = host.replace(/:\d+$/, "");
  if (hostWithoutPort === "localhost" || hostWithoutPort === "127.0.0.1") {
    const ns = process.env.FIRESTORE_NAMESPACE;
    if (!ns) {
      return undefined;
    }
    const appName = ns.split("/")[0];
    const prodHost = Object.keys(APP_CONFIGS).find(
      (h) => APP_CONFIGS[h].namespace.startsWith(`${appName}/`),
    );
    if (!prodHost) return undefined;
    return { ...APP_CONFIGS[prodHost], siteUrl: `http://${host}`, namespace: ns };
  }

  return undefined;
}

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
  const appConfig = resolveAppConfig(host);
  if (!appConfig) {
    res.status(400).send(`Unknown host: ${host}`);
    return;
  }

  if (getApps().length === 0) initializeApp();
  const db = getFirestore();

  // Query only with the equality filter; sort in memory to avoid requiring a
  // composite Firestore index (the emulator doesn't enforce index requirements,
  // so this mismatch only surfaces in production / preview deploys).
  const snapshot = await db
    .collection(`${appConfig.namespace}/posts`)
    .where("published", "==", true)
    .get();

  // Sort descending by publishedAt in memory
  const docs = [...snapshot.docs].sort((a, b) => {
    const aDate = new Date(a.data().publishedAt).getTime();
    const bDate = new Date(b.data().publishedAt).getTime();
    return bDate - aDate;
  });

  const feedUrl = `${appConfig.siteUrl}/feed.xml`;

  const lastBuildDate =
    docs.length > 0
      ? `\n    <lastBuildDate>${new Date(docs[0].data().publishedAt).toUTCString()}</lastBuildDate>`
      : "";

  const items = docs
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
