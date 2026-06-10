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
// "extras" is reserved for the synthesized JSON blob of non-reserved context.
const RESERVED_KEYS = new Set(["operation", "kind", "message", "stack", "code", "timestamp", "userAgent", "url", "uid", "email", "extras"]);

// Size caps (UTF-16 code units) — must mirror the firestore.rules isValidErrorLog() caps exactly.
const CAPS = {
  message: 10000,
  operation: 200,
  kind: 32,
  stack: 50000,
  code: 200,
  userAgent: 500,
  url: 2000,
  uid: 128,
  email: 320,
  extras: 10000,
} as const;

function truncate(value: string | null | undefined, max: number): string | null {
  return value == null ? null : String(value).slice(0, max);
}

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
      message: truncate(error instanceof Error ? error.message : String(error), CAPS.message),
      stack: truncate(error instanceof Error ? error.stack ?? null : null, CAPS.stack),
      code: truncate((error as { code?: string })?.code ?? null, CAPS.code),
      kind: truncate(context.kind, CAPS.kind),
      operation: truncate(context.operation, CAPS.operation),
      timestamp: Timestamp.now(),
      userAgent: truncate(typeof navigator !== "undefined" ? navigator.userAgent : null, CAPS.userAgent),
      url: truncate(typeof location !== "undefined" ? location.href : null, CAPS.url),
      uid: truncate(user?.uid ?? null, CAPS.uid),
      email: truncate(user?.email ?? null, CAPS.email),
    };

    // Collect non-reserved context entries into the extras field.
    // This keeps the doc shape fixed to the 11 enumerated keys the firestore.rules
    // isValidErrorLog() hasOnly() check allows.
    const extrasObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(context)) {
      if (!RESERVED_KEYS.has(key)) {
        extrasObj[key] = value;
      }
    }
    if (Object.keys(extrasObj).length > 0) {
      let extrasStr: string | null = null;
      try {
        const serialized = JSON.stringify(extrasObj);
        extrasStr = serialized.length <= CAPS.extras ? serialized : null;
      } catch {
        extrasStr = null;
      }
      doc.extras = extrasStr;
    } else {
      doc.extras = null;
    }

    // Fire-and-forget. Never await — error logging must not block the caller.
    addDoc(collection(db, errorsPath), doc).catch((e) => {
      console.warn("Firestore error sink: failed to write error document", e);
    });
  };
}
