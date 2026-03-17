export interface ContentRenderer {
  init(container: HTMLElement, url: string, initialPosition?: string): Promise<void>;
  goToPage(page: number): Promise<void>;
  next(): Promise<void>;
  prev(): Promise<void>;
  readonly pageCount: number;
  readonly currentPage: number;
  readonly canGoNext: boolean;
  readonly canGoPrev: boolean;
  /** String form of currentPage. Do not read before init resolves. */
  readonly position: string;
  readonly positionLabel: string;
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
