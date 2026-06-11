import "missing.css";
import "./style/theme.css";
import { createHistoryRouter } from "@commons-systems/router";
import { classifyError } from "@commons-systems/errorutil/classify";
import { logError } from "@commons-systems/errorutil/log";
import { renderHome, afterRenderHome } from "./pages/home.js";
import { initLocalFolder } from "./local-folder-ui.js";
import { renderView, afterRenderView, cleanupView, NOT_FOUND_HTML } from "./pages/view.js";
import { renderAbout } from "./pages/about.js";
import "@commons-systems/components/nav";
import type { AppNavElement } from "@commons-systems/components/nav";
import { signIn, signOut, onAuthStateChanged } from "./auth.js";
import type { User } from "./auth.js";
import { setViewerEmail, markLocalFolderReady } from "./library.js";
import { trackPageView } from "./firebase.js";
import { renderHero } from "./pages/hero.js";
import { mountHero } from "@commons-systems/components/hero";

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

// Insert the local-folder button into the nav, immediately before the
// Login/user controls. Inserted as a sibling of .nav-auth (not inside it) so
// the nav component's innerHTML rewrite on auth state change does not touch it.
// The CSS rule `app-nav > .nav-links + * { margin-left: auto }` then pushes
// this span (and .nav-auth) to the right.
const navAuthEl = navEl.querySelector(".nav-auth");
if (navAuthEl) {
  const localFolderNavEl = document.createElement("span");
  localFolderNavEl.id = "local-folder";
  navEl.insertBefore(localFolderNavEl, navAuthEl);
  initLocalFolder(localFolderNavEl, app)
    .catch((err) => logError(err, { operation: "init-local-folder" }))
    .finally(() => markLocalFolderReady());
}

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
      render: (path) => {
        let id: string;
        try {
          id = decodeURIComponent(path.slice("/view/".length));
        } catch {
          // Malformed percent-encoding (e.g. /view/%ZZ) is normal user input,
          // not an error to report — treat it as a missing item.
          return NOT_FOUND_HTML;
        }
        return renderView(id, currentUser);
      },
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
  setViewerEmail(user?.email ?? null);
  router.navigate();
});
