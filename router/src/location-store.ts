/**
 * Framework-agnostic location store, designed to back a React `useLocation()`
 * hook (a later unit) via React 18's `useSyncExternalStore`. This module has
 * zero React imports — it is plain TS/DOM and is internal (not added to the
 * package `exports` map); the React surface re-exports it through `react.tsx`.
 *
 * The snapshot-caching contract is the load-bearing part of this module.
 * `useSyncExternalStore` calls `getSnapshot` on every render and bails out of
 * re-rendering only when `Object.is(prev, next)` holds. If `getSnapshot`
 * returned a fresh object on every call, React would see a "changed" snapshot
 * on every render and loop forever ("The result of getSnapshot should be
 * cached"). So we cache the parsed snapshot together with the cache key it was
 * computed for (`location.pathname + location.search`):
 *
 * - If the current key equals the cached key, return the SAME object reference,
 *   so `Object.is` sees no change and React bails out.
 * - If the key differs (or nothing is cached yet), recompute via `parsePath()`,
 *   store it under the new key, and return the new reference.
 *
 * A `navigate`/`popstate` that actually changes `pathname+search` yields a new
 * reference; a no-op render yields the same one. `navigate` does not invalidate
 * the cache manually — `getSnapshot` recomputes lazily because the key changed.
 */
import { parsePath } from "./index";

type Snapshot = { path: string; params: URLSearchParams };

const listeners = new Set<() => void>();

let cachedSnapshot: Snapshot | null = null;
let cachedKey: string | null = null;

function emit(): void {
  for (const listener of listeners) listener();
}

const onPopState = (): void => emit();

export function subscribe(callback: () => void): () => void {
  // Attach the single popstate listener lazily on the first subscriber.
  if (listeners.size === 0) {
    window.addEventListener("popstate", onPopState);
  }
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
    // Detach when the last subscriber leaves.
    if (listeners.size === 0) {
      window.removeEventListener("popstate", onPopState);
    }
  };
}

export function getSnapshot(): Snapshot {
  const key = location.pathname + location.search;
  if (cachedSnapshot === null || key !== cachedKey) {
    cachedSnapshot = parsePath();
    cachedKey = key;
  }
  return cachedSnapshot;
}

/**
 * Returns a fresh frozen snapshot on every call. Two properties protect SSR
 * callers from each other:
 *
 * (a) Fresh allocation (primary protection): each call gets its own object, so
 *     one caller mutating `params` cannot affect any other call's snapshot.
 * (b) `Object.freeze` (shallow secondary defense): blocks reassignment of
 *     `path` and `params` on the returned object, but does NOT prevent
 *     URLSearchParams methods (`.set`, `.delete`, etc.) from mutating the
 *     instance — the primary protection above is what prevents cross-call
 *     contamination.
 *
 * Referential stability is not required here: React's SSR/hydration path does
 * not compare `getServerSnapshot` results across calls. Only the client-side
 * `getSnapshot` path requires it (handled by the `cachedSnapshot`/`cachedKey`
 * machinery above).
 */
export function getServerSnapshot(): Readonly<Snapshot> {
  return Object.freeze({ path: "/", params: new URLSearchParams() });
}

export function navigate(href: string, opts?: { replace?: boolean }): void {
  if (opts?.replace) {
    history.replaceState({}, "", href);
  } else {
    history.pushState({}, "", href);
  }
  emit();
}
