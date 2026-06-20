// Shared single-page-app bootstrap for the landing and fellspiral blogs. Both
// apps ship a near-identical shell — DOM lookups, the header ResizeObserver,
// nav wiring, the info-panel toggle, the click-to-top handler, the history
// router, and an auth-driven refresh. createBlogApp owns that shell; each app
// supplies its differences (build-time content, site config, firebase context)
// via CreateBlogAppConfig and never imports a `virtual:*` module here — that
// data arrives only through config.
import type { User } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

import { createElement } from "react";
import { createRoot } from "react-dom/client";

import type { Namespace } from "@commons-systems/firestoreutil/namespace";
import { isInGroup, type GroupId } from "@commons-systems/authutil/groups";
import type { NavLink } from "@commons-systems/ds";
import { createHistoryRouter, parsePath, type Route } from "@commons-systems/router";
import { classifyError } from "@commons-systems/errorutil/classify";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import { deferAppCheckInit } from "@commons-systems/firebaseutil/defer-appcheck";
import { initScrollIndicator } from "@commons-systems/components/scroll-indicator";

import { initPanelToggle } from "@commons-systems/components/panel-toggle";

import { BlogNav } from "./components/BlogNav.tsx";
import { updateOgMeta, type SiteDefaults } from "./og-meta.ts";
import { updateCanonical } from "./canonical.ts";
import { createFetchPost } from "./github.ts";
import { getPosts, type PostMeta } from "./firestore.ts";
import { renderHomeHtml, hydrateHome, type PostContent } from "./pages/home.ts";
import { renderAdmin } from "./pages/admin.ts";
import { renderInfoPanel, hydrateInfoPanel, type LinkSection } from "./components/info-panel.ts";
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
   * Defeat updateInfoPanel's `cachedPosts === lastRenderedPosts` early-return by
   * clearing lastRenderedPosts, so the next Home render rebuilds the panel from
   * scratch. A route that clobbers the info panel directly — e.g. landing's
   * /about via mountAboutPanel — must call this in its afterRender; otherwise,
   * with cachedPosts unchanged, the returning Home render would skip the rebuild
   * and leave the about-panel content stale.
   */
  forceInfoPanelRefresh(): void;
}

