import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { escapeHtml } from "@commons-systems/htmlutil";
import type { SeedSpec } from "@commons-systems/firestoreutil/seed";
import type { InfoPanelData } from "./components/info-panel.ts";
import {
  siteDefaultOgEntries,
  postOgEntries,
  staticPageOgEntries,
  type OgTagEntry,
  type SiteDefaults,
} from "./og-meta.ts";
import { validatePublishedPosts, type PostMeta, type PublishedPost } from "./post-types.ts";
import { formatPageTitle } from "./page-title.ts";
import { renderInfoPanel } from "./components/info-panel.ts";
import { createMarked, renderPostContents } from "./marked-config.ts";
import { renderArticle } from "./pages/home.ts";
import {
  organizationJsonLd,
  blogPostingJsonLd,
  softwareApplicationJsonLd,
  jsonLdScriptTag,
  canonicalLinkTag,
  relMeLinkTags,
  type Organization,
  type Author,
  type SoftwareApplication,
} from "./seo.ts";

export interface NavLink {
  readonly href: string;
  readonly label: string;
  readonly align?: "end";
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
  organization?: Organization;
  author?: Author;
  relMe?: string[];
  /** When provided, also set `homeExtraHtml` so JSON-LD apps have a visual representation on the page. */
  softwareApplications?: SoftwareApplication[];
  /** Replaces the `<section class="landing-hero">` block when rendering the root page.
   *  When set, per-post pages also strip the `landing-hero` section.
   *  Throws if the marker is absent from the template. */
  homeExtraHtml?: string;
}

export interface StaticPageConfig {
  siteUrl: string;
  titleSuffix: string;
  distDir: string;
  /** e.g. "/about" — leading slash required, no trailing slash. */
  path: string;
  pageTitle: string;
  pageDescription: string;
  /** Absolute path from site root; included in og:image / twitter:image when provided. */
  pageImage?: string;
  pageType?: "website" | "profile";
  /** Injected into `<main id="app">`. */
  bodyHtml: string;
  navLinks: NavLink[];
  /** Pre-rendered info panel HTML — produced by `loadPostsForPrerender`. */
  panelHtml: string;
  jsonLdBlocks?: Record<string, unknown>[];
  relMe?: string[];
  /** Defaults to true. Set false to keep the landing-hero block in this static page. */
  stripHero?: boolean;
}

export interface PostsArtifacts {
  topPosts: PostMeta[];
  panelHtml: string;
  allArticlesHtml: string;
  rendered: RenderedPost[];
}

function ogTagsToHtml(entries: OgTagEntry[]): string {
  return entries
    .map((e) => `<meta ${e.attr}="${e.key}" content="${escapeHtml(e.content)}">`)
    .join("\n    ");
}

function renderNavHtml(links: NavLink[]): string {
  const anchors = links
    .map((l) => {
      const alignAttr = l.align === "end" ? ` data-align="end"` : "";
      return `<a href="${escapeHtml(l.href)}"${alignAttr}>${escapeHtml(l.label)}</a>`;
    })
    .join("");
  return `<span class="nav-links">${anchors}</span>`;
}

interface RenderedPost {
  meta: PublishedPost;
  articleHtml: string;
}

