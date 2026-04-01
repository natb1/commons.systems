import { DataIntegrityError } from "./errors.js";

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

export function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new DataIntegrityError(`Expected boolean for ${field}, got ${typeof value}`);
  }
  return value;
}

export function optionalString(value: unknown, field: string): string | null {
  if (value == null) return null;
  if (typeof value !== "string") {
    throw new DataIntegrityError(`Expected string or null for ${field}, got ${typeof value}`);
  }
  return value;
}

export function optionalNumber(value: unknown, field: string): number | null {
  if (value == null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new DataIntegrityError(`Expected finite number or null for ${field}, got ${value}`);
  }
  return value;
}

export function requireStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new DataIntegrityError(`Expected array for ${field}, got ${typeof value}`);
  }
  return value.map((item, i) => {
    if (typeof item !== "string") {
      throw new DataIntegrityError(`Expected string at ${field}[${i}], got ${typeof item}`);
    }
    return item;
  });
}

export function requireIso8601(value: unknown, field: string): string {
  const s = requireString(value, field);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(s)) {
    throw new DataIntegrityError(`Expected UTC ISO 8601 date for ${field}: "${s}"`);
  }
  return s;
}
