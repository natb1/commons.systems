import { Marked } from "marked";
import { escapeHtml } from "@commons-systems/htmlutil";
import type { PublishedPost } from "./post-types.ts";

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
