import "missing.css";
import "./style/theme.css";
import type { User } from "firebase/auth";

import { classifyError } from "@commons-systems/errorutil/classify";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { createHistoryRouter, parsePath } from "@commons-systems/router";
import { renderHomeHtml, hydrateHome } from "@commons-systems/blog/pages/home";
import { renderAdmin } from "@commons-systems/blog/pages/admin";
import { renderInfoPanel, hydrateInfoPanel, type LinkSection } from "@commons-systems/blog/components/info-panel";

import buildTimeContent from "virtual:blog-post-content";
import buildTimeMetadata from "virtual:blog-post-metadata";
import { createFetchPost } from "@commons-systems/blog/github";
import { updateOgMeta } from "@commons-systems/blog/og-meta";
import { getPosts, type PostMeta } from "@commons-systems/blog/firestore";
import { initPanelToggle } from "@commons-systems/style/panel-toggle";
import "@commons-systems/style/components/nav";
import type { AppNavElement } from "@commons-systems/style/components/nav";
import { BLOG_ROLL_ENTRIES, createStrategies } from "./blog-roll/config.js";
import { signIn, signOut, onAuthStateChanged } from "./auth.js";
import { isInGroup, ADMIN_GROUP_ID } from "@commons-systems/authutil/groups";
import { db, NAMESPACE, trackPageView } from "./firebase.js";

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
const boundFetchPost = createFetchPost("fellspiral/post");
const RSS_CONFIG = { title: "fellspiral", siteUrl: "https://fellspiral.commons.systems" };
const INFO_PANEL_LINK_SECTIONS: LinkSection[] = [
  {
    links: [
      { label: "itch.io", url: "https://natethenoob.itch.io" },
      { label: "No Land Beyond", subtitle: "Find a Local Game in Baltimore", url: "https://discord.gg/MxXHfyY3" },
    ],
  },
  {
    heading: "Games I'm Playing",
    links: [
      { label: "Mythic Bastionland", url: "https://chrismcdee.itch.io/mythic-bastionland" },
      { label: "ALIEN", url: "https://freeleaguepublishing.com/games/alien/" },
      { label: "Cairn", url: "https://cairnrpg.com/" },
    ],
  },
];

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

navEl.links = [{ href: "/", label: "Home" }];
navEl.addEventListener("sign-in", () => signIn());
navEl.addEventListener("sign-out", () => {
  signOut().catch((err) => console.error("Sign-out failed:", err));
});

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
        updateOgMeta(RSS_CONFIG.siteUrl, slug ? cachedPosts.find((p) => p.id === slug) : undefined);
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
          console.error("Failed to check admin group:", error);
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
  refreshAfterAuthChange().catch((err) => {
    if (deferProgrammerError(err)) return;
    console.error("Failed to refresh after auth change:", err);
  });
});
