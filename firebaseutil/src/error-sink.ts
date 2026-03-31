import { collection, addDoc, Timestamp } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { Namespace } from "@commons-systems/firestoreutil/namespace";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";
import type { ErrorSink, ErrorContext } from "@commons-systems/errorutil/log";

export interface ErrorSinkUser {
  uid: string;
  email: string | null;
}

export interface ErrorSinkOptions {
  db: Firestore;
  namespace: Namespace;
  /** Returns the current user at log time. Omit for apps without auth (e.g., budget). */
  getCurrentUser?: () => ErrorSinkUser | null;
}

const RESERVED_KEYS = new Set(["operation", "kind", "message", "stack", "code", "timestamp", "userAgent", "url", "uid", "email"]);

export function createFirestoreErrorSink(options: ErrorSinkOptions): ErrorSink {
  const { db, namespace, getCurrentUser } = options;
  const errorsPath = nsCollectionPath(namespace, "errors");

  return (error: unknown, context: ErrorContext): void => {
    const user = getCurrentUser?.() ?? null;
    const doc: Record<string, unknown> = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack ?? null : null,
      code: (error as { code?: string })?.code ?? null,
      kind: context.kind ?? "unknown",
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
    addDoc(collection(db, errorsPath), doc).catch(() => {});
  };
}
