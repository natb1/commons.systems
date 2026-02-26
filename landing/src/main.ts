import { createRouter } from "./router.js";
import { renderHomeHtml, hydrateHome } from "./pages/home.js";
import { renderAdmin } from "./pages/admin.js";
import { renderNav } from "./components/nav.js";
import { auth, signIn, signOut, onAuthStateChanged } from "./auth.js";
import { getPosts, type PostMeta } from "./firestore.js";
import type { User } from "firebase/auth";

const nav = document.getElementById("nav");
const app = document.getElementById("app");

let currentUser: User | null = null;
let cachedPosts: PostMeta[] = [];

function currentPath(): string {
  return location.hash.slice(1) || "/";
}

function updateNav(): void {
  if (!nav) return;
  nav.innerHTML = renderNav(currentUser, currentPath());
  document.getElementById("sign-in")?.addEventListener("click", (e) => {
    e.preventDefault();
    signIn();
  });
  document.getElementById("sign-out")?.addEventListener("click", (e) => {
    e.preventDefault();
    void signOut();
  });
}

async function loadPosts(): Promise<string> {
  try {
    cachedPosts = await getPosts(currentUser);
  } catch (error) {
    console.error("Failed to load posts:", error);
    return `
    <h2>Home</h2>
    <p id="posts-error">Could not load posts</p>
  `;
  }
  return renderHomeHtml(cachedPosts);
}

updateNav();

if (app) {
  const navigate = createRouter(app, [
    {
      path: "/",
      render: () => loadPosts(),
      afterRender: (outlet) => hydrateHome(outlet, cachedPosts),
    },
    {
      path: /^\/post\//,
      render: () => loadPosts(),
      afterRender: (outlet, hash) => {
        const slug = hash.replace(/^\/post\//, "");
        hydrateHome(outlet, cachedPosts, slug);
      },
    },
    { path: "/admin", render: () => renderAdmin(currentUser) },
  ]);

  window.addEventListener("hashchange", () => updateNav());

  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    updateNav();
    navigate();
  });
}
