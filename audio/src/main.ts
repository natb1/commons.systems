import "missing.css";
import "./style/theme.css";
import { createHistoryRouter } from "@commons-systems/router";
import { classifyError } from "@commons-systems/errorutil/classify";
import { renderHome, afterRenderHome } from "./pages/home.js";
import { renderAbout } from "./pages/about.js";
import "@commons-systems/style/components/nav";
import type { AppNavElement } from "@commons-systems/style/components/nav";
import { signIn, signOut, onAuthStateChanged } from "./auth.js";
import type { User } from "./auth.js";
import { trackPageView } from "./firebase.js";
import { renderHero } from "./pages/hero.js";
import { mountHero } from "@commons-systems/style/hero";
import { initPanelToggle } from "@commons-systems/style/panel-toggle";
import { initPlayer } from "./player.js";

const navEl = document.getElementById("nav") as AppNavElement;
if (!navEl) throw new Error("#nav element not found");
const app = document.getElementById("app");
if (!app) throw new Error("#app element not found");

const heroContainer = document.getElementById("hero-container") as HTMLElement;
if (!heroContainer) throw new Error("#hero-container element not found");
heroContainer.hidden = true;
mountHero(heroContainer, renderHero);

const playerPanel = document.getElementById("player-panel") as HTMLElement;
if (!playerPanel) throw new Error("#player-panel element not found");
const panelToggle = document.getElementById("panel-toggle") as HTMLElement;
if (!panelToggle) throw new Error("#panel-toggle element not found");
const audioEl = document.getElementById("audio-player") as HTMLAudioElement;
if (!audioEl) throw new Error("#audio-player element not found");
const nowPlayingEl = document.getElementById("now-playing") as HTMLElement;
if (!nowPlayingEl) throw new Error("#now-playing element not found");

initPanelToggle(playerPanel, panelToggle);
const player = initPlayer(audioEl, nowPlayingEl);

navEl.links = [
  { href: "/", label: "Library" },
  { href: "/about", label: "About" },
];
navEl.addEventListener("sign-in", () => signIn());
navEl.addEventListener("sign-out", () => void signOut());

let currentUser: User | null = null;

navEl.user = null;

const router = createHistoryRouter(
  app,
  [
    {
      path: "/",
      render: () => renderHome(currentUser),
      afterRender: (outlet) => afterRenderHome(outlet, player),
    },
    { path: "/about", render: renderAbout },
  ],
  {
    onNavigate: ({ path }) => trackPageView(path),
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
  router.navigate();
});
