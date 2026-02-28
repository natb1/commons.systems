import { createRouter } from "./router.js";
import { renderHome } from "./pages/home.js";
import { renderAbout } from "./pages/about.js";
import { renderNav } from "./components/nav.js";
import { hydrateTransactionTable } from "./pages/home-hydrate.js";
import { auth, signIn, signOut, onAuthStateChanged, type User } from "./auth.js";
import { getUserGroups, type Group } from "./firestore.js";

const nav = document.getElementById("nav");
if (!nav) throw new Error("#nav element not found");
const app = document.getElementById("app");
if (!app) throw new Error("#app element not found");

let currentGroups: Group[] = [];
let currentUser: User | null = null;
let currentGroupError = false;

function parseHash(): { path: string; params: URLSearchParams } {
  const hash = location.hash.slice(1) || "/";
  const qIndex = hash.indexOf("?");
  return qIndex === -1
    ? { path: hash, params: new URLSearchParams() }
    : { path: hash.slice(0, qIndex), params: new URLSearchParams(hash.slice(qIndex + 1)) };
}

function getGroupParam(): string | null {
  return parseHash().params.get("group");
}

function setGroupParam(groupId: string): void {
  const { path } = parseHash();
  location.hash = `${path}?group=${encodeURIComponent(groupId)}`;
}

function selectedGroup(): Group | null {
  if (currentGroups.length === 0) return null;
  const param = getGroupParam();
  return currentGroups.find((g) => g.id === param) ?? currentGroups[0];
}

function updateNav(user: User | null): void {
  const group = selectedGroup();
  nav.innerHTML = renderNav(user, currentGroups, group?.id ?? null);
  document.getElementById("sign-in")?.addEventListener("click", (e) => {
    e.preventDefault();
    signIn();
  });
  document.getElementById("sign-out")?.addEventListener("click", (e) => {
    e.preventDefault();
    void signOut();
  });
  document.getElementById("group-select")?.addEventListener("change", (e) => {
    const select = e.target as HTMLSelectElement;
    setGroupParam(select.value);
  });
}

// Render nav immediately with unauthenticated state
updateNav(null);

const navigate = createRouter(app, [
  {
    path: "/",
    render: () => {
      const group = selectedGroup();
      return renderHome({
        user: currentUser,
        group,
        groupError: currentGroupError,
      });
    },
  },
  { path: "/about", render: renderAbout },
]);

// The router sets innerHTML asynchronously, so we watch for the table
// to appear rather than hydrating inline after render.
const observer = new MutationObserver(() => {
  const table = app.querySelector("#transactions-table") as HTMLElement | null;
  if (table && !table.dataset.hydrated) {
    table.dataset.hydrated = "true";
    observer.disconnect();
    hydrateTransactionTable(table);
  }
});
observer.observe(app, { childList: true, subtree: true });

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  currentGroupError = false;
  if (user) {
    try {
      currentGroups = await getUserGroups(user);
    } catch (error) {
      console.error("Failed to fetch user groups:", error);
      currentGroups = [];
      currentGroupError = true;
    }
  } else {
    currentGroups = [];
  }
  updateNav(user);
  navigate();
});
