import { classifyError, type ErrorKind } from "./classify.js";

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

export function registerErrorSink(s: ErrorSink): void {
  sink = s;
}

/**
 * Log an error with structured context. Always writes to console.error for
 * local visibility, then forwards to the registered sink (e.g., Firestore)
 * if one exists. Synchronous sink failures are caught here. Async sinks
 * must handle their own rejections — logError does not await.
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
