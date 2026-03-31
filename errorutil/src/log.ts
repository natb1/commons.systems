import { classifyError, type ErrorKind } from "./classify.js";

export interface ErrorContext {
  /** Human-readable label for what was happening when the error occurred. */
  operation: string;
  /** Populated automatically by logError via classifyError; callers may override. */
  kind?: ErrorKind;
  /** Arbitrary metadata (e.g., postId, txnId). */
  [key: string]: unknown;
}

export type ErrorSink = (error: unknown, context: ErrorContext) => void;

let sink: ErrorSink | undefined;

export function registerErrorSink(s: ErrorSink): void {
  sink = s;
}

/**
 * Log an error with structured context. Always writes to console.error for
 * local visibility, then forwards to the registered sink (e.g., Firestore)
 * if one exists. Sink failures are silently caught — console.error is the
 * guaranteed fallback.
 */
export function logError(error: unknown, context: ErrorContext): void {
  const enriched: ErrorContext = {
    ...context,
    kind: context.kind ?? classifyError(error),
  };

  console.error(`[${enriched.operation}]`, error);

  if (sink) {
    try {
      sink(error, enriched);
    } catch {
      // Sink failure must never propagate — console.error above already captured the error.
    }
  }
}
