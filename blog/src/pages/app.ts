import type { Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";
import type { Namespace } from "@commons-systems/firestoreutil/namespace";

import { classifyError } from "@commons-systems/errorutil/classify";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import { createHistoryRouter, parsePath } from "@commons-systems/router";
import { initPanelToggle } from "@commons-systems/style/panel-toggle";
import { initScrollIndicator } from "@commons-systems/style/scroll-indicator";
import "@commons-systems/style/components/nav";
import type { AppNavElement } from "@commons-systems/style/components/nav";
import { isInGroup, ADMIN_GROUP_ID } from "@commons-systems/authutil/groups";
import { deferAppCheckInit } from "@commons-systems/firebaseutil/defer-appcheck";

import { renderHomeHtml, hydrateHome, type PostContent } from "./home.ts";
import { renderAdmin } from "./admin.ts";
import {
  renderInfoPanel,
  hydrateInfoPanel,
  type LinkSection,
} from "../components/info-panel.ts";
import { createFetchPost } from "../github.ts";
import { updateOgMeta, type SiteDefaults } from "../og-meta.ts";
import { updateCanonical } from "../canonical.ts";
import { getPosts, type PostMeta } from "../firestore.ts";
import type {
  BlogRollEntry,
  BlogRollStrategy,
  LatestPost,
} from "../blog-roll/types.ts";

export type { LinkSection };

export interface CreateBlogAppConfig {
  // Site identity
  siteUrl: string;
  /** Title used as og:title / page title suffix (e.g. "commons.systems", "Fellspiral"). */
  ogTitle: string;
  siteDefaults: SiteDefaults;

  // Build-time content
  /** Map from post id to pre-rendered post content, keyed for the home page. */
  buildTimeContent: Record<string, PostContent>;
  /** Build-time post metadata used while unauthenticated or before Firestore loads. */
  buildTimeMetadata: PostMeta[];
  /** Path prefix for fetching post markdown from GitHub (e.g. "landing/post"). */
  postFetchPathPrefix: string;
  /** Anchor href prefix for post links in the home + info-panel. Defaults to "/post/". */
  postLinkPrefix?: string;

  // Info panel
  infoPanelLinkSections: LinkSection[];
  blogRollEntries: BlogRollEntry[];
  createStrategies: () => Map<string, BlogRollStrategy>;
  /** Build-time-fetched blogroll feed snapshot. Triggers a post-AppCheck rehydrate when present. */
  buildTimeFeeds?: Record<string, LatestPost | null>;
  /** RSS feed URL shown in info-panel archive header. Defaults to "/feed.xml". */
  rssFeedUrl?: string;
  /** OPML URL shown in info-panel blogroll header. Defaults to "/blogroll.opml". */
  opmlUrl?: string;

  // Firebase
  db: Firestore;
  namespace: Namespace;
  trackPageView: (path: string) => void;
  initAppCheck: (() => Promise<void>) | undefined;

  // Auth
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  onAuthStateChanged: (
    cb: (u: User | null) => void,
  ) => Promise<() => void>;

  // Layout
  /** Element to receive the `--header-height` CSS variable. Defaults to `document.documentElement`. */
  headerHeightTarget?: HTMLElement;

  // Optional features
  /** When true, attaches a scroll indicator to the info panel. */
  enableInfoPanelScrollIndicator?: boolean;
}

/**
 * Wires up the shared blog-app shell: header height observer, info-panel render
 * + hydration, two-route history router (home/post + admin), nav and auth
 * handlers, and deferred App Check init. Pre-rendered apps get CLS-safe
 * skip-first-render behavior; non-prerendered apps render normally.
 */
export function createBlogApp(config: CreateBlogAppConfig): void {
  const postLinkPrefix = config.postLinkPrefix ?? "/post/";
  const rssFeedUrl = config.rssFeedUrl ?? "/feed.xml";
  const opmlUrl = config.opmlUrl ?? "/blogroll.opml";

  const navEl = document.getElementById("nav") as AppNavElement;
  if (!navEl) throw new Error("#nav element not found");
  const app = document.getElementById("app");
  if (!app) throw new Error("#app element not found");
  const infoPanel = document.getElementById("info-panel");
  if (!infoPanel) throw new Error("#info-panel element not found");

  const header = document.querySelector(".page > header");
  if (!header) throw new Error(".page > header element not found");
  const headerHeightTarget = config.headerHeightTarget ?? document.documentElement;
  new ResizeObserver(([entry]) => {
    headerHeightTarget.style.setProperty(
      "--header-height",
      `${entry.borderBoxSize[0].blockSize}px`,
    );
  }).observe(header);

  let teardownScroll: (() => void) | undefined;
  let currentUser: User | null = null;
  let cachedPosts: PostMeta[] = [];
  let lastSkippedCount = 0;
  let lastRenderedPosts: PostMeta[] | undefined;
  const strategies = config.createStrategies();
  const boundFetchPost = createFetchPost(config.postFetchPathPrefix);

  // Skip the very first innerHTML replacement when pre-rendered content exists.
  // The pre-render script already injected identical panel markup, so replacing
  // it would cause a needless DOM teardown that can trigger CLS. For apps
  // without pre-render, infoPanel.children.length is 0 so this is a no-op.
  const hasPrerenderedPanel = infoPanel.children.length > 0;
  let isFirstPanelRender = hasPrerenderedPanel;

  const updateInfoPanel = (): void => {
    if (cachedPosts === lastRenderedPosts) return;

    if (isFirstPanelRender) {
      isFirstPanelRender = false;
    } else {
      infoPanel.innerHTML = renderInfoPanel({
        linkSections: config.infoPanelLinkSections,
        topPosts: cachedPosts,
        blogRoll: config.blogRollEntries,
        rssFeedUrl,
        opmlUrl,
        postLinkPrefix,
        buildTimeFeeds: config.buildTimeFeeds,
      });
    }
    hydrateInfoPanel(infoPanel, config.blogRollEntries, strategies);
    if (config.enableInfoPanelScrollIndicator) {
      teardownScroll?.();
      teardownScroll = initScrollIndicator(infoPanel);
    }
    lastRenderedPosts = cachedPosts;
  };

  navEl.links = [{ href: "/", label: "Home" }];
  navEl.addEventListener("sign-in", () => void config.signIn());
  navEl.addEventListener("sign-out", () => void config.signOut());

  function updateNav(path: string): void {
    navEl.showAuth = path === "/admin";
    navEl.user = currentUser;
  }

  const toggle = document.getElementById("panel-toggle");
  if (!toggle) throw new Error("#panel-toggle element not found");
  initPanelToggle(infoPanel, toggle);

  async function loadPosts(): Promise<string> {
    if (currentUser === null) {
      cachedPosts = config.buildTimeMetadata;
      lastSkippedCount = 0;
      return renderHomeHtml(cachedPosts, postLinkPrefix, config.buildTimeContent);
    }

    try {
      const result = await getPosts(config.db, config.namespace, currentUser);
      cachedPosts = result.posts;
      lastSkippedCount = result.skippedCount;
      return renderHomeHtml(cachedPosts, postLinkPrefix, config.buildTimeContent);
    } catch (error) {
      const kind = classifyError(error);
      if (kind === "programmer") throw error;
      logError(error, { operation: "load-posts" });
      const msg =
        kind === "permission-denied"
          ? "Permission denied loading posts."
          : "Could not load posts. Try refreshing the page.";
      return `
    <h2>Home</h2>
    <p id="posts-error">${msg}</p>
  `;
    }
  }

  updateNav(parsePath().path);

  // Same pre-render skip pattern as isFirstPanelRender above — return null on
  // the first navigation so the router keeps the existing DOM instead of
  // tearing it down and rebuilding identical markup. For apps without
  // pre-render, hasPrerenderedHome is false so this is a no-op.
  const hasPrerenderedHome = app.querySelector("#posts") !== null;
  let isFirstHomeRender = hasPrerenderedHome;

  const router = createHistoryRouter(
    app,
    [
      {
        path: /^\/(?:post\/.*)?$/,
        render: () => {
          if (isFirstHomeRender) {
            isFirstHomeRender = false;
            // Populate cachedPosts synchronously since the null return skips
            // loadPosts, and afterRender needs them for hydration.
            cachedPosts = config.buildTimeMetadata;
            lastSkippedCount = 0;
            return null;
          }
          return loadPosts();
        },
        afterRender: (outlet, path) => {
          const slug = path.startsWith("/post/") ? path.slice(6) : undefined;
          hydrateHome(outlet, cachedPosts, boundFetchPost, slug);
          updateOgMeta(
            config.siteUrl,
            slug ? cachedPosts.find((p) => p.id === slug) : undefined,
            config.ogTitle,
            config.siteDefaults,
          );
          updateCanonical(config.siteUrl, slug);
          updateInfoPanel();
        },
      },
      {
        path: "/admin",
        render: async () => {
          try {
            const admin = await isInGroup(
              config.db,
              config.namespace,
              currentUser,
              ADMIN_GROUP_ID,
            );
            return renderAdmin(currentUser, admin, lastSkippedCount);
          } catch (error) {
            if (classifyError(error) === "programmer") throw error;
            logError(error, { operation: "admin-group-check" });
            return `<h2>Admin</h2><p>Could not verify admin access. Try refreshing the page.</p>`;
          }
        },
      },
    ],
    {
      onNavigate: ({ path }) => {
        updateNav(path);
        config.trackPageView(path);
      },
    },
  );

  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('a[href="/"]')) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  // router.navigate() is fire-and-forget — updateInfoPanel() below may see
  // stale cachedPosts until the router's async render cycle completes and
  // afterRender calls updateInfoPanel() again with fresh data.
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

  config
    .onAuthStateChanged((user) => {
      if (user?.uid === currentUser?.uid) return;
      currentUser = user;
      // Intentional silent degradation — user sees stale content rather than an error.
      refreshAfterAuthChange().catch((err) => {
        if (deferProgrammerError(err)) return;
        logError(err, { operation: "auth-change-refresh" });
      });
    })
    .catch((err) => {
      if (deferProgrammerError(err)) return;
      logError(err, { operation: "auth-init" });
    });

  // When build-time feeds are baked in, re-hydrate the info panel after App
  // Check is ready so the live blogroll replaces the (potentially stale) build
  // snapshot. Without buildTimeFeeds the build snapshot is empty and the
  // initial hydrateInfoPanel call already covers refresh.
  if (config.buildTimeFeeds) {
    deferAppCheckInit(config.initAppCheck, () =>
      hydrateInfoPanel(infoPanel, config.blogRollEntries, strategies),
    );
  } else {
    deferAppCheckInit(config.initAppCheck);
  }
}
