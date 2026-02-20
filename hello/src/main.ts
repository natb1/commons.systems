import { createRouter } from "./router";
import { renderHome } from "./pages/home";
import { renderAbout } from "./pages/about";
import { renderNotes } from "./pages/notes";
import { renderNav } from "./components/nav";
import { auth, signIn, signOut, onAuthStateChanged } from "./auth";

const nav = document.getElementById("nav");
const app = document.getElementById("app");

if (app) {
  const navigate = createRouter(app, [
    { path: "/", render: renderHome },
    { path: "/about", render: renderAbout },
    { path: "/notes", render: renderNotes },
  ]);

  onAuthStateChanged(auth, (user) => {
    if (nav) {
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
    navigate();
  });
}
