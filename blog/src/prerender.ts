import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { escapeHtml } from "@commons-systems/htmlutil";
import type { SeedSpec } from "@commons-systems/firestoreutil/seed";

export interface PrerenderConfig {
  siteUrl: string;
  titleSuffix: string;
  distDir: string;
  seed: Pick<SeedSpec, "collections">;
}

// Build-time function that generates per-post HTML files with OG metadata tags.
// Reads the post catalog from seed data and injects OG tags into copies of the
// SPA's index.html, enabling link previews for crawlers that don't execute JS.
//
// The client-side counterpart (blog/src/og-meta.ts) manages og:title,
// og:description, og:image, og:type, and og:url dynamically for SPA navigation.
// This function mirrors those OG tags in static HTML for crawlers, and
// additionally sets <meta name="description"> and rewrites <title> — neither of
// which the client-side module handles.
export function prerenderPosts(config: PrerenderConfig): void {
  const { siteUrl, titleSuffix, distDir, seed } = config;

  const template = readFileSync(join(distDir, "index.html"), "utf-8");

  const postsCollection = seed.collections.find((c) => c.name === "posts");
  if (!postsCollection) {
    throw new Error("No 'posts' collection found in seed data");
  }

  for (const doc of postsCollection.documents) {
    const data = doc.data as Record<string, unknown>;
    if (data.published !== true) continue;

    const id = doc.id;
    if (typeof data.title !== "string") {
      throw new Error(`Post "${id}" is missing a title`);
    }
    const title = data.title;
    const description = typeof data.previewDescription === "string" ? data.previewDescription : undefined;
    const image = typeof data.previewImage === "string" ? data.previewImage : undefined;

    const ogTags = [
      `<meta property="og:title" content="${escapeHtml(title)}">`,
      `<meta property="og:url" content="${siteUrl}/post/${encodeURIComponent(id)}">`,
      `<meta property="og:type" content="article">`,
    ];

    if (description) {
      ogTags.push(`<meta property="og:description" content="${escapeHtml(description)}">`);
      ogTags.push(`<meta name="description" content="${escapeHtml(description)}">`);
    }

    if (image) {
      ogTags.push(`<meta property="og:image" content="${escapeHtml(siteUrl + image)}">`);
    }

    const ogBlock = ogTags.join("\n    ");
    let html = template.replace("</head>", `    ${ogBlock}\n  </head>`);
    if (html === template) throw new Error(`</head> marker not found in template`);
    const beforeTitle = html;
    html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)} | ${escapeHtml(titleSuffix)}</title>`);
    if (html === beforeTitle) throw new Error(`<title> tag not found in template`);

    const outDir = join(distDir, "post", id);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "index.html"), html);
    console.log(`Pre-rendered: /post/${id}/index.html`);
  }
}
