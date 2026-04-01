import type { SeedSpec } from "@commons-systems/firestoreutil/seed";

export type PostMeta =
  | { id: string; title: string; published: true; publishedAt: string; filename: string; previewImage?: string; previewDescription?: string }
  | { id: string; title: string; published: false; publishedAt: null; filename: string; previewImage?: string; previewDescription?: string };

export type PublishedPost = Extract<PostMeta, { published: true }>;

export function isPublished(p: PostMeta): p is PublishedPost {
  return p.published;
}

/** Extract published posts from seed data. Throws if any published post is missing title, filename, or publishedAt. */
export function validatePublishedPosts(seed: Pick<SeedSpec, "collections">): PublishedPost[] {
  const postsCollection = seed.collections.find((c) => c.name === "posts");
  if (!postsCollection) {
    throw new Error("No 'posts' collection found in seed data");
  }

  const published: PublishedPost[] = [];
  for (const doc of postsCollection.documents) {
    const data = doc.data as Record<string, unknown>;
    if (data.published !== true) continue;
    if (typeof data.title !== "string") {
      throw new Error(`Post "${doc.id}" is missing a title`);
    }
    if (typeof data.filename !== "string") {
      throw new Error(`Post "${doc.id}" is missing a filename`);
    }
    if (typeof data.publishedAt !== "string") {
      throw new Error(`Post "${doc.id}" is missing a publishedAt`);
    }
    published.push({
      id: doc.id,
      title: data.title,
      published: true,
      publishedAt: data.publishedAt,
      filename: data.filename,
      previewImage: data.previewImage as string | undefined,
      previewDescription: data.previewDescription as string | undefined,
    });
  }

  return published;
}
