// Posts store publishedAt as UTC ISO strings; format in UTC to avoid
// timezone-dependent date shifts (e.g. Feb 1 UTC displaying as Jan 31).
export function formatUtcDate(
  isoDate: string,
  monthFormat: "long" | "short" = "long",
): string {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) {
    throw new Error(`formatUtcDate: invalid ISO date string: "${isoDate}"`);
  }
  return date.toLocaleDateString("en-US", {
    month: monthFormat,
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function monthName(month: number): string {
  return new Date(Date.UTC(2000, month)).toLocaleString("en-US", {
    month: "long",
    timeZone: "UTC",
  });
}
