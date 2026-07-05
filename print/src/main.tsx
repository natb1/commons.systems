import "missing.css";
import "./style/theme.css";
import { createHistoryRouter } from "@commons-systems/router";
import { PageShell } from "@commons-systems/ds";
import { classifyError } from "@commons-systems/errorutil/classify";
import { logError } from "@commons-systems/errorutil/log";
import { loadMediaHtml, afterRenderHome, wireDownloadActions, wireLoadMore } from "./pages/home.js";
import { wireMarkdownActions } from "./markdown-actions.js";
import { initLocalFolder } from "./local-folder-ui.js";
import { renderView, getViewFrame, markViewNotFound } from "./pages/view.js";
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import { AppNav, NAV_LINKS } from "./components/AppNav.js";
import { Hero } from "./pages/Hero.js";
import { About } from "./pages/About.js";
import { Home } from "./pages/Home.js";
import { ViewPage } from "./pages/View.js";
import { signIn, signOut, onAuthStateChanged } from "./auth.js";
import type { User } from "./auth.js";
import { setViewerEmail, markLocalFolderReady } from "./library.js";
import { trackPageView } from "./firebase.js";

let currentUser: User | null = null;

// Childless mount node we own outright. AppNav injects it (opaquely) into the
// PageShell Nav's `end` slot; initLocalFolder fills it imperatively below.
// Because the node has no React children, React never re-touches its injected
// content, so the local-folder button survives shell re-renders on auth state
// change.
const localFolderSlot = document.createElement("span");
localFolderSlot.id = "local-folder";

const rootMount = document.getElementById("root");
if (!rootMount) throw new Error("#root element not found");
const shellRoot = createRoot(rootMount);
function renderShell() {
  shellRoot.render(
    <PageShell
      wordmark="Print"
      navLinks={NAV_LINKS}
      navEnd={
        <AppNav
          user={currentUser}
          onSignIn={() => signIn()}
          onSignOut={() => void signOut()}
          localFolderSlot={localFolderSlot}
        />
      }
      hero={<div id="hero-container" className="content-grid" />}
    >
      <main id="app" />
    </PageShell>,
  );
}

// First render uses flushSync so the shell's #app/#hero-container nodes exist
// synchronously before the one-time wiring below queries them.
flushSync(() => renderShell());
const app = document.getElementById("app");
if (!app) throw new Error("#app element not found");
const heroContainer = document.getElementById("hero-container");
if (!heroContainer) throw new Error("#hero-container element not found");

createRoot(heroContainer).render(<Hero />);

// Mount the local-folder UI once, after the shell's first render places the
// slot in the DOM. We own the mount node, so this runs unconditionally.
initLocalFolder(localFolderSlot, app, () => router.navigate())
  .catch((err) => logError(err, { operation: "init-local-folder" }))
  .finally(() => markLocalFolderReady());

wireDownloadActions(app);
wireMarkdownActions(app);
// Delegated on the persistent #app root ONCE (not per home render), so repeated
// home visits never stack duplicate load-more listeners (#1280 pattern).
wireLoadMore(app);

// Generalized router→React page lifecycle. A page route renders an empty
// `#page-root` placeholder (string), then mounts a React root into it in
// afterRender. The previous page's root is unmounted in onNavigate, before the
// router wipes the outlet's innerHTML.
let currentPageRoot: Root | null = null;
let homeState: { mediaHtml: string; user: User | null } | null = null;

const router = createHistoryRouter(
  app,
  [
    {
      path: "/",
      render: async () => {
        homeState = { mediaHtml: await loadMediaHtml(), user: currentUser };
        return '<div id="page-root"></div>';
      },
      afterRender: (outlet) => {
        const mount = outlet.querySelector("#page-root");
        if (!mount || !homeState) return;
        const state = homeState;
        currentPageRoot = createRoot(mount as HTMLElement);
        // flushSync so the dangerouslySetInnerHTML media DOM is committed
        // synchronously BEFORE afterRenderHome queries #media-list to prepend
        // local items. React 18 createRoot.render is otherwise concurrent/deferred.
        flushSync(() =>
          currentPageRoot!.render(
            <Home mediaHtml={state.mediaHtml} user={state.user} />,
          ),
        );
        afterRenderHome(outlet);
      },
    },
    {
      path: /^\/view\/([^/]+)$/,
      render: async (path) => {
        let id: string;
        try {
          id = decodeURIComponent(path.slice("/view/".length));
        } catch {
          // Malformed percent-encoding (e.g. /view/%ZZ) is normal user input,
          // not an error to report — treat it as a missing item. renderView is
          // intentionally NOT called; markViewNotFound sets the "notFound" frame
          // so afterRender mounts the not-found <ViewPage>.
          markViewNotFound();
          return '<div id="page-root"></div>';
        }
        await renderView(id, currentUser);
        return '<div id="page-root"></div>';
      },
      afterRender: (outlet) => {
        const mount = outlet.querySelector("#page-root");
        if (!mount) return;
        currentPageRoot = createRoot(mount as HTMLElement);
        // No flushSync/querySelector dance: <Viewer> mounts the viewer chrome and
        // the controller hook inits inside its own effect, after React commits the
        // canvas node.
        currentPageRoot.render(<ViewPage frame={getViewFrame()} />);
      },
    },
    {
      path: "/about",
      render: () => '<div id="page-root"></div>',
      afterRender: (outlet) => {
        const mount = outlet.querySelector("#page-root");
        if (!mount) return;
        currentPageRoot = createRoot(mount as HTMLElement);
        currentPageRoot.render(<About />);
      },
    },
  ],
  {
    onNavigate: ({ path }) => {
      // Unmounting the page root triggers the viewer controller hook's
      // effect-cleanup (full teardown), so there is no separate cleanup step.
      currentPageRoot?.unmount();
      currentPageRoot = null;
      trackPageView(path);
    },
    formatError: (error) => {
      if (classifyError(error) === "data-integrity")
        return "A data error occurred. Please contact support.";
      return undefined;
    },
  },
);

onAuthStateChanged((user) => {
  currentUser = user;
  renderShell();
  heroContainer.hidden = user !== null;
  setViewerEmail(user?.email ?? null);
  router.navigate();
});
