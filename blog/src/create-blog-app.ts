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

import { createElement, Fragment } from "react";
import { hydrateRoot } from "react-dom/client";

import type { Namespace } from "@commons-systems/firestoreutil/namespace";
import { isInGroup, type GroupId } from "@commons-systems/authutil/groups";
import type { NavLink } from "@commons-systems/ds";
import { createHistoryRouter, parsePath, type Route } from "@commons-systems/router";
import { classifyError } from "@commons-systems/errorutil/classify";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import { deferAppCheckInit } from "@commons-systems/firebaseutil/defer-appcheck";

import { initPanelToggle } from "@commons-systems/components/panel-toggle";

import { BlogNav } from "./components/BlogNav.tsx";
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
  /** Per-route info-panel content override (raw, pre-sanitized HTML). When it returns a string for the current path, InfoPanelRegion renders it as the panel (via aboutContent) instead of the standard blogroll panel; returning undefined yields the standard panel. Landing uses this for /about. */
  infoPanelContentForPath?: (path: string) => string | undefined;
  // optional hooks (consumed in units 2/3)
  extraRoutes?: Route[];
  onHomeAfterRender?: (slug: string | undefined) => void;
  onNavigate?: (path: string) => void;
  useScrollIndicator?: boolean;
  rehydrateOnAppCheck?: boolean;
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
  const navMount = document.getElementById("nav");
  if (!navMount) throw new Error("#nav element not found");
  const appEl = document.getElementById("app");
  if (!appEl) throw new Error("#app element not found");
  const app: HTMLElement = appEl;
  const infoPanel = document.getElementById("info-panel");
  if (!infoPanel) throw new Error("#info-panel element not found");

  const header = document.querySelector(".page > header");
  if (!header) throw new Error(".page > header element not found");
  // Drift fix: always target document.documentElement (landing's behavior).
  // fellspiral set --header-height on .content-grid; the shared shell unifies
  // on the root element.
  const headerObserver = new ResizeObserver(([entry]) => {
    document.documentElement.style.setProperty(
      "--header-height",
      `${entry.borderBoxSize[0].blockSize}px`,
    );
  });
  headerObserver.observe(header);

  const toggle = document.getElementById("panel-toggle");
  if (!toggle) throw new Error("#panel-toggle element not found");
  initPanelToggle(infoPanel, toggle);

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
      showAuth: path === "/admin",
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
  const entryExtraHtml = entryExtraRoute?.render(currentPath);
  const hydratedExtraRoute = typeof entryExtraHtml === "string";
  const navRoot = hydrateRoot(navMount, navElement(parsePath().path));
  const appRoot = hydrateRoot(
    app,
    typeof entryExtraHtml === "string"
      ? createElement("div", { dangerouslySetInnerHTML: { __html: entryExtraHtml } })
      : homeElement(initialSlug),
  );
  const panelRoot = hydrateRoot(infoPanel, panelElement());
  teardowns.push(() => navRoot.unmount());
  teardowns.push(() => appRoot.unmount());
  teardowns.push(() => panelRoot.unmount());

  const renderNav = (path: string): void => {
    navRoot.render(navElement(path));
  };
  const renderPanel = (): void => {
    panelRoot.render(panelElement());
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
  function matchExtraRoute(path: string): Route | undefined {
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
    if (!isFirstDispatch) renderNav(path); // first dispatch: nav already hydrated for entry path
    config.onNavigate?.(path); // landing sets document.body.dataset.route; fellspiral omits
    config.firebase.trackPageView(path);
    // Centralized panel render: one per navigation, so entering/leaving a route
    // with an infoPanelContentForPath override (landing's /about) toggles
    // aboutContent. The blogroll effect's stable deps mean a same-path home→home
    // nav does NOT re-fetch; only an aboutContent toggle re-runs it.
    if (!isFirstDispatch) renderPanel(); // first dispatch: panel already hydrated for entry path

    const isHome = path === "/" || path.startsWith("/post/");
    if (isHome) {
      const slug = path.startsWith("/post/") ? path.slice(6) : undefined;
      // First dispatch: #app is already hydrated with homeElement(initialSlug) —
      // same as all three roots above, skip to avoid redundant root.render().
      if (!isFirstDispatch) appRoot.render(homeElement(slug));
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
          appRoot.render(
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
          appRoot.render(
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
        const html = await extra.render(path);
        if (seq === navSeq) {
          appRoot.render(createElement("div", { dangerouslySetInnerHTML: { __html: html ?? "" } }));
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
    appRoot.render(homeElement());
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
    renderNav(path);
    if (currentUser !== null) {
      await loadPosts(); // sign-in: fetch firestore posts (incl. drafts)
    } else {
      cachedPosts = config.buildTimeMetadata;
      lastSkippedCount = 0;
      postsErrorMsg = undefined;
    }
    router.navigate(); // re-dispatch → re-renders body (home shows new posts; admin re-checks)
    // router.navigate() only loads posts on the home route; re-fetch on /admin
    // so the info panel populates even when not on home.
    if (path === "/admin") {
      await loadPosts();
    }
    renderPanel(); // re-render panel with new cachedPosts
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
    config.rehydrateOnAppCheck
      ? () => {
          panelKey++;
          renderPanel();
        }
      : undefined,
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
      panelKey++;
      renderPanel();
    },
  };
}
