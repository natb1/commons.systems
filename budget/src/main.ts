import { createRouter } from "./router.js";
import { renderHome } from "./pages/home.js";
import { renderAbout } from "./pages/about.js";
import { renderNav } from "./components/nav.js";
import { hydrateTransactionTable } from "./pages/home-hydrate.js";
import { auth, signIn, signOut, onAuthStateChanged, type User } from "./auth.js";
import { getUserGroups, type Group } from "./firestore.js";

const nav = document.getElementById("nav");
const app = document.getElementById("app");

let currentGroups: Group[] = [];
let currentUser: User | null = null;
let currentGroupError = false;

function getGroupParam(): string | null {
  const hash = location.hash.slice(1) || "/";
  const qIndex = hash.indexOf("?");
  if (qIndex === -1) return null;
  const params = new URLSearchParams(hash.slice(qIndex + 1));
  return params.get("group");
}

function setGroupParam(groupId: string): void {
  const hash = location.hash.slice(1) || "/";
  const qIndex = hash.indexOf("?");
  const path = qIndex === -1 ? hash : hash.slice(0, qIndex);
  location.hash = `${path}?group=${encodeURIComponent(groupId)}`;
}

function selectedGroup(): Group | null {
  if (currentGroups.length === 0) return null;
  const param = getGroupParam();
  return currentGroups.find((g) => g.id === param) ?? currentGroups[0];
}

function updateNav(user: User | null): void {
  if (!nav) return;
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

if (app) {
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

  // Hydrate transaction table when it appears in the DOM
  const observer = new MutationObserver(() => {
    const table = app.querySelector("#transactions-table") as HTMLElement | null;
    if (table && !table.dataset.hydrated) {
      table.dataset.hydrated = "true";
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
      // Default to first group if no valid group param
      if (currentGroups.length > 0 && !selectedGroup()) {
        setGroupParam(currentGroups[0].id);
      }
    } else {
      currentGroups = [];
    }
    updateNav(user);
    navigate();
  });
}
