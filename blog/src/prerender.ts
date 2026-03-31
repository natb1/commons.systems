import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { escapeHtml } from "@commons-systems/htmlutil";
import type { SeedSpec } from "@commons-systems/firestoreutil/seed";
import type { LinkSection, InfoPanelData } from "./components/info-panel.js";
import type { BlogRollEntry } from "./blog-roll/types.js";
import type { PostMeta, PublishedPost } from "./post-types.js";
import { renderInfoPanel } from "./components/info-panel.js";
import { createMarked } from "./marked-config.js";
import { formatUtcDate } from "./date.js";

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

function extractH1(markdown: string): { title: string; body: string } | null {
  const match = markdown.match(/^#\s+(.+)/);
  if (!match) return null;
  return { title: match[1], body: markdown.replace(/^#\s+.+\n?/, "") };
}

function renderArticle(
  id: string,
  title: string,
  publishedAt: string,
  contentHtml: string,
): string {
  const safeId = escapeHtml(id);
  return `<article id="post-${safeId}">
        <h2><a href="/post/${safeId}" class="post-link"><span class="link-icon" aria-hidden="true">&#x1F517; </span><span class="post-title">${escapeHtml(title)}</span></a></h2>
        <time datetime="${escapeHtml(publishedAt)}">${escapeHtml(formatUtcDate(publishedAt))}</time>
        <div id="post-content-${safeId}" data-hydrated>${contentHtml}</div>
      </article>`;
}

function renderNavHtml(links: NavLink[]): string {
  const anchors = links
    .map((l) => `<a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a>`)
    .join("");
  return `<span class="nav-links">${anchors}</span>`;
}

interface ParsedPost {
  id: string;
  title: string;
  publishedAt: string;
  articleHtml: string;
}

function parseAndRenderPosts(
  published: Array<{ id: string; data: Record<string, unknown> }>,
  postDir: string,
  marked: ReturnType<typeof createMarked>,
): ParsedPost[] {
  return published.map((doc) => {
    const data = doc.data;
    const filename = data.filename as string;
    const markdown = readFileSync(join(postDir, filename), "utf-8");

    const h1 = extractH1(markdown);
    const title = h1 ? h1.title : (data.title as string);
    const body = h1 ? h1.body : markdown;
    const contentHtml = marked.parse(body) as string;

    return {
      id: doc.id,
      title,
      publishedAt: data.publishedAt as string,
      articleHtml: renderArticle(doc.id, title, data.publishedAt as string, contentHtml),
    };
  });
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
export function prerenderPosts(config: PrerenderConfig): void {
  const { siteUrl, titleSuffix, distDir, seed, postDir, navLinks, infoPanel } = config;

  const template = readFileSync(join(distDir, "index.html"), "utf-8");
  const marked = createMarked();

  const postsCollection = seed.collections.find((c) => c.name === "posts");
  if (!postsCollection) {
    throw new Error("No 'posts' collection found in seed data");
  }

  const publishedDocs = postsCollection.documents.filter(
    (doc) => (doc.data as Record<string, unknown>).published === true,
  );

  for (const doc of publishedDocs) {
    const data = doc.data as Record<string, unknown>;
    if (typeof data.title !== "string") {
      throw new Error(`Post "${doc.id}" is missing a title`);
    }
  }

  const parsed = parseAndRenderPosts(
    publishedDocs.map((d) => ({ id: d.id, data: d.data as Record<string, unknown> })),
    postDir,
    marked,
  );

  // Sort by date descending for the home page
  const sorted = [...parsed].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  // Build info panel HTML using published posts as topPosts
  const topPosts: PostMeta[] = sorted.map((p) => {
    const doc = publishedDocs.find((d) => d.id === p.id)!;
    const data = doc.data as Record<string, unknown>;
    return {
      id: p.id,
      title: p.title,
      published: true as const,
      publishedAt: p.publishedAt,
      filename: data.filename as string,
    };
  });
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
  for (const doc of publishedDocs) {
    const data = doc.data as Record<string, unknown>;
    const id = doc.id;
    const title = data.title as string;
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

    // Inject single-post content, info panel, and nav
    const post = parsed.find((p) => p.id === id)!;
    html = injectMain(html, post.articleHtml);
    html = injectInfoPanel(html, panelHtml);
    html = injectNav(html, navHtml);

    const outDir = join(distDir, "post", id);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "index.html"), html);
    console.log(`Pre-rendered: /post/${id}/index.html`);
  }
}
