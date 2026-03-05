import { createRouter, parseHash } from "./router.js";
import { renderHome } from "./pages/home.js";
import { renderAbout } from "./pages/about.js";
import { renderNav } from "./components/nav.js";
import { hydrateTransactionTable } from "./pages/home-hydrate.js";
import { auth, signIn, signOut, onAuthStateChanged, type User } from "./auth.js";
import { getUserGroups as _getUserGroups, type Group } from "@commons-systems/authutil/groups";
import { db, NAMESPACE } from "./firebase.js";
import { DataIntegrityError } from "./errors.js";

function getUserGroups(user: User): Promise<Group[]> {
  return _getUserGroups(db, NAMESPACE, user);
}

const nav = document.getElementById("nav")!;
if (!nav) throw new Error("#nav element not found");
const app = document.getElementById("app");
if (!app) throw new Error("#app element not found");

export type AppState =
  | { user: null; groups: readonly []; groupError: false }
  | { user: User; groups: Group[]; groupError: false }
  | { user: User; groups: readonly []; groupError: true };

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
    // signOut handles failures internally with a toast; outer catch guards against bugs in the error handler
    signOut().catch((error) => console.error("Unexpected sign-out error:", error));
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

function transition(next: AppState): void {
  state = next;
  updateNav(next.user);
  router.navigate();
}

// Hydrate the transaction table whenever it appears in the DOM. Multiple code
// paths trigger renders (hashchange, auth state changes), so an observer
// catches all of them. Sets dataset.hydrated to "true" on success or "error"
// on failure to prevent retry loops.
// Observer runs for page lifetime: each navigation to "/" produces a new table.
const observer = new MutationObserver(() => {
  const table = app.querySelector("#transactions-table") as HTMLElement | null;
  if (!table || table.dataset.hydrated) return;
  try {
    hydrateTransactionTable(table);
    table.dataset.hydrated = "true";
  } catch (error) {
    table.dataset.hydrated = "error";
    // TypeError/ReferenceError: deferred via setTimeout so they surface in
    // devtools without killing the observer. No UI feedback — these are
    // programmer errors that need code fixes, not user-facing recovery.
    if (error instanceof TypeError || error instanceof ReferenceError) {
      setTimeout(() => { throw error; }, 0);
      return;
    }
    // All other errors: inputs are disabled and an error message is appended
    // to preserve the read-only view while signaling that editing is unavailable.
    console.error("Hydration error:", error);
    table.querySelectorAll("input").forEach((el) => {
      el.disabled = true;
    });
    const msg = document.createElement("p");
    msg.textContent = error instanceof DataIntegrityError
      ? "A data error occurred. Please contact support."
      : "Editing is temporarily unavailable. Try refreshing the page.";
    table.appendChild(msg);
  }
});
observer.observe(app, { childList: true, subtree: true });

export interface AuthStateDeps {
  /** Fetches groups the user belongs to from Firestore. */
  getUserGroups: (user: User) => Promise<Group[]>;
  /** Commits final state and triggers nav update + route re-render. */
  transition: (next: AppState) => void;
  /** Tears down the router (removes hashchange listener) on terminal data errors. */
  destroyRouter: () => void;
  /** Replaces app content directly, bypassing the router, for terminal error states. */
  setAppHtml: (html: string) => void;
  /** Returns the current app state snapshot (used for race-condition guards during async operations). */
  getState: () => AppState;
  /** Sets intermediate state without triggering re-render (e.g., setting user before async group fetch). */
  setState: (next: AppState) => void;
}

export function createAuthStateHandler(deps: AuthStateDeps): (user: User | null) => Promise<void> {
  return async (user) => {
    if (!user) {
      deps.transition({ user: null, groups: [], groupError: false });
      return;
    }
    // Set user immediately so concurrent callbacks detect the change
    const currentState = deps.getState();
    deps.setState({
      user,
      groups: currentState.user === user ? currentState.groups : [],
      groupError: false,
    });
    try {
      const groups = await deps.getUserGroups(user);
      if (deps.getState().user !== user) return; // auth state changed during fetch
      deps.transition({ user, groups, groupError: false });
    } catch (error) {
      if (error instanceof DataIntegrityError) {
        console.error("Data integrity error in user groups:", error);
        deps.destroyRouter();
        deps.setAppHtml("<p>A data error occurred. Please contact support.</p>");
        return;
      }
      if (error instanceof TypeError || error instanceof ReferenceError) throw error;
      console.error("Failed to fetch user groups:", error);
      deps.transition({ user, groups: [], groupError: true });
    }
  };
}

const handleAuth = createAuthStateHandler({
  getUserGroups,
  transition,
  destroyRouter: () => router.destroy(),
  setAppHtml: (html) => { app.innerHTML = html; },
  getState: () => state,
  setState: (next) => { state = next; },
});

onAuthStateChanged(auth, (user) => {
  handleAuth(user).catch((error) => {
    console.error("Unhandled error in auth state handler:", error);
  });
});
