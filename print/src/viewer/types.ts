/**
 * A single match returned by a renderer's search method.
 *
 * Invariant: matchStart >= 0, matchLength > 0, and matchStart + matchLength <= snippet.length.
 */
import type { Annotation } from "../annotations.js";

export interface SearchResult {
  /** Opaque location token understood by the renderer (page number string, EPUB CFI, etc.) */
  readonly location: string;
  /** Human-readable label ("Page 42", "Ch. 3") */
  readonly label: string;
  /** Text snippet around the match */
  readonly snippet: string;
  /** Character offset of match start within snippet */
  readonly matchStart: number;
  /** Character length of the match within snippet */
  readonly matchLength: number;
}

/**
 * Maximum number of search results a renderer returns from a single search().
 *
 * Common short queries ("the", "a") match thousands of positions across a long
 * document; collecting and highlighting every one freezes the viewer. Capping
 * the result count bounds both the returned list and the synchronous highlight
 * burst. A single shared constant backs both the EPUB and PDF renderers for
 * uniformity; 200 is the value the PDF renderer already shipped.
 */
export const MAX_SEARCH_RESULTS = 200;

/**
 * Envelope returned by a renderer's search method. Carries the capped result
 * list plus whether the cap truncated the matches, so the truncation fact
 * travels with the results rather than living in renderer state (where
 * overlapping searches would race over it).
 */
export interface SearchResponse {
  readonly results: SearchResult[];
  readonly truncated: boolean;
}

/** A node in a document's table of contents tree. */
export interface OutlineEntry {
  readonly title: string;
  readonly children: readonly OutlineEntry[];
}

/**
 * The anchor a renderer derives from the live text selection, suitable for
 * building an Annotation. `position` restores navigation (PDF: page-number
 * string; EPUB: a CFI range); `quote` is the selected text. The
 * `page`/`offset`/`length` fields locate the highlighted range in the page's
 * reconstructed text (the offset space `offsetToItemRanges` consumes) — a PDF
 * anchor carries all three, but they are OPTIONAL because an EPUB anchor
 * (CFI-only) has no page coordinates, matching the optional PDF-anchor fields on
 * {@link Annotation}. A renderer returns null when there is no usable selection
 * inside a rendered text layer.
 */
export interface SelectionAnchor {
  readonly position: string;
  readonly quote: string;
  readonly page?: number;
  readonly offset?: number;
  readonly length?: number;
}

export interface ContentRenderer {
  init(container: HTMLElement, source: string | ArrayBuffer, initialPosition?: string): Promise<void>;
  goToPage(page: number): Promise<void>;
  /** Navigate to an arbitrary serialized position (page-number string or EPUB CFI). */
  goToPosition(position: string): Promise<void>;
  /** Optional percent-based navigation [0,1]. EPUB-only. Generates locations lazily. */
  goToFraction?(fraction: number): Promise<void>;
  next(): Promise<void>;
  prev(): Promise<void>;
  readonly pageCount: number;
  readonly currentPage: number;
  readonly canGoNext: boolean;
  readonly canGoPrev: boolean;
  /** Serialized position suitable for restoring via initialPosition. Do not read before init resolves. */
  readonly position: string;
  readonly positionLabel: string;
  renderPageInto?(page: number, container: HTMLElement): Promise<void>;
  zoomIn?(): void;
  zoomOut?(): void;
  resetZoom?(): void;
  readonly isZoomed?: boolean;
  onZoomChange?: () => void;
  /**
   * Optional search surface. A renderer that supports search should implement
   * the SearchableRenderer contract (all four methods required); these stay
   * optional here so non-searchable renderers (image-archive) and generic
   * `clearSearch?.()` call sites compile unchanged. Use isSearchable() to narrow
   * a ContentRenderer to SearchableRenderer at call sites that need all four.
   */
  search?(query: string): Promise<SearchResponse>;
  goToResult?(result: SearchResult): Promise<void>;
  renderResult?(): Promise<void>;
  clearSearch?(): void;
  /** Renderers implementing getOutline must also implement goToOutlineEntry. */
  getOutline?(): Promise<OutlineEntry[]>;
  goToOutlineEntry?(entry: OutlineEntry): Promise<void>;
  /**
   * Optional annotation surface. `getSelectionAnchor` reads the live selection
   * against the rendered text layer and returns an anchor for a new annotation
   * (null when there is no usable selection). `setAnnotations` hands the
   * renderer the full annotation list; the renderer re-applies persistent
   * highlights whenever a covering page's text layer renders. A renderer
   * without a text layer (image-archive) implements neither.
   */
  getSelectionAnchor?(): SelectionAnchor | null;
  setAnnotations?(annotations: Annotation[]): void;
  destroy(): void;
}

/**
 * A ContentRenderer that supports full-text search. Re-declares the four search
 * methods as REQUIRED (TypeScript lets a sub-interface promote an optional
 * member to required), so a concrete searchable renderer that omits any of them
 * is a compile error rather than a silent `renderResult?.()` no-op.
 */
export interface SearchableRenderer extends ContentRenderer {
  search(query: string): Promise<SearchResponse>;
  goToResult(result: SearchResult): Promise<void>;
  /**
   * Render the armed result in single-page mode. A renderer whose goToResult
   * already renders the result (no spread mode / no renderPageInto) implements
   * this as a documented no-op; an arm-only renderer (whose goToResult only
   * arms a pending highlight) MUST render the armed result here.
   */
  renderResult(): Promise<void>;
  clearSearch(): void;
}

/**
 * Runtime type guard narrowing a ContentRenderer to SearchableRenderer by
 * checking that all four search methods are present.
 */
export function isSearchable(r: ContentRenderer): r is SearchableRenderer {
  return (
    typeof r.search === "function" &&
    typeof r.goToResult === "function" &&
    typeof r.renderResult === "function" &&
    typeof r.clearSearch === "function"
  );
}

/**
 * Parse a saved position string into a page number within [1, pageCount].
 * Returns 1 if position is undefined, non-numeric, or outside [1, pageCount].
 */
export function parsePositionPage(initialPosition: string | undefined, pageCount: number): number {
  if (initialPosition) {
    const parsed = parseInt(initialPosition, 10);
    if (parsed >= 1 && parsed <= pageCount) return parsed;
  }
  return 1;
}

/**
 * Clamp a raw "go to page" input into [1, pageCount].
 *
 * Complements parsePositionPage: an interactive jump ignores garbage (returns
 * null) rather than defaulting to 1, so a typo does not silently send the reader
 * to page 1. Restoring a saved position from storage is parsePositionPage's job.
 *
 * Returns null for empty/whitespace or non-numeric input; otherwise the parsed
 * value clamped into [1, pageCount].
 */
export function clampGoToPage(raw: string, pageCount: number): number | null {
  if (raw.trim() === "") return null;
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed)) return null;
  return Math.max(1, Math.min(pageCount, parsed));
}
