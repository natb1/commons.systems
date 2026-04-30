/**
 * Single source of truth for the BudgetPeriod entity.
 * All per-entity representations (domain, IDB, raw/upload, seed declaration, seed data)
 * are defined or imported here; adaptor functions live alongside them.
 */
import { Timestamp } from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { GroupId } from "@commons-systems/authutil/groups";
import type { Brand } from "@commons-systems/firestoreutil/brand";
import type { BudgetPeriodSeedData } from "../../seeds/firestore.js";
import type { SeedBudgetPeriod } from "virtual:budget-seed-data";
import type { BudgetId } from "./budget.js";

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

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new DataIntegrityError(`Expected string for ${field}, got ${typeof value}`);
  }
  return value;
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new DataIntegrityError(`Expected finite number for ${field}, got ${value}`);
  }
  return value;
}

function optionalString(value: unknown, field: string): string | null {
  if (value == null) return null;
  return requireString(value, field);
}

export type BudgetPeriodId = Brand<"BudgetPeriodId">;

// ── Domain interface ──────────────────────────────────────────────────────────

export interface BudgetPeriod {
  readonly id: BudgetPeriodId;
  readonly budgetId: BudgetId;
  readonly periodStart: Timestamp;
  readonly periodEnd: Timestamp;
  /** Sum of net transaction amounts (after reimbursement) in this period. May be negative when credits/refunds exceed debits. Client-updatable. */
  readonly total: number;
  /** Number of transactions in this period. Non-negative, immutable by client. */
  readonly count: number;
  /** Net amounts broken down by category. Immutable by client. */
  readonly categoryBreakdown: Record<string, number>;
  readonly groupId: GroupId | null;
}

// ── IDB storage interface ─────────────────────────────────────────────────────

export interface IdbBudgetPeriod {
  id: string;
  budgetId: string;
  periodStartMs: number;
  periodEndMs: number;
  total: number;
  count: number;
  categoryBreakdown: Record<string, number>;
}

// ── Raw upload interface ──────────────────────────────────────────────────────

export interface RawBudgetPeriod {
  id: string;
  budgetId: string;
  periodStart: string;
  periodEnd: string;
  total: number;
  count: number;
  categoryBreakdown: Record<string, number>;
}

// ── Seed data type alias ──────────────────────────────────────────────────────
export type { BudgetPeriodSeedData };

// ── Internal helpers ──────────────────────────────────────────────────────────

function requireTimestamp(value: unknown, field: string): Timestamp {
  if (value == null) {
    throw new DataIntegrityError(`Expected Timestamp for ${field}, got null`);
  }
  if (!(value instanceof Timestamp)) {
    throw new DataIntegrityError(`Expected Timestamp for ${field}, got ${typeof value}`);
  }
  return value;
}

function requireNonNegativeNumber(value: unknown, field: string): number {
  const n = requireNumber(value, field);
  if (n < 0) throw new DataIntegrityError(`Expected non-negative number for ${field}, got ${n}`);
  return n;
}

function requireCategoryBreakdown(value: unknown): Record<string, number> {
  if (value == null) return {};
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new DataIntegrityError(`Expected object for categoryBreakdown, got ${typeof value}`);
  }
  const result: Record<string, number> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (typeof val !== "number" || !Number.isFinite(val)) {
      throw new DataIntegrityError(`categoryBreakdown[${key}] is not a finite number`);
    }
    result[key] = val;
  }
  return result;
}

function parseTimestamp(iso: string, field: string): Timestamp {
  const ms = Date.parse(iso);
  if (isNaN(ms)) throw new Error(`Invalid timestamp for ${field}: "${iso}"`);
  return Timestamp.fromMillis(ms);
}

// ── Firestore → BudgetPeriod ──────────────────────────────────────────────────

