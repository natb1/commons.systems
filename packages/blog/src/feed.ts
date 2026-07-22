import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateRssXml, type RssPost } from "./feed-rss.ts";
import { validatePublishedPosts } from "./post-types.ts";
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

  // Reuse the canonical published-post gate so the RSS feed's published set
  // matches the sitemap's (sitemap.ts also calls validatePublishedPosts).
  const posts: RssPost[] = validatePublishedPosts(seed).map((post) => ({
    id: post.id,
    title: post.title,
    publishedAt: post.publishedAt,
    previewDescription: post.previewDescription,
    previewImage: post.previewImage,
  }));

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
