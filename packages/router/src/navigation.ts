/**
 * Shared click-interception helpers used by both the vanilla global click
 * listener in createHistoryRouter and the React <Link> component.
 */

/**
 * Returns true if the event should not be intercepted as a client-side
 * navigation — non-primary button or any modifier key held (which typically
 * opens the link in a new tab/window, downloads, or triggers browser
 * shortcuts). Shared by the vanilla global click listener and the React
 * <Link> component.
 */
export function isModifiedEvent(e: MouseEvent): boolean {
  return e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
}

/**
 * Resolves an anchor's href to a normalized same-origin pathname, or returns
 * null if the href should not be intercepted (external, protocol-relative,
 * non-absolute, or cross-origin after URL normalization). Shared by the
 * vanilla global click listener and the React <Link> component.
 */
export function resolveInternalHref(href: string | null): string | null {
  if (!href || !href.startsWith("/") || href.startsWith("//")) return null;
  const url = new URL(href, location.origin);
  if (url.origin !== location.origin) return null;
  return url.pathname.replace(/\/$/, "") || "/";
}
