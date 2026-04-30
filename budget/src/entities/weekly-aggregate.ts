/**
 * Single source of truth for the WeeklyAggregate entity.
 * WeeklyAggregate is a read-only computed entity: it has Firestore read, IDB storage,
 * upload parse, and seed declaration layers, but no export path (not in exportToJson).
 * All per-entity representations are defined or imported here; adaptor functions live alongside them.
 */
import { Timestamp } from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { GroupId } from "@commons-systems/authutil/groups";
import { UploadValidationError } from "./_helpers.js";
import type { WeeklyAggregateSeedData } from "../../seeds/firestore.js";

// ── Local validation helpers ──────────────────────────────────────────────────
// Inlined here to avoid importing @commons-systems/firestoreutil/validate and
// @commons-systems/firestoreutil/errors, which use .js extension imports that
// break Node.js ESM resolution when this module is loaded during vite config startup.

class DataIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataIntegrityError";
  }
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new DataIntegrityError(`Expected finite number for ${field}, got ${value}`);
  }
  return value;
}

function optionalString(value: unknown, field: string): string | null {
  if (value == null) return null;
  if (typeof value !== "string") {
    throw new DataIntegrityError(`Expected string for ${field}, got ${typeof value}`);
  }
  return value;
}

function requireTimestamp(value: unknown, field: string): Timestamp {
  if (value == null || !(value instanceof Timestamp)) {
    throw new DataIntegrityError(`Expected Timestamp for ${field}, got ${value == null ? "null" : typeof value}`);
  }
  return value;
}

// ── Domain interface ──────────────────────────────────────────────────────────

export interface WeeklyAggregate {
  readonly id: string;
  readonly weekStart: Timestamp;
  readonly creditTotal: number;
  readonly unbudgetedTotal: number;
  readonly groupId: GroupId | null;
}

// ── IDB storage interface ─────────────────────────────────────────────────────

export interface IdbWeeklyAggregate {
  id: string;
  weekStartMs: number;
  creditTotal: number;
  unbudgetedTotal: number;
}

// ── Raw upload interface ──────────────────────────────────────────────────────

export interface RawWeeklyAggregate {
  id: string;
  weekStart: string;
  creditTotal: number;
  unbudgetedTotal: number;
}

// ── Seed data type alias ──────────────────────────────────────────────────────
export type { WeeklyAggregateSeedData };

// ── Seed output type ──────────────────────────────────────────────────────────
// Defined here so budget-seed-data.d.ts can re-export it without circular refs.
export interface SeedWeeklyAggregate {
  readonly id: string;
  readonly weekStartMs: number;
  readonly creditTotal: number;
  readonly unbudgetedTotal: number;
}

// ── Internal upload helpers ───────────────────────────────────────────────────

function requireId(value: unknown, entity: string, index: number): string {
  if (typeof value !== "string" || value === "") {
    throw new UploadValidationError(`${entity}[${index}] is missing a valid id`);
  }
  return value;
}

function requireFiniteNumber(value: unknown, entity: string, index: number, field: string): number {
  if (typeof value !== "number" || !isFinite(value)) {
    throw new UploadValidationError(`${entity}[${index}].${field} must be a finite number`);
  }
  return value;
}

function parseTimestamp(iso: string, field: string): Timestamp {
  const ms = Date.parse(iso);
  if (isNaN(ms)) throw new UploadValidationError(`Invalid timestamp for ${field}: "${iso}"`);
  return Timestamp.fromMillis(ms);
}

// ── Firestore → WeeklyAggregate ───────────────────────────────────────────────

export function parseFirestoreWeeklyAggregate(docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>): WeeklyAggregate {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    weekStart: requireTimestamp(data.weekStart, "weekStart"),
    creditTotal: requireNumber(data.creditTotal, "creditTotal"),
    unbudgetedTotal: requireNumber(data.unbudgetedTotal, "unbudgetedTotal"),
    groupId: optionalString(data.groupId, "groupId") as GroupId | null,
  };
}

// ── Raw upload → WeeklyAggregate ──────────────────────────────────────────────

export function parseRawWeeklyAggregate(a: RawWeeklyAggregate, i: number): WeeklyAggregate {
  return {
    id: requireId(a.id, "weeklyAggregate", i),
    weekStart: parseTimestamp(a.weekStart, "weeklyAggregate.weekStart"),
    creditTotal: requireFiniteNumber(a.creditTotal, "weeklyAggregate", i, "creditTotal"),
    unbudgetedTotal: requireFiniteNumber(a.unbudgetedTotal, "weeklyAggregate", i, "unbudgetedTotal"),
    groupId: null as GroupId | null,
  };
}

// ── WeeklyAggregate → IdbWeeklyAggregate ─────────────────────────────────────

export function weeklyAggregateToIdbRecord(a: WeeklyAggregate): IdbWeeklyAggregate {
  return {
    id: a.id,
    weekStartMs: a.weekStart.toMillis(),
    creditTotal: a.creditTotal,
    unbudgetedTotal: a.unbudgetedTotal,
  };
}

// ── IdbWeeklyAggregate → WeeklyAggregate ─────────────────────────────────────

export function idbToWeeklyAggregate(row: IdbWeeklyAggregate): WeeklyAggregate {
  return {
    id: row.id,
    weekStart: Timestamp.fromMillis(row.weekStartMs),
    creditTotal: row.creditTotal,
    unbudgetedTotal: row.unbudgetedTotal,
    groupId: null as GroupId | null,
  };
}

// ── WeeklyAggregateSeedData → SeedWeeklyAggregate (build-time) ────────────────

function toMs(d: unknown): number | null {
  if (d instanceof Date) return d.getTime();
  if (d != null && typeof d === "object" && "toMillis" in d) return (d as { toMillis(): number }).toMillis();
  return null;
}

function requireMs(d: unknown, field: string): number {
  const ms = toMs(d);
  if (ms === null) throw new Error(`Expected Date or Timestamp for ${field}, got ${d}`);
  return ms;
}

function requireSeedNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Expected finite number for ${field}, got ${value}`);
  return value;
}

export function serializeSeedWeeklyAggregate(raw: WeeklyAggregateSeedData, id: string): SeedWeeklyAggregate {
  return {
    id,
    weekStartMs: requireMs(raw.weekStart, "weekStart"),
    creditTotal: requireSeedNumber(raw.creditTotal, "creditTotal"),
    unbudgetedTotal: requireSeedNumber(raw.unbudgetedTotal, "unbudgetedTotal"),
  };
}
