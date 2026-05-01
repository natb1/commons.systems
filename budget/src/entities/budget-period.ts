/**
 * Single source of truth for the BudgetPeriod entity.
 * All per-entity representations (domain, IDB, raw/upload, seed declaration, seed data)
 * are defined or imported here; adaptor functions live alongside them.
 */
import { Timestamp } from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { GroupId } from "@commons-systems/authutil/groups";
import type { Brand } from "@commons-systems/firestoreutil/brand";
import {
  DataIntegrityError,
  optionalString,
  parseISOTimestamp,
  requireMs,
  requireNonNegativeNumber,
  requireNumber,
  requireSeedNumber,
  requireString,
  requireTimestamp,
  requireUploadId,
} from "./_helpers.js";
import type { BudgetPeriodSeedData } from "../../seeds/firestore.js";
import type { BudgetId } from "./budget.js";

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

// ── Seed output type ──────────────────────────────────────────────────────────
// Defined here so budget-seed-data.d.ts can re-export it without circular refs.
export interface SeedBudgetPeriod {
  readonly id: string;
  readonly budgetId: string;
  readonly periodStartMs: number;
  readonly periodEndMs: number;
  readonly total: number;
  readonly count: number;
  readonly categoryBreakdown: Record<string, number>;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

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

export function parseRawBudgetPeriod(p: RawBudgetPeriod, i: number): BudgetPeriod {
  return {
    id: requireUploadId(p.id, "budgetPeriod", i) as BudgetPeriodId,
    budgetId: requireUploadId(p.budgetId, "budgetPeriod.budgetId", i) as BudgetId,
    periodStart: parseISOTimestamp(p.periodStart, "budgetPeriod.periodStart"),
    periodEnd: parseISOTimestamp(p.periodEnd, "budgetPeriod.periodEnd"),
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
