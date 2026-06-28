/**
 * React surface for @commons-systems/router, exposed at the `./react` subpath.
 *
 * Exports exactly three location/navigation primitives:
 *
 * - `useLocation()` — subscribes the calling component to the location store via
 *   `useSyncExternalStore`, re-rendering on every `navigate` or `popstate`.
 * - `navigate(href, opts?)` — public re-export of the store's imperative
 *   navigator.
 * - `<Link>` — an `<a>` that intercepts same-origin internal clicks and routes
 *   them through `navigate`, falling back to native browser behavior for
 *   modified clicks, `download`/`target` links, and external/protocol-relative/
 *   cross-origin hrefs.
 *
 * Deliberate design decisions:
 *
 * - No matching primitive. There is no `useMatch`/`<Route>`. In React's
 *   component-tree model, "which component renders for this path" is the
 *   consumer's responsibility (mirroring low-level routers like React Router's
 *   location hooks and wouter). The router ships only location + navigation.
 *
 * - No `matchRoute` gate on `<Link>`. The vanilla global click listener gates
 *   interception against a routes array because it intercepts ALL document
 *   clicks and must not hijack links to non-routed paths (e.g. `/feed.xml`).
 *   `<Link>` instead scopes interception to opted-in links — the component-tree
 *   model has no routes array to gate against — so it intercepts any same-origin
 *   internal href. This asymmetry is intentional and is the justification for
 *   choosing `<Link>` over a global listener in React.
 */
import { forwardRef, useSyncExternalStore } from "react";
import type { AnchorHTMLAttributes, MouseEvent as ReactMouseEvent } from "react";
import { subscribe, getSnapshot, getServerSnapshot, navigate } from "./location-store";
import { isModifiedEvent, resolveInternalHref } from "./navigation";

export { navigate };

export function useLocation(): { path: string; params: URLSearchParams } {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, onClick, ...rest },
  ref,
) {
  const handleClick = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    // Respect a consumer-supplied handler first: if it prevents default, bail.
    onClick?.(e);
    if (e.defaultPrevented) return;
    // Let the browser handle modified clicks (new tab/window, etc.).
    if (isModifiedEvent(e.nativeEvent)) return;
    // Native behavior for download links and links with an explicit target.
    if (rest.download !== undefined || rest.target !== undefined) return;
    // Native behavior for external/protocol-relative/cross-origin hrefs.
    if (resolveInternalHref(href) === null) return;
    e.preventDefault();
    navigate(href);
  };
  return <a {...rest} href={href} ref={ref} onClick={handleClick} />;
});
