import { classifyError, type ErrorKind } from "./classify.ts";

export interface ErrorContext {
  /** Human-readable label for what was happening when the error occurred. */
  operation: string;
  /** Populated automatically by logError via classifyError; callers may override. */
  kind?: ErrorKind;
  /** Arbitrary metadata (e.g., postId, txnId). */
  [key: string]: unknown;
}

/** ErrorContext after logError enrichment — `kind` is guaranteed present. */
export type EnrichedErrorContext = ErrorContext & { kind: ErrorKind };

export type ErrorSink = (error: unknown, context: EnrichedErrorContext) => void;

let sink: ErrorSink | undefined;

export function registerErrorSink(s: ErrorSink | undefined): void {
  sink = s;
}

/**
 * Convention: prefer `logError` in any package that depends on `errorutil`,
 * and in all apps. Bare global `reportError` is permitted ONLY in packages
 * that do not depend on `errorutil` (e.g. `idbutil`). In those packages, the
 * global handler installed by `createAppContext` (`installGlobalErrorHandlers`,
 * in `errorutil/src/global-handler.ts`) catches the dispatched `error` event
 * and records it via `logError` under `operation: "uncaught"`, so the error
 * still reaches the Firestore sink — just without a specific operation label.
 */

/**
 * Log an error with structured context. Always writes to console.error for
 * local visibility, then forwards to the registered sink (e.g., Firestore)
 * if one exists. Synchronous sink failures are caught here. Async sinks
 * must handle their own rejections — logError does not await the return
 * value, so unhandled rejections will surface as unhandled promise rejections.
 */
export function logError(error: unknown, context: ErrorContext): void {
  const enriched: EnrichedErrorContext = {
    ...context,
    kind: context.kind ?? classifyError(error),
  };

  console.error(`[${enriched.operation}]`, error);

  if (sink) {
    try {
      sink(error, enriched);
    } catch (sinkErr) {
      console.warn("Error sink threw synchronously", sinkErr);
    }
  }
}
