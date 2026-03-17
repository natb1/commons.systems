import { onRequest } from "firebase-functions/v2/https";
import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { generateRssXml, type RssPost } from "@commons-systems/rssutil";

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

// Maps Firebase Hosting site IDs to production hostnames, used to resolve preview channel URLs back to production config
const SITE_TO_HOST: Record<string, string> = {
  "cs-fellspiral-4e12": "fellspiral.commons.systems",
  "commons-systems": "commons.systems",
};

function resolveAppConfig(host: string): AppConfig | undefined {
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
    console.warn(
      `Preview channel matched but site ID "${previewMatch[1]}" not in SITE_TO_HOST`,
    );
  }

  // Emulator: localhost or 127.0.0.1 (stripped of port).
  // Use FIRESTORE_NAMESPACE env var (set by the test harness or QA server) to
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

export async function handleRssFeed(req: Request, res: Response) {
  const host = (req.headers["x-forwarded-host"] as string | undefined) ?? req.hostname;
  const appConfig = resolveAppConfig(host);
  if (!appConfig) {
    res.status(400).set("Content-Type", "text/plain").send(`Unknown host: ${host}`);
    return;
  }

  if (getApps().length === 0) initializeApp({ projectId: "commons-systems" });
  const db = getFirestore();

  const collectionPath = `${appConfig.namespace}/posts`;
  let snapshot;
  try {
    // Query only with the equality filter; sort in memory to avoid requiring a
    // composite Firestore index. (The emulator does not enforce index
    // requirements, so missing indexes only fail in production.)
    snapshot = await db
      .collection(collectionPath)
      .where("published", "==", true)
      .get();
  } catch (err) {
    console.error(`Firestore query failed for collection "${collectionPath}":`, err);
    res.status(500).set("Content-Type", "text/plain").send("RSS feed temporarily unavailable");
    return;
  }

  const docs = [...snapshot.docs].sort((a, b) => {
    const aTime = new Date(a.data().publishedAt).getTime();
    const bTime = new Date(b.data().publishedAt).getTime();
    if (isNaN(aTime) && isNaN(bTime)) return 0;
    if (isNaN(aTime)) return 1;
    if (isNaN(bTime)) return -1;
    return bTime - aTime;
  });

  const rssPosts: RssPost[] = [];
  for (const doc of docs) {
    const d = doc.data();
    if (typeof d.title !== "string") {
      console.warn(
        `Skipping doc "${doc.id}" in "${collectionPath}": missing or non-string title`,
      );
      continue;
    }
    rssPosts.push({
      id: doc.id,
      title: d.title,
      publishedAt: d.publishedAt,
      previewDescription: d.previewDescription,
    });
  }

  const feedUrl = `${appConfig.siteUrl}/feed.xml`;
  const xml = generateRssXml(rssPosts, {
    title: appConfig.title,
    siteUrl: appConfig.siteUrl,
    feedUrl,
    postLinkPrefix: appConfig.postLinkPrefix,
  });

  res.set("Content-Type", "application/rss+xml; charset=utf-8");
  res.set("Cache-Control", "public, max-age=3600");
  res.send(xml);
}

export const rssFeed = onRequest(handleRssFeed);
