import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Button, Checkbox } from "@commons-systems/ds";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import { logError } from "@commons-systems/errorutil/log";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import type { User } from "../auth.js";
import type { LibraryItem } from "../types.js";
import { listLibrary } from "../library.js";
import { formatDuration } from "../player.js";
import type { PlayerHandle } from "../player.js";
import { getCacheStats, clearCache, CACHE_UPDATED_EVENT } from "../audio-cache.js";
import { enrichLocalTracks, listLocalTracks } from "../local-source.js";
import { savePlaylist, getPlaylists } from "../sidecar.js";

export interface HomeProps {
  user: User | null;
  player: PlayerHandle | null;
  refreshKey: number;
}

type LibraryState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "loaded"; items: LibraryItem[] };

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function Row({
  item,
  player,
  onQueueChange,
}: {
  item: LibraryItem;
  player: PlayerHandle | null;
  onQueueChange: () => void;
}) {
  const onToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.currentTarget.checked;
    try {
      const { id, title, artist, album, origin, storagePath, localName } = item;
      const locatorOk = origin === "local" ? !!localName : !!storagePath;
      if (!id || !title || !artist || !album || !origin || !locatorOk) {
        logError(new Error("Queue toggle: missing data attributes on audio row"), {
          operation: "queue-toggle",
        });
        return;
      }
      if (!player) return;
      if (checked) {
        player.add({
          id,
          title,
          artist,
          album,
          origin,
          ...(origin === "local" ? { localName } : { storagePath }),
        });
      } else {
        player.remove(id);
      }
    } finally {
      // Re-render Home so the controlled `checked` reasserts from isQueued on
      // every exit path (add, remove, validation-fail, or !player).
      onQueueChange();
    }
  };

  return (
    <details
      className="expand-row audio-row"
      data-id={item.id}
      data-origin={item.origin}
      data-storage-path={item.storagePath}
      data-local-name={item.localName ?? ""}
      data-title={item.title}
      data-artist={item.artist}
      data-album={item.album}
    >
      <summary>
        <div className="expand-summary">
          <Checkbox
            className="queue-checkbox"
            label={null}
            data-queue-toggle
            aria-label={`Add ${item.title} to queue`}
            checked={player ? player.isQueued(item.id) : false}
            onChange={onToggle}
          />
          <span className="title">{item.title}</span>
          <span className="artist">{item.artist}</span>
          <span className="album">{item.album}</span>
        </div>
      </summary>
      <div className="expand-details">
        <dl>
          <dt>Track</dt>
          <dd>{item.trackNumber !== null ? String(item.trackNumber) : "—"}</dd>
          <dt>Genre</dt>
          <dd>{item.genre}</dd>
          <dt>Year</dt>
          <dd>{item.year !== null ? String(item.year) : "—"}</dd>
          <dt>Duration</dt>
          <dd>{formatDuration(item.duration)}</dd>
          <dt>Format</dt>
          <dd>{item.format}</dd>
          <dt>Source</dt>
          <dd>{item.sourceNotes}</dd>
        </dl>
      </div>
    </details>
  );
}

/**
 * Library page (ports home.ts's renderHome + afterRenderHome). This unit wires
 * the interactive behavior: the queue checkbox -> player, the #cache-stats text,
 * the clear-cache onClick, the window-focus library rescan, and the
 * folder-connect-driven refetch (via the App-owned refreshKey).
 */
