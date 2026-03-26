/*
 * Hydration pattern selection guide
 * ==================================
 * afterRender runs after the router sets outlet.innerHTML. Choose a pattern
 * based on the hydration trigger and whether work is async:
 *
 * 1. Synchronous one-shot — afterRender attaches listeners directly.
 *    No helper needed. (landing, fellspiral, print)
 *
 * 2. Idempotent observer-driven — a MutationObserver (or other repeated
 *    trigger) calls hydration for elements that may already be hydrated.
 *    Use hydrateOnce to gate on dataset.hydrated. (budget)
 *
 * 3. Async with staleness guard — afterRender starts async work (fetches,
 *    etc.) whose callbacks must check the outlet hasn't been re-rendered.
 *    Use isOutletCurrent before writing to the DOM. (blog)
 */

/**
 * Run `hydrate(el)` only if `el` exists and has not already been hydrated.
 * Sets `el.dataset.hydrated` to "true" on success, "error" on failure.
 * TypeError and ReferenceError are deferred as uncaught errors (same convention
 * as the router's afterRender handling). Other errors are passed to `onError`
 * if provided, or reported via `reportError`.
 */
export function hydrateOnce(
  root: ParentNode,
  selector: string,
  hydrate: (el: HTMLElement) => void,
  onError?: (error: unknown, el: HTMLElement) => void,
): void {
  const el = root.querySelector(selector) as HTMLElement | null;
  if (!el || el.dataset.hydrated) return;
  try {
    hydrate(el);
    el.dataset.hydrated = "true";
  } catch (error) {
    el.dataset.hydrated = "error";
    if (error instanceof TypeError || error instanceof ReferenceError) {
      setTimeout(() => { throw error; }, 0);
      return;
    }
    if (onError) {
      onError(error, el);
    } else {
      reportError(error);
    }
  }
}

/**
 * Returns true if `anchor` is still part of `outlet`'s DOM subtree.
 * Use this to skip DOM writes after async work when the user has navigated
 * away (the router replaces outlet.innerHTML, detaching the old subtree).
 */
export function isOutletCurrent(outlet: HTMLElement, anchor: Element): boolean {
  return outlet.contains(anchor);
}
