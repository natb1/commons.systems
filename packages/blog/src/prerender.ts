import * as fs from "node:fs";
import { join } from "node:path";
import { createElement, Fragment, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { escapeHtml } from "@commons-systems/htmlutil";
import type { SeedSpec } from "@commons-systems/firestoreutil/seed";
import { ContextPanelToggle } from "@commons-systems/ds";
import { BlogNavEnd } from "./components/BlogNav.tsx";
import { BlogPageShell } from "./components/BlogPageShell.tsx";
import type { InfoPanelData } from "./components/info-panel.ts";
import { InfoPanelRegion } from "./components/InfoPanelRegion.tsx";
import { HomeRegion } from "./pages/HomeRegion.tsx";
import {
  siteDefaultOgEntries,
  postOgEntries,
  staticPageOgEntries,
  type OgTagEntry,
  type SiteDefaults,
  type StaticPageMeta,
} from "./og-meta.ts";
import { validatePublishedPosts, type PostMeta, type PublishedPost } from "./post-types.ts";
import { formatPageTitle } from "./page-title.ts";
import { createMarked, renderPostContents, type PostContent } from "./marked-config.ts";
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
import type { NavLink } from "@commons-systems/ds";

export type { NavLink };

/** The ds-chrome seam — the SSR/prerender counterpart of create-blog-app's
 *  client `shell` config. Prerender renders a SINGLE ds `<PageShell>` root (via
 *  BlogPageShell) into `#${mount}`, so the prerendered HTML byte-matches what
 *  the client hydrates. This is the only injection path. Mirrors the client
 *  `shell` shape in create-blog-app.ts. */
export interface PrerenderShellConfig {
  mount: string;
  wordmark: ReactNode;
  tagline?: ReactNode;
  hero?: ReactNode;
  panelId?: string;
  panelAriaLabel?: string;
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
  /** Emitted as SoftwareApplication JSON-LD on the root page. Pair with a
   *  `shell.hero` so the apps also have a visual representation on the page. */
  softwareApplications?: SoftwareApplication[];
  /** Whether to include the `commons.systems` home link in the prerendered nav.
   *  Defaults to `false`. */
  showHomeLink?: boolean;
  /** The ds-chrome seam — see PrerenderShellConfig. The root index and every
   *  post page render through BlogPageShell into `#${mount}` (the shell carries
   *  nav, panel, hero, and footer). The `<head>` SEO injectors run on top. */
  shell: PrerenderShellConfig;
}

export interface StaticPageConfig {
  siteUrl: string;
  titleSuffix: string;
  distDir: string;
  /** Page metadata; `page.url` is also the output path (e.g. "/about" — leading
   *  slash required, no trailing slash). */
  page: StaticPageMeta;
  /** A ReactNode server-rendered (wrapped in a `<div>`) as the shell's children,
   *  byte-matching the client's `createElement("div", null, node)` entry-hydration
   *  wrapper in create-blog-app.ts so the page hydrates without a mismatch. */
  body: ReactNode;
  navLinks: NavLink[];
  /** A ReactNode for an About-style panel. The panel is server-rendered through
   *  `InfoPanelRegion` (matching the client's `panelElement()` aboutContent
   *  branch), so the prerendered `#info-panel` hydrates without a mismatch.
   *  Required — a static page's panel has no other source. */
  aboutContent?: ReactNode;
  jsonLdBlocks?: Record<string, unknown>[];
  relMe?: string[];
  /** Whether to include the `commons.systems` home link in the prerendered nav.
   *  Defaults to `false`. */
  showHomeLink?: boolean;
  /** The ds-chrome seam — see PrerenderShellConfig. The page renders through
   *  BlogPageShell into `#${mount}` (the shell carries nav, panel, and footer).
   *  Requires `aboutContent` (the panel ReactNode) — the client hydrates a
   *  static page's panel from `infoPanelContentForPath`. The `<head>` SEO
   *  injectors run on top. */
  shell: PrerenderShellConfig;
}

export interface PostsArtifacts {
  topPosts: PostMeta[];
  /** Server-rendered `HomeRegion` (the `#posts` feed) — the single body shared by
   *  the root index and every per-post page. */
  bodyHtml: string;
  /** The same `HomeRegion` as a ReactNode (not yet rendered). The shell path
   *  nests it — PageShell's `children` — so the whole shell renders in one
   *  `renderToString`; reusing one element across the root + every post page is
   *  safe (elements are immutable descriptions). */
  homeBody: ReactNode;
  /** Server-rendered `InfoPanelRegion` — the info-panel sidebar body. */
  panelHtml: string;
  /** Per-post metadata for the SEO iteration in `prerenderPosts` (og/canonical/JSON-LD). */
  rendered: RenderedPost[];
}

/** Client's `HomeRegion.fetchPost` has no analogue at build time — the prerender
 *  embeds the build-time content directly via `contentMap`, so the SSR render
 *  never fetches. A no-op keeps the prop type satisfied. */
const NOOP_FETCH: (filename: string) => Promise<string> = () => Promise.resolve("");

function ogTagsToHtml(entries: OgTagEntry[]): string {
  return entries
    .map((e) => `<meta ${e.attr}="${e.key}" content="${escapeHtml(e.content)}">`)
    .join("\n    ");
}

// Server-render the info panel through InfoPanelRegion — the SAME component the
// client hydrates #info-panel with — so the prerendered markup matches and
// hydrateRoot reuses it. strategies is unused during SSR render (the blogroll
// fetch effect runs only on the client), so an empty Map is fine.
export function renderPanelHtml(data: InfoPanelData): string {
  return renderToString(createElement(InfoPanelRegion, { data, strategies: new Map() }));
}

interface RenderedPost {
  meta: PublishedPost;
}

// The single injection path: replace the empty `<div id="${mount}"></div>`
// PageShell mount placeholder with the SSR-rendered shell string. The template
// ships an empty mount div (the caller's contract); a function replacement
// avoids `$`-sequence interpretation in the rendered HTML.
function injectRoot(html: string, mount: string, rendered: string): string {
  const re = new RegExp(`<div id="${mount}">.*?</div>`, "s");
  const result = html.replace(re, () => `<div id="${mount}">${rendered}</div>`);
  if (result === html) throw new Error(`<div id="${mount}"> mount marker not found in template`);
  return result;
}

// The PageShell `navEnd` slot at SSR, mirroring create-blog-app's navEndNode():
// the nav-end chrome (BlogNavEnd) then the panel toggle, wrapped in a
// Fragment. Auth is never shown at prerender (showAuth=false, user=null), and
// the toggle starts closed (open=false) — both matching the client's first
// render for a non-/admin entry.
function shellNavEnd(showHomeLink: boolean, panelId: string): ReactNode {
  return createElement(
    Fragment,
    null,
    createElement(BlogNavEnd, {
      showHomeLink,
      showAuth: false,
      user: null,
      onSignIn: () => {},
      onSignOut: () => {},
    }),
    createElement(ContextPanelToggle, {
      open: false,
      controls: panelId,
      onToggle: () => {},
    }),
  );
}

function injectBeforeHead(html: string, block: string, context: string): string {
  const result = html.replace("</head>", () => `    ${block}\n  </head>`);
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

  const contentMap: Record<string, PostContent> = await renderPostContents(
    published,
    (filename) => fs.readFileSync(join(args.postDir, filename), "utf-8"),
    marked,
  );

  const rendered: RenderedPost[] = published.map((meta) => ({ meta }));
  const topPosts: PostMeta[] = rendered.map((p) => p.meta);

  // The body is the single HomeRegion render shared by every page — byte-identical
  // to the client's initial HomeRegion render (which delegates to PostFeed), so
  // the #posts/#post-{id}/#post-content-{id} ids, data-hydrated, <hr> placement,
  // and Card markup all match for hydration. The SSR render embeds build-time
  // content via contentMap and never calls fetchPost (the useEffect is client-only).
  const homeBody = createElement(HomeRegion, {
    posts: topPosts,
    contentMap,
    postLinkPrefix: "/post/",
    fetchPost: NOOP_FETCH,
  });
  const bodyHtml = renderToString(homeBody);

  const panelHtml = renderPanelHtml({ ...args.infoPanel, topPosts, postLinkPrefix: "/post/" });

  return { topPosts, bodyHtml, homeBody, panelHtml, rendered };
}

// Build-time counterpart of og-meta.ts. Generates per-post HTML files with
// OG tags, <meta name="description">, <title>, canonical link, JSON-LD
// structured data (Organization on the root, BlogPosting per post), and
// optional rel=me links, plus injects the server-rendered PageShell (nav, hero,
// blog content, info panel, footer) into the template's mount div — enabling
// crawlers to see full content without executing JS. Each post
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
    showHomeLink,
    shell,
  } = config;

  const template = fs.readFileSync(join(distDir, "index.html"), "utf-8");

  const { homeBody, topPosts, rendered } = await loadPostsForPrerender({
    seed,
    postDir,
    infoPanel,
  });

  // Render the whole ds <PageShell> (nav + hero + body + panel +
  // footer) as ONE renderToString so the prerendered HTML byte-matches the
  // single shell root the client hydrates. The panel data and home body mirror
  // create-blog-app's panelElement()/homeElement() exactly. hero is gated by
  // current === "/" — VERBATIM from the client — so only the home root carries
  // the hero. Post pages (like /post/x) and static pages (like /about) get no
  // hero. The same panel + body elements are reused for every page (matching
  // the client, which hydrates the build-time metadata feed on home and post
  // pages alike).
  const renderShellHtml = (current: string): string => {
    const panelId = shell.panelId ?? "info-panel";
    return renderToString(
      createElement(BlogPageShell, {
        wordmark: shell.wordmark,
        tagline: shell.tagline,
        navLinks,
        current,
        navEnd: shellNavEnd(showHomeLink ?? false, panelId),
        hero: current === "/" ? shell.hero : undefined,
        panelOpen: false,
        panelId,
        panelAriaLabel: shell.panelAriaLabel,
        panel: createElement(InfoPanelRegion, {
          data: { ...infoPanel, topPosts, postLinkPrefix: "/post/" },
          strategies: new Map(),
        }),
        children: homeBody,
      }),
    );
  };

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

  let rootHtml = injectRoot(template, shell.mount, renderShellHtml("/"));
  if (siteDefaults) {
    rootHtml = rootHtml.replace(/\s*<meta name="description"[^>]*>/, "");
    const rootOgTags = ogTagsToHtml(siteDefaultOgEntries(siteUrl, siteDefaults));
    rootHtml = injectBeforeHead(rootHtml, rootOgTags, "root template");
  }
  rootHtml = injectBeforeHead(rootHtml, rootSeoHead, "root template");
  fs.writeFileSync(join(distDir, "index.html"), rootHtml);
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
    html = html.replace(/<title>.*?<\/title>/, () => `<title>${escapeHtml(formatPageTitle(titleSuffix, meta.title))}</title>`);
    if (html === beforeTitle) throw new Error(`<title> tag not found in template`);

    html = injectRoot(html, shell.mount, renderShellHtml(`/post/${meta.id}`));

    const outDir = join(distDir, "post", meta.id);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(join(outDir, "index.html"), html);
    console.log(`Pre-rendered: /post/${meta.id}/index.html`);
  }
}

