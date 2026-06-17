import "missing.css";
import "./style/theme.css";
import { createHistoryRouter } from "@commons-systems/router";
import { classifyError } from "@commons-systems/errorutil/classify";
import { logError } from "@commons-systems/errorutil/log";
import { renderHome, afterRenderHome } from "./pages/home.js";
import { renderAbout } from "./pages/about.js";
import "@commons-systems/components/nav";
import type { AppNavElement } from "@commons-systems/components/nav";
import { signIn, signOut, onAuthStateChanged } from "./auth.js";
import type { User } from "./auth.js";
import { trackPageView } from "./firebase.js";
import { clearCache } from "./audio-cache.js";
import { initPanelToggle } from "@commons-systems/components/panel-toggle";
import { initPlayer } from "./player.js";
import {
  ensureLocalFolderRestored,
  getLocalFolderState,
  isLocalFolderSupported,
  connectLocalFolder,
  regrantLocalFolder,
  listLocalTracks,
} from "./local-source.js";
import { getPlayerState } from "./sidecar.js";

const navEl = document.getElementById("nav") as AppNavElement;
if (!navEl) throw new Error("#nav element not found");
const folderSlot = document.getElementById("nav-folder-slot") as HTMLSpanElement;
if (!folderSlot) throw new Error("#nav-folder-slot element not found");
const app = document.getElementById("app");
if (!app) throw new Error("#app element not found");

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

function renderFolderSlot(): void {
  if (!isLocalFolderSupported()) {
    folderSlot.innerHTML = "";
    return;
  }
  const state = getLocalFolderState();
  let label: string;
  switch (state) {
    case "granted":
      label = "Change folder";
      break;
    case "prompt":
      label = "Reconnect folder";
      break;
    default:
      label = "Choose folder";
      break;
  }
  folderSlot.innerHTML = `<button id="nav-folder-btn" type="button">${label}</button>`;
  folderSlot.querySelector<HTMLButtonElement>("#nav-folder-btn")!.addEventListener("click", () => {
    const action = state === "prompt" ? regrantLocalFolder() : connectLocalFolder();
    action
      .then(() => { renderFolderSlot(); router.navigate(); })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        logError(err, { operation: "nav-folder-btn" });
      });
  });
}

void (async () => {
  await ensureLocalFolderRestored();
  renderFolderSlot();
  const localItems = await listLocalTracks();
  const state = await getPlayerState();
  if (state) player.restore(state, localItems);
})().catch((err) => logError(err, { operation: "restore-player-state" }));

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
      afterRender: (outlet) => afterRenderHome(outlet, player, currentUser, renderFolderSlot),
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

onAuthStateChanged(async (user) => {
  const wasSignedIn = currentUser !== null;
  currentUser = user;
  navEl.user = user; // nav UI updates immediately, before the await
  if (wasSignedIn && user === null) {
    try {
      await clearCache();
    } catch (err) {
      logError(err, { operation: "signout-clear-cache" });
    }
  }
  router.navigate();
});
