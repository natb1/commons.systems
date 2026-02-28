import type { PostMeta } from "./firestore.js";

export type PublishedPost = PostMeta & { published: true; publishedAt: string };

export function isPublished(p: PostMeta): p is PublishedPost {
  return p.published;
}