function injectMain(html: string, innerHtml: string): string {
  const result = html.replace(
    /<main id="app">.*?<\/main>/s,
    `<main id="app">${innerHtml}</main>`,
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

function injectHomeExtra(html: string, extraHtml: string): string {
  const result = html.replace(
    /<section class="landing-hero"[^>]*>.*?<\/section>/s,
    extraHtml,
  );
  if (result === html) throw new Error('<section class="landing-hero"> marker not found in template');
  return result;
}

function stripHomeExtra(html: string): string {
  const result = html.replace(/<section class="landing-hero"[^>]*>.*?<\/section>\s*/s, "");
  if (result === html) throw new Error('<section class="landing-hero"> marker not found in template');
  return result;
}

function injectBeforeHead(html: string, block: string, context: string): string {
  const result = html.replace("</head>", `    ${block}\n  </head>`);
  if (result === html) throw new Error(`</head> marker not found in ${context}`);
  return result;
}

function buildSeoHeadHtml(parts: string[]): string {
  return parts.filter((s) => s.length > 0).join("\n    ");
}

/** Loads, validates, and renders all published posts plus the info panel HTML.
 *  Both `prerenderPosts` and static-page callers can use this to avoid loading
 *  posts and rendering the panel twice. */
export async function loadPostsForPrerender(args: {
  seed: Pick<SeedSpec, "collections">;
  postDir: string;
  infoPanel: Omit<InfoPanelData, "topPosts">;
}): Promise<PostsArtifacts> {
  const marked = createMarked();
  const published = validatePublishedPosts(args.seed);
  published.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const contentMap = await renderPostContents(
    published,
    (filename) => readFileSync(join(args.postDir, filename), "utf-8"),
    marked,
  );

  const rendered: RenderedPost[] = published.map((meta) => ({
    meta,
    articleHtml: renderArticle(meta, "/post/", contentMap[meta.id]),
  }));

  const topPosts: PostMeta[] = rendered.map((p) => p.meta);
  const panelHtml = renderInfoPanel({ ...args.infoPanel, topPosts });
  const allArticlesHtml = rendered.map((p) => p.articleHtml).join("\n      <hr>\n      ");

  return { topPosts, panelHtml, allArticlesHtml, rendered };
}

// Build-time counterpart of og-meta.ts. Generates per-post HTML files with
// OG tags, <meta name="description">, <title>, canonical link, JSON-LD
// structured data (Organization on the root, BlogPosting per post), and
// optional rel=me links, plus injects rendered blog content, info panel, and
// nav — enabling crawlers to see full content without executing JS. Each post
// page includes all published articles (matching the root index) so the
// client hydrates without a visible content shift.
export async function prerenderPosts(config: PrerenderConfig): Promise<void> {
  const {
    siteUrl,
    titleSuffix,
    distDir,
    seed,
    postDir,
    navLinks,
    infoPanel,
    siteDefaults,
    organization,
    author,
    relMe,
    softwareApplications,
    homeExtraHtml,
  } = config;

  const template = readFileSync(join(distDir, "index.html"), "utf-8");

  const { panelHtml, allArticlesHtml, rendered } = await loadPostsForPrerender({
    seed,
    postDir,
    infoPanel,
  });

  const navHtml = renderNavHtml(navLinks);

  const relMeHtml = relMe ? relMeLinkTags(relMe) : "";

  const softwareApplicationTags = (softwareApplications ?? [])
    .map((app) => jsonLdScriptTag(softwareApplicationJsonLd(app)))
    .join("\n    ");

  const rootSeoHead = buildSeoHeadHtml([
    canonicalLinkTag(`${siteUrl}/`),
    organization ? jsonLdScriptTag(organizationJsonLd(organization)) : "",
    softwareApplicationTags,
    relMeHtml,
  ]);

  let rootHtml = injectMain(template, `<div id="posts">${allArticlesHtml}</div>`);
  rootHtml = injectInfoPanel(rootHtml, panelHtml);
  rootHtml = injectNav(rootHtml, navHtml);
  if (homeExtraHtml !== undefined) {
    rootHtml = injectHomeExtra(rootHtml, homeExtraHtml);
  }
  if (siteDefaults) {
    rootHtml = rootHtml.replace(/\s*<meta name="description"[^>]*>/, "");
    const rootOgTags = ogTagsToHtml(siteDefaultOgEntries(siteUrl, siteDefaults));
    rootHtml = injectBeforeHead(rootHtml, rootOgTags, "root template");
  }
  rootHtml = injectBeforeHead(rootHtml, rootSeoHead, "root template");
  writeFileSync(join(distDir, "index.html"), rootHtml);
  console.log("Pre-rendered: /index.html");

  for (const { meta } of rendered) {
    const ogBlock = ogTagsToHtml(postOgEntries(siteUrl, meta));
    const postSeoHead = buildSeoHeadHtml([
      canonicalLinkTag(`${siteUrl}/post/${encodeURIComponent(meta.id)}`),
      author ? jsonLdScriptTag(blogPostingJsonLd(meta, siteUrl, author)) : "",
      relMeHtml,
    ]);
    let html = template;
    if (meta.previewDescription) {
      html = html.replace(/\s*<meta name="description"[^>]*>/, "");
    }
    html = injectBeforeHead(html, ogBlock, "post template");
    html = injectBeforeHead(html, postSeoHead, "post template");
    const beforeTitle = html;
    html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(formatPageTitle(titleSuffix, meta.title))}</title>`);
    if (html === beforeTitle) throw new Error(`<title> tag not found in template`);

    html = injectMain(html, `<div id="posts">${allArticlesHtml}</div>`);
    html = injectInfoPanel(html, panelHtml);
    html = injectNav(html, navHtml);
    if (homeExtraHtml !== undefined) {
      html = stripHomeExtra(html);
    }

    const outDir = join(distDir, "post", meta.id);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "index.html"), html);
    console.log(`Pre-rendered: /post/${meta.id}/index.html`);
  }
}

/** Emit a static page (e.g. `/about`) with full SEO parity to `prerenderPosts`.
 *  The caller supplies a pre-rendered info panel via `panelHtml` — typically
 *  obtained from `loadPostsForPrerender` — so posts are loaded only once. */
export function prerenderStaticPage(config: StaticPageConfig): void {
  const {
    siteUrl,
    titleSuffix,
    distDir,
    path,
    pageTitle,
    pageDescription,
    pageImage,
    pageType,
    bodyHtml,
    navLinks,
    panelHtml,
    jsonLdBlocks,
    relMe,
    stripHero,
  } = config;

  const template = readFileSync(join(distDir, "index.html"), "utf-8");

  const ogBlock = ogTagsToHtml(
    staticPageOgEntries(siteUrl, {
      url: path,
      title: pageTitle,
      description: pageDescription,
      image: pageImage,
      type: pageType,
    }),
  );

  const jsonLdHtml = (jsonLdBlocks ?? [])
    .map((block) => jsonLdScriptTag(block))
    .join("\n    ");

  const seoHead = buildSeoHeadHtml([
    canonicalLinkTag(`${siteUrl}${path}`),
    jsonLdHtml,
    relMe && relMe.length > 0 ? relMeLinkTags(relMe) : "",
  ]);

  let html = template.replace(/\s*<meta name="description"[^>]*>/, "");

  const beforeTitle = html;
  html = html.replace(
    /<title>.*?<\/title>/,
    `<title>${escapeHtml(formatPageTitle(titleSuffix, pageTitle))}</title>`,
  );
  if (html === beforeTitle) throw new Error(`<title> tag not found in template`);

  html = injectBeforeHead(html, ogBlock, "static page template");
  html = injectBeforeHead(html, seoHead, "static page template");

  html = injectMain(html, bodyHtml);
  html = injectInfoPanel(html, panelHtml);
  html = injectNav(html, renderNavHtml(navLinks));

  if (stripHero !== false) {
    html = stripHomeExtra(html);
  }

  const outDir = join(distDir, path);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), html);
  console.log(`Pre-rendered: ${path}/index.html`);
}
