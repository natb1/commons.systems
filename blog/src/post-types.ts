export type PostMeta =
  | { id: string; title: string; published: true; publishedAt: string; filename: string }
  | { id: string; title: string; published: false; publishedAt: null; filename: string };

export type PublishedPost = PostMeta & { published: true; publishedAt: string };

export function isPublished(p: PostMeta): p is PublishedPost {
  return p.published;
}
