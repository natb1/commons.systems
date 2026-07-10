/**
 * Format a UTC-midnight timestamp as an "M/D/YYYY" calendar date using its UTC
 * fields.
 *
 * Transaction dates are stored as UTC midnight throughout the budget math layer.
 * Rendering them with `toLocaleDateString()` uses the browser/process timezone,
 * so for a user west of UTC a txn dated 2025-01-22 (00:00Z) renders as the
 * previous day ("1/21/2025"). Reading the UTC fields (`getUTC*`) instead keeps
 * the displayed date equal to the stored date regardless of the viewer's
 * timezone. Mirrors the `formatDate` idiom in `home-chart.ts`.
 */
export function formatUtcDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
}
