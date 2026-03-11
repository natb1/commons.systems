import { createRouter, parseHash } from "@commons-systems/router";
import { renderHome } from "./pages/home.js";
import { renderBudgets } from "./pages/budgets.js";
import "@commons-systems/style/components/nav";
import type { AppNavElement } from "@commons-systems/style/components/nav";
import { escapeHtml } from "@commons-systems/htmlutil";
import type { RenderPageOptions } from "./pages/render-options.js";
import { hydrateTransactionTable } from "./pages/home-hydrate.js";
import { hydrateBudgetTable } from "./pages/budgets-hydrate.js";
import { auth, signIn, signOut, onAuthStateChanged, type User } from "./auth.js";
import { getUserGroups as _getUserGroups, type Group } from "@commons-systems/authutil/groups";
import { db, NAMESPACE, trackPageView } from "./firebase.js";
import { DataIntegrityError } from "./errors.js";

function getUserGroups(user: User): Promise<Group[]> {
  return _getUserGroups(db, NAMESPACE, user);
}

const navEl = document.getElementById("nav") as AppNavElement;
if (!navEl) throw new Error("#nav element not found");
const app = document.getElementById("app") as HTMLElement;
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

navEl.links = [{ href: "#/", label: "transactions" }, { href: "#/budgets", label: "budgets" }];
navEl.addEventListener("sign-in", () => signIn());
navEl.addEventListener("sign-out", () => {
  signOut().catch((error) => console.error("Unexpected sign-out error:", error));
});

function updateNav(user: User | null): void {
  navEl.user = user;
  const group = selectedGroup();
  let select = navEl.querySelector("#group-select") as HTMLSelectElement | null;
  if (user && state.groups.length > 0) {
    if (!select) {
      select = document.createElement("select");
      select.id = "group-select";
      select.setAttribute("aria-label", "Select group");
      const authContainer = navEl.querySelector(".nav-auth");
      if (!authContainer) throw new Error(".nav-auth container not found in app-nav");
      authContainer.insertBefore(select, authContainer.querySelector("#sign-out"));
      select.addEventListener("change", (e) => setGroupParam((e.target as HTMLSelectElement).value));
    }
    select.innerHTML = state.groups.map(g => {
      const sel = g.id === (group?.id ?? null) ? " selected" : "";
      return `<option value="${escapeHtml(g.id)}"${sel}>${escapeHtml(g.name)}</option>`;
    }).join("");
  } else if (select) {
    select.remove();
  }
}

// Show login UI immediately; onAuthStateChanged will update once auth resolves.
updateNav(null);

function renderOptions(): RenderPageOptions {
  const group = selectedGroup();
  const user = state.user;
  if (!user) return { user: null, group: null, groupError: false };
  if (group) return { user, group, groupError: false };
  return { user, group, groupError: state.groupError };
}

const router = createRouter(
  app,
  [
    { path: "/", render: () => renderHome(renderOptions()) },
    { path: "/budgets", render: () => renderBudgets(renderOptions()) },
  ],
  {
    onNavigate: trackPageView,
    formatError: (error) => {
      if (error instanceof DataIntegrityError || error instanceof RangeError)
        return "A data error occurred. Please contact support.";
      return undefined;
    },
  },
);

function transition(next: AppState): void {
  state = next;
  updateNav(next.user);
  router.navigate();
}

// Hydrate tables (transactions, budgets) whenever they appear in the DOM.
// Multiple code paths trigger renders (hashchange, auth state changes), so an
// observer catches all of them. Sets dataset.hydrated to "true" on success or
// "error" on failure to prevent retry loops.
// Observer runs for page lifetime: each render replaces page content, so
// tables start unhydrated and need re-initialization.
function hydrateTable(
  selector: string,
  hydrate: (el: HTMLElement) => void,
): void {
  const table = app.querySelector(selector) as HTMLElement | null;
  if (!table || table.dataset.hydrated) return;
  try {
    hydrate(table);
    table.dataset.hydrated = "true";
  } catch (error) {
    table.dataset.hydrated = "error";
    // Programmer errors: rethrow asynchronously so they surface in devtools
    // without killing the MutationObserver.
    if (error instanceof TypeError || error instanceof ReferenceError) {
      setTimeout(() => { throw error; }, 0);
      return;
    }
    console.error("Hydration error:", error);
    table.querySelectorAll("input, select").forEach((el) => {
      (el as HTMLInputElement | HTMLSelectElement).disabled = true;
    });
    const msg = document.createElement("p");
    msg.textContent = error instanceof DataIntegrityError
      ? "A data error occurred. Please contact support."
      : "Editing is temporarily unavailable. Try refreshing the page.";
    table.appendChild(msg);
  }
}

const observer = new MutationObserver(() => {
  hydrateTable("#transactions-table", hydrateTransactionTable);
  hydrateTable("#budgets-table", hydrateBudgetTable);
});
observer.observe(app, { childList: true, subtree: true });

export interface AuthStateDeps {
  /** Fetches groups the user belongs to from Firestore. */
  getUserGroups: (user: User) => Promise<Group[]>;
  /** Commits final state and triggers nav update + route re-render. */
  transition: (next: AppState) => void;
  /** Displays a terminal error message, halting further route navigation. */
  showTerminalError: (html: string) => void;
  /** Returns the current app state snapshot (used for race-condition guards during async operations). */
  getState: () => AppState;
  /** Sets intermediate state without updating nav or triggering route re-render (e.g., setting user before async group fetch). */
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
      groups: currentState.user === user && !currentState.groupError ? currentState.groups : [],
      groupError: false,
    });
    try {
      const groups = await deps.getUserGroups(user);
      if (deps.getState().user !== user) return; // auth state changed during fetch
      deps.transition({ user, groups, groupError: false });
    } catch (error) {
      if (error instanceof DataIntegrityError) {
        console.error("Data integrity error in user groups:", error);
        deps.showTerminalError("<p>A data error occurred. Please contact support.</p>");
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
  showTerminalError: router.showTerminalError,
  getState: () => state,
  setState: (next) => { state = next; },
});

onAuthStateChanged(auth, (user) => {
  handleAuth(user).catch((error) => {
    console.error("Unhandled error in auth state handler:", error);
  });
});
