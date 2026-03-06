import type { User } from "firebase/auth";

import { createRouter, parseHash } from "@commons-systems/router";
import { renderHomeHtml, hydrateHome } from "./pages/home.js";
import { renderAdmin } from "./pages/admin.js";
import { renderNav } from "./components/nav.js";
import { renderInfoPanel, hydrateInfoPanel } from "./components/info-panel.js";
import { createRssBlobUrl } from "./feed.js";
import { BLOG_ROLL_ENTRIES, createStrategies } from "./blog-roll/config.js";
import { auth, signIn, signOut, onAuthStateChanged } from "./auth.js";
import { getPosts, type PostMeta } from "./firestore.js";
import { isInGroup } from "@commons-systems/authutil/groups";
import { db, NAMESPACE } from "./firebase.js";

const nav = document.getElementById("nav");
const app = document.getElementById("app");
const infoPanel = document.getElementById("info-panel");

const header = document.querySelector("body > header");
if (header) {
  new ResizeObserver(([entry]) => {
    document.documentElement.style.setProperty(
      "--header-height",
      `${entry.borderBoxSize[0].blockSize}px`,
    );
  }).observe(header);
}

let currentUser: User | null = null;
let cachedPosts: PostMeta[] = [];
let lastSkippedCount = 0;
let rssBlobUrl: string | undefined;
let lastRenderedPosts: PostMeta[] | undefined;
const strategies = createStrategies();
const INFO_PANEL_LINKS = [{ label: "Source", url: "https://github.com/natb1/commons.systems" }];

function handleClick(action: () => void | Promise<void>, label: string): (e: Event) => void {
  return function (e: Event): void {
    e.preventDefault();
    const btn = e.currentTarget;
    Promise.resolve(action()).catch((err) => {
      console.error(`${label} failed:`, err);
      if (btn instanceof HTMLElement) btn.textContent = `${label} failed — try again`;
    });
  };
}

function updateInfoPanel(): void {
  if (!infoPanel) {
    console.error("updateInfoPanel: #info-panel element not found");
    return;
  }
  if (cachedPosts === lastRenderedPosts) return;

  if (rssBlobUrl) URL.revokeObjectURL(rssBlobUrl);
  rssBlobUrl = createRssBlobUrl(cachedPosts);

  infoPanel.innerHTML = renderInfoPanel({
    links: INFO_PANEL_LINKS,
    topPosts: cachedPosts,
    blogRoll: BLOG_ROLL_ENTRIES,
    rssFeedUrl: rssBlobUrl,
  });
  hydrateInfoPanel(infoPanel, BLOG_ROLL_ENTRIES, strategies);
  lastRenderedPosts = cachedPosts;
}

function updateNav(): void {
  if (!nav) {
    console.error("updateNav: #nav element not found");
    return;
  }
  nav.innerHTML = renderNav(currentUser, parseHash().path);
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
  const router = createRouter(
    app,
    [
      {
        path: /^\/(?:post\/.*)?$/,
        render: () => loadPosts(),
        afterRender: (outlet, path) => {
          const slug = path.startsWith("/post/") ? path.slice(6) : undefined;
          hydrateHome(outlet, cachedPosts, slug);
          updateInfoPanel();
        },
      },
      {
        path: "/admin",
        render: async () => {
          const admin = await isInGroup(db, NAMESPACE, currentUser, "admin");
          return renderAdmin(currentUser, admin, lastSkippedCount);
        },
      },
    ],
    { onNavigate: updateNav },
  );

  function closePanel(): void {
    infoPanel?.classList.remove("open");
    document.getElementById("panel-toggle")?.setAttribute("aria-expanded", "false");
  }

  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;

    if (target.closest('a[href="#/"]')) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (
      infoPanel?.classList.contains("open") &&
      !target.closest("#info-panel") &&
      !target.closest("#panel-toggle")
    ) {
      closePanel();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && infoPanel?.classList.contains("open")) {
      closePanel();
    }
  });

  async function refreshAfterAuthChange(): Promise<void> {
    updateNav();
    router.navigate();
    // router.navigate() only loads posts on the home route; re-fetch here so
    // the info panel populates regardless of which route is active.
    if (parseHash().path === "/admin") {
      await loadPosts();
    }
    updateInfoPanel();
  }

  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    refreshAfterAuthChange().catch((err) => {
      console.error("Failed to refresh after auth change:", err);
    });
  });
} else {
  console.error("Fatal: #app element not found");
}
