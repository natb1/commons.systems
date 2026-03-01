import { createRouter, parseHash } from "./router.js";
import { renderHome } from "./pages/home.js";
import { renderAbout } from "./pages/about.js";
import { renderNav } from "./components/nav.js";
import { hydrateTransactionTable } from "./pages/home-hydrate.js";
import { auth, signIn, signOut, onAuthStateChanged, type User } from "./auth.js";
import { getUserGroups, type Group } from "./firestore.js";
import { DataIntegrityError } from "./errors.js";

const nav = document.getElementById("nav");
if (!nav) throw new Error("#nav element not found");
const app = document.getElementById("app");
if (!app) throw new Error("#app element not found");

interface AppState { groups: Group[]; user: User | null; groupError: boolean; }
const state: AppState = { groups: [], user: null, groupError: false };

function getGroupParam(): string | null {
  return parseHash().params.get("group");
}

function setGroupParam(groupId: string): void {
  const { path, params } = parseHash();
  params.set("group", groupId);
  location.hash = `${path}?${params.toString()}`;
}

function selectedGroup(): Group | null {
  if (state.groups.length === 0) return null;
  const param = getGroupParam();
  return state.groups.find((g) => g.id === param) ?? state.groups[0];
}

function updateNav(user: User | null): void {
  const group = selectedGroup();
  nav.innerHTML = renderNav(user, state.groups, group?.id ?? null);
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

const router = createRouter(app, [
  {
    path: "/",
    render: () => {
      const group = selectedGroup();
      return renderHome({
        user: state.user,
        group,
        groupError: state.groupError,
      });
    },
  },
  { path: "/about", render: renderAbout },
]);

// Hydrate the transaction table whenever it appears in the DOM. Multiple code
// paths trigger renders (hashchange, auth state changes), so an observer
// catches all of them.
// Observer runs for page lifetime: each navigation to "/" produces a new table.
const observer = new MutationObserver(() => {
  try {
    const table = app.querySelector("#transactions-table") as HTMLElement | null;
    if (table && !table.dataset.hydrated) {
      hydrateTransactionTable(table);
      table.dataset.hydrated = "true";
    }
  } catch (error) {
    console.error("Hydration error:", error);
    const table = app.querySelector("#transactions-table") as HTMLElement | null;
    if (table) table.dataset.hydrated = "true";
  }
});
observer.observe(app, { childList: true, subtree: true });

onAuthStateChanged(auth, async (user) => {
  state.user = user;
  state.groupError = false;
  if (user) {
    try {
      state.groups = await getUserGroups(user);
    } catch (error) {
      if (error instanceof DataIntegrityError) {
        throw error; // data integrity error — surface, don't swallow
      }
      console.error("Failed to fetch user groups:", error);
      state.groups = [];
      state.groupError = true;
    }
  } else {
    state.groups = [];
  }
  updateNav(user);
  router.navigate();
});
