/**
 * Single source of truth for the WeeklyAggregate entity.
 * WeeklyAggregate is a computed entity: it has Firestore read, IDB storage,
 * upload parse, export (exportToJson), and seed declaration layers.
 * All per-entity representations are defined or imported here; adaptor functions live alongside them.
 */
import { Timestamp } from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { GroupId } from "@commons-systems/authutil/groups";
import {
  msToISO,
  optionalString,
  parseISOTimestamp,
  requireMs,
  requireNumber,
  requireSeedNumber,
  requireTimestamp,
  requireUploadFiniteNumber,
  requireUploadId,
} from "./_helpers.js";
import type { WeeklyAggregateSeedData } from "../../seeds/firestore.js";

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
    id: requireUploadId(a.id, "weeklyAggregate", i),
    weekStart: parseISOTimestamp(a.weekStart, "weeklyAggregate.weekStart"),
    creditTotal: requireUploadFiniteNumber(a.creditTotal, "weeklyAggregate", i, "creditTotal"),
    unbudgetedTotal: requireUploadFiniteNumber(a.unbudgetedTotal, "weeklyAggregate", i, "unbudgetedTotal"),
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

// ── IdbWeeklyAggregate → RawWeeklyAggregate (export) ─────────────────────────

export function weeklyAggregateToRawJson(a: IdbWeeklyAggregate): RawWeeklyAggregate {
  return {
    id: a.id,
    weekStart: msToISO(a.weekStartMs),
    creditTotal: a.creditTotal,
    unbudgetedTotal: a.unbudgetedTotal,
  };
}

// ── WeeklyAggregateSeedData → SeedWeeklyAggregate (build-time) ────────────────

export function serializeSeedWeeklyAggregate(raw: WeeklyAggregateSeedData, id: string): SeedWeeklyAggregate {
  return {
    id,
    weekStartMs: requireMs(raw.weekStart, "weekStart"),
    creditTotal: requireSeedNumber(raw.creditTotal, "creditTotal"),
    unbudgetedTotal: requireSeedNumber(raw.unbudgetedTotal, "unbudgetedTotal"),
  };
}
