import { useEffect, useRef, useState } from "react";
import { PageShell } from "@commons-systems/ds";
import { logError } from "@commons-systems/errorutil/log";
import { onAuthStateChanged } from "./auth.js";
import type { User } from "./auth.js";
import { clearCache } from "./audio-cache.js";
import { useRouter } from "./router.js";
import { NavControls } from "./components/NavControls.js";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary.js";
import { Player } from "./Player.js";
import type { PlayerHandle } from "./player.js";
import { ensureLocalFolderRestored, listLocalTracks } from "./local-source.js";
import { getPlayerState } from "./sidecar.js";
import { Home } from "./pages/Home.js";
import { About } from "./pages/About.js";

export function App() {
  const { path } = useRouter();
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

  // Player-state restore (ports main.ts:75-81). Once the player engine is ready,
  // wait for the local folder to restore (binding the sidecar and making local
  // tracks listable), list local tracks (for title/artist when rebuilding the
  // queue), read the persisted local-only player state, and restore it seeked +
  // paused. Re-runs on libraryRefreshKey so a folder regrant after FSA permission
  // loss still restores the persisted queue; player.restore()'s own queue.length
  // guard prevents a double-restore on the initial load.
  useEffect(() => {
    if (!playerHandle) return;
    let cancelled = false;
    void (async () => {
      await ensureLocalFolderRestored();
      const localItems = await listLocalTracks();
      const restoreState = await getPlayerState();
      if (cancelled || !restoreState) return;
      playerHandle.restore(restoreState, localItems);
    })().catch((err) => logError(err, { operation: "restore-player-state" }));
    return () => {
      cancelled = true;
    };
  }, [playerHandle, libraryRefreshKey]);

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

  const activePath = path === "/about" ? "/about" : "/";

  return (
    <PageShell
      wordmark="Audio"
      navLinks={[
        { href: "/", label: "Library" },
        { href: "/about", label: "About" },
      ]}
      current={activePath}
      navEnd={
        <NavControls
          user={currentUser}
          onFolderConnected={() => setLibraryRefreshKey((k) => k + 1)}
        />
      }
      headerEnd={
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
      }
    >
      <main id="app">
        <RouteErrorBoundary key={activePath}>
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
    </PageShell>
  );
}
