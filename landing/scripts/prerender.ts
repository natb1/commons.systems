import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
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
  const title = data.title as string;
  const description = typeof data.description === "string" ? data.description : undefined;
  const image = typeof data.image === "string" ? data.image : undefined;

  const ogTags = [
    `<meta property="og:title" content="${escapeAttr(title)}">`,
    `<meta property="og:url" content="${SITE_URL}/post/${id}">`,
    `<meta property="og:type" content="article">`,
  ];

  if (description) {
    ogTags.push(`<meta property="og:description" content="${escapeAttr(description)}">`);
    ogTags.push(`<meta name="description" content="${escapeAttr(description)}">`);
  }

  if (image) {
    ogTags.push(`<meta property="og:image" content="${escapeAttr(image)}">`);
  }

  const ogBlock = ogTags.join("\n    ");
  let html = template.replace("</head>", `    ${ogBlock}\n  </head>`);
  html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)} | commons.systems</title>`);

  const outDir = join(DIST_DIR, "post", id);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), html);
  console.log(`Pre-rendered: /post/${id}/index.html`);
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
