export type Spread = { readonly left: number; readonly right: number | null };

/**
 * Build ordered spread array for a document.
 * Page 1 solo, then pairs (2-3, 4-5, ...), last page solo if pageCount is even.
 */
export function spreadsForPageCount(pageCount: number): Spread[] {
  if (pageCount <= 0) return [];
  const spreads: Spread[] = [{ left: 1, right: null }];
  for (let p = 2; p <= pageCount; p += 2) {
    const right = p + 1 <= pageCount ? p + 1 : null;
    spreads.push({ left: p, right });
  }
  return spreads;
}

/** 0-based index into the spread array for the spread containing `page`. */
export function spreadIndexForPage(page: number, pageCount: number): number {
  if (pageCount <= 0 || page < 1) return 0;
  if (page > pageCount) page = pageCount;
  if (page === 1) return 0;
  return Math.floor((page - 2) / 2) + 1;
}

/**
 * Position label for a spread: "Page X / Z" for solo, "Pages X\u2013Y / Z" for paired.
 */
export function spreadPositionLabel(spread: Spread, pageCount: number): string {
  if (spread.right === null) {
    return `Page ${spread.left} / ${pageCount}`;
  }
  return `Pages ${spread.left}\u2013${spread.right} / ${pageCount}`;
}
