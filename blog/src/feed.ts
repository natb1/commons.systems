import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateRssXml, type RssPost } from "./feed-rss.ts";
import type { SeedSpec } from "@commons-systems/firestoreutil/seed";

export interface FeedXmlConfig {
  title: string;
  siteUrl: string;
  seed: Pick<SeedSpec, "collections">;
  postLinkPrefix?: string;
}

export interface FeedConfig extends FeedXmlConfig {
  distDir: string;
}

/** Returns RSS XML string from seed data. Pure function used by the Vite dev plugin. */
export function buildFeedXml(config: FeedXmlConfig): string {
  const { title, siteUrl, seed, postLinkPrefix } = config;

  const postsCollection = seed.collections.find((c) => c.name === "posts");
  if (!postsCollection) {
    throw new Error("No 'posts' collection found in seed data");
  }

  const posts: RssPost[] = [];
  for (const doc of postsCollection.documents) {
    const data = doc.data as Record<string, unknown>;
    if (data.published !== true) continue;

    if (typeof data.title !== "string") {
      throw new Error(`Post "${doc.id}" is missing a title`);
    }

    posts.push({
      id: doc.id,
      title: data.title,
      publishedAt: typeof data.publishedAt === "string" ? data.publishedAt : undefined,
      previewDescription: typeof data.previewDescription === "string" ? data.previewDescription : undefined,
      previewImage: typeof data.previewImage === "string" ? data.previewImage : undefined,
    });
  }

  posts.sort((a, b) => {
    const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : NaN;
    const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : NaN;
    if (isNaN(aTime) && isNaN(bTime)) return 0;
    if (isNaN(aTime)) return 1;
    if (isNaN(bTime)) return -1;
    return bTime - aTime;
  });

  const feedUrl = `${siteUrl}/feed.xml`;
  return generateRssXml(posts, { title, siteUrl, feedUrl, postLinkPrefix });
}

/** Builds RSS XML and writes feed.xml to distDir. Called by prerender scripts. */
export function generateFeedXml(config: FeedConfig): void {
  const xml = buildFeedXml(config);
  writeFileSync(join(config.distDir, "feed.xml"), xml);
  console.log("Generated: /feed.xml");
}
