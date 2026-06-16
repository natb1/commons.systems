import { logError } from "./log.ts";

/**
 * Minimal structural types for the global error/rejection events. The errorutil
 * tsconfig uses lib `ES2022` with no DOM, so the DOM `ErrorEvent`,
 * `PromiseRejectionEvent`, and `EventTarget` types are unavailable here (the
 * codebase casts around this rather than adding the DOM lib — see
 * `self as unknown` in firebaseutil's app-context.ts). These local interfaces
 * capture only the fields the handlers read, and keep both the production
 * `globalThis` target and an injected test target assignable.
 */
interface ErrorEventLike {
  /** The thrown value. Null for cross-origin "Script error." events. */
  error?: unknown;
  /** Fallback message string when `error` is absent. */
  message?: string;
}

interface PromiseRejectionEventLike {
  /** The rejection reason. */
  reason?: unknown;
}

interface ErrorEventTarget {
  addEventListener(type: string, listener: (event: unknown) => void): void;
  removeEventListener(type: string, listener: (event: unknown) => void): void;
}

/**
 * Install global handlers that route otherwise-untelemetered errors through
 * {@link logError} (and thus the registered Firestore sink). This catches three
 * classes that the global `reportError()` and bare `throw`s would otherwise
 * leave console-only:
 *
 *   - `reportError(e)` dispatches an `error` event on the global scope.
 *   - `setTimeout(() => { throw e })` surfaces as an uncaught `error` event.
 *   - an unhandled promise rejection fires `unhandledrejection`.
 *
 * The `error` listener is registered in the default (non-capture) phase: the
 * capture phase also catches resource-load failures on `<img>`/`<script>`,
 * which would flood the sink.
 *
 * No infinite-loop risk: the Firestore sink swallows its async write failure
 * (`addDoc(...).catch(...)`) and `logError` wraps the synchronous sink call in
 * try/catch.
 *
 * @param target Global scope to attach to. Defaults to the ambient global
 *   (`globalThis`), which works in both window and worker scopes. Injectable
 *   for testing.
 * @returns A disposer that removes both listeners. Required for test hygiene so
 *   repeated `createAppContext` calls don't accumulate listeners and double-log.
 */
export function installGlobalErrorHandlers(
  target: ErrorEventTarget = globalThis as unknown as ErrorEventTarget,
): () => void {
  function onError(event: unknown): void {
    const e = event as ErrorEventLike;
    // Cross-origin "Script error." events have a null `.error`; fall back to
    // the message string so something useful still reaches telemetry.
    const err = e.error ?? e.message;
    logError(err, { operation: "uncaught" });
  }

  function onUnhandledRejection(event: unknown): void {
    const e = event as PromiseRejectionEventLike;
    logError(e.reason, { operation: "unhandledrejection" });
  }

  target.addEventListener("error", onError);
  target.addEventListener("unhandledrejection", onUnhandledRejection);

  return () => {
    target.removeEventListener("error", onError);
    target.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
}