export function createBlogApp(config: CreateBlogAppConfig): BlogAppHandle {
  const navMount = document.getElementById("nav");
  if (!navMount) throw new Error("#nav element not found");
  const navRoot = createRoot(navMount);
  const app = document.getElementById("app");
  if (!app) throw new Error("#app element not found");
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
  teardowns.push(() => navRoot.unmount());

  let currentUser: User | null = null;
  let cachedPosts: PostMeta[] = [];
  let lastSkippedCount = 0;
  let lastRenderedPosts: PostMeta[] | undefined;
  const boundFetchPost = createFetchPost(config.fetchPostSource);

  async function loadPosts(): Promise<string> {
    if (currentUser === null) {
      cachedPosts = config.buildTimeMetadata;
      lastSkippedCount = 0;
      return renderHomeHtml(cachedPosts, "/post/", config.buildTimeContent);
    }

    try {
      const result = await getPosts(config.firebase.db, config.firebase.namespace, currentUser);
      cachedPosts = result.posts;
      lastSkippedCount = result.skippedCount;
      return renderHomeHtml(cachedPosts, "/post/", config.buildTimeContent);
    } catch (error) {
      const kind = classifyError(error);
      const fallbackMsg = "Could not load posts. Try refreshing the page.";
      let msg: string;
      if (kind === "programmer") {
        deferProgrammerError(error);
        msg = fallbackMsg;
      } else {
        logError(error, { operation: "load-posts" });
        msg = kind === "permission-denied" ? "Permission denied loading posts." : fallbackMsg;
      }
      return `
    <h2>Home</h2>
    <p id="posts-error">${msg}</p>
  `;
    }
  }

  // Consumable DOM marker for once-only prerendered-panel preservation. The
  // pre-render script (prerender.ts) injects identical panel markup with
  // populated children but no data-prerendered attribute, so set the marker
  // here from the live DOM. Consuming it exactly once in updateInfoPanel
  // reproduces fellspiral's isFirstPanelRender semantics as a render-time DOM
  // check, and fixes landing's latent CLS for free.
  if (infoPanel.children.length > 0) infoPanel.dataset.prerendered = "true";

  let teardownScroll: (() => void) | undefined;
  const updateInfoPanel = (): void => {
    if (cachedPosts === lastRenderedPosts) return;
    if (infoPanel.dataset.prerendered) {
      delete infoPanel.dataset.prerendered; // consume exactly once
    } else {
      infoPanel.innerHTML = renderInfoPanel({
        linkSections: config.infoPanelLinkSections,
        topPosts: cachedPosts,
        blogRoll: config.blogRollEntries,
        rssFeedUrl: "/feed.xml",
        opmlUrl: "/blogroll.opml",
        postLinkPrefix: "/post/",
        buildTimeFeeds: config.buildTimeFeeds, // undefined for landing — harmless optional
      });
    }
    hydrateInfoPanel(infoPanel, config.blogRollEntries, config.strategies);
    if (config.useScrollIndicator) {
      teardownScroll?.();
      teardownScroll = initScrollIndicator(infoPanel);
    }
    lastRenderedPosts = cachedPosts;
  };
  teardowns.push(() => teardownScroll?.());

  const homeRoute: Route = {
    path: /^\/(?:post\/.*)?$/,
    render: () => {
      // Preserve the live prerendered home DOM only while signed out: the
      // prerendered #posts shows the published (build-time) posts, matching what
      // loadPosts() produces for an anonymous viewer, so skipping the rebuild
      // avoids needless teardown/CLS. It is a render-time live-DOM check, not a
      // one-shot flag, so a non-home entry route (e.g. /admin) that already
      // replaced #posts does not leave stale markup on a later Home navigation
      // (#1285). After sign-in we MUST run loadPosts() even though #posts is
      // live, so the admin's draft posts replace the published-only prerendered
      // markup (landing/e2e/admin.spec.ts draft tests).
      if (currentUser === null && app.querySelector("#posts")) {
        cachedPosts = config.buildTimeMetadata;
        lastSkippedCount = 0;
        return null;
      }
      return loadPosts();
    },
    afterRender: (outlet, path) => {
      const slug = path.startsWith("/post/") ? path.slice(6) : undefined;
      hydrateHome(outlet, cachedPosts, boundFetchPost, slug);
      config.onHomeAfterRender?.(slug);
      updateOgMeta(config.siteUrl, slug ? cachedPosts.find((p) => p.id === slug) : undefined, config.ogTitle, config.siteDefaults);
      updateCanonical(config.siteUrl, slug);
      updateInfoPanel();
    },
  };

  const adminRoute: Route = {
    path: "/admin",
    render: async () => {
      try {
        const admin = await isInGroup(config.firebase.db, config.firebase.namespace, currentUser, config.adminGroupId);
        return renderAdmin(currentUser, admin, lastSkippedCount);
      } catch (error) {
        if (!deferProgrammerError(error)) logError(error, { operation: "admin-group-check" });
        return `<h2>Admin</h2><p>Could not verify admin access. Try refreshing the page.</p>`;
      }
    },
  };

  function renderNav(path: string): void {
    navRoot.render(
      createElement(BlogNav, {
        links: config.navLinks,
        showHomeLink: config.showHomeLink,
        showAuth: path === "/admin",
        user: currentUser,
        onSignIn: () => void config.firebase.signIn(),
        onSignOut: () => void config.firebase.signOut(),
      }),
    );
  }

  function updateNav(path: string): void {
    renderNav(path);
    config.onNavigate?.(path); // landing sets document.body.dataset.route; fellspiral omits
  }

  updateNav(parsePath().path);
  const router = createHistoryRouter(
    app,
    [homeRoute, ...(config.extraRoutes ?? []), adminRoute],
    {
      onNavigate: ({ path }) => {
        updateNav(path);
        config.firebase.trackPageView(path);
      },
    },
  );
  teardowns.push(() => router.destroy());

  // router.navigate() is fire-and-forget — updateInfoPanel() below may see stale
  // cachedPosts until the router's async render cycle completes and afterRender
  // calls updateInfoPanel() again with fresh data.
  async function refreshAfterAuthChange(): Promise<void> {
    const { path } = parsePath();
    updateNav(path);
    router.navigate();
    // router.navigate() only loads posts on the home route; re-fetch on /admin
    // so the info panel populates even when not on home.
    if (path === "/admin") {
      await loadPosts();
    }
    updateInfoPanel();
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

  deferAppCheckInit(
    config.firebase.initAppCheck,
    config.rehydrateOnAppCheck
      ? () => hydrateInfoPanel(infoPanel, config.blogRollEntries, config.strategies)
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
      for (const teardown of teardowns) teardown();
    },
    forceInfoPanelRefresh(): void {
      lastRenderedPosts = undefined;
    },
  };
}
