import "missing.css";
import "./style/theme.css";
import { createHistoryRouter } from "@commons-systems/router";
import { renderHome } from "./pages/home.js";
import { renderAbout } from "./pages/about.js";
import { renderNotes } from "./pages/notes.js";
import "@commons-systems/style/components/nav";
import type { AppNavElement } from "@commons-systems/style/components/nav";
import { signIn, signOut, onAuthStateChanged } from "./auth.js";
import type { User } from "firebase/auth";
import { trackPageView } from "./firebase.js";
import { renderHero } from "./pages/hero.js";
import { mountHero } from "@commons-systems/style/hero";

const navEl = document.getElementById("nav") as AppNavElement;
if (!navEl) throw new Error("#nav element not found");
const app = document.getElementById("app");
if (!app) throw new Error("#app element not found");

// Hero section — rendered once into its own container above #app
const heroContainer = document.getElementById("hero-container") as HTMLElement;
if (!heroContainer) throw new Error("#hero-container element not found");
mountHero(heroContainer, renderHero);

navEl.links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/notes", label: "Notes" },
];
navEl.addEventListener("sign-in", () => signIn());
navEl.addEventListener("sign-out", () => void signOut());

function updateNav(user: User | null): void {
  navEl.user = user;
}

// Show login UI immediately; onAuthStateChanged will update once auth resolves.
updateNav(null);

const router = createHistoryRouter(
  app,
  [
    { path: "/", render: renderHome },
    { path: "/about", render: renderAbout },
    { path: "/notes", render: renderNotes },
  ],
  { onNavigate: ({ path }) => trackPageView(path) },
);

onAuthStateChanged((user) => {
  updateNav(user);
  heroContainer.hidden = user !== null;
  router.navigate();
});
