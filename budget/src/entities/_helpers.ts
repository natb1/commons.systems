/** Shared field-conversion helpers used by entity modules in this directory. */
import { Timestamp } from "firebase/firestore";

/** Convert a Firestore Timestamp (or null) to milliseconds (or null). */
export function tsToMs(ts: Timestamp | null): number | null {
  return ts != null ? ts.toMillis() : null;
}

/** Convert milliseconds (or null) to a Firestore Timestamp (or null). */
export function msToTs(ms: number | null): Timestamp | null {
  return ms != null ? Timestamp.fromMillis(ms) : null;
}

/** Convert a JS Date to milliseconds. */
export function dateToMs(d: Date): number {
  return d.getTime();
}

/**
 * Parse an ISO timestamp string to a Firestore Timestamp.
 * Throws UploadValidationError for invalid input.
 */
export function parseISOTimestamp(iso: string, field: string): Timestamp {
  const ms = Date.parse(iso);
  if (isNaN(ms)) throw new UploadValidationError(`Invalid timestamp for ${field}: "${iso}"`);
  return Timestamp.fromMillis(ms);
}

/** Convert milliseconds (or null) to an ISO 8601 string, or empty string for null. */
export function msToISO(ms: number | null): string {
  if (ms === null) return "";
  return new Date(ms).toISOString();
}

/** Convert an empty string to null, otherwise return the string unchanged. */
export function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}

/** Convert null to an empty string, otherwise return the value unchanged. */
export function nullToEmpty(value: string | null): string {
  return value ?? "";
}

/**
 * Error thrown when uploaded JSON data fails validation.
 * Defined here (shared internal) so upload.ts and entity modules can use it
 * without creating circular imports.
 */
export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}
