import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { escapeHtml } from "@commons-systems/htmlutil";
import type { SeedSpec } from "@commons-systems/firestoreutil/seed";
import type { InfoPanelData } from "./components/info-panel.js";
import type { PostMeta, PublishedPost } from "./post-types.js";
import { renderInfoPanel } from "./components/info-panel.js";
import { createMarked, extractH1 } from "./marked-config.js";
import { renderArticle, type PostContent } from "./pages/home.js";
import { findPostsCollection, extractPublishedPosts } from "./seed-posts.js";

export interface NavLink {
  readonly href: string;
  readonly label: string;
}

export interface PrerenderConfig {
  siteUrl: string;
  titleSuffix: string;
  distDir: string;
  seed: Pick<SeedSpec, "collections">;
  postDir: string;
  navLinks: NavLink[];
  infoPanel: Omit<InfoPanelData, "topPosts">;
}

function renderNavHtml(links: NavLink[]): string {
  const anchors = links
    .map((l) => `<a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a>`)
    .join("");
  return `<span class="nav-links">${anchors}</span>`;
}

interface RenderedPost {
  meta: PublishedPost;
  articleHtml: string;
}

async function parseAndRenderPosts(
  published: PublishedPost[],
  postDir: string,
  marked: ReturnType<typeof createMarked>,
): Promise<RenderedPost[]> {
  const results: RenderedPost[] = [];
  for (const post of published) {
    const markdown = readFileSync(join(postDir, post.filename), "utf-8");

    const h1 = extractH1(markdown);
    const title = h1 ? h1.title : post.title;
    const body = h1 ? h1.body : markdown;
    const html = await marked.parse(body);
    const content: PostContent = { html, title: h1 ? h1.title : null };

    const meta: PublishedPost = { ...post, title };

    results.push({
      meta,
      articleHtml: renderArticle(meta, "/post/", content),
    });
  }
  return results;
}

function injectMain(html: string, articlesHtml: string): string {
  const result = html.replace(
    /<main id="app">.*?<\/main>/s,
    `<main id="app"><div id="posts">${articlesHtml}</div></main>`,
  );
  if (result === html) throw new Error('<main id="app"> marker not found in template');
  return result;
}

function injectInfoPanel(html: string, panelHtml: string): string {
  const result = html.replace(
    /<aside id="info-panel" class="sidebar">.*?<\/aside>/s,
    `<aside id="info-panel" class="sidebar">${panelHtml}</aside>`,
  );
  if (result === html) throw new Error('<aside id="info-panel"> marker not found in template');
  return result;
}

function injectNav(html: string, navHtml: string): string {
  const result = html.replace(
    /<app-nav id="nav">.*?<\/app-nav>/s,
    `<app-nav id="nav">${navHtml}</app-nav>`,
  );
  if (result === html) throw new Error('<app-nav id="nav"> marker not found in template');
  return result;
}

// Build-time function that generates per-post HTML files with OG metadata tags
// and injects rendered blog content, info panel, and nav into static HTML.
// Reads the post catalog from seed data and markdown files, enabling crawlers
// to see full content without executing JS.
//
// The client-side counterpart (blog/src/og-meta.ts) manages og:title,
// og:description, og:image, og:type, and og:url dynamically for SPA navigation.
// This function mirrors those OG tags in static HTML for crawlers, and
// additionally sets <meta name="description"> and rewrites <title> — neither of
// which the client-side module handles.
export async function prerenderPosts(config: PrerenderConfig): Promise<void> {
  const { siteUrl, titleSuffix, distDir, seed, postDir, navLinks, infoPanel } = config;

  const template = readFileSync(join(distDir, "index.html"), "utf-8");
  const marked = createMarked();

  const postsCollection = findPostsCollection(seed.collections);
  const published = extractPublishedPosts(postsCollection);

  const parsed = await parseAndRenderPosts(published, postDir, marked);

  // Sort by date descending for the home page (extractPublishedPosts sorts by
  // publishedAt string comparison; re-sort by parsed Date for correctness)
  const sorted = [...parsed].sort(
    (a, b) => new Date(b.meta.publishedAt).getTime() - new Date(a.meta.publishedAt).getTime(),
  );

  // Build info panel HTML with all published posts as the archive listing
  const topPosts: PostMeta[] = sorted.map((p) => p.meta);
  const panelHtml = renderInfoPanel({ ...infoPanel, topPosts });
  const navHtml = renderNavHtml(navLinks);

  // Inject content into root index.html (all posts)
  const allArticlesHtml = sorted.map((p) => p.articleHtml).join("\n      <hr>\n      ");
  let rootHtml = injectMain(template, allArticlesHtml);
  rootHtml = injectInfoPanel(rootHtml, panelHtml);
  rootHtml = injectNav(rootHtml, navHtml);
  writeFileSync(join(distDir, "index.html"), rootHtml);
  console.log("Pre-rendered: /index.html");

  // Generate per-post pages with OG tags and single-post content
  for (const post of published) {
    const { id, title, previewDescription: description, previewImage: image } = post;

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

    // Inject single-post content, info panel, and nav
    const rendered = parsed.find((p) => p.meta.id === id)!;
    html = injectMain(html, rendered.articleHtml);
    html = injectInfoPanel(html, panelHtml);
    html = injectNav(html, navHtml);

    const outDir = join(distDir, "post", id);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "index.html"), html);
    console.log(`Pre-rendered: /post/${id}/index.html`);
  }
}
