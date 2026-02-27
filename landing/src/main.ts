import type { User } from "firebase/auth";

import { createRouter, getHashPath } from "./router.js";
import { renderHomeHtml, hydrateHome } from "./pages/home.js";
import { renderAdmin } from "./pages/admin.js";
import { renderNav } from "./components/nav.js";
import { auth, signIn, signOut, onAuthStateChanged } from "./auth.js";
import { getPosts, type PostMeta, type GetPostsResult } from "./firestore.js";

const nav = document.getElementById("nav");
const app = document.getElementById("app");

let currentUser: User | null = null;
let cachedPosts: PostMeta[] = [];
let lastSkippedCount = 0;

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

function updateNav(): void {
  if (!nav) return;
  nav.innerHTML = renderNav(currentUser, getHashPath());
  document.getElementById("sign-in")?.addEventListener("click", handleClick(signIn, "Sign-in"));
  document.getElementById("sign-out")?.addEventListener("click", handleClick(signOut, "Sign-out"));
}

async function loadPosts(): Promise<string> {
  try {
    const result: GetPostsResult = await getPosts(currentUser);
    cachedPosts = result.posts;
    lastSkippedCount = result.skippedCount;
  } catch (error) {
    console.error("Failed to load posts:", error);
    const msg =
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "permission-denied"
        ? "Permission denied loading posts."
        : "Could not load posts. Try refreshing the page.";
    return `
    <h2>Home</h2>
    <p id="posts-error">${msg}</p>
  `;
  }
  return renderHomeHtml(cachedPosts);
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
        },
      },
      { path: "/admin", render: () => renderAdmin(currentUser, lastSkippedCount) },
    ],
    { onNavigate: updateNav },
  );

  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    updateNav();
    navigate();
  });
}
