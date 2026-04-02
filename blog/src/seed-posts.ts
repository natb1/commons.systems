import type { SeedCollection } from "@commons-systems/firestoreutil/seed";
import type { PublishedPost } from "./post-types.js";

/** Find the "posts" collection from seed data collections. Throws if not found. */
export function findPostsCollection(collections: SeedCollection[]): SeedCollection {
  const col = collections.find((c) => c.name === "posts");
  if (!col) throw new Error("No 'posts' collection found in seed data");
  return col;
}

/** Extract validated PublishedPost entries from a seed collection, sorted by publishedAt descending. */
export function extractPublishedPosts(postsCollection: SeedCollection): PublishedPost[] {
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
  published.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return published;
}
