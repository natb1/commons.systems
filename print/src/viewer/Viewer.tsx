import { useMemo } from "react";
import type { MediaItem } from "../types.js";
import type { PositionStore } from "../sidecar.js";
import type { ContentRenderer } from "./types.js";
import { useViewerController } from "./useViewerController.js";
import { ViewerToolbar } from "./ViewerToolbar.js";
import { SearchPanel } from "./SearchPanel.js";
import { OutlinePanel } from "./OutlinePanel.js";
import { useBookmarks, pickBookmarksStore } from "./useBookmarks.js";
import { BookmarksPanel } from "./BookmarksPanel.js";

export interface ViewerProps {
  item: MediaItem;
  createRenderer: (onError: (err: unknown) => void) => ContentRenderer;
  resolveSource: () => Promise<string | ArrayBuffer>;
  store: PositionStore;
  uid: string | null;
}

/**
 * The viewer mounted as a React component. The fixed chrome shell is JSX
 * (mirroring the old `renderViewerShell`); all orchestration lives in
 * {@link useViewerController}. The `.viewer-canvas-wrap` is intentionally
 * childless — the renderer/engine owns its subtree, so React must never
 * reconcile children into it (the AppNav mount-survival pattern).
 */
export function Viewer({ item, createRenderer, resolveSource, store, uid }: ViewerProps) {
  const controller = useViewerController({
    createRenderer,
    resolveSource,
    mediaId: item.id,
    store,
    uid,
  });

  const {
    canvasWrapRef,
    viewerRef,
    orientation,
    panelCollapsed,
    goPrev,
    goNext,
    togglePanel,
  } = controller;

  const bookmarksStore = useMemo(
    () => pickBookmarksStore(controller.uid, controller.readFailed, controller.mediaId),
    [controller.uid, controller.readFailed, controller.mediaId],
  );
  const bookmarks = useBookmarks(controller, bookmarksStore);

  return (
    <div
      className="viewer"
      ref={viewerRef as React.RefObject<HTMLDivElement>}
      data-orientation={orientation}
    >
      <div className="viewer-content">
        {/* Renderer-owned subtree: NEVER render React children into this node. */}
        <div className="viewer-canvas-wrap" ref={canvasWrapRef} />
        {panelCollapsed && (
          <>
            <div className="tap-zone tap-zone-prev" onClick={goPrev} />
            <div className="tap-zone tap-zone-next" onClick={goNext} />
          </>
        )}
      </div>
      <button
        className="viewer-panel-toggle"
        aria-expanded={!panelCollapsed}
        aria-label="Toggle panel"
        onClick={togglePanel}
      >
        ☰
      </button>
      <aside className={panelCollapsed ? "viewer-panel collapsed" : "viewer-panel"}>
        <a href="/" className="viewer-back">
          ← Back to Library
        </a>
        <ViewerToolbar controller={controller} bookmarks={bookmarks} />
        <SearchPanel controller={controller} />
        <BookmarksPanel bookmarks={bookmarks} />
        <OutlinePanel controller={controller} />
        <div className="viewer-meta">
          <h3 className="viewer-title">{item.title}</h3>
          <p className="viewer-type">
            <span className="media-badge">{item.mediaType}</span>
          </p>
          {item.publicDomain && <p className="viewer-pd">Public Domain</p>}
          <p className="viewer-source">{item.sourceNotes}</p>
          <div className="viewer-tags">
            {Object.entries(item.tags).map(([k, v]) => (
              <span key={k} className="viewer-tag">
                {k}: {v}
              </span>
            ))}
          </div>
          {item.markdownPath && (
            <div className="viewer-md-actions">
              <button
                className="media-md-download"
                data-md-path={item.markdownPath}
                data-title={item.title}
                title="Download Markdown"
                aria-label="Download Markdown"
              >
                {"\u{1F4DC}"}
              </button>
              <button
                className="media-md-copy"
                data-md-path={item.markdownPath}
                title="Copy Markdown"
                aria-label="Copy Markdown"
              >
                {"\u{1F4CB}"}
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
