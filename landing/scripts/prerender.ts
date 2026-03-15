// Build-time script that generates per-post HTML files with OG metadata tags.
// Reads the post catalog from seed data and injects OG tags into copies of the
// SPA's index.html, enabling link previews for crawlers that don't execute JS.
// Run after vite build (chained in the package.json "build" script).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { escapeHtml } from "@commons-systems/htmlutil";
import appSeed from "../seeds/firestore.js";

const DIST_DIR = join(dirname(new URL(import.meta.url).pathname), "..", "dist");
const SITE_URL = "https://commons.systems";

const template = readFileSync(join(DIST_DIR, "index.html"), "utf-8");

const postsCollection = appSeed.collections.find((c) => c.name === "posts");
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
    `<meta property="og:url" content="${SITE_URL}/post/${encodeURIComponent(id)}">`,
    `<meta property="og:type" content="article">`,
  ];

  if (description) {
    ogTags.push(`<meta property="og:description" content="${escapeHtml(description)}">`);
    ogTags.push(`<meta name="description" content="${escapeHtml(description)}">`);
  }

  if (image) {
    ogTags.push(`<meta property="og:image" content="${escapeHtml(image)}">`);
  }

  const ogBlock = ogTags.join("\n    ");
  let html = template.replace("</head>", `    ${ogBlock}\n  </head>`);
  if (html === template) throw new Error(`</head> marker not found in template`);
  const beforeTitle = html;
  html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)} | commons.systems</title>`);
  if (html === beforeTitle) throw new Error(`<title> tag not found in template`);

  const outDir = join(DIST_DIR, "post", id);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), html);
  console.log(`Pre-rendered: /post/${id}/index.html`);
}
