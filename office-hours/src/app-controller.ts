import { renderApp, type AppView, type ViewState } from "./app-view.js";

/**
 * Owns the live view and the single 60s tick timer that drives
 * `AppView.tick`, keeping the time-sensitive panels (capacity, reminders)
 * fresh without re-fetching from Firestore.
 */
export interface AppController {
  /**
   * Render `state` into the container, then (re)start the single tick timer.
   * Clears any prior interval first so re-rendering (e.g. on an auth change)
   * never leaks a second timer.
   */
  paint(state: ViewState, now: Date): void;
  /** Stop the tick timer (teardown). */
  stop(): void;
}

export function createAppController(
  container: Element,
  opts: { intervalMs?: number; now?: () => Date } = {},
): AppController {
  const intervalMs = opts.intervalMs ?? 60_000;
  const nowFn = opts.now ?? (() => new Date());

  let view: AppView | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;

  function clearTimer(): void {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  return {
    paint(state: ViewState, now: Date): void {
      // Single-interval invariant: clear before painting so a re-paint
      // (auth-change re-render) never leaves the prior interval running.
      clearTimer();
      view = renderApp(container, state, now);
      const v = view;
      timer = setInterval(() => v.tick(nowFn()), intervalMs);
    },
    stop(): void {
      clearTimer();
    },
  };
}
