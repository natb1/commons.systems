/** Escapes &, <, >, ", and ' for safe insertion into HTML markup. */
export function escapeHtml(str: string): string {
  if (typeof str !== "string") {
    throw new TypeError(`escapeHtml expected a string, got ${typeof str}`);
  }
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
