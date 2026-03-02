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

type AppState =
  | { user: null; groups: []; groupError: false }
  | { user: User; groups: Group[]; groupError: boolean };

let state: AppState = { user: null, groups: [], groupError: false };

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
      const user = state.user;
      if (!user) {
        return renderHome({ user: null, group: null, groupError: false });
      }
      if (group) {
        return renderHome({ user, group, groupError: false });
      }
      return renderHome({ user, group, groupError: state.groupError });
    },
  },
  { path: "/about", render: renderAbout },
]);

// Hydrate the transaction table whenever it appears in the DOM. Multiple code
// paths trigger renders (hashchange, auth state changes), so an observer
// catches all of them.
// Observer runs for page lifetime: each navigation to "/" produces a new table.
const observer = new MutationObserver(() => {
  const table = app.querySelector("#transactions-table") as HTMLElement | null;
  if (!table || table.dataset.hydrated) return;
  try {
    hydrateTransactionTable(table);
    table.dataset.hydrated = "true";
  } catch (error) {
    if (error instanceof DataIntegrityError) throw error;
    console.error("Hydration error:", error);
    table.dataset.hydrated = "error";
  }
});
observer.observe(app, { childList: true, subtree: true });

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    state = { user: null, groups: [], groupError: false };
    updateNav(null);
    router.navigate();
    return;
  }
  // Set user immediately so concurrent callbacks detect the change
  state = { user, groups: state.user === user ? state.groups : [], groupError: false };
  try {
    const groups = await getUserGroups(user);
    if (state.user !== user) return; // auth state changed during fetch
    state = { user, groups, groupError: false };
  } catch (error) {
    if (error instanceof DataIntegrityError) {
      console.error("Data integrity error in user groups:", error);
      app.innerHTML = '<p>A data error occurred. Please contact support.</p>';
      return;
    }
    console.error("Failed to fetch user groups:", error);
    state = { user, groups: [], groupError: true };
  }
  updateNav(user);
  router.navigate();
});
