import * as fs from "node:fs";
import { join } from "node:path";
import { createElement, Fragment, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { escapeHtml } from "@commons-systems/htmlutil";
import type { SeedSpec } from "@commons-systems/firestoreutil/seed";
import { ContextPanelToggle } from "@commons-systems/ds";
import { BlogNav, BlogNavEnd } from "./components/BlogNav.tsx";
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

/** Opt-in ds-chrome seam — the SSR/prerender counterpart of create-blog-app's
 *  client `shell` config. When present, prerender renders a SINGLE ds
 *  `<PageShell>` root (via BlogPageShell) into `#${mount}` instead of the legacy
 *  `#nav` / `#app` / `#info-panel` + static-markup injectors, so the prerendered
 *  HTML byte-matches what the client hydrates. Absent (fellspiral) keeps the
 *  legacy regex-injection path verbatim. Mirrors the client `shell` shape in
 *  create-blog-app.ts. */
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
  /** When provided, also set `homeExtraHtml` so JSON-LD apps have a visual representation on the page. */
  softwareApplications?: SoftwareApplication[];
  /** Replaces the `<section class="landing-hero">` block when rendering the root page.
   *  When set, per-post pages also strip the `landing-hero` section.
   *  Throws if the marker is absent from the template. */
  homeExtraHtml?: string;
  /** Whether to include the `commons.systems` home link in the prerendered nav.
   *  Defaults to `false`. */
  showHomeLink?: boolean;
  /** When provided, inject this HTML into the template's `<footer></footer>`
   *  element (root index + every post page). Throws if the `<footer>` marker is
   *  absent. */
  footerHtml?: string;
  /** Opt-in ds-chrome seam — see PrerenderShellConfig. When set, the root index
   *  and every post page render through BlogPageShell into `#${mount}`; the
   *  legacy `injectMain`/`injectInfoPanel`/`injectNav`/`injectFooter`/
   *  `injectHomeExtra`/`stripHomeExtra` injectors are skipped (the shell already
   *  carries nav, panel, hero, and footer). The `<head>` SEO injectors run
   *  regardless. */
  shell?: PrerenderShellConfig;
}

