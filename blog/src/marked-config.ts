import { Marked } from "marked";
import { escapeHtml } from "@commons-systems/htmlutil";
import type { PublishedPost } from "./post-types.ts";
import { BLOG_IMAGES } from "./image-config.ts";

interface ImageMeta {
  width: number;
  height: number;
  srcset: { path: string; width: number }[];
}

/** Known image dimensions and responsive variants for blog images served from public/. */
export const IMAGE_DIMENSIONS: Record<string, ImageMeta> = Object.fromEntries(
  BLOG_IMAGES.map(img => [
    `/${img.baseName}.webp`,
    {
      width: img.fullWidth,
      height: img.fullHeight,
      srcset: [
        ...img.responsiveWidths.map(w => ({ path: `/${img.baseName}-${w}w.webp`, width: w })),
        { path: `/${img.baseName}.webp`, width: img.fullWidth },
      ],
    },
  ]),
);

// Creates a Marked instance that strips raw HTML from markdown (defense-in-depth)
// and opens post-body links in new tabs with rel="noopener noreferrer" to prevent
// reverse tabnapping. The image renderer adds width/height, srcset/sizes, and
// fetchpriority="high" on the first image per instance (likely LCP candidate).
//
// Server-side HTML sanitizer (isomorphic-dompurify) is unnecessary: `html: () => ""`
// strips all raw HTML at build time, and images validate against IMAGE_DIMENSIONS
// (unknown paths throw). The client additionally runs DOMPurify (see pages/home.ts).
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
        const srcsetAttr = ` srcset="${dims.srcset.map(s => `${escapeHtml(s.path)} ${s.width}w`).join(", ")}"`;
        // sizes: empirically matched to blog.css / fellspiral layout.css.
        // Desktop: main column capped at ~49rem, narrower on small desktops.
        // Mobile: full viewport minus page padding and filigree borders.
        const sizesAttr = ' sizes="(min-width: 768px) min(49rem, calc(100vw - 22.5rem - 24px)), calc(100vw - 5rem - 24px)"';
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
