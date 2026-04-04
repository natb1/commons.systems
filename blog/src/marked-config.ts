import { Marked } from "marked";
import { escapeHtml } from "@commons-systems/htmlutil";
import type { PublishedPost } from "./post-types.ts";

interface ImageMeta {
  width: number;
  height: number;
  srcset: { path: string; width: number }[];
}

/** Known image dimensions and responsive variants for blog images served from public/. */
export const IMAGE_DIMENSIONS: Record<string, ImageMeta> = {
  "/woman-with-a-flower-head.webp": {
    width: 1600, height: 900,
    srcset: [
      { path: "/woman-with-a-flower-head-400w.webp", width: 400 },
      { path: "/woman-with-a-flower-head-800w.webp", width: 800 },
      { path: "/woman-with-a-flower-head.webp", width: 1600 },
    ],
  },
  "/blog-map-color.webp": {
    width: 1600, height: 1267,
    srcset: [
      { path: "/blog-map-color-400w.webp", width: 400 },
      { path: "/blog-map-color-800w.webp", width: 800 },
      { path: "/blog-map-color.webp", width: 1600 },
    ],
  },
  "/tile10-armadillo-crag.webp": {
    width: 782, height: 812,
    srcset: [
      { path: "/tile10-armadillo-crag-400w.webp", width: 400 },
      { path: "/tile10-armadillo-crag.webp", width: 782 },
    ],
  },
  "/alienurn.webp": {
    width: 1920, height: 1080,
    srcset: [
      { path: "/alienurn-400w.webp", width: 400 },
      { path: "/alienurn-800w.webp", width: 800 },
      { path: "/alienurn.webp", width: 1920 },
    ],
  },
};

// Creates a Marked instance that strips raw HTML from markdown (defense-in-depth)
// and opens post-body links in new tabs with rel="noopener noreferrer" to prevent
// reverse tabnapping.
//
// The image renderer adds width/height attributes from IMAGE_DIMENSIONS,
// fetchpriority="high" on the first image (LCP element), and loading="lazy"
// on all subsequent images. The counter is per-Marked-instance: vite plugin
// and prerender each create their own instance. Client hydration (home.ts)
// shares a single module-level instance but skips prerendered posts via
// data-hydrated, so the counter is only used for non-prerendered content.
//
// Build-time paths (prerender, vite plugin) rely on the `html: () => ""` renderer
// to strip raw HTML. The client additionally runs DOMPurify (see pages/home.ts).
// A Node-compatible sanitizer (e.g., isomorphic-dompurify) is not currently used
// at build time — security review should evaluate whether one is needed.
export function createMarked(): Marked {
  let imageIndex = 0;

  return new Marked({
    renderer: {
      html: () => "",
      link({ href, text, title }) {
        const safeHref = escapeHtml(href);
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
        return `<a href="${safeHref}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
      },
      image({ href, text }) {
        const safeHref = escapeHtml(href);
        const alt = text ? escapeHtml(text) : "";
        const dims = IMAGE_DIMENSIONS[href];
        if (!dims) {
          throw new Error(`Image "${href}" not found in IMAGE_DIMENSIONS. Add its dimensions to marked-config.ts.`);
        }
        const loadAttr = imageIndex === 0
          ? ' fetchpriority="high"'
          : ' loading="lazy"';
        imageIndex++;
        const srcsetAttr = ` srcset="${dims.srcset.map(s => `${s.path} ${s.width}w`).join(", ")}"`;
        const sizesAttr = ' sizes="(min-width: 768px) min(49rem, calc(100vw - 19.5rem)), calc(100vw - 2rem - 24px)"';
        return `<img src="${safeHref}" alt="${alt}" width="${dims.width}" height="${dims.height}"${srcsetAttr}${sizesAttr}${loadAttr}>`;
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
