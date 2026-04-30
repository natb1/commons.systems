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
import { updateOgMeta, updateStaticPageMeta } from "@commons-systems/blog/og-meta";
import { updateCanonical } from "@commons-systems/blog/canonical";
import { getPosts, type PostMeta } from "@commons-systems/blog/firestore";
import { initPanelToggle } from "@commons-systems/style/panel-toggle";
import "@commons-systems/style/components/nav";
import type { AppNavElement } from "@commons-systems/style/components/nav";
import { BLOG_ROLL_ENTRIES, createStrategies } from "./blog-roll/config.js";
import { ABOUT_PAGE_META, INFO_PANEL_LINK_SECTIONS, NAV_LINKS, SITE_DEFAULTS, SITE_URL } from "./site-config.js";
import { renderAboutHtml } from "./pages/about.js";
import { signIn, signOut, onAuthStateChanged } from "./auth.js";
import { isInGroup, ADMIN_GROUP_ID } from "@commons-systems/authutil/groups";
import { db, NAMESPACE, trackPageView, initAppCheck } from "./firebase.js";
import { deferAppCheckInit } from "@commons-systems/firebaseutil/defer-appcheck";

const navEl = document.getElementById("nav") as AppNavElement;
if (!navEl) throw new Error("#nav element not found");
const app = document.getElementById("app");
if (!app) throw new Error("#app element not found");
const infoPanel = document.getElementById("info-panel");
if (!infoPanel) throw new Error("#info-panel element not found");

const header = document.querySelector(".page > header");
if (!header) throw new Error(".page > header element not found");
new ResizeObserver(([entry]) => {
  document.documentElement.style.setProperty(
    "--header-height",
    `${entry.borderBoxSize[0].blockSize}px`,
  );
}).observe(header);

let currentUser: User | null = null;
let cachedPosts: PostMeta[] = [];
let lastSkippedCount = 0;
let lastRenderedPosts: PostMeta[] | undefined;
const strategies = createStrategies();
const boundFetchPost = createFetchPost("landing/post");
const RSS_CONFIG = { title: "commons.systems", siteUrl: SITE_URL };
const updateInfoPanel = (): void => {
  if (cachedPosts === lastRenderedPosts) return;

  infoPanel.innerHTML = renderInfoPanel({
    linkSections: INFO_PANEL_LINK_SECTIONS,
    topPosts: cachedPosts,
    blogRoll: BLOG_ROLL_ENTRIES,
    rssFeedUrl: "/feed.xml",
    opmlUrl: "/blogroll.opml",
    postLinkPrefix: "/post/",
  });
  hydrateInfoPanel(infoPanel, BLOG_ROLL_ENTRIES, strategies);
  lastRenderedPosts = cachedPosts;
}

navEl.links = NAV_LINKS;
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
    reportError(new Error(`Failed to load posts: ${error instanceof Error ? error.message : error}`));
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

const router = createHistoryRouter(
  app,
  [
    {
      path: /^\/(?:post\/.*)?$/,
      render: () => loadPosts(),
      afterRender: (outlet, path) => {
        const slug = path.startsWith("/post/") ? path.slice(6) : undefined;
        hydrateHome(outlet, cachedPosts, boundFetchPost, slug);
        updateOgMeta(RSS_CONFIG.siteUrl, slug ? cachedPosts.find((p) => p.id === slug) : undefined, RSS_CONFIG.title, SITE_DEFAULTS);
        updateCanonical(RSS_CONFIG.siteUrl, slug);
        updateInfoPanel();
      },
    },
    {
      path: "/about",
      render: () => renderAboutHtml(),
      afterRender: () => {
        updateStaticPageMeta(RSS_CONFIG.siteUrl, ABOUT_PAGE_META, RSS_CONFIG.title);
        updateCanonical(RSS_CONFIG.siteUrl, undefined, "/about");
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

deferAppCheckInit(initAppCheck);
