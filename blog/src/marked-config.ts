import { Marked } from "marked";
import { escapeHtml } from "@commons-systems/htmlutil";
import type { SeedSpec } from "@commons-systems/firestoreutil/seed";
import type { PublishedPost } from "./post-types.js";

// Creates a Marked instance that strips raw HTML from markdown (defense-in-depth)
// and opens post-body links in new tabs with rel="noopener noreferrer" to prevent
// reverse tabnapping.
//
// Build-time paths (prerender, vite plugin) rely on the `html: () => ""` renderer
// to strip raw HTML. The client additionally runs DOMPurify (see pages/home.ts).
// A Node-compatible sanitizer (e.g., isomorphic-dompurify) is not currently used
// at build time — security review should evaluate whether one is needed.
export function createMarked(): Marked {
  return new Marked({
    renderer: {
      html: () => "",
      link({ href, text, title }) {
        const safeHref = escapeHtml(href);
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
        return `<a href="${safeHref}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
      },
    },
  });
}

export function extractH1(markdown: string): { title: string; body: string } | null {
  const match = markdown.match(/^#\s+(.+)/);
  if (!match) return null;
  return { title: match[1], body: markdown.replace(/^#\s+.+\n?/, "") };
}

/** Validate and extract published posts from seed data. Throws on missing fields. */
export function getPublishedFromSeed(
  seed: Pick<SeedSpec, "collections">,
  errorPrefix = "",
): PublishedPost[] {
  const postsCollection = seed.collections.find((c) => c.name === "posts");
  if (!postsCollection) {
    throw new Error(`${errorPrefix}No 'posts' collection found in seed data`);
  }

  const published: PublishedPost[] = [];
  for (const doc of postsCollection.documents) {
    const data = doc.data as Record<string, unknown>;
    if (data.published !== true) continue;
    if (typeof data.title !== "string") {
      throw new Error(`${errorPrefix}Post "${doc.id}" is missing a title`);
    }
    if (typeof data.filename !== "string") {
      throw new Error(`${errorPrefix}Post "${doc.id}" is missing a filename`);
    }
    if (typeof data.publishedAt !== "string") {
      throw new Error(`${errorPrefix}Post "${doc.id}" is missing a publishedAt`);
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

export interface PostContent {
  html: string;
  title: string | null;
}

/** Parse markdown files into rendered HTML content. */
export async function renderPostContents(
  posts: PublishedPost[],
  readFile: (path: string) => string,
  marked: Marked,
): Promise<Record<string, PostContent>> {
  const results: Record<string, PostContent> = {};
  for (const post of posts) {
    const markdown = readFile(post.filename);
    const h1 = extractH1(markdown);
    const body = h1 ? h1.body : markdown;
    const html = await marked.parse(body);
    results[post.id] = { html, title: h1 ? h1.title : null };
  }
  return results;
}
