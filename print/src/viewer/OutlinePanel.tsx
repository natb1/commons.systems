import { useCallback, useEffect, useRef, useState } from "react";
import type { UseViewerControllerResult } from "./useViewerController.js";
import type { OutlineEntry } from "./types.js";

// ---------------------------------------------------------------------------
// OutlineItem
// ---------------------------------------------------------------------------

function OutlineItem({
  entry,
  onActivate,
}: {
  entry: OutlineEntry;
  onActivate: (e: OutlineEntry) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = entry.children.length > 0;

  return (
    <li className="viewer-outline-item" role="treeitem">
      <span className="viewer-outline-row">
        {hasChildren && (
          <button
            className="viewer-outline-toggle"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse" : "Expand"}
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? "▼" : "▶"}
          </button>
        )}
        <a
          className="viewer-outline-entry"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onActivate(entry);
          }}
        >
          {entry.title}
        </a>
      </span>
      {hasChildren && (
        <ul
          className={
            expanded
              ? "viewer-outline-children"
              : "viewer-outline-children outline-collapsed"
          }
          role="group"
        >
          {entry.children.map((c, i) => (
            <OutlineItem key={i} entry={c} onActivate={onActivate} />
          ))}
        </ul>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// OutlinePanel
// ---------------------------------------------------------------------------

/**
 * Outline (table of contents) panel wired to the viewer controller. Replaces
 * the imperative renderOutlineSection + initOutline in outline.ts. Returns
 * null when the renderer does not support outline or the outline is empty.
 *
 * All hooks are called unconditionally (rules-of-hooks); the early return is
 * placed AFTER the hook block.
 */
export function OutlinePanel({
  controller,
}: {
  controller: UseViewerControllerResult;
}) {
  const [entries, setEntries] = useState<OutlineEntry[]>([]);
  const loadedRef = useRef(false);
  const destroyedRef = useRef(false);

  // Unmount guard: mark destroyed so in-flight promises skip setState.
  useEffect(() => {
    return () => {
      destroyedRef.current = true;
    };
  }, []);

  // Load effect: runs when navSignal changes but loads exactly once (once-guard
  // via loadedRef). Keys off navSignal so the load fires after the renderer
  // becomes available (navSignal is 0 pre-init and increments after syncNav).
  useEffect(() => {
    if (loadedRef.current) return;
    const r = controller.getRenderer();
    if (!r || !r.getOutline || !r.goToOutlineEntry) return;
    r.getOutline()
      .then((e) => {
        loadedRef.current = true;
        if (!destroyedRef.current) setEntries(e as OutlineEntry[]);
      })
      .catch((err) => {
        // Leave loadedRef.current = false so the next navSignal change retries.
        reportError(new Error("Failed to load outline", { cause: err }));
      });
  }, [controller.navSignal]);

  const onActivate = useCallback(
    (entry: OutlineEntry) => {
      controller
        .getRenderer()
        ?.goToOutlineEntry?.(entry)
        ?.then(() => controller.onPanelNavigate())
        .catch((err) => {
          reportError(new Error("Outline navigation failed", { cause: err }));
        });
    },
    [controller],
  );

  // Rules-of-hooks: all hooks above; conditional return below.
  if (entries.length === 0) return null;

  return (
    <div className="viewer-outline">
      <h4 className="viewer-outline-heading">Contents</h4>
      <ul className="viewer-outline-list" role="tree">
        {entries.map((e, i) => (
          <OutlineItem key={i} entry={e} onActivate={onActivate} />
        ))}
      </ul>
    </div>
  );
}
