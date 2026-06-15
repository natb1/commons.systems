// Truncates a third-party HTTP response body before it enters an Error message
// (and thus the function logs). Bounds the blast radius of a verbose or
// reflected GitHub error response without dropping the leading diagnostic text.
export function truncateForLog(text: string, max = 200): string {
  return text.length > max ? `${text.slice(0, max)}…[truncated]` : text;
}
