import { Button, Input } from "@commons-systems/ds";
import type { UseViewerControllerResult } from "./useViewerController.js";
import type { UseBookmarksResult } from "./useBookmarks.js";

/**
 * The `.viewer-nav` row: presentational chrome wired to the controller hook.
 * Built on the ds `Button`/`Input` primitives, which forward
 * className/aria/onClick/disabled and merge the className onto the underlying
 * element. The `.viewer-*` classNames + aria-labels are VERBATIM — existing
 * imperative queries (the hook reads `.viewer-goto-input`, the keyboard guard
 * checks `.closest(".viewer-goto-input")`) and the Unit-7 e2e selectors depend
 * on them.
 */
export function ViewerToolbar({
  controller,
  bookmarks,
}: {
  controller: UseViewerControllerResult;
  bookmarks: UseBookmarksResult;
}) {
  const {
    gotoInputRef,
    gotoStatusRef,
    spreadToggleRef,
    positionLabel,
    canGoPrev,
    canGoNext,
    zoomOutDisabled,
    zoomResetDisabled,
    spreadEnabled,
    gotoMode,
    hasZoom,
    hasSpread,
    loadError,
    goPrev,
    goNext,
    submitGoto,
    zoomIn,
    zoomOut,
    zoomReset,
    toggleSpread,
  } = controller;

  return (
    <div className="viewer-nav">
      <Button
        className="viewer-prev"
        aria-label="Previous page"
        disabled={!canGoPrev}
        onClick={goPrev}
      >
        &larr;
      </Button>
      <span className="viewer-position">{loadError ?? positionLabel ?? "Loading..."}</span>
      <Button
        className="viewer-next"
        aria-label="Next page"
        disabled={!canGoNext}
        onClick={goNext}
      >
        &rarr;
      </Button>
      <Input
        // The ds Input returns a bare <input> when given no label/helper/error,
        // so this className lands on the actual input element the hook queries.
        className={gotoMode === null ? "viewer-goto-input goto-hidden" : "viewer-goto-input"}
        ref={gotoInputRef}
        type="number"
        inputMode="numeric"
        aria-label={gotoMode === "percent" ? "Go to location percent" : "Go to page"}
        onKeyDown={(e) => {
          if (e.key === "Enter") submitGoto();
        }}
      />
      {/* aria-live status the hook populates with "Calculating location…"
          during a percent goto; visually hidden since the input placeholder
          already shows the visual cue. Static in the DOM so assistive tech
          announces reliably when its text changes. */}
      <span
        className="viewer-goto-status visually-hidden"
        ref={gotoStatusRef}
        role="status"
        aria-live="polite"
      />
      <Button
        className={hasZoom ? "viewer-zoom-in" : "viewer-zoom-in zoom-hidden"}
        aria-label="Zoom in"
        onClick={zoomIn}
      >
        +
      </Button>
      <Button
        className={hasZoom ? "viewer-zoom-out" : "viewer-zoom-out zoom-hidden"}
        aria-label="Zoom out"
        disabled={zoomOutDisabled}
        onClick={zoomOut}
      >
        &minus;
      </Button>
      <Button
        className={hasZoom ? "viewer-zoom-reset" : "viewer-zoom-reset zoom-hidden"}
        aria-label="Reset zoom"
        disabled={zoomResetDisabled}
        onClick={zoomReset}
      >
        &#8865;
      </Button>
      {/* Spread toggle is ALWAYS mounted: SpreadController captures
          spreadToggleRef.current at mount and a returning spread=true user
          drives its aria-pressed during init, so a null ref would crash.
          Hidden via the spread-hidden class, never unmounted. */}
      <Button
        className={hasSpread ? "viewer-spread-toggle" : "viewer-spread-toggle spread-hidden"}
        ref={spreadToggleRef}
        aria-label="Toggle spread view"
        aria-pressed={spreadEnabled}
        onClick={toggleSpread}
      >
        &#9783;
      </Button>
      <Button
        className="viewer-bookmark-toggle"
        aria-label="Bookmark this page"
        aria-pressed={bookmarks.currentBookmarked}
        disabled={bookmarks.toggleDisabled}
        onClick={bookmarks.toggleBookmark}
      >
        {"\u{1F516}"}
      </Button>
    </div>
  );
}
