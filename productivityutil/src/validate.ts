import { Timestamp } from "firebase/firestore";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import { requireString } from "@commons-systems/firestoreutil/validate";
import type { GroupId } from "@commons-systems/authutil/groups";

export function optionalTimestamp(value: unknown, field: string): Timestamp | null {
  if (value == null) return null;
  if (!(value instanceof Timestamp)) {
    throw new DataIntegrityError(`Expected Timestamp for ${field}, got ${typeof value}`);
  }
  return value;
}

export function requireTimestamp(value: unknown, field: string): Timestamp {
  const ts = optionalTimestamp(value, field);
  if (ts === null) throw new DataIntegrityError(`Expected Timestamp for ${field}, got null`);
  return ts;
}

export function requireGroupId(value: unknown, field: string): GroupId {
  return requireString(value, field) as GroupId;
}

export function requireMemberEmails(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    throw new DataIntegrityError(`Expected array for memberEmails, got ${typeof value}`);
  }
  return value.map((item, i) => {
    if (typeof item !== "string") {
      throw new DataIntegrityError(`Expected string at memberEmails[${i}], got ${typeof item}`);
    }
    return item;
  });
}

export function requireBoundedNumber(value: unknown, field: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new DataIntegrityError(`Expected finite number for ${field}, got ${value}`);
  }
  if (value < min || value > max) {
    throw new DataIntegrityError(`${field} must be in [${min}, ${max}], got ${value}`);
  }
  return value;
}
