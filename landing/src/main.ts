import { createRouter } from "./router.js";
import { renderHome } from "./pages/home.js";
import { renderPost } from "./pages/post.js";
import { renderAdmin } from "./pages/admin.js";
import { renderNav } from "./components/nav.js";
import { auth, signIn, signOut, onAuthStateChanged } from "./auth.js";
import type { User } from "firebase/auth";

const nav = document.getElementById("nav");
const app = document.getElementById("app");

let currentUser: User | null = null;

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

updateNav();

if (app) {
  const navigate = createRouter(app, [
    { path: "/", render: () => renderHome(currentUser) },
    {
      path: /^\/post\//,
      render: (hash) => renderPost(hash.replace(/^\/post\//, "")),
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
