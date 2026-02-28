import type { User } from "firebase/auth";

import { createRouter, getHashPath } from "./router.js";
import { renderHomeHtml, hydrateHome } from "./pages/home.js";
import { renderAdmin } from "./pages/admin.js";
import { renderNav } from "./components/nav.js";
import { renderInfoPanel, hydrateInfoPanel } from "./components/info-panel.js";
import { createRssBlobUrl } from "./feed.js";
import { BLOG_ROLL_ENTRIES, createStrategies } from "./blog-roll/config.js";
import { auth, signIn, signOut, onAuthStateChanged } from "./auth.js";
import { getPosts, type PostMeta } from "./firestore.js";

const nav = document.getElementById("nav");
const app = document.getElementById("app");
const infoPanel = document.getElementById("info-panel");

// Set --header-height for sticky info panel positioning
function syncHeaderHeight(): void {
  const header = document.querySelector("body > header");
  if (header) {
    document.documentElement.style.setProperty(
      "--header-height",
      `${header.getBoundingClientRect().height}px`,
    );
  }
}
syncHeaderHeight();
window.addEventListener("resize", syncHeaderHeight);

let currentUser: User | null = null;
let cachedPosts: PostMeta[] = [];
let lastSkippedCount = 0;
let rssBlobUrl: string | undefined;

function handleClick(action: () => Promise<void>, label: string): (e: Event) => void {
  return function (e: Event): void {
    e.preventDefault();
    const btn = e.currentTarget;
    action().catch((err) => {
      console.error(`${label} failed:`, err);
      if (btn instanceof HTMLElement) btn.textContent = `${label} failed — try again`;
    });
  };
}

function updateInfoPanel(): void {
  if (!infoPanel) return;

  if (rssBlobUrl) URL.revokeObjectURL(rssBlobUrl);
  rssBlobUrl = createRssBlobUrl(cachedPosts);

  let rssLink = document.querySelector<HTMLLinkElement>('link[type="application/rss+xml"]');
  if (!rssLink) {
    rssLink = document.createElement("link");
    rssLink.rel = "alternate";
    rssLink.type = "application/rss+xml";
    rssLink.title = "commons.systems RSS";
    document.head.appendChild(rssLink);
  }
  rssLink.href = rssBlobUrl;

  const links = [{ label: "Source", url: "https://github.com/natb1/commons.systems" }];
  infoPanel.innerHTML = renderInfoPanel({
    links,
    topPosts: cachedPosts,
    blogRoll: BLOG_ROLL_ENTRIES,
    rssFeedUrl: rssBlobUrl,
  });
  const strategies = createStrategies();
  hydrateInfoPanel(infoPanel, BLOG_ROLL_ENTRIES, strategies);
}

function updateNav(): void {
  if (!nav) {
    console.error("updateNav: #nav element not found");
    return;
  }
  nav.innerHTML = renderNav(currentUser, getHashPath());
  document.getElementById("sign-in")?.addEventListener("click", handleClick(signIn, "Sign-in"));
  document.getElementById("sign-out")?.addEventListener("click", handleClick(signOut, "Sign-out"));

  const toggle = document.getElementById("panel-toggle");
  toggle?.addEventListener("click", () => {
    if (!infoPanel) return;
    const isOpen = infoPanel.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

async function loadPosts(): Promise<string> {
  try {
    const result = await getPosts(currentUser);
    cachedPosts = result.posts;
    lastSkippedCount = result.skippedCount;
    return renderHomeHtml(cachedPosts);
  } catch (error) {
    console.error("Failed to load posts:", error);
    const isPermissionDenied =
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "permission-denied";
    const msg = isPermissionDenied
      ? "Permission denied loading posts."
      : "Could not load posts. Try refreshing the page.";
    return `
    <h2>Home</h2>
    <p id="posts-error">${msg}</p>
  `;
  }
}

updateNav();

if (app) {
  const navigate = createRouter(
    app,
    [
      {
        path: /^\/(?:post\/.*)?$/,
        render: () => loadPosts(),
        afterRender: (outlet, hash) => {
          const slug = hash.startsWith("/post/") ? hash.slice(6) : undefined;
          hydrateHome(outlet, cachedPosts, slug);
          updateInfoPanel();
        },
      },
      { path: "/admin", render: () => renderAdmin(currentUser, lastSkippedCount) },
    ],
    { onNavigate: updateNav },
  );

  document.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest('a[href="#/"]')) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    updateNav();
    navigate();
  });
} else {
  console.error("Fatal: #app element not found");
}
