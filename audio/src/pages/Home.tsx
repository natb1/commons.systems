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
    async (isRescan: boolean, isActive: () => boolean) => {
      if (!isRescan) setState({ status: "loading" });
      try {
        const items = await listLibrary(user);
        if (!isActive()) return;
        setState({ status: "loaded", items });
      } catch (error: unknown) {
        if (!isActive()) return;
        if (isRescan) {
          logError(error, { operation: "library-rescan" });
          return; // leave the current region intact
        }
        if (error instanceof DataIntegrityError) {
          setFatalError(error);
          return;
        }
        if (!deferProgrammerError(error)) {
          logError(error, { operation: "load-media" });
        }
        setState({ status: "error" });
      }
    },
    [user],
  );

  // Initial load: on mount, user change, or a folder-connect refreshKey bump.
  // The `cancelled` flag guards against a stale-user race (an earlier user's
  // fetch resolving after the user changed).
  useEffect(() => {
    let cancelled = false;
    void loadLibrary(false, () => !cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadLibrary, refreshKey]);

  // Focus rescan (home.ts:135-145): re-fetch the library on window focus, behind
  // a re-entrancy guard, leaving the region intact on error.
  const rescanningRef = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    window.addEventListener(
      "focus",
      () => {
        if (rescanningRef.current) return;
        rescanningRef.current = true;
        void loadLibrary(true, () => mountedRef.current)
          .finally(() => {
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
    </>
  );
}
