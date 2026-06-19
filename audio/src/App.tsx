import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Nav } from "@commons-systems/ds";
import { logError } from "@commons-systems/errorutil/log";
import { onAuthStateChanged } from "./auth.js";
import type { User } from "./auth.js";
import { clearCache } from "./audio-cache.js";
import { useRouter } from "./router.js";
import { NavControls } from "./components/NavControls.js";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary.js";
import { Player } from "./Player.js";
import type { PlayerHandle } from "./player.js";
import { Home } from "./pages/Home.js";
import { About } from "./pages/About.js";

export function App() {
  const { path, navigate } = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [playerHandle, setPlayerHandle] = useState<PlayerHandle | null>(null);
  // Bumped when the local folder is connected/regranted, so Home refetches its
  // library (local tracks appear). Ports main.ts:65's router.navigate() refresh.
  const [libraryRefreshKey, setLibraryRefreshKey] = useState(0);

  // Auth state (ports main.ts:106-118). Sets currentUser immediately so the Nav
  // re-renders before any await; clears the cache once on sign-out.
  useEffect(() => {
    const wasSignedIn = { current: false };
    const unsubscribe = onAuthStateChanged(async (user) => {
      const previouslySignedIn = wasSignedIn.current;
      wasSignedIn.current = user !== null;
      setCurrentUser(user);
      if (previouslySignedIn && user === null) {
        try {
          await clearCache();
        } catch (err) {
          logError(err, { operation: "signout-clear-cache" });
        }
      }
    });
    return unsubscribe;
  }, []);

  // Panel toggle: Escape + click-outside close, only while open (matches
  // panel-toggle.ts's no-op-when-closed semantics, and avoids a stale `open`).
  const panelRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const { signal } = controller;
    document.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape") setOpen(false);
      },
      { signal },
    );
    document.addEventListener(
      "click",
      (e) => {
        const target = e.target as Node;
        if (
          panelRef.current &&
          !panelRef.current.contains(target) &&
          toggleRef.current &&
          !toggleRef.current.contains(target)
        ) {
          setOpen(false);
        }
      },
      { signal },
    );
    return () => controller.abort();
  }, [open]);

  // Intercept clicks on in-app nav links (literal href starting with "/").
  // The home link (https://commons.systems/) and "#" auth links are excluded by
  // the attribute test. Respect modified / non-primary clicks so open-in-new-tab
  // still works.
  const onHeaderClick = (e: MouseEvent<HTMLElement>) => {
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;
    const anchor = (e.target as HTMLElement).closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href || !href.startsWith("/")) return;
    if (anchor.target && anchor.target !== "_self") return;
    e.preventDefault();
    navigate(href);
  };

  const activePath = path === "/about" ? "/about" : "/";

  return (
    <div className="page">
      <header onClick={onHeaderClick}>
        <h1>Audio</h1>
        <Nav
          links={[
            { href: "/", label: "Library" },
            { href: "/about", label: "About" },
          ]}
          current={activePath}
          end={
            <NavControls
              user={currentUser}
              onFolderConnected={() => setLibraryRefreshKey((k) => k + 1)}
            />
          }
        />
        <button
          className="panel-toggle"
          id="panel-toggle"
          aria-expanded={open}
          aria-controls="player-panel"
          ref={toggleRef}
          onClick={() => setOpen((v) => !v)}
        >
          ▸
        </button>
      </header>
      <div className="content-grid">
        <main id="app">
          <RouteErrorBoundary>
            {activePath === "/about" ? (
              <About />
            ) : (
              <Home
                user={currentUser}
                player={playerHandle}
                refreshKey={libraryRefreshKey}
              />
            )}
          </RouteErrorBoundary>
        </main>
        <aside
          id="player-panel"
          className={open ? "sidebar open" : "sidebar"}
          ref={panelRef}
        >
          {/* PERSISTENT player — lives outside the route switch so it never
              remounts on navigation. The imperative engine owns its DOM. */}
          <Player onReady={setPlayerHandle} />
        </aside>
      </div>
      <footer>
        <p>
          Created with{" "}
          <a
            href="https://github.com/natb1/commons.systems"
            target="_blank"
            rel="noopener"
          >
            commons.systems
          </a>{" "}
          | &copy; 2026 RUMOR.ML{" "}
          <a
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            target="_blank"
            rel="noopener"
          >
            <img
              src="https://mirrors.creativecommons.org/presskit/buttons/88x31/png/by-sa.png"
              alt="CC-BY-SA"
              className="cc-badge"
            />
          </a>
        </p>
      </footer>
    </div>
  );
}
