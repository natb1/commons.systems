import type { SeedSpec } from "@commons-systems/firestoreutil/seed";

export type PostMeta =
  | { id: string; title: string; published: true; publishedAt: string; filename: string; previewImage?: string; previewDescription?: string; syndication?: string[] }
  | { id: string; title: string; published: false; publishedAt: null; filename: string; previewImage?: string; previewDescription?: string; syndication?: string[] };

export type PublishedPost = Extract<PostMeta, { published: true }>;

export function isPublished(p: PostMeta): p is PublishedPost {
  return p.published;
}

/** Extract published posts from seed data. Throws if the posts collection is missing or any published post lacks title, filename, or publishedAt. */
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
    if (data.previewImage !== undefined && typeof data.previewImage !== "string") {
      throw new Error(`Post "${doc.id}" has non-string previewImage`);
    }
    if (data.previewDescription !== undefined && typeof data.previewDescription !== "string") {
      throw new Error(`Post "${doc.id}" has non-string previewDescription`);
    }
    if (data.syndication !== undefined) {
      if (!Array.isArray(data.syndication)) {
        throw new Error(`Post "${doc.id}" has non-array syndication`);
      }
      if (!data.syndication.every((u) => typeof u === "string")) {
        throw new Error(`Post "${doc.id}" has non-string syndication entry`);
      }
    }
    published.push({
      id: doc.id,
      title: data.title,
      published: true,
      publishedAt: data.publishedAt,
      filename: data.filename,
      previewImage: data.previewImage,
      previewDescription: data.previewDescription,
      syndication: data.syndication as string[] | undefined,
    });
  }

  return published;
}
