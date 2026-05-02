/**
 * Shared field-conversion and validation helpers used by entity modules.
 *
 * Validators are defined here (rather than imported from
 * @commons-systems/firestoreutil/validate) because entity modules load at
 * vite config startup via vite-plugin-seed-data, and firestoreutil submodules
 * use .js extension imports that break Node.js ESM resolution in that context.
 */
import { Timestamp } from "firebase/firestore";

// ── Timestamp / millis converters ─────────────────────────────────────────────

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

// ── Errors ────────────────────────────────────────────────────────────────────

/** Thrown when uploaded JSON data fails validation. */
export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

/** Thrown when a Firestore document violates the entity schema. */
export class DataIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataIntegrityError";
  }
}

// ── Firestore-side validators (throw DataIntegrityError) ──────────────────────

export function requireString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new DataIntegrityError(`Expected string for ${field}, got ${typeof value}`);
  }
  return value;
}

export function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new DataIntegrityError(`Expected finite number for ${field}, got ${value}`);
  }
  return value;
}

export function requireNonNegativeNumber(value: unknown, field: string): number {
  const n = requireNumber(value, field);
  if (n < 0) throw new DataIntegrityError(`Expected non-negative number for ${field}, got ${n}`);
  return n;
}

export function optionalString(value: unknown, field: string): string | null {
  if (value == null) return null;
  return requireString(value, field);
}

export function optionalNumber(value: unknown, field: string): number | null {
  if (value == null) return null;
  return requireNumber(value, field);
}

export function requireTimestamp(value: unknown, field: string): Timestamp {
  if (value == null || !(value instanceof Timestamp)) {
    throw new DataIntegrityError(
      `Expected Timestamp for ${field}, got ${value == null ? "null" : typeof value}`,
    );
  }
  return value;
}

export function optionalTimestamp(value: unknown, field: string): Timestamp | null {
  if (value == null) return null;
  if (!(value instanceof Timestamp)) {
    throw new DataIntegrityError(`Expected Timestamp for ${field}, got ${typeof value}`);
  }
  return value;
}

/** Validate that `value` is a member of `allowed`. Throws DataIntegrityError. */
export function requireEnum<T extends string>(
  value: unknown, allowed: readonly T[], field: string,
): T {
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    throw new DataIntegrityError(
      `Expected ${field} to be one of ${allowed.join(", ")}, got ${JSON.stringify(value)}`,
    );
  }
  return value as T;
}

// ── Upload-side validators (throw UploadValidationError) ──────────────────────

export function requireUploadId(value: unknown, entity: string, index: number): string {
  if (typeof value !== "string" || value === "") {
    throw new UploadValidationError(`${entity}[${index}] is missing a valid id`);
  }
  return value;
}

export function requireUploadString(
  value: unknown, entity: string, index: number, field: string,
): string {
  if (typeof value !== "string" || value === "") {
    throw new UploadValidationError(`${entity}[${index}].${field} is missing or empty`);
  }
  return value;
}

export function requireUploadFiniteNumber(
  value: unknown, entity: string, index: number, field: string,
): number {
  if (typeof value !== "number" || !isFinite(value)) {
    throw new UploadValidationError(`${entity}[${index}].${field} must be a finite number`);
  }
  return value;
}

export function requireUploadEnum<T extends string>(
  value: unknown, allowed: readonly T[], field: string,
): T {
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    throw new UploadValidationError(`Invalid ${field} value: ${JSON.stringify(value)}`);
  }
  return value as T;
}

// ── Seed-side validators (throw plain Error; run at vite build time) ──────────

export function toMs(d: unknown): number | null {
  if (d instanceof Date) return d.getTime();
  if (d != null && typeof d === "object" && "toMillis" in d) {
    return (d as { toMillis(): number }).toMillis();
  }
  return null;
}

export function requireMs(d: unknown, field: string): number {
  const ms = toMs(d);
  if (ms === null) throw new Error(`Expected Date or Timestamp for ${field}, got ${d}`);
  return ms;
}

export function requireSeedString(value: unknown, field: string): string {
  if (typeof value !== "string") throw new Error(`Expected string for ${field}, got ${typeof value}`);
  return value;
}

export function requireSeedNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Expected finite number for ${field}, got ${value}`);
  }
  return value;
}

export function requireSeedNonNegativeNumber(value: unknown, field: string): number {
  const n = requireSeedNumber(value, field);
  if (n < 0) throw new Error(`Expected non-negative number for ${field}, got ${n}`);
  return n;
}

export function requireSeedEnum<T extends string>(
  value: unknown, allowed: readonly T[], field: string,
): T {
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    throw new Error(
      `Expected ${field} to be one of ${allowed.join(", ")}, got ${JSON.stringify(value)}`,
    );
  }
  return value as T;
}

// ── Misc ──────────────────────────────────────────────────────────────────────

/**
 * Filter a list of IDB records by a millisecond timestamp range.
 * Records with a null timestamp are excluded when a `sinceMs` bound is present.
 */
export function filterByTimestamp<T extends { timestampMs: number | null }>(
  rows: T[], sinceMs: number | undefined, beforeMs: number | undefined,
): T[] {
  return rows.filter(row => {
    if (sinceMs !== undefined) {
      if (row.timestampMs === null) return false;
      if (row.timestampMs < sinceMs) return false;
    }
    if (beforeMs !== undefined) {
      if (row.timestampMs !== null && row.timestampMs >= beforeMs) return false;
    }
    return true;
  });
}
