import type { User } from "firebase/auth";

import { createRouter, getHashPath } from "./router.js";
import { renderHomeHtml, hydrateHome } from "./pages/home.js";
import { renderAdmin } from "./pages/admin.js";
import "@commons-systems/style/components/nav";
import type { AppNavElement } from "@commons-systems/style/components/nav";
import { renderInfoPanel, hydrateInfoPanel } from "./components/info-panel.js";
import { createRssBlobUrl } from "./feed.js";
import { BLOG_ROLL_ENTRIES, createStrategies } from "./blog-roll/config.js";
import { auth, signIn, signOut, onAuthStateChanged } from "./auth.js";
import { getPosts, type PostMeta } from "./firestore.js";
import { isInGroup } from "@commons-systems/authutil/groups";
import { db, NAMESPACE } from "./firebase.js";

const navEl = document.getElementById("nav") as AppNavElement;
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

navEl.links = [{ href: "#/", label: "Home" }];
navEl.addEventListener("sign-in", handleClick(signIn, "Sign-in"));
navEl.addEventListener("sign-out", handleClick(signOut, "Sign-out"));

function updateNav(): void {
  navEl.showAuth = getHashPath() === "/admin";
  navEl.user = currentUser;
}

const toggle = document.getElementById("panel-toggle");
toggle?.addEventListener("click", () => {
  if (!infoPanel) return;
  const isOpen = infoPanel.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(isOpen));
});

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

  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    updateNav();
    navigate();
    updateInfoPanel();
  });
} else {
  console.error("Fatal: #app element not found");
}
