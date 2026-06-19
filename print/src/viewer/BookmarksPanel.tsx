import type { UseBookmarksResult } from "./useBookmarks.js";

/**
 * Bookmarks list panel. Returns null when there are no bookmarks (replacing
 * the old "bookmarks-hidden" class). All hooks must be called unconditionally
 * (rules-of-hooks); the early return is placed AFTER the hook block.
 *
 * State is owned by the parent <Viewer> via useBookmarks; this component is
 * purely presentational.
 */
export function BookmarksPanel({ bookmarks }: { bookmarks: UseBookmarksResult }) {
  // Rules-of-hooks: no hooks needed here; conditional return is safe.
  if (bookmarks.bookmarks.length === 0) return null;

  return (
    <div className="viewer-bookmarks">
      <h4 className="viewer-bookmarks-heading">Bookmarks</h4>
      <ul className="viewer-bookmarks-list" aria-label="Bookmarks">
        {bookmarks.bookmarks.map((b) => (
          <li key={b.position} className="viewer-bookmarks-item">
            <a
              className="viewer-bookmark-entry"
              href="#"
              data-position={b.position}
              onClick={(e) => {
                e.preventDefault();
                bookmarks.goToBookmark(b.position);
              }}
            >
              {b.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