export interface StaticPageConfig {
  siteUrl: string;
  titleSuffix: string;
  distDir: string;
  /** Page metadata; `page.url` is also the output path (e.g. "/about" — leading
   *  slash required, no trailing slash). */
  page: StaticPageMeta;
  /** A ReactNode server-rendered (wrapped in a `<div>`) into `<main id="app">`,
   *  byte-matching the client's `createElement("div", null, node)` entry-hydration
   *  wrapper in create-blog-app.ts so `#app` hydrates without a mismatch. */
  body: ReactNode;
  navLinks: NavLink[];
  /** Pre-rendered info panel HTML — produced by `loadPostsForPrerender`.
   *  Used only when `aboutContent` is not set; ignored otherwise. */
  panelHtml?: string;
  /** A ReactNode for an About-style panel. When set, the panel is
   *  server-rendered through `InfoPanelRegion` (matching the client's
   *  `panelElement()` aboutContent branch) instead of using `panelHtml`, so the
   *  prerendered `#info-panel` hydrates without a mismatch. */
  aboutContent?: ReactNode;
  jsonLdBlocks?: Record<string, unknown>[];
  relMe?: string[];
  /** Defaults to true. Set false to keep the landing-hero block in this static page. */
  stripHero?: boolean;
  /** Whether to include the `commons.systems` home link in the prerendered nav.
   *  Defaults to `false`. */
  showHomeLink?: boolean;
  /** When provided, inject this HTML into the template's `<footer></footer>`
   *  element. Throws if the `<footer>` marker is absent. */
  footerHtml?: string;
  /** Opt-in ds-chrome seam — see PrerenderShellConfig. When set, the page renders
   *  through BlogPageShell into `#${mount}`; the legacy injectors and
   *  `stripHomeExtra` are skipped (the shell carries nav, panel, and footer).
   *  Shell mode requires `aboutContent` (the panel ReactNode) — the client
   *  hydrates a static page's panel from `infoPanelContentForPath`. The `<head>`
   *  SEO injectors run regardless. */
  shell?: PrerenderShellConfig;
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

// Render the nav anonymously (showAuth=false, user=null) so no stray "Login"
// control leaks into the static HTML. showHomeLink comes from the caller's
// config and defaults to false. renderToString (not renderToStaticMarkup) so the
// prerendered nav carries the hydration markers `hydrateRoot` reuses.
function renderNavHtml(links: NavLink[], showHomeLink: boolean = false): string {
  return renderToString(
    createElement(BlogNav, {
      links,
      showHomeLink,
      showAuth: false,
      user: null,
      onSignIn: () => {},
      onSignOut: () => {},
    }),
  );
}

// Server-render the info panel through InfoPanelRegion — the SAME component the
// client hydrates #info-panel with — so the prerendered markup matches and
// hydrateRoot reuses it. strategies is unused during SSR render (the blogroll
// fetch effect runs only on the client), so an empty Map is fine. When
// aboutContent is set, InfoPanelRegion ignores `data` and renders the About
// ReactNode (matching the client's panelElement() aboutContent branch).
export function renderPanelHtml(data: InfoPanelData, aboutContent?: ReactNode): string {
  return renderToString(
    createElement(InfoPanelRegion, { data, strategies: new Map(), aboutContent }),
  );
}

interface RenderedPost {
  meta: PublishedPost;
}

function injectMain(html: string, innerHtml: string): string {
  const result = html.replace(
    /<main id="app">.*?<\/main>/s,
    () => `<main id="app">${innerHtml}</main>`,
  );
  if (result === html) throw new Error('<main id="app"> marker not found in template');
  return result;
}

// Shell-path counterpart of injectMain: replace the empty
// `<div id="${mount}"></div>` PageShell mount placeholder with the SSR-rendered
// shell string. The template ships an empty mount div (the Unit-5 caller's
// contract); a function replacement avoids `$`-sequence interpretation in the
// rendered HTML.
function injectRoot(html: string, mount: string, rendered: string): string {
  const re = new RegExp(`<div id="${mount}">.*?</div>`, "s");
  const result = html.replace(re, () => `<div id="${mount}">${rendered}</div>`);
  if (result === html) throw new Error(`<div id="${mount}"> mount marker not found in template`);
  return result;
}

// The PageShell `navEnd` slot at SSR, mirroring create-blog-app's navEndNode():
// the legacy nav-end chrome (BlogNavEnd) then the panel toggle, wrapped in a
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

function injectInfoPanel(html: string, panelHtml: string): string {
  const result = html.replace(
    /<aside id="info-panel" class="sidebar">.*?<\/aside>/s,
    () => `<aside id="info-panel" class="sidebar">${panelHtml}</aside>`,
  );
  if (result === html) throw new Error('<aside id="info-panel"> marker not found in template');
  return result;
}

function injectNav(html: string, navHtml: string): string {
  const result = html.replace(
    /<app-nav id="nav">.*?<\/app-nav>/s,
    () => `<app-nav id="nav">${navHtml}</app-nav>`,
  );
  if (result === html) throw new Error('<app-nav id="nav"> marker not found in template');
  return result;
}

function injectFooter(html: string, footerHtml: string): string {
  const result = html.replace(
    /<footer[^>]*>.*?<\/footer>/s,
    () => `<footer>${footerHtml}</footer>`,
  );
  if (result === html) throw new Error('<footer> marker not found in template');
  return result;
}

function injectHomeExtra(html: string, extraHtml: string): string {
  const result = html.replace(
    /<section class="landing-hero"[^>]*>.*?<\/section>/s,
    () => extraHtml,
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
    showHomeLink,
    footerHtml,
    shell,
  } = config;

  const template = fs.readFileSync(join(distDir, "index.html"), "utf-8");

  const { panelHtml, bodyHtml, homeBody, topPosts, rendered } = await loadPostsForPrerender({
    seed,
    postDir,
    infoPanel,
  });

  const navHtml = renderNavHtml(navLinks, showHomeLink);

  // Shell path: render the whole ds <PageShell> (nav + hero + body + panel +
  // footer) as ONE renderToString so the prerendered HTML byte-matches the
  // single shell root the client hydrates. The panel data and home body mirror
  // create-blog-app's panelElement()/homeElement() exactly. hero is gated by
  // current === "/" — VERBATIM from the client — so only the home root carries
  // the hero. Post pages (like /post/x) and static pages (like /about) get no
  // hero. The same panel + body elements are reused for every page (matching
  // the client, which hydrates the build-time metadata feed on home and post
  // pages alike).
  const renderShellHtml = (current: string): string => {
    const panelId = shell!.panelId ?? "info-panel"; // type-safety-ok: renderShellHtml is only called inside if (shell) guards
    return renderToString(
      createElement(BlogPageShell, {
        wordmark: shell!.wordmark, // type-safety-ok: renderShellHtml is only called inside if (shell) guards
        tagline: shell!.tagline, // type-safety-ok: renderShellHtml is only called inside if (shell) guards
        navLinks,
        current,
        navEnd: shellNavEnd(showHomeLink ?? false, panelId),
        hero: current === "/" ? shell!.hero : undefined, // type-safety-ok: renderShellHtml is only called inside if (shell) guards
        panelOpen: false,
        panelId,
        panelAriaLabel: shell!.panelAriaLabel, // type-safety-ok: renderShellHtml is only called inside if (shell) guards
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

  let rootHtml: string;
  if (shell) {
    rootHtml = injectRoot(template, shell.mount, renderShellHtml("/"));
  } else {
    rootHtml = injectMain(template, bodyHtml);
    rootHtml = injectInfoPanel(rootHtml, panelHtml);
    rootHtml = injectNav(rootHtml, navHtml);
    if (footerHtml !== undefined) {
      rootHtml = injectFooter(rootHtml, footerHtml);
    }
    if (homeExtraHtml !== undefined) {
      rootHtml = injectHomeExtra(rootHtml, homeExtraHtml);
    }
  }
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

    if (shell) {
      html = injectRoot(html, shell.mount, renderShellHtml(`/post/${meta.id}`));
    } else {
      html = injectMain(html, bodyHtml);
      html = injectInfoPanel(html, panelHtml);
      html = injectNav(html, navHtml);
      if (footerHtml !== undefined) {
        html = injectFooter(html, footerHtml);
      }
      if (homeExtraHtml !== undefined) {
        html = stripHomeExtra(html);
      }
    }

    const outDir = join(distDir, "post", meta.id);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(join(outDir, "index.html"), html);
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
    page,
    body,
    navLinks,
    panelHtml,
    aboutContent,
    jsonLdBlocks,
    relMe,
    stripHero,
    showHomeLink,
    footerHtml,
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

  if (shell) {
    // Shell path: render the whole ds <PageShell> as ONE renderToString so the
    // prerendered HTML byte-matches the single shell root the client hydrates.
    // A static page's panel mirrors the client's panelElement() aboutContent
    // branch (infoPanelContentForPath), so shell mode requires `aboutContent`.
    // hero is gated by page.url === "/" — only the home root carries the hero;
    // a static page like /about gets no hero, matching the client's gate and the
    // legacy prerender. children
    // preserves the existing <div>-wrapped body so it byte-matches the client's
    // entry-hydration wrapper createElement("div", null, node).
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
  } else {
    // When aboutContent is set, server-render the panel through InfoPanelRegion's
    // aboutContent branch — matching the client's panelElement(), which hydrates
    // #info-panel with InfoPanelRegion(aboutContent=…) on a deep /about entry. The
    // data object is ignored in that branch, so a minimal one suffices. Otherwise
    // fall back to the caller-supplied pre-rendered panelHtml.
    let renderedPanel: string;
    if (aboutContent !== undefined) {
      renderedPanel = renderPanelHtml({ linkSections: [], topPosts: [], blogRoll: [] }, aboutContent);
    } else if (panelHtml !== undefined) {
      renderedPanel = panelHtml;
    } else {
      throw new Error("prerenderStaticPage requires either aboutContent or panelHtml");
    }

    // Server-render the body wrapped in a <div> so it byte-matches the client's
    // entry-hydration wrapper createElement("div", null, node) in create-blog-app.ts.
    const bodyHtml = renderToString(createElement("div", null, body));
    html = injectMain(html, bodyHtml);
    html = injectInfoPanel(html, renderedPanel);
    html = injectNav(html, renderNavHtml(navLinks, showHomeLink));
    if (footerHtml !== undefined) {
      html = injectFooter(html, footerHtml);
    }

    if (stripHero !== false) {
      html = stripHomeExtra(html);
    }
  }

  const outDir = join(distDir, page.url);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(join(outDir, "index.html"), html);
  console.log(`Pre-rendered: ${page.url}/index.html`);
}
