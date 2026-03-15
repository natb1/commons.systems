export type PostMeta =
  | { id: string; title: string; published: true; publishedAt: string; filename: string; previewImage?: string; previewDescription?: string }
  | { id: string; title: string; published: false; publishedAt: null; filename: string; previewImage?: string; previewDescription?: string };

export type PublishedPost = PostMeta & { published: true; publishedAt: string };

export function isPublished(p: PostMeta): p is PublishedPost {
  return p.published;
}