/** Emit a static page (e.g. `/about`) with full SEO parity to `prerenderPosts`.
 *  The page renders through the same single BlogPageShell root; the caller
 *  supplies the panel body as `aboutContent`. */
export function prerenderStaticPage(config: StaticPageConfig): void {
  const {
    siteUrl,
    titleSuffix,
    distDir,
    page,
    body,
    navLinks,
    aboutContent,
    jsonLdBlocks,
    relMe,
    showHomeLink,
    shell,
  } = config;

  const template = fs.readFileSync(join(distDir, "index.html"), "utf-8");

  const ogBlock = ogTagsToHtml(staticPageOgEntries(siteUrl, page));

  const jsonLdHtml = (jsonLdBlocks ?? [])
    .map((block) => jsonLdScriptTag(block))
    .join("\n    ");

  const seoHead = buildSeoHeadHtml([
    canonicalLinkTag(`${siteUrl}${page.url}`),
    jsonLdHtml,
    relMe && relMe.length > 0 ? relMeLinkTags(relMe) : "",
  ]);

  let html = template.replace(/\s*<meta name="description"[^>]*>/, "");

  const beforeTitle = html;
  html = html.replace(
    /<title>.*?<\/title>/,
    () => `<title>${escapeHtml(formatPageTitle(titleSuffix, page.title))}</title>`,
  );
  if (html === beforeTitle) throw new Error(`<title> tag not found in template`);

  html = injectBeforeHead(html, ogBlock, "static page template");
  html = injectBeforeHead(html, seoHead, "static page template");

  // Render the whole ds <PageShell> as ONE renderToString so the prerendered
  // HTML byte-matches the single shell root the client hydrates. A static page's
  // panel mirrors the client's panelElement() aboutContent branch
  // (infoPanelContentForPath), so `aboutContent` is required. hero is gated by
  // page.url === "/" — only the home root carries the hero; a static page like
  // /about gets no hero, matching the client's gate. children preserves the
  // <div>-wrapped body so it byte-matches the client's entry-hydration wrapper
  // createElement("div", null, node).
  if (aboutContent === undefined) {
    throw new Error("prerenderStaticPage shell mode requires aboutContent for the panel");
  }
  const panelId = shell.panelId ?? "info-panel";
  const shellHtml = renderToString(
    createElement(BlogPageShell, {
      wordmark: shell.wordmark,
      tagline: shell.tagline,
      navLinks,
      current: page.url,
      navEnd: shellNavEnd(showHomeLink ?? false, panelId),
      hero: page.url === "/" ? shell.hero : undefined,
      panelOpen: false,
      panelId,
      panelAriaLabel: shell.panelAriaLabel,
      panel: createElement(InfoPanelRegion, {
        data: { linkSections: [], topPosts: [], blogRoll: [] },
        strategies: new Map(),
        aboutContent,
      }),
      children: createElement("div", null, body),
    }),
  );
  html = injectRoot(html, shell.mount, shellHtml);

  const outDir = join(distDir, page.url);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(join(outDir, "index.html"), html);
  console.log(`Pre-rendered: ${page.url}/index.html`);
}
