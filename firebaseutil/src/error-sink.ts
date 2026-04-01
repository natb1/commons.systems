import { collection, addDoc, Timestamp } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { Namespace } from "@commons-systems/firestoreutil/namespace";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";
import type { ErrorSink, EnrichedErrorContext } from "@commons-systems/errorutil/log";

export interface ErrorSinkUser {
  uid: string;
  email: string | null;
}

export interface ErrorSinkOptions {
  db: Firestore;
  namespace: Namespace;
  /** Optional; error logs omit user info when not provided. */
  getCurrentUser?: () => ErrorSinkUser | null;
}

// Keys written to the Firestore document from structured fields. Context entries
// with these names are dropped so caller-provided extras cannot overwrite canonical
// error values like the original Error message. operation and kind are included
// for safety even though they are always written from structured fields.
const RESERVED_KEYS = new Set(["operation", "kind", "message", "stack", "code", "timestamp", "userAgent", "url", "uid", "email"]);

export function createFirestoreErrorSink(options: ErrorSinkOptions): ErrorSink {
  const { db, namespace, getCurrentUser } = options;
  const errorsPath = nsCollectionPath(namespace, "errors");

  // Rate-limit Firestore writes: max 50 per 60-second window.
  // console.error is always written by logError before reaching this sink,
  // so throttled errors still appear in the console.
  let recentWrites = 0;
  let windowStart = 0;
  let rateLimitWarned = false;
  let suppressedCount = 0;

  return (error: unknown, context: EnrichedErrorContext): void => {
    const now = Date.now();
    if (now - windowStart > 60_000) {
      if (suppressedCount > 0) {
        console.warn(`Firestore error sink: ${suppressedCount} errors suppressed in previous window`);
      }
      recentWrites = 0;
      windowStart = now;
      rateLimitWarned = false;
      suppressedCount = 0;
    }
    if (recentWrites >= 50) {
      suppressedCount++;
      if (!rateLimitWarned) {
        console.warn("Firestore error sink: rate limit reached (50 writes/60s), suppressing further writes");
        rateLimitWarned = true;
      }
      return;
    }
    recentWrites++;
    const user = getCurrentUser?.() ?? null;
    const doc: Record<string, unknown> = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack ?? null : null,
      code: (error as { code?: string })?.code ?? null,
      kind: context.kind,
      operation: context.operation,
      timestamp: Timestamp.now(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      url: typeof location !== "undefined" ? location.href : null,
      uid: user?.uid ?? null,
      email: user?.email ?? null,
    };

    for (const [key, value] of Object.entries(context)) {
      if (!RESERVED_KEYS.has(key)) {
        doc[key] = value;
      }
    }

    // Fire-and-forget. Never await — error logging must not block the caller.
    addDoc(collection(db, errorsPath), doc).catch((e) => {
      console.warn("Firestore error sink: failed to write error document", e);
    });
  };
}
