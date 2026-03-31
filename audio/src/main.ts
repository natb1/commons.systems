import "missing.css";
import "./style/theme.css";
import { createHistoryRouter } from "@commons-systems/router";
import { renderHome } from "./pages/home.js";
import { renderAbout } from "./pages/about.js";
import "@commons-systems/style/components/nav";
import type { AppNavElement } from "@commons-systems/style/components/nav";
import { signIn, signOut, onAuthStateChanged } from "./auth.js";
import type { User } from "firebase/auth";
import { trackPageView } from "./firebase.js";

const navEl = document.getElementById("nav") as AppNavElement;
if (!navEl) throw new Error("#nav element not found");
const app = document.getElementById("app");
if (!app) throw new Error("#app element not found");

navEl.links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
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
  ],
  { onNavigate: ({ path }) => trackPageView(path) },
);

onAuthStateChanged((user) => {
  updateNav(user);
  router.navigate();
});
