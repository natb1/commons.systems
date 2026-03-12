import { createRouter } from "@commons-systems/router";
import { DataIntegrityError } from "./errors.js";
import { renderHome, afterRenderHome } from "./pages/home.js";
import { renderView } from "./pages/view.js";
import { renderAbout } from "./pages/about.js";
import "@commons-systems/style/components/nav";
import type { AppNavElement } from "@commons-systems/style/components/nav";
import { auth, signIn, signOut, onAuthStateChanged } from "./auth.js";
import type { User } from "./auth.js";
import { trackPageView } from "./firebase.js";

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

// Show login UI immediately; onAuthStateChanged will update once auth resolves.
navEl.user = null;

const router = createRouter(
  app,
  [
    {
      path: "/",
      render: () => renderHome(currentUser),
      afterRender: afterRenderHome,
    },
    {
      path: /^\/view\/([^/]+)$/,
      render: (path) => renderView(path.slice("/view/".length), currentUser),
    },
    { path: "/about", render: renderAbout },
  ],
  {
    onNavigate: ({ path }) => trackPageView(path),
    formatError: (error) => {
      if (error instanceof DataIntegrityError)
        return "A data error occurred. Please contact support.";
      return undefined;
    },
  },
);

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  navEl.user = user;
  router.navigate();
});
