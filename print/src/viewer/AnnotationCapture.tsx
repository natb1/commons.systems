import { useEffect, useRef } from "react";
import type { UseAnnotationsResult } from "./useAnnotations.js";

/**
 * Floating capture control shown next to the live text selection. Presentational
 * — all state lives in useAnnotations, except the transient note draft text
 * which is local. Returns null when there is no pending selection.
 *
 * IMPORTANT: this element is rendered as a sibling of the renderer-owned
 * `.viewer-canvas-wrap`, never a child of it — the renderer owns that subtree
 * and React must never reconcile children into it (Viewer.tsx). It positions
 * itself with `position: fixed` off the selection's viewport rect.
 *
 * Highlight / Note buttons use `onMouseDown` preventDefault so clicking them
 * does not collapse the selection before the click handler reads the captured
 * anchor. The note input carries the `viewer-annotation-note-input` class so the
 * viewer's keyboard-nav handler ignores arrow keys typed into it.
 */
export function AnnotationCapture({
  annotations,
}: {
  annotations: UseAnnotationsResult;
}) {
  const { pending, noteDraftOpen } = annotations;
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the note input when the draft opens. The input is uncontrolled — its
  // value is read from the ref at save time (mirroring the goto input), so it
  // needs no reset: React remounts it fresh for each new capture.
  useEffect(() => {
    if (noteDraftOpen) inputRef.current?.focus();
  }, [noteDraftOpen]);

  if (!pending) return null;

  const submitNote = () => annotations.saveNote(inputRef.current?.value ?? "");

  const style: React.CSSProperties = {
    position: "fixed",
    top: `${pending.rect.top + pending.rect.height + 4}px`,
    left: `${pending.rect.left}px`,
  };

  return (
    <div className="viewer-annotation-capture" style={style} role="toolbar">
      {noteDraftOpen ? (
        <>
          <input
            ref={inputRef}
            className="viewer-annotation-note-input"
            type="text"
            placeholder="Add a note…"
            aria-label="Annotation note"
            onKeyDown={(e) => {
              if (e.key === "Enter") submitNote();
              else if (e.key === "Escape") annotations.cancelCapture();
            }}
          />
          <button
            className="viewer-annotation-note-save"
            onMouseDown={(e) => e.preventDefault()}
            onClick={submitNote}
          >
            Save
          </button>
          <button
            className="viewer-annotation-note-cancel"
            onMouseDown={(e) => e.preventDefault()}
            onClick={annotations.cancelCapture}
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <button
            className="viewer-annotation-highlight-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={annotations.addHighlight}
          >
            Highlight
          </button>
          <button
            className="viewer-annotation-note-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={annotations.openNoteDraft}
          >
            Note
          </button>
        </>
      )}
    </div>
  );
}
