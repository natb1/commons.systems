import { useEffect, useState } from "react";
import { Button, Checkbox } from "@commons-systems/ds";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import { logError } from "@commons-systems/errorutil/log";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import type { User } from "../auth.js";
import type { LibraryItem } from "../types.js";
import { listLibrary } from "../library.js";
import { formatDuration } from "../player.js";
import type { PlayerHandle } from "../player.js";

export interface HomeProps {
  user: User | null;
  player: PlayerHandle | null;
}

type LibraryState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "loaded"; items: LibraryItem[] };

function Row({ item }: { item: LibraryItem }) {
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
 * Library page (ports home.ts's renderHome). This unit owns the render
 * structure and the data fetch (loading / empty / error / list branches), the
 * anon notice, the expandable rows, and the cache section. The interactive
 * wiring (checkbox -> player, cache-stats text, clear-cache onClick, focus
 * rescan) lands in Unit 5 — the checkbox stays uncontrolled, #cache-stats stays
 * empty, and the Button carries no onClick here.
 */
export function Home(props: HomeProps) {
  const { user } = props;
  const [state, setState] = useState<LibraryState>({ status: "loading" });
  // A DataIntegrityError is stored, then thrown during render so the route-level
  // RouteErrorBoundary catches it (a component cannot catch its own throw).
  const [fatalError, setFatalError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    listLibrary(user)
      .then((items) => {
        if (cancelled) return;
        setState({ status: "loaded", items });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof DataIntegrityError) {
          setFatalError(error);
          return;
        }
        if (!deferProgrammerError(error)) {
          logError(error, { operation: "load-media" });
        }
        setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

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
            <Row key={item.id} item={item} />
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
          <span id="cache-stats"></span>
        </p>
        <Button id="clear-cache-btn">Clear audio cache</Button>
      </section>
    </>
  );
}