export function parseFirestoreBudgetPeriod(docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>): BudgetPeriod {
  const data = docSnap.data();
  const periodStart = requireTimestamp(data.periodStart, "periodStart");
  const periodEnd = requireTimestamp(data.periodEnd, "periodEnd");
  if (periodStart.toMillis() >= periodEnd.toMillis()) {
    throw new DataIntegrityError(
      `periodStart must be before periodEnd for budget period ${docSnap.id}`
    );
  }
  return {
    id: docSnap.id as BudgetPeriodId,
    budgetId: requireString(data.budgetId, "budgetId") as BudgetId,
    periodStart,
    periodEnd,
    total: requireNumber(data.total, "total"),
    count: requireNonNegativeNumber(data.count, "count"),
    categoryBreakdown: requireCategoryBreakdown(data.categoryBreakdown),
    groupId: optionalString(data.groupId, "groupId") as GroupId | null,
  };
}

// ── Raw upload → BudgetPeriod ─────────────────────────────────────────────────

function requireUploadId(value: unknown, entity: string, index: number): string {
  if (typeof value !== "string" || value === "") {
    throw new Error(`${entity}[${index}] is missing a valid id`);
  }
  return value;
}

export function parseRawBudgetPeriod(p: RawBudgetPeriod, i: number): BudgetPeriod {
  return {
    id: requireUploadId(p.id, "budgetPeriod", i) as BudgetPeriodId,
    budgetId: requireUploadId(p.budgetId, "budgetPeriod.budgetId", i) as BudgetId,
    periodStart: parseTimestamp(p.periodStart, "budgetPeriod.periodStart"),
    periodEnd: parseTimestamp(p.periodEnd, "budgetPeriod.periodEnd"),
    total: p.total ?? 0,
    count: p.count ?? 0,
    categoryBreakdown: p.categoryBreakdown ?? {},
    groupId: null as GroupId | null,
  };
}

// ── BudgetPeriod → IdbBudgetPeriod ────────────────────────────────────────────

export function budgetPeriodToIdbRecord(p: BudgetPeriod): IdbBudgetPeriod {
  return {
    id: p.id,
    budgetId: p.budgetId,
    periodStartMs: p.periodStart.toMillis(),
    periodEndMs: p.periodEnd.toMillis(),
    total: p.total,
    count: p.count,
    categoryBreakdown: p.categoryBreakdown,
  };
}

// ── IdbBudgetPeriod → BudgetPeriod ────────────────────────────────────────────

export function idbToBudgetPeriod(row: IdbBudgetPeriod): BudgetPeriod {
  return {
    id: row.id as BudgetPeriodId,
    budgetId: row.budgetId as BudgetId,
    periodStart: Timestamp.fromMillis(row.periodStartMs),
    periodEnd: Timestamp.fromMillis(row.periodEndMs),
    total: row.total,
    count: row.count,
    categoryBreakdown: row.categoryBreakdown,
    groupId: null as GroupId | null,
  };
}

// ── IdbBudgetPeriod → RawBudgetPeriod (export) ────────────────────────────────

export function budgetPeriodToRawJson(p: IdbBudgetPeriod): object {
  return {
    id: p.id,
    budgetId: p.budgetId,
    periodStart: new Date(p.periodStartMs).toISOString(),
    periodEnd: new Date(p.periodEndMs).toISOString(),
    total: p.total,
    count: p.count,
    categoryBreakdown: p.categoryBreakdown,
  };
}

// ── BudgetPeriodSeedData → SeedBudgetPeriod (build-time) ──────────────────────

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

export function serializeSeedBudgetPeriod(raw: BudgetPeriodSeedData, id: string): SeedBudgetPeriod {
  return {
    id,
    budgetId: raw.budgetId,
    periodStartMs: requireMs(raw.periodStart, "periodStart"),
    periodEndMs: requireMs(raw.periodEnd, "periodEnd"),
    total: requireSeedNumber(raw.total, "total"),
    count: requireSeedNumber(raw.count, "count"),
    categoryBreakdown: raw.categoryBreakdown,
  };
}
