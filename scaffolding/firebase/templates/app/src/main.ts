import "missing.css";
import "./style/theme.css";
import { createHistoryRouter } from "@commons-systems/router";
import { renderHome } from "./pages/home.js";
import { renderAbout } from "./pages/about.js";
import { renderNotes } from "./pages/notes.js";
import "@commons-systems/style/components/nav";
import type { AppNavElement } from "@commons-systems/style/components/nav";
import { signIn, signOut, onAuthStateChanged } from "./auth.js";
import { trackPageView } from "./firebase.js";

const navEl = document.getElementById("nav") as AppNavElement;
if (!navEl) throw new Error("#nav element not found");
const app = document.getElementById("app");
if (!app) throw new Error("#app element not found");

navEl.links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/notes", label: "Notes" },
];
navEl.addEventListener("sign-in", () => signIn());
navEl.addEventListener("sign-out", () => {
  signOut().catch((err) => console.error("Sign-out failed:", err));
});

function updateNav(user: import("firebase/auth").User | null): void {
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
  router.navigate();
});
