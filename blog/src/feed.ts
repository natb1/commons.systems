import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateRssXml, type RssPost } from "@commons-systems/rssutil";
import type { SeedSpec } from "@commons-systems/firestoreutil/seed";

export interface FeedConfig {
  title: string;
  siteUrl: string;
  distDir: string;
  seed: Pick<SeedSpec, "collections">;
  postLinkPrefix?: string;
}

export function generateFeedXml(config: FeedConfig): void {
  const { title, siteUrl, distDir, seed, postLinkPrefix } = config;

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
  const xml = generateRssXml(posts, { title, siteUrl, feedUrl, postLinkPrefix });

  writeFileSync(join(distDir, "feed.xml"), xml);
  console.log("Generated: /feed.xml");
}
