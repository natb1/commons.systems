import { createRouter } from "@commons-systems/router";
import { DataIntegrityError } from "./errors.js";
import { renderHome, afterRenderHome } from "./pages/home.js";
import { renderView } from "./pages/view.js";
import { renderAbout } from "./pages/about.js";
import "@commons-systems/style/components/nav";
import type { AppNavElement } from "@commons-systems/style/components/nav";
import { auth, signIn, signOut, onAuthStateChanged } from "./auth.js";
import type { User } from "./auth.js";

const navEl = document.getElementById("nav") as AppNavElement;
if (!navEl) throw new Error("#nav element not found");
const app = document.getElementById("app");
if (!app) throw new Error("#app element not found");

navEl.links = [
  { href: "#/", label: "Library" },
  { href: "#/about", label: "About" },
];
navEl.addEventListener("sign-in", () => signIn());
navEl.addEventListener("sign-out", () => void signOut());

let currentUser: User | null = null;

function updateNav(user: User | null): void {
  navEl.user = user;
}

// Show login UI immediately; onAuthStateChanged will update once auth resolves.
updateNav(null);

const router = createRouter(
  app,
  [
    {
      path: "/",
      render: () => renderHome(currentUser),
      afterRender: (outlet) => afterRenderHome(outlet),
    },
    {
      path: /^\/view\/([^/]+)$/,
      render: (path) => {
        const match = path.match(/^\/view\/([^/]+)$/);
        const id = match ? match[1] : "";
        return renderView(id, currentUser);
      },
    },
    { path: "/about", render: renderAbout },
  ],
  {
    formatError: (error) => {
      if (error instanceof DataIntegrityError)
        return "A data error occurred. Please contact support.";
      return undefined;
    },
  },
);

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  updateNav(user);
  router.navigate();
});
