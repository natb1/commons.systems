// Shared single-page-app bootstrap for the landing and fellspiral blogs. Both
// apps ship a near-identical shell — DOM lookups, the header ResizeObserver,
// nav wiring, the info-panel toggle, the click-to-top handler, the history
// router, and an auth-driven refresh. createBlogApp owns that shell; each app
// supplies its differences (build-time content, site config, firebase context)
// via CreateBlogAppConfig and never imports a `virtual:*` module here — that
// data arrives only through config.
//
// Rendering is React-owned. Three hydrateRoot roots drive pure components over
// the prerendered DOM: the nav (BlogNav), the body (#app — HomeRegion /
// AdminRegion / extra-route HTML), and the info panel (InfoPanelRegion). The
// history router stays as the navigation ENGINE — its global click handler
// intercepts the plain <a> tags the frozen components emit — but every route's
// render returns null so the router never writes to #app; React does, through
// the appRoot. All rendering and per-navigation side-effects live in dispatch().
import type { User } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

import { createElement, Fragment, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";

import type { Namespace } from "@commons-systems/firestoreutil/namespace";
import { isInGroup, type GroupId } from "@commons-systems/authutil/groups";
import { ContextPanelToggle, type NavLink } from "@commons-systems/ds";
import { createHistoryRouter, parsePath } from "@commons-systems/router";
import { classifyError } from "@commons-systems/errorutil/classify";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import { deferAppCheckInit } from "@commons-systems/firebaseutil/defer-appcheck";

import { initPanelToggle } from "@commons-systems/components/panel-toggle";

import { BlogNav, BlogNavEnd } from "./components/BlogNav.tsx";
import { BlogPageShell } from "./components/BlogPageShell.tsx";
import { HomeRegion } from "./pages/HomeRegion.tsx";
import { AdminRegion } from "./pages/AdminRegion.tsx";
import { InfoPanelRegion } from "./components/InfoPanelRegion.tsx";
import { updateOgMeta, type SiteDefaults } from "./og-meta.ts";
import { updateCanonical } from "./canonical.ts";
import { createFetchPost } from "./github.ts";
import { getPosts, type PostMeta } from "./firestore.ts";
import type { PostContent } from "./marked-config.ts";
import type { LinkSection } from "./components/info-panel.ts";
import type { BlogRollEntry, BlogRollStrategy, LatestPost } from "./blog-roll/types.ts";

/** Whether a path shows the auth controls. Single source for both nav render sites. */
const isAdminPath = (p: string): boolean => p === "/admin";

/**
 * A blog-local extra SPA route. Distinct from the shared router's `Route`: its
 * `render` returns a ReactNode (React renders it into `#app`), whereas the
 * router's `render` returns `string | null`. create-blog-app maps extraRoutes to
 * `render: () => null` for the router (so the router never writes to `#app`) and
 * invokes the real ReactNode render itself.
 */
export interface ExtraRoute {
  // Matches the shared router's `Route.path` so the extraRoutes→router mapping
  // below typechecks and the prior caller contract (landing) is preserved.
  path: `/${string}` | RegExp;
  render: (path: string) => ReactNode;
  afterRender?: (outlet: HTMLElement, path: string) => void;
}

export interface CreateBlogAppConfig {
  // build-time data (passed in; NEVER imported in blog/)
  buildTimeContent: Record<string, PostContent>;
  buildTimeMetadata: PostMeta[];
  buildTimeFeeds?: Record<string, LatestPost | null>;
  // per-app data
  fetchPostSource: string;
  siteUrl: string;
  ogTitle: string;
  siteDefaults: SiteDefaults;
  navLinks: NavLink[];
  showHomeLink: boolean;
  infoPanelLinkSections: LinkSection[];
  blogRollEntries: BlogRollEntry[];
  strategies: Map<string, BlogRollStrategy>;
  // firebase app context (per-app instances)
  firebase: {
    db: Firestore;
    namespace: Namespace;
    trackPageView: (path: string) => void;
    initAppCheck: (() => Promise<void>) | undefined;
    signIn: () => Promise<unknown> | void;
    signOut: () => Promise<unknown> | void;
    onAuthStateChanged: (
      cb: (user: User | null) => void,
    ) => (() => void) | PromiseLike<(() => void) | void>;
  };
  adminGroupId: GroupId;
  /**
   * Per-route info-panel content override. When it returns a ReactNode for the
   * current path, InfoPanelRegion renders it as the panel (via `aboutContent`)
   * instead of the standard blogroll panel; returning `undefined` yields the
   * standard panel. Landing uses this for /about.
   *
   * The returned node is rendered by React (server-side via `renderToString` at
   * prerender time, client-side via the panel root), so React escapes text and
   * no manual sanitization contract applies.
   */
  infoPanelContentForPath?: (path: string) => ReactNode;
  /**
   * Extra SPA routes beyond home / admin. Each route's `render(path)` return
   * value is a ReactNode that React renders into `#app` (server-side via
   * `renderToString` at prerender time, client-side via the app root), so React
   * escapes text and no manual sanitization contract applies.
   */
  extraRoutes?: ExtraRoute[];
  onHomeAfterRender?: (slug: string | undefined) => void;
  onNavigate?: (path: string) => void;
  useScrollIndicator?: boolean;
  rehydrateOnAppCheck?: boolean;
  /**
   * Opt-in ds-chrome seam. When present, the renderer mounts a SINGLE ds
   * `<PageShell>` root (via BlogPageShell) into `#${mount}` instead of the
   * legacy three-root (`#nav` / `#app` / `#info-panel`) + static-markup path.
   * Absent runs the legacy path VERBATIM. Both in-repo apps (landing and
   * fellspiral) now pass `shell`; the prerender side has no legacy path left.
   */
  shell?: {
    mount: string;
    wordmark: ReactNode;
    tagline?: ReactNode;
    hero?: ReactNode;
    panelId?: string;
    panelAriaLabel?: string;
  };
}

export interface BlogAppHandle {
  destroy(): void;
  /**
   * Force the React info-panel root to REMOUNT and re-fetch the blogroll. A
   * route that clobbers the info panel directly — e.g. landing's /about via an
   * aboutContent panel — may call this in its afterRender so the returning Home
   * navigation restores the standard panel AND re-runs the blogroll fetch.
   * InfoPanelRegion's blogroll-hydration effect is gated on referentially stable
   * deps (blogRoll / strategies / aboutContent), so a bare re-render would
   * reconcile without re-fetching; this bumps the React `key` to force a remount,
   * which re-runs the fetch effect from scratch.
   */
  forceInfoPanelRefresh(): void;
}

export function createBlogApp(config: CreateBlogAppConfig): BlogAppHandle {
  // The `#app` body element and the header ResizeObserver are needed by BOTH
  // render paths, but in the shell path `#app` only exists AFTER the PageShell
  // mounts, so they're resolved/created in the render-bootstrap block below.
  let app: HTMLElement;
  let headerObserver: ResizeObserver;
  // Render roots: the legacy path owns the three hydrate roots (nav/app/panel);
  // the shell path owns the single PageShell root. Each is assigned only in its
  // matching branch and read only through a mode-guarded helper.
  let navRoot: Root | undefined;
  let appRoot: Root | undefined;
  let panelRoot: Root | undefined;
  let shellRoot: Root | undefined;

  // Shared: observe the page header so the --header-height CSS var tracks its
  // box. Always targets document.documentElement (landing's behavior); the
  // shared shell unifies fellspiral's old .content-grid target onto the root.
  const observeHeader = (): ResizeObserver => {
    const headerEl = document.querySelector(".page > header");
    if (!headerEl) throw new Error(".page > header element not found");
    const obs = new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty(
        "--header-height",
        `${entry.borderBoxSize[0].blockSize}px`,
      );
    });
    obs.observe(headerEl);
    return obs;
  };

  // Teardown list: destroy() unwinds everything in one place. Declared before
  // the router/auth wiring below so those can register their teardowns.
  const teardowns: Array<() => void> = [];

  // Driver-owned state. NO useState anywhere — the Region components are pure
  // and prop-driven; the driver holds the shared state and re-renders the roots
  // when it changes. cachedPosts starts as the build-time metadata so the
  // initial hydrateRoot matches the prerendered (published-only) markup.
  let currentUser: User | null = null;
  // Tracks the path of the current navigation so panelElement() (used by both the
  // initial hydrateRoot and renderPanel()) can compute the per-route info-panel
  // override; initialized from the entry path so a deep entry like /about reflects
  // its panel content from the first render.
  let currentPath = parsePath().path;
  // The slug for a deep /post/x entry, derived from the same entry path as
  // currentPath. Used to hydrate #app with the slug-aware home element so the
  // hydrated tree already carries the right scrollSlug (HomeRegion's scroll
  // effect then fires on a deep /post/x entry without needing a re-render).
  const initialSlug = currentPath.startsWith("/post/") ? currentPath.slice(6) : undefined;
  let cachedPosts: PostMeta[] = config.buildTimeMetadata;
  let lastSkippedCount = 0;
  let postsErrorMsg: string | undefined;
  // Bumped by forceInfoPanelRefresh() / the app-check rehydrate callback to force
  // a remount of InfoPanelRegion (re-running its blogroll-fetch effect). Normal
  // renderPanel() calls keep the same key so they reconcile cheaply.
  let panelKey = 0;
  const boundFetchPost = createFetchPost(config.fetchPostSource);

  // The home/post body. Renders the posts-error message when loadPosts() failed
  // (preserving the legacy `#posts-error` UX), otherwise the HomeRegion feed.
  function homeElement(slug?: string) {
    if (postsErrorMsg !== undefined) {
      return createElement(
        Fragment,
        null,
        createElement("h2", null, "Home"),
        createElement("p", { id: "posts-error" }, postsErrorMsg),
      );
    }
    return createElement(HomeRegion, {
      posts: cachedPosts,
      contentMap: config.buildTimeContent,
      postLinkPrefix: "/post/",
      fetchPost: boundFetchPost,
      scrollSlug: slug,
    });
  }

  function navElement(path: string) {
    return createElement(BlogNav, {
      links: config.navLinks,
      showHomeLink: config.showHomeLink,
      showAuth: isAdminPath(path),
      user: currentUser,
      onSignIn: () => void config.firebase.signIn(),
      onSignOut: () => void config.firebase.signOut(),
    });
  }

  function panelElement() {
    return createElement(InfoPanelRegion, {
      key: panelKey,
      data: {
        linkSections: config.infoPanelLinkSections,
        topPosts: cachedPosts,
        blogRoll: config.blogRollEntries,
        rssFeedUrl: "/feed.xml",
        opmlUrl: "/blogroll.opml",
        postLinkPrefix: "/post/",
        buildTimeFeeds: config.buildTimeFeeds, // undefined for landing — harmless optional
      },
      strategies: config.strategies,
      useScrollIndicator: config.useScrollIndicator,
      aboutContent: config.infoPanelContentForPath?.(currentPath),
    });
  }

  // Hydrate the three roots over the prerendered DOM (before creating the
  // router, which dispatches synchronously on construction). #app is hydrated
  // with the SLUG-AWARE home element homeElement(initialSlug): per prerender.ts
  // every page embeds the full posts feed, so the home element is the right
  // hydration target for / and /post/*; passing initialSlug means HomeRegion's
  // scroll effect fires on a deep /post/x entry directly from the hydrated tree.
  // Because the first dispatch then sees slug === initialSlug, it SKIPS the
  // redundant appRoot.render (see dispatch's isHome branch) — a root.render()
  // right after hydrateRoot can make React abandon hydration and client-render,
  // causing CLS on the SEO surface.
  //
  // A deep entry to a SYNC extraRoute (e.g. landing's /about) hydrates #app with
  // that route's prerendered body, wrapped in a <div> to byte-match both
  // prerenderStaticPage's injected body and the dispatch extraRoute render below.
  // Without this, #app would hydrate the home feed over the prerendered About
  // body and the first dispatch's appRoot.render would fire mid-hydration,
  // abandoning the prerendered DOM (#424) and shifting layout on the SEO surface.
  // An ASYNC extraRoute render cannot feed a synchronous hydrate, so it falls
  // back to homeElement (the prior behavior; that path keeps the immediate
  // dispatch reconcile). panelElement() reads its aboutContent from
  // infoPanelContentForPath(currentPath), so a deep /about entry hydrates the
  // panel with the About content directly.
  const entryExtraRoute = matchExtraRoute(currentPath);
  const entryExtraNode = entryExtraRoute?.render(currentPath);
  // A synchronous render returns a usable ReactNode now; an async render returns
  // a Promise (ReactNode includes Promise in React 19) which cannot feed a
  // synchronous hydrate. Hydrate the extra-route body only when the node is
  // defined AND not a Promise; otherwise fall back to homeElement (the prior
  // async/no-match path, which keeps the immediate dispatch reconcile).
  const hydratedExtraRoute =
    entryExtraNode !== undefined && !(entryExtraNode instanceof Promise);
  // The entry-route body, used to hydrate #app (legacy) or seed the PageShell
  // body (shell). Identical derivation in both paths.
  const initialAppBody: ReactNode = hydratedExtraRoute
    ? createElement("div", null, entryExtraNode)
    : homeElement(initialSlug);

  // ── Shell-path state (used only when config.shell is present) ──────────────
  const isShell = config.shell !== undefined;
  // Panel open/close lives in plain closure state and drives React re-renders;
  // initPanelToggle's imperative className writes would be clobbered by a
  // PageShell re-render, so the shell path reimplements the toggle in React.
  let panelOpen = false;
  const panelId = config.shell?.panelId ?? "info-panel";
  // The latest body node, so a panel toggle / auth change can re-render the
  // single shell root reusing the current body (the shell tree carries nav,
  // panel, and body together, unlike the legacy three independent roots).
  let currentAppBody: ReactNode = initialAppBody;

  // Home-route predicate, shared by dispatch and the shell hero gate.
  const isHomePath = (path: string): boolean => path === "/" || path.startsWith("/post/");

  // The PageShell nav `end` slot: the legacy nav-end chrome (home link + auth
  // control), then the React panel toggle. Recomputed per render so it tracks
  // panelOpen / currentUser / currentPath.
  const togglePanel = (): void => {
    panelOpen = !panelOpen;
    renderShell(currentAppBody);
  };
  const navEndNode = (): ReactNode =>
    createElement(
      Fragment,
      null,
      createElement(BlogNavEnd, {
        showHomeLink: config.showHomeLink,
        showAuth: isAdminPath(currentPath),
        user: currentUser,
        onSignIn: () => void config.firebase.signIn(),
        onSignOut: () => void config.firebase.signOut(),
      }),
      createElement(ContextPanelToggle, {
        open: panelOpen,
        controls: panelId,
        onToggle: togglePanel,
      }),
    );

  // The single ds PageShell tree for a given body. hero shows only on home.
  const shellElement = (appBody: ReactNode): ReactNode =>
    createElement(BlogPageShell, {
      wordmark: config.shell!.wordmark, // type-safety-ok: shellElement is only called in shell mode
      tagline: config.shell!.tagline, // type-safety-ok: shellElement is only called in shell mode
      navLinks: config.navLinks,
      current: currentPath,
      navEnd: navEndNode(),
      hero: currentPath === "/" ? config.shell!.hero : undefined, // type-safety-ok: shellElement is only called in shell mode
      panelOpen,
      panelId,
      panelAriaLabel: config.shell!.panelAriaLabel, // type-safety-ok: shellElement is only called in shell mode
      panel: panelElement(),
      children: appBody,
    });
  // Re-render the single shell root, tracking the latest body for toggle/auth
  // re-renders. The mode guard guarantees shellRoot is assigned here.
  function renderShell(appBody: ReactNode): void {
    currentAppBody = appBody;
    shellRoot!.render(shellElement(appBody)); // type-safety-ok: shellRoot assigned in the config.shell branch; renderShell runs only in shell mode
  }

  // ── Render bootstrap: shell (single ds PageShell root) vs legacy three-root.
  if (config.shell) {
    // The router constructs synchronously over #app, so #app must exist first.
    // Branch on content presence (NOT env): a prerendered/scaffolded PageShell
    // stays on the hydrate path; a dev-empty mount commits synchronously via
    // flushSync (createRoot().render() is otherwise async and #app would not
    // exist when the router constructs).
    const rootEl = document.getElementById(config.shell.mount);
    if (!rootEl) throw new Error(`#${config.shell.mount} element not found`);
    const tree = shellElement(initialAppBody);
    if (rootEl.childElementCount > 0) {
      shellRoot = hydrateRoot(rootEl, tree);
    } else {
      shellRoot = createRoot(rootEl);
      flushSync(() => shellRoot!.render(tree)); // type-safety-ok: shellRoot assigned two lines above in this block
    }
    teardowns.push(() => shellRoot!.unmount()); // type-safety-ok: shellRoot assigned in this block

    // Now that PageShell has committed, #app and the header exist.
    const appEl = document.getElementById("app");
    if (!appEl) throw new Error("#app element not found");
    app = appEl;
    headerObserver = observeHeader();

    // Panel close behavior ported from components/panel-toggle.ts: Escape and
    // outside-click set panelOpen=false and re-render (no imperative DOM writes
    // that React would clobber). Removers registered in teardowns for destroy().
    const onShellKeydown = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && panelOpen) {
        panelOpen = false;
        renderShell(currentAppBody);
      }
    };
    const onShellOutsideClick = (e: MouseEvent): void => {
      if (!panelOpen) return;
      const target = e.target as HTMLElement; // type-safety-ok: document click handler target is always an HTMLElement
      const panelEl = document.getElementById(panelId);
      if (panelEl?.contains(target)) return;
      if (target.closest(".panel-toggle")) return;
      panelOpen = false;
      renderShell(currentAppBody);
    };
    document.addEventListener("keydown", onShellKeydown);
    document.addEventListener("click", onShellOutsideClick);
    teardowns.push(() => document.removeEventListener("keydown", onShellKeydown));
    teardowns.push(() => document.removeEventListener("click", onShellOutsideClick));
  } else {
    // Legacy three-root path — VERBATIM behavior (order + error messages).
    const navMount = document.getElementById("nav");
    if (!navMount) throw new Error("#nav element not found");
    const appEl = document.getElementById("app");
    if (!appEl) throw new Error("#app element not found");
    app = appEl;
    const infoPanel = document.getElementById("info-panel");
    if (!infoPanel) throw new Error("#info-panel element not found");

    headerObserver = observeHeader();

    const toggle = document.getElementById("panel-toggle");
    if (!toggle) throw new Error("#panel-toggle element not found");
    initPanelToggle(infoPanel, toggle);

    // Hydrate the three roots over the prerendered DOM (before creating the
    // router, which dispatches synchronously on construction).
    navRoot = hydrateRoot(navMount, navElement(parsePath().path));
    appRoot = hydrateRoot(app, initialAppBody);
    panelRoot = hydrateRoot(infoPanel, panelElement());
    teardowns.push(() => navRoot!.unmount()); // type-safety-ok: navRoot assigned in this else branch
    teardowns.push(() => appRoot!.unmount()); // type-safety-ok: appRoot assigned in this else branch
    teardowns.push(() => panelRoot!.unmount()); // type-safety-ok: panelRoot assigned in this else branch
  }

  const renderNav = (path: string): void => {
    navRoot!.render(navElement(path)); // type-safety-ok: navRoot assigned in legacy branch; renderNav only called when !isShell
  };
  const renderPanel = (): void => {
    panelRoot!.render(panelElement()); // type-safety-ok: panelRoot assigned in legacy branch; renderPanel only called when !isShell
  };
  // Unified body render: shell collapses nav+panel+body into one root; legacy
  // renders the body root.
  const renderBody = (appBody: ReactNode): void => {
    if (isShell) renderShell(appBody);
    else appRoot!.render(appBody); // type-safety-ok: appRoot assigned in legacy branch; renderBody legacy path only when !isShell
  };
  // Force InfoPanelRegion to REMOUNT (bumped panelKey re-runs its blogroll
  // fetch). Shell: re-render the single root reusing the current body; legacy:
  // re-render the panel root.
  const rerenderPanelRegion = (): void => {
    panelKey++;
    if (isShell) renderShell(currentAppBody);
    else renderPanel();
  };

  // Load posts into the driver state (no longer returns HTML — React renders).
  // Signed out: the build-time metadata. Signed in: firestore (draft-inclusive).
  async function loadPosts(): Promise<void> {
    if (currentUser === null) {
      cachedPosts = config.buildTimeMetadata;
      lastSkippedCount = 0;
      postsErrorMsg = undefined;
      return;
    }

    try {
      const result = await getPosts(config.firebase.db, config.firebase.namespace, currentUser);
      cachedPosts = result.posts;
      lastSkippedCount = result.skippedCount;
      postsErrorMsg = undefined;
    } catch (error) {
      const kind = classifyError(error);
      const fallbackMsg = "Could not load posts. Try refreshing the page.";
      if (kind === "programmer") {
        deferProgrammerError(error);
        postsErrorMsg = fallbackMsg;
      } else {
        logError(error, { operation: "load-posts" });
        postsErrorMsg = kind === "permission-denied" ? "Permission denied loading posts." : fallbackMsg;
      }
    }
  }

  // Match the extra-route predicate createHistoryRouter's matchRoute uses: a
  // string path matches by exact equality, a RegExp by `.test`.
  function matchExtraRoute(path: string): ExtraRoute | undefined {
    return (config.extraRoutes ?? []).find((r) => {
      if (typeof r.path === "string") return r.path === path;
      r.path.lastIndex = 0;
      return r.path.test(path);
    });
  }

  // Single body-rendering + side-effect function. createHistoryRouter calls its
  // onNavigate synchronously, before route matching, on every navigation; we do
  // all React rendering and nav side-effects here, with a driver-level
  // staleness guard for async branches.
  let navSeq = 0;
  let firstDispatch = true;
  async function dispatch(path: string): Promise<void> {
    currentPath = path;
    const seq = ++navSeq;
    const isFirstDispatch = firstDispatch;
    firstDispatch = false;

    // Per-nav side-effects (every navigation), matching the old updateNav +
    // router-onNavigate behavior.
    //
    // On the very first dispatch, the three hydrateRoot calls above already
    // rendered nav (navElement(parsePath().path)), app (homeElement(initialSlug)),
    // and panel (panelElement() reading the entry path) for the entry path — the
    // same output the first dispatch would re-render. Calling root.render() here
    // would be redundant AND harmful: a root.render() mid-hydration can make React
    // abandon the prerendered server DOM and client-render the whole root, producing
    // a recoverable hydration error (#424) and CLS on the SEO surface. Skip all
    // three root.render() calls on the first dispatch; hydrateRoot already committed
    // the correct initial tree. Analytics and body-dataset side-effects still run
    // unconditionally (see onNavigate / trackPageView below).
    // Shell path: nav + panel + body are ONE root, re-rendered together at the
    // body-render point below via renderBody; the separate top-of-dispatch
    // nav/panel renders are legacy-only.
    if (!isShell && !isFirstDispatch) renderNav(path); // first dispatch: nav already hydrated for entry path
    config.onNavigate?.(path); // landing sets document.body.dataset.route; fellspiral omits
    config.firebase.trackPageView(path);
    // Centralized panel render: one per navigation, so entering/leaving a route
    // with an infoPanelContentForPath override (landing's /about) toggles
    // aboutContent. The blogroll effect's stable deps mean a same-path home→home
    // nav does NOT re-fetch; only an aboutContent toggle re-runs it.
    if (!isShell && !isFirstDispatch) renderPanel(); // first dispatch: panel already hydrated for entry path

    const isHome = isHomePath(path);
    if (isHome) {
      const slug = path.startsWith("/post/") ? path.slice(6) : undefined;
      // First dispatch: #app is already hydrated with homeElement(initialSlug) —
      // same as all three roots above, skip to avoid redundant root.render().
      if (!isFirstDispatch) renderBody(homeElement(slug));
      // SEO + home hooks (old homeRoute.afterRender).
      config.onHomeAfterRender?.(slug);
      updateOgMeta(
        config.siteUrl,
        slug ? cachedPosts.find((p) => p.id === slug) : undefined,
        config.ogTitle,
        config.siteDefaults,
      );
      updateCanonical(config.siteUrl, slug);
      return;
    }

    if (path === "/admin") {
      try {
        const admin = await isInGroup(
          config.firebase.db,
          config.firebase.namespace,
          currentUser,
          config.adminGroupId,
        );
        if (seq === navSeq) {
          renderBody(
            createElement(AdminRegion, {
              user: currentUser,
              isAdmin: admin,
              skippedCount: lastSkippedCount,
            }),
          );
        }
      } catch (error) {
        if (!deferProgrammerError(error)) logError(error, { operation: "admin-group-check" });
        if (seq === navSeq) {
          renderBody(
            createElement(
              Fragment,
              null,
              createElement("h2", null, "Admin"),
              createElement("p", null, "Could not verify admin access. Try refreshing the page."),
            ),
          );
        }
      }
      return;
    }

    const extra = matchExtraRoute(path);
    if (extra) {
      // First dispatch after #app was hydrated with this sync extraRoute's body:
      // the prerendered DOM already matches, so skip the appRoot.render that would
      // fire mid-hydration and abandon it (#424). Still run afterRender for its
      // SEO/meta side-effects. SPA navigations (not first dispatch) render normally.
      if (isFirstDispatch && hydratedExtraRoute) {
        queueMicrotask(() => {
          if (seq === navSeq) extra.afterRender?.(app, path);
        });
        return;
      }
      try {
        const node = await extra.render(path);
        if (seq === navSeq) {
          renderBody(createElement("div", null, node));
          // Run afterRender after React commits the body.
          queueMicrotask(() => {
            if (seq === navSeq) extra.afterRender?.(app, path);
          });
        }
      } catch (error) {
        if (!deferProgrammerError(error)) logError(error, { operation: "router-render" });
      }
      return;
    }

    // No match — createHistoryRouter falls back to route[0] (the home regex),
    // so treat an unmatched path as home for parity.
    renderBody(homeElement());
  }

  const router = createHistoryRouter(
    app,
    [
      { path: /^\/(?:post\/.*)?$/, render: () => null },
      ...(config.extraRoutes ?? []).map((r) => ({ path: r.path, render: () => null })),
      { path: "/admin", render: () => null },
    ],
    {
      onNavigate: ({ path }) => {
        void dispatch(path);
      },
    },
  );
  teardowns.push(() => router.destroy());

  async function refreshAfterAuthChange(): Promise<void> {
    const { path } = parsePath();
    currentPath = path;
    // Shell: nav + panel are part of the single root re-rendered by the
    // router.navigate() re-dispatch below, so skip the legacy-only eager
    // nav/panel renders.
    if (!isShell) renderNav(path);
    if (currentUser !== null) {
      await loadPosts(); // sign-in: fetch firestore posts (incl. drafts)
    } else {
      cachedPosts = config.buildTimeMetadata;
      lastSkippedCount = 0;
      postsErrorMsg = undefined;
    }
    router.navigate(); // re-dispatch → re-renders body (home shows new posts; admin re-checks)
    if (!isShell) renderPanel(); // re-render panel with new cachedPosts
  }

  // Capture the auth-state unsubscribe so destroy() can tear it down; without
  // this an auth event can still fire refreshAfterAuthChange on a destroyed
  // instance. Production passes firebaseutil's async wrapper resolving to the
  // unsubscribe (Promise<() => void>), so we handle both a sync function return
  // and a promise resolving to one, with a guard for the destroy-before-resolve
  // race. The teardown is registered before the call so a synchronous capture
  // and the race guard share the same closure state.
  let authUnsub: (() => void) | undefined;
  let authDestroyed = false;
  teardowns.push(() => {
    authDestroyed = true;
    authUnsub?.();
  });

  const captureUnsub = (unsub: (() => void) | void): void => {
    if (typeof unsub !== "function") return;
    // destroy() may have run before an async unsubscribe resolved.
    if (authDestroyed) unsub();
    else authUnsub = unsub;
  };

  const authResult = config.firebase.onAuthStateChanged((user) => {
    if (user?.uid === currentUser?.uid) return;
    currentUser = user;
    // Intentional silent degradation — user sees stale content rather than an error.
    refreshAfterAuthChange().catch((err) => {
      if (deferProgrammerError(err)) return;
      logError(err, { operation: "auth-change-refresh" });
    });
  });

  if (typeof authResult === "function") {
    captureUnsub(authResult);
  } else {
    authResult.then(captureUnsub, (err) => {
      if (deferProgrammerError(err)) return;
      logError(err, { operation: "auth-init" });
    });
  }

  // Re-fetch the blogroll once app-check is ready. InfoPanelRegion's
  // blogroll-hydration effect is gated on referentially stable deps (blogRoll /
  // strategies / aboutContent), so a bare renderPanel() would NOT re-fetch. We
  // bump panelKey before re-rendering to force a REMOUNT, re-running the fetch
  // effect from scratch — restoring the old hydrateInfoPanel(...)-on-appcheck
  // behavior so an app whose initial fetch was app-check-blocked recovers.
  deferAppCheckInit(
    config.firebase.initAppCheck,
    config.rehydrateOnAppCheck ? rerenderPanelRegion : undefined,
  );

  // Click-to-top: a named handler so destroy() can remove it.
  const onDocumentClick = (e: MouseEvent): void => {
    const target = e.target as HTMLElement;
    if (target.closest('a[href="/"]')) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  document.addEventListener("click", onDocumentClick);

  return {
    destroy(): void {
      headerObserver.disconnect();
      document.removeEventListener("click", onDocumentClick);
      // Teardowns: router.destroy(), the three root unmounts (InfoPanelRegion's
      // scroll-indicator/blogroll effect cleanups run on panelRoot.unmount), and
      // the auth unsubscribe (guarded by authDestroyed).
      for (const teardown of teardowns) teardown();
    },
    forceInfoPanelRefresh(): void {
      rerenderPanelRegion();
    },
  };
}
