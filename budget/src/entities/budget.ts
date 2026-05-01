/**
 * Single source of truth for the Budget entity.
 * All per-entity representations (domain, IDB, raw/upload, seed declaration, seed data)
 * are defined or imported here; adaptor functions live alongside them.
 */
import { Timestamp } from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { GroupId } from "@commons-systems/authutil/groups";
import type { Brand } from "@commons-systems/firestoreutil/brand";
import {
  DataIntegrityError,
  UploadValidationError,
  msToTs,
  optionalString,
  parseISOTimestamp,
  requireEnum,
  requireMs,
  requireNonNegativeNumber,
  requireNumber,
  requireSeedEnum,
  requireSeedNonNegativeNumber,
  requireSeedNumber,
  requireSeedString,
  requireString,
  requireTimestamp,
  requireUploadEnum,
  requireUploadId,
} from "./_helpers.js";
import type { BudgetSeedData } from "../../seeds/firestore.js";
import {
  ROLLOVERS,
  ALLOWANCE_PERIODS,
  type Rollover,
  type AllowancePeriod,
} from "../schema/enums.js";

export type BudgetId = Brand<"BudgetId">;

// ── Nested types ──────────────────────────────────────────────────────────────

export interface BudgetOverride {
  readonly date: Timestamp;
  readonly balance: number;
}

// ── Domain interface ──────────────────────────────────────────────────────────

export interface Budget {
  readonly id: BudgetId;
  readonly name: string;
  readonly allowance: number;
  readonly allowancePeriod: AllowancePeriod;
  readonly rollover: Rollover;
  /** Sorted by date ascending. findLatestOverride assumes this ordering. */
  readonly overrides: BudgetOverride[];
  readonly groupId: GroupId | null;
}

// ── IDB storage interface ─────────────────────────────────────────────────────
// Stored values originate from Firestore but may pre-date schema changes;
// idbToBudget revalidates allowancePeriod/rollover against the current enums.

export interface IdbBudget {
  id: string;
  name: string;
  allowance: number;
  allowancePeriod?: string;
  rollover: string;
  overrides?: Array<{ dateMs: number; balance: number }>;
}

// ── Raw upload interface ──────────────────────────────────────────────────────

export interface RawBudgetOverride {
  date: string;
  balance: number;
}

export interface RawBudget {
  id: string;
  name: string;
  allowance: number;
  allowancePeriod?: string;
  rollover: string;
  overrides?: RawBudgetOverride[];
}

// ── Seed data type alias ──────────────────────────────────────────────────────
export type { BudgetSeedData };

// ── Seed output types ─────────────────────────────────────────────────────────
// Defined here so budget-seed-data.d.ts can re-export them without circular refs.
export interface SeedBudgetOverride {
  readonly dateMs: number;
  readonly balance: number;
}

export interface SeedBudget {
  readonly id: string;
  readonly name: string;
  readonly allowance: number;
  readonly allowancePeriod: AllowancePeriod;
  readonly rollover: Rollover;
  readonly overrides: SeedBudgetOverride[];
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function requireAllowancePeriod(value: unknown): AllowancePeriod {
  // Pre-rollout records may have a missing `allowancePeriod`; default to "weekly".
  if (value == null) return "weekly";
  return requireEnum(value, ALLOWANCE_PERIODS, "allowancePeriod");
}

function requireOverrides(value: unknown): BudgetOverride[] {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    throw new DataIntegrityError(`Expected array for overrides, got ${typeof value}`);
  }
  const result: BudgetOverride[] = [];
  for (let i = 0; i < value.length; i++) {
    const entry = value[i];
    if (entry == null || typeof entry !== "object") {
      throw new DataIntegrityError(`overrides[${i}] is not an object`);
    }
    const date = requireTimestamp(entry.date, `overrides[${i}].date`);
    const balance = requireNumber(entry.balance, `overrides[${i}].balance`);
    result.push({ date, balance });
  }
  for (let i = 1; i < result.length; i++) {
    if (result[i].date.toMillis() <= result[i - 1].date.toMillis()) {
      throw new DataIntegrityError(`overrides not sorted by date ascending at index ${i}`);
    }
  }
  return result;
}