export function Home(props: HomeProps) {
  const { user, player, refreshKey } = props;
  const [state, setState] = useState<LibraryState>({ status: "loading" });
  const [cacheStats, setCacheStats] = useState("");
  const [playlistNames, setPlaylistNames] = useState<string[]>([]);
  // A DataIntegrityError is stored, then thrown during render so the route-level
  // RouteErrorBoundary catches it (a component cannot catch its own throw).
  const [fatalError, setFatalError] = useState<unknown>(null);
  // A force-render counter: bumped on every queue toggle so Home (and each
  // non-memoized Row) re-renders and recomputes the controlled `checked` from
  // player.isQueued. Its value is never read in render.
  const [, bumpQueue] = useReducer((n: number) => n + 1, 0);

  // Guards async setState after unmount: a late getCacheStats() / listLibrary()
  // resolution must not touch state once Home is gone.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Ports home.ts:80-94's refreshCacheStats. Stable identity ([] deps) so the
  // cache effect registers its document listener exactly once.
  const refreshCacheStats = useCallback(() => {
    getCacheStats()
      .then(({ trackCount, totalBytes }) => {
        if (!mountedRef.current) return;
        setCacheStats(
          `${trackCount} track${trackCount !== 1 ? "s" : ""} cached (${formatBytes(totalBytes)})`,
        );
      })
      .catch((err: unknown) => {
        if (!mountedRef.current) return;
        logError(err, { operation: "cache-stats" });
        setCacheStats("Cache stats unavailable");
      });
  }, []);

  // Ports home.ts:122-133. `isRescan` distinguishes the two callers:
  //  - initial load (false): sets loading, then loaded/error (#media-error),
  //    rethrows DataIntegrityError to the boundary.
  //  - focus rescan (true): no loading state, swaps in the new items in place,
  //    and on error logs {operation:"library-rescan"} leaving the region intact.
  const loadLibrary = useCallback(
    async (isRescan: boolean, isActive: () => boolean): Promise<boolean> => {
      if (!isRescan) setState({ status: "loading" });
      try {
        const items = await listLibrary(user);
        if (!isActive()) return false;
        setState({ status: "loaded", items });
        return true;
      } catch (error: unknown) {
        if (!isActive()) return false;
        if (isRescan) {
          logError(error, { operation: "library-rescan" });
          return false; // leave the current region intact
        }
        if (error instanceof DataIntegrityError) {
          setFatalError(error);
          return false;
        }
        if (!deferProgrammerError(error)) {
          logError(error, { operation: "load-media" });
        }
        setState({ status: "error" });
        return false;
      }
    },
    [user],
  );

  // Initial load + cache-first enrichment (ports home.ts:267-270). The first
  // load shows cached/placeholder tags immediately (cheap, no IO); the async
  // enrichment pass then extracts tags from any uncached local files, and a
  // rescan reload swaps in the real tags. Runs on mount, user change, or a
  // folder-connect refreshKey bump. The `cancelled` flag guards against
  // stale-user / unmount races.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // Skip enrichment when the first load failed: a fatal DataIntegrityError
      // hands off to the error boundary, and a plain error already shows
      // #media-error — re-listing would just fail again (mirrors the old
      // afterRenderHome only running after a successful render).
      const ok = await loadLibrary(false, () => !cancelled);
      if (cancelled || !ok) return;
      await enrichLocalTracks();
      if (cancelled) return;
      await loadLibrary(true, () => !cancelled);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadLibrary, refreshKey]);

  // Focus rescan (home.ts:143-154): on window focus, re-enrich (a folder the user
  // edited while away may have new files) then re-fetch the library, behind a
  // re-entrancy guard, leaving the region intact on error. enrichLocalTracks
  // suppresses its sidecar write when nothing new was extracted.
  const rescanningRef = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    window.addEventListener(
      "focus",
      () => {
        if (rescanningRef.current) return;
        rescanningRef.current = true;
        void (async () => {
          await enrichLocalTracks();
          await loadLibrary(true, () => mountedRef.current);
        })().finally(() => {
          rescanningRef.current = false;
        });
      },
      { signal: controller.signal },
    );
    return () => controller.abort();
  }, [loadLibrary]);

  // Cache stats: refresh on mount and on each CACHE_UPDATED_EVENT. The unmount
  // cleanup removes the listener, so a stale cache event after navigation away
  // neither updates state nor logs (replaces the old isOutletCurrent guard).
  useEffect(() => {
    refreshCacheStats();
    const controller = new AbortController();
    document.addEventListener(
      CACHE_UPDATED_EVENT,
      () => {
        refreshCacheStats();
      },
      { signal: controller.signal },
    );
    return () => controller.abort();
  }, [refreshCacheStats]);

  const onClearCache = () => {
    clearCache()
      .then(refreshCacheStats)
      .catch((err: unknown) => {
        logError(err, { operation: "clear-cache" });
        setCacheStats("Failed to clear cache. Try again.");
      });
  };

  // Playlists (ports home.ts:218-265). Minimal save-current-queue / load-by-name
  // over the sidecar accessors; local-only. The select is reset to its
  // placeholder each render (value="") so re-picking the same playlist re-fires.
  const refreshPlaylists = useCallback(() => {
    getPlaylists()
      .then((playlists) => {
        if (!mountedRef.current) return;
        setPlaylistNames(Object.keys(playlists));
      })
      .catch((err: unknown) => {
        logError(err, { operation: "load-playlist-options" });
      });
  }, []);

  // Load playlist names on mount and after a folder-connect refreshKey bump (the
  // sidecar — hence its playlists — binds during folder restore/connect).
  useEffect(() => {
    refreshPlaylists();
  }, [refreshPlaylists, refreshKey]);

  const onSavePlaylist = () => {
    const name = window.prompt("Playlist name")?.trim();
    if (!name || !player) return;
    const names = player.getLocalQueueNames();
    if (names.length === 0) {
      window.alert("Queue has no local tracks");
      return;
    }
    savePlaylist(name, names)
      .then(refreshPlaylists)
      .catch((err: unknown) => logError(err, { operation: "save-playlist" }));
  };

  const onLoadPlaylist = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.currentTarget.value;
    if (!name || !player) return;
    getPlaylists()
      .then(async (playlists) => {
        const names = playlists[name];
        if (!names) return;
        const items = await listLocalTracks();
        player.loadPlaylist(names, items);
      })
      .catch((err: unknown) => logError(err, { operation: "load-playlist" }));
  };

  if (fatalError !== null) throw fatalError;

  let regionContent: React.ReactNode = null;
  if (state.status === "error") {
    regionContent = <p id="media-error">Could not load audio library.</p>;
  } else if (state.status === "loaded") {
    regionContent =
      state.items.length === 0 ? (
        <p id="media-empty">No audio items available.</p>
      ) : (
        <div id="media-list">
          {state.items.map((item) => (
            <Row
              key={item.id}
              item={item}
              player={player}
              onQueueChange={bumpQueue}
            />
          ))}
        </div>
      );
  }

  return (
    <>
      <h2>Library</h2>
      {!user && (
        <p id="public-notice">
          Showing public domain items. Sign in to see your full library.
        </p>
      )}
      <div id="library-region">{regionContent}</div>
      <section id="cache-info">
        <p>
          <span id="cache-stats">{cacheStats}</span>
        </p>
        <Button id="clear-cache-btn" onClick={onClearCache}>
          Clear audio cache
        </Button>
      </section>
      <section id="playlists">
        <Button id="save-playlist-btn" onClick={onSavePlaylist}>
          Save queue as playlist
        </Button>
        <select
          id="load-playlist-select"
          aria-label="Load playlist"
          value=""
          onChange={onLoadPlaylist}
        >
          <option value="">Load playlist…</option>
          {playlistNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </section>
    </>
  );
}
