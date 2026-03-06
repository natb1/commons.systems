import { createRouter } from "./router.js";
import { renderHome } from "./pages/home.js";
import { renderAbout } from "./pages/about.js";
import { renderNotes } from "./pages/notes.js";
import "@commons-systems/style/components/nav";
import type { AppNavElement } from "@commons-systems/style/components/nav";
import { auth, signIn, signOut, onAuthStateChanged } from "./auth.js";

const navEl = document.getElementById("nav") as AppNavElement;
const app = document.getElementById("app");

navEl.links = [
  { href: "#/", label: "Home" },
  { href: "#/about", label: "About" },
  { href: "#/notes", label: "Notes" },
];
navEl.addEventListener("sign-in", (e) => { e.preventDefault(); signIn(); });
navEl.addEventListener("sign-out", (e) => { e.preventDefault(); void signOut(); });

function updateNav(user: import("firebase/auth").User | null): void {
  navEl.user = user;
}

// Render nav immediately with unauthenticated state
updateNav(null);

if (app) {
  const navigate = createRouter(app, [
    { path: "/", render: renderHome },
    { path: "/about", render: renderAbout },
    { path: "/notes", render: renderNotes },
  ]);

  onAuthStateChanged(auth, (user) => {
    updateNav(user);
    navigate();
  });
}
