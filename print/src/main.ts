import "missing.css";
import "./style/theme.css";
import { createHistoryRouter } from "@commons-systems/router";
import { classifyError } from "@commons-systems/errorutil/classify";
import { renderHome, afterRenderHome } from "./pages/home.js";
import { renderView, afterRenderView, cleanupView } from "./pages/view.js";
import { renderAbout } from "./pages/about.js";
import "@commons-systems/style/components/nav";
import type { AppNavElement } from "@commons-systems/style/components/nav";
import { signIn, signOut, onAuthStateChanged } from "./auth.js";
import type { User } from "./auth.js";
import { trackPageView } from "./firebase.js";
import { renderHero } from "./pages/hero.js";
import { mountHero } from "@commons-systems/style/hero";

const navEl = document.getElementById("nav") as AppNavElement;
if (!navEl) throw new Error("#nav element not found");
const app = document.getElementById("app");
if (!app) throw new Error("#app element not found");

const heroContainer = document.getElementById("hero-container") as HTMLElement;
if (!heroContainer) throw new Error("#hero-container element not found");
mountHero(heroContainer, renderHero);

navEl.links = [
  { href: "/", label: "Library" },
  { href: "/about", label: "About" },
];
navEl.addEventListener("sign-in", () => signIn());
navEl.addEventListener("sign-out", () => void signOut());

let currentUser: User | null = null;

// Show login UI immediately; onAuthStateChanged will update once auth resolves.
navEl.user = null;

const router = createHistoryRouter(
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
      afterRender: (outlet) => afterRenderView(outlet, currentUser),
    },
    { path: "/about", render: renderAbout },
  ],
  {
    onNavigate: ({ path }) => {
      cleanupView();
      trackPageView(path);
    },
    formatError: (error) => {
      if (classifyError(error) === "data-integrity")
        return "A data error occurred. Please contact support.";
      return undefined;
    },
  },
);

onAuthStateChanged((user) => {
  currentUser = user;
  navEl.user = user;
  heroContainer.hidden = user !== null;
  router.navigate();
});
