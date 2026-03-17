import {
  generateRssXml,
  type RssConfig,
  type RssPost,
} from "@commons-systems/rssutil";
import { isPublished, type PostMeta } from "./post-types.js";

export function generateFeedXml(posts: PostMeta[], config: RssConfig): string {
  const published = posts
    .filter(isPublished)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const rssPosts: RssPost[] = published.map((p) => ({
    id: p.id,
    title: p.title,
    publishedAt: p.publishedAt,
    previewDescription: p.previewDescription,
  }));

  return generateRssXml(rssPosts, config);
}
