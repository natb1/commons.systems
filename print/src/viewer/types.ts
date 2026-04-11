/**
 * A single match returned by a renderer's search method.
 *
 * Invariant: matchStart >= 0, matchLength > 0, and matchStart + matchLength <= snippet.length.
 */
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

export interface OutlineEntry {
  readonly title: string;
  readonly children: readonly OutlineEntry[];
}

export interface ContentRenderer {
  init(container: HTMLElement, source: string | ArrayBuffer, initialPosition?: string): Promise<void>;
  goToPage(page: number): Promise<void>;
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
  /** Renderers implementing search must also implement goToResult and clearSearch. */
  search?(query: string): Promise<SearchResult[]>;
  goToResult?(result: SearchResult): Promise<void>;
  clearSearch?(): void;
  /** Renderers implementing getOutline must also implement goToOutlineEntry. */
  getOutline?(): Promise<OutlineEntry[]>;
  goToOutlineEntry?(entry: OutlineEntry): Promise<void>;
  destroy(): void;
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
