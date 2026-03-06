// Posts store publishedAt as UTC ISO strings; format in UTC to avoid
// timezone-dependent date shifts (e.g. Feb 1 UTC displaying as Jan 31).
export function formatUtcDate(
  isoDate: string,
  monthFormat: "long" | "short" = "long",
): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: monthFormat,
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
