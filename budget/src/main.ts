import { createRouter } from "./router.js";
import { renderHome } from "./pages/home.js";
import { renderAbout } from "./pages/about.js";
import { renderNav } from "./components/nav.js";
import { hydrateTransactionTable } from "./pages/home-hydrate.js";
import { auth, signIn, signOut, onAuthStateChanged } from "./auth.js";

const nav = document.getElementById("nav");
const app = document.getElementById("app");

function updateNav(user: import("firebase/auth").User | null): void {
  if (!nav) return;
  nav.innerHTML = renderNav(user);
  document.getElementById("sign-in")?.addEventListener("click", (e) => {
    e.preventDefault();
    signIn();
  });
  document.getElementById("sign-out")?.addEventListener("click", (e) => {
    e.preventDefault();
    void signOut();
  });
}

// Render nav immediately with unauthenticated state
updateNav(null);

if (app) {
  const navigate = createRouter(app, [
    { path: "/", render: () => renderHome(auth.currentUser) },
    { path: "/about", render: renderAbout },
  ]);

  // Hydrate transaction table when it appears in the DOM
  const observer = new MutationObserver(() => {
    const table = app.querySelector("#transactions-table") as HTMLTableElement | null;
    if (table && !table.dataset.hydrated) {
      table.dataset.hydrated = "true";
      hydrateTransactionTable(table);
    }
  });
  observer.observe(app, { childList: true, subtree: true });

  onAuthStateChanged(auth, (user) => {
    updateNav(user);
    navigate();
  });
}
