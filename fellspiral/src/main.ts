import "missing.css";
import "./style/theme.css";
import type { User } from "./auth.js";

import { classifyError } from "@commons-systems/errorutil/classify";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import { createHistoryRouter, parsePath } from "@commons-systems/router";
import { renderHomeHtml, hydrateHome } from "@commons-systems/blog/pages/home";
import { renderAdmin } from "@commons-systems/blog/pages/admin";
import { renderInfoPanel, hydrateInfoPanel } from "@commons-systems/blog/components/info-panel";

import buildTimeContent from "virtual:blog-post-content";
import buildTimeMetadata from "virtual:blog-post-metadata";
import { createFetchPost } from "@commons-systems/blog/github";
import { updateOgMeta } from "@commons-systems/blog/og-meta";
import { updateCanonical } from "@commons-systems/blog/canonical";
import { getPosts, type PostMeta } from "@commons-systems/blog/firestore";
import { initPanelToggle } from "@commons-systems/style/panel-toggle";
import { initScrollIndicator } from "@commons-systems/style/scroll-indicator";
import "@commons-systems/style/components/nav";
import type { AppNavElement } from "@commons-systems/style/components/nav";
import { createStrategies, BLOG_ROLL_ENTRIES } from "./blog-roll/config.js";
import { INFO_PANEL_LINK_SECTIONS, SITE_DEFAULTS, SITE_URL } from "./site-config.js";
import { signIn, signOut, onAuthStateChanged } from "./auth.js";
import { isInGroup, ADMIN_GROUP_ID } from "@commons-systems/authutil/groups";
import { db, NAMESPACE, trackPageView, initAppCheck } from "./firebase.js";
import { deferAppCheckInit } from "@commons-systems/firebaseutil/defer-appcheck";
import buildTimeFeeds from "virtual:blog-roll-feeds";

const navEl = document.getElementById("nav") as AppNavElement;
if (!navEl) throw new Error("#nav element not found");
const app = document.getElementById("app");
if (!app) throw new Error("#app element not found");
const infoPanel = document.getElementById("info-panel");
if (!infoPanel) throw new Error("#info-panel element not found");

const header = document.querySelector(".page > header");
if (!header) throw new Error(".page > header element not found");
const contentGrid = document.querySelector(".content-grid");
if (!contentGrid) throw new Error(".content-grid element not found");
new ResizeObserver(([entry]) => {
  (contentGrid as HTMLElement).style.setProperty(
    "--header-height",
    `${entry.borderBoxSize[0].blockSize}px`,
  );
}).observe(header);

let teardownScroll: (() => void) | undefined;
let currentUser: User | null = null;
let cachedPosts: PostMeta[] = [];
let lastSkippedCount = 0;
let lastRenderedPosts: PostMeta[] | undefined;
const strategies = createStrategies();
const boundFetchPost = createFetchPost("fellspiral/post");
const RSS_CONFIG = { title: "fellspiral", siteUrl: SITE_URL };
// Skip the very first innerHTML replacement when pre-rendered content exists.
// The pre-render script (prerender.ts) already injected identical panel markup,
// so replacing it would cause a needless DOM teardown that can trigger CLS.
const hasPrerenderedPanel = infoPanel.children.length > 0;
let isFirstPanelRender = hasPrerenderedPanel;

const updateInfoPanel = (): void => {
  if (cachedPosts === lastRenderedPosts) return;

  if (isFirstPanelRender) {
    isFirstPanelRender = false;
  } else {
    infoPanel.innerHTML = renderInfoPanel({
      linkSections: INFO_PANEL_LINK_SECTIONS,
      topPosts: cachedPosts,
      blogRoll: BLOG_ROLL_ENTRIES,
      rssFeedUrl: "/feed.xml",
      opmlUrl: "/blogroll.opml",
      postLinkPrefix: "/post/",
      buildTimeFeeds,
    });
  }
  hydrateInfoPanel(infoPanel, BLOG_ROLL_ENTRIES, strategies);
  teardownScroll?.();
  teardownScroll = initScrollIndicator(infoPanel);
  lastRenderedPosts = cachedPosts;
}

navEl.links = [{ href: "/", label: "Home" }];
navEl.addEventListener("sign-in", () => signIn());
navEl.addEventListener("sign-out", () => void signOut());

function updateNav(path: string): void {
  navEl.showAuth = path === "/admin";
  navEl.user = currentUser;
}

const toggle = document.getElementById("panel-toggle");
if (!toggle) throw new Error("#panel-toggle element not found");
initPanelToggle(infoPanel, toggle);

async function loadPosts(): Promise<string> {
  if (currentUser === null) {
    cachedPosts = buildTimeMetadata;
    lastSkippedCount = 0;
    return renderHomeHtml(cachedPosts, "/post/", buildTimeContent);
  }

  try {
    const result = await getPosts(db, NAMESPACE, currentUser);
    cachedPosts = result.posts;
    lastSkippedCount = result.skippedCount;
    return renderHomeHtml(cachedPosts, "/post/", buildTimeContent);
  } catch (error) {
    const kind = classifyError(error);
    if (kind === "programmer") throw error;
    logError(error, { operation: "load-posts" });
    const msg = kind === "permission-denied"
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
// tearing it down and rebuilding identical markup.
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
          cachedPosts = buildTimeMetadata;
          lastSkippedCount = 0;
          return null;
        }
        return loadPosts();
      },
      afterRender: (outlet, path) => {
        const slug = path.startsWith("/post/") ? path.slice(6) : undefined;
        hydrateHome(outlet, cachedPosts, boundFetchPost, slug);
        updateOgMeta(RSS_CONFIG.siteUrl, slug ? cachedPosts.find((p) => p.id === slug) : undefined, "Fellspiral", SITE_DEFAULTS);
        updateCanonical(RSS_CONFIG.siteUrl, slug);
        updateInfoPanel();
      },
    },
    {
      path: "/admin",
      render: async () => {
        try {
          const admin = await isInGroup(db, NAMESPACE, currentUser, ADMIN_GROUP_ID);
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
      trackPageView(path);
    },
  },
);

document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  if (target.closest('a[href="/"]')) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

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

onAuthStateChanged((user) => {
  if (user?.uid === currentUser?.uid) return;
  currentUser = user;
  // Intentional silent degradation — user sees stale content rather than an error.
  refreshAfterAuthChange().catch((err) => {
    if (deferProgrammerError(err)) return;
    logError(err, { operation: "auth-change-refresh" });
  });
}).catch((err) => {
  if (deferProgrammerError(err)) return;
  logError(err, { operation: "auth-init" });
});

// Build-time feed data is already rendered in the blogroll; once App Check is
// ready, re-hydrate with live data.
deferAppCheckInit(initAppCheck, () =>
  hydrateInfoPanel(infoPanel, BLOG_ROLL_ENTRIES, strategies),
);
