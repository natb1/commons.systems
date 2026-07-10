import type { UseAnnotationsResult } from "./useAnnotations.js";

/**
 * Annotations list panel. Returns null when there are no annotations (mirroring
 * BookmarksPanel). State is owned by the parent <Viewer> via useAnnotations;
 * this component is purely presentational. Each entry shows the highlighted
 * quote and (when present) the note; clicking navigates to the annotation's
 * position, and the delete button removes it.
 */
export function AnnotationsPanel({
  annotations,
}: {
  annotations: UseAnnotationsResult;
}) {
  // Rules-of-hooks: no hooks needed here; conditional return is safe.
  if (annotations.annotations.length === 0) return null;

  return (
    <div className="viewer-annotations">
      <h4 className="viewer-annotations-heading">Annotations</h4>
      <ul className="viewer-annotations-list" aria-label="Annotations">
        {annotations.annotations.map((a) => (
          <li key={a.id} className="viewer-annotations-item">
            <a
              className="viewer-annotation-entry"
              href="#"
              data-position={a.position}
              onClick={(e) => {
                e.preventDefault();
                annotations.goToAnnotation(a.position);
              }}
            >
              <span className="viewer-annotation-quote">{a.quote}</span>
              {a.note && (
                <span className="viewer-annotation-note">{a.note}</span>
              )}
            </a>
            <button
              className="viewer-annotation-delete"
              aria-label="Delete annotation"
              onClick={() => annotations.removeAnnotation(a.id)}
            >
              {"×"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
