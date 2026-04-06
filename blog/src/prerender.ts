import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { escapeHtml } from "@commons-systems/htmlutil";
import type { SeedSpec } from "@commons-systems/firestoreutil/seed";
import type { InfoPanelData } from "./components/info-panel.ts";
import { siteDefaultOgEntries, postOgEntries, type OgTagEntry, type SiteDefaults } from "./og-meta.ts";
import { validatePublishedPosts, type PostMeta, type PublishedPost } from "./post-types.ts";
import { formatPageTitle } from "./page-title.ts";
import { renderInfoPanel } from "./components/info-panel.ts";
import { createMarked, renderPostContents } from "./marked-config.ts";
import { renderArticle } from "./pages/home.ts";

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
  siteDefaults?: SiteDefaults;
}

function ogTagsToHtml(entries: OgTagEntry[]): string {
  return entries
    .map((e) => `<meta ${e.attr}="${e.key}" content="${escapeHtml(e.content)}">`)
    .join("\n    ");
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

// Build-time counterpart of og-meta.ts. Generates per-post HTML files with
// OG tags, <meta name="description">, and <title>, plus injects rendered blog
// content, info panel, and nav — enabling crawlers to see full content without
// executing JS. Each post page includes all published articles (matching the
// root index) so the client hydrates without a visible content shift.
export async function prerenderPosts(config: PrerenderConfig): Promise<void> {
  const { siteUrl, titleSuffix, distDir, seed, postDir, navLinks, infoPanel, siteDefaults } = config;

  const template = readFileSync(join(distDir, "index.html"), "utf-8");
  const marked = createMarked();

  const published = validatePublishedPosts(seed);
  published.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const contentMap = await renderPostContents(
    published,
    (filename) => readFileSync(join(postDir, filename), "utf-8"),
    marked,
  );

  const rendered: RenderedPost[] = published.map((meta) => ({
    meta,
    articleHtml: renderArticle(meta, "/post/", contentMap[meta.id]),
  }));

  const topPosts: PostMeta[] = rendered.map((p) => p.meta);
  const panelHtml = renderInfoPanel({ ...infoPanel, topPosts });
  const navHtml = renderNavHtml(navLinks);

  const allArticlesHtml = rendered.map((p) => p.articleHtml).join("\n      <hr>\n      ");
  let rootHtml = injectMain(template, allArticlesHtml);
  rootHtml = injectInfoPanel(rootHtml, panelHtml);
  rootHtml = injectNav(rootHtml, navHtml);
  if (siteDefaults) {
    rootHtml = rootHtml.replace(/\s*<meta name="description"[^>]*>/, "");
    const rootOgTags = ogTagsToHtml(siteDefaultOgEntries(siteUrl, siteDefaults));
    const beforeOg = rootHtml;
    rootHtml = rootHtml.replace("</head>", `    ${rootOgTags}\n  </head>`);
    if (rootHtml === beforeOg) throw new Error("</head> marker not found in root template");
  }
  writeFileSync(join(distDir, "index.html"), rootHtml);
  console.log("Pre-rendered: /index.html");

  for (const meta of published) {
    const ogBlock = ogTagsToHtml(postOgEntries(siteUrl, meta));
    let html = template;
    if (meta.previewDescription) {
      html = html.replace(/\s*<meta name="description"[^>]*>/, "");
    }
    const beforeHead = html;
    html = html.replace("</head>", `    ${ogBlock}\n  </head>`);
    if (html === beforeHead) throw new Error(`</head> marker not found in template`);
    const beforeTitle = html;
    html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(formatPageTitle(titleSuffix, meta.title))}</title>`);
    if (html === beforeTitle) throw new Error(`<title> tag not found in template`);

    html = injectMain(html, allArticlesHtml);
    html = injectInfoPanel(html, panelHtml);
    html = injectNav(html, navHtml);

    const outDir = join(distDir, "post", meta.id);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "index.html"), html);
    console.log(`Pre-rendered: /post/${meta.id}/index.html`);
  }
}