function requireRawOverrides(rawOverrides: RawBudgetOverride[], budgetIndex: number): BudgetOverride[] {
  const parsed = rawOverrides.map(o => ({
    date: parseISOTimestamp(o.date, "budget.overrides.date"),
    balance: o.balance,
  }));
  for (let j = 1; j < parsed.length; j++) {
    if (parsed[j].date.toMillis() <= parsed[j - 1].date.toMillis()) {
      throw new UploadValidationError(`budget[${budgetIndex}].overrides not sorted by date ascending at index ${j}`);
    }
  }
  return parsed;
}

// ── Firestore → Budget ────────────────────────────────────────────────────────

export function parseFirestoreBudget(docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>): Budget {
  const data = docSnap.data();
  const name = requireString(data.name, "name");
  if (!name) throw new DataIntegrityError("Budget name must be non-empty");
  return {
    id: docSnap.id as BudgetId,
    name,
    allowance: requireNonNegativeNumber(data.allowance, "allowance"),
    allowancePeriod: requireAllowancePeriod(data.allowancePeriod),
    rollover: requireEnum(data.rollover, ROLLOVERS, "rollover"),
    overrides: requireOverrides(data.overrides),
    groupId: optionalString(data.groupId, "groupId") as GroupId | null,
  };
}

// ── Raw upload → Budget ───────────────────────────────────────────────────────

export function parseRawBudget(b: RawBudget, i: number): Budget {
  return {
    id: requireUploadId(b.id, "budget", i) as BudgetId,
    name: b.name,
    allowance: b.allowance ?? 0,
    allowancePeriod: requireUploadEnum(b.allowancePeriod ?? "weekly", ALLOWANCE_PERIODS, "allowancePeriod"),
    rollover: requireUploadEnum(b.rollover ?? "none", ROLLOVERS, "rollover"),
    overrides: requireRawOverrides(b.overrides ?? [], i),
    groupId: null as GroupId | null,
  };
}

// ── Budget → IdbBudget ────────────────────────────────────────────────────────

export function budgetToIdbRecord(b: Budget): IdbBudget {
  return {
    id: b.id,
    name: b.name,
    allowance: b.allowance,
    allowancePeriod: b.allowancePeriod,
    rollover: b.rollover,
    overrides: b.overrides.map(o => ({ dateMs: o.date.toMillis(), balance: o.balance })),
  };
}

// ── IdbBudget → Budget ────────────────────────────────────────────────────────

export function idbToBudget(row: IdbBudget): Budget {
  return {
    id: row.id as BudgetId,
    name: row.name,
    allowance: row.allowance,
    allowancePeriod: requireAllowancePeriod(row.allowancePeriod),
    rollover: requireEnum(row.rollover, ROLLOVERS, "rollover"),
    overrides: (row.overrides ?? []).map(o => ({
      date: msToTs(o.dateMs) as Timestamp,
      balance: o.balance,
    })),
    groupId: null as GroupId | null,
  };
}

// ── IdbBudget → RawBudget (export) ────────────────────────────────────────────

export function budgetToRawJson(b: IdbBudget): object {
  return {
    id: b.id,
    name: b.name,
    allowance: b.allowance,
    allowancePeriod: b.allowancePeriod,
    rollover: b.rollover,
    overrides: (b.overrides ?? []).map(o => ({
      date: new Date(o.dateMs).toISOString(),
      balance: o.balance,
    })),
  };
}

// ── BudgetSeedData → SeedBudget (build-time) ──────────────────────────────────

export function serializeSeedBudget(raw: BudgetSeedData, id: string): SeedBudget {
  const name = requireSeedString(raw.name, "name");
  if (!name) throw new Error("Budget name must be non-empty");
  const overrides = Array.isArray((raw as unknown as Record<string, unknown>).overrides)
    ? ((raw as unknown as Record<string, unknown>).overrides as { date: unknown; balance: number }[]).map((o) => ({
        dateMs: requireMs(o.date, "overrides.date"),
        balance: requireSeedNumber(o.balance, "overrides.balance"),
      }))
    : [];
  return {
    id,
    name,
    allowance: requireSeedNonNegativeNumber(raw.allowance, "allowance"),
    allowancePeriod: requireSeedEnum(raw.allowancePeriod, ALLOWANCE_PERIODS, "allowancePeriod"),
    rollover: requireSeedEnum(raw.rollover, ROLLOVERS, "rollover"),
    overrides,
  };
}
