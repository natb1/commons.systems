import { createRouter } from "./router";
import { renderHome } from "./pages/home";
import { renderAbout } from "./pages/about";
import { renderNav } from "./components/nav";

const nav = document.getElementById("nav");
const app = document.getElementById("app");

if (nav) {
  nav.innerHTML = renderNav();
}

if (app) {
  createRouter(app, [
    { path: "/", render: renderHome },
    { path: "/about", render: renderAbout },
  ]);
}
