/**
 * Single source of truth for the Budget entity.
 * All per-entity representations (domain, IDB, raw/upload, seed declaration, seed data)
 * are defined or imported here; adaptor functions live alongside them.
 */
import { Timestamp } from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { GroupId } from "@commons-systems/authutil/groups";
import type { Brand } from "@commons-systems/firestoreutil/brand";
import { msToTs, UploadValidationError } from "./_helpers.js";
import type { BudgetSeedData } from "../../seeds/firestore.js";
import {
  ROLLOVERS,
  ALLOWANCE_PERIODS,
  type Rollover,
  type AllowancePeriod,
} from "../schema/enums.js";

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

export interface IdbBudget {
  id: string;
  name: string;
  allowance: number;
  allowancePeriod?: string;
  rollover: Rollover;
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
  readonly allowancePeriod: "weekly" | "monthly" | "quarterly";
  readonly rollover: "none" | "debt" | "balance";
  readonly overrides: SeedBudgetOverride[];
}

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

function requireRollover(value: unknown): Rollover {
  const s = requireString(value, "rollover");
  if (!(ROLLOVERS as readonly string[]).includes(s)) {
    throw new DataIntegrityError(`Expected rollover to be one of ${ROLLOVERS.join(", ")}, got ${value}`);
  }
  return s as Rollover;
}

function requireAllowancePeriod(value: unknown): AllowancePeriod {
  if (value == null) return "weekly";
  if (!(ALLOWANCE_PERIODS as readonly unknown[]).includes(value)) {
    throw new DataIntegrityError(`Expected allowancePeriod to be one of ${ALLOWANCE_PERIODS.join(", ")}, got ${value}`);
  }
  return value as AllowancePeriod;
}

function parseUploadTimestamp(iso: string, field: string): Timestamp {
  const ms = Date.parse(iso);
  if (isNaN(ms)) throw new UploadValidationError(`Invalid timestamp for ${field}: "${iso}"`);
  return Timestamp.fromMillis(ms);
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
    date: parseUploadTimestamp(o.date, "budget.overrides.date"),
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
    rollover: requireRollover(data.rollover),
    overrides: requireOverrides(data.overrides),
    groupId: optionalString(data.groupId, "groupId") as GroupId | null,
  };
}

// ── Raw upload → Budget ───────────────────────────────────────────────────────

function requireUploadId(value: unknown, entity: string, index: number): string {
  if (typeof value !== "string" || value === "") {
    throw new Error(`${entity}[${index}] is missing a valid id`);
  }
  return value;
}

function requireUploadAllowancePeriod(value: string | undefined): AllowancePeriod {
  if (value == null || value === "weekly") return "weekly";
  if (!(ALLOWANCE_PERIODS as readonly string[]).includes(value)) {
    throw new UploadValidationError(`Invalid allowancePeriod value: "${value}"`);
  }
  return value as AllowancePeriod;
}

function requireUploadRollover(value: string): Rollover {
  if (!(ROLLOVERS as readonly string[]).includes(value)) {
    throw new UploadValidationError(`Invalid rollover value: "${value}"`);
  }
  return value as Rollover;
}

export function parseRawBudget(b: RawBudget, i: number): Budget {
  return {
    id: requireUploadId(b.id, "budget", i) as BudgetId,
    name: b.name,
    allowance: b.allowance ?? 0,
    allowancePeriod: requireUploadAllowancePeriod(b.allowancePeriod),
    rollover: requireUploadRollover(b.rollover ?? "none"),
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

function toAllowancePeriod(value: string | undefined): AllowancePeriod {
  if (value === "monthly") return "monthly";
  if (value === "quarterly") return "quarterly";
  if (value == null || value === "weekly") return "weekly";
  throw new DataIntegrityError(`Invalid allowancePeriod: ${value}`);
}

export function idbToBudget(row: IdbBudget): Budget {
  return {
    id: row.id as BudgetId,
    name: row.name,
    allowance: row.allowance,
    allowancePeriod: toAllowancePeriod(row.allowancePeriod),
    rollover: row.rollover,
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

function requireSeedString(value: unknown, field: string): string {
  if (typeof value !== "string") throw new Error(`Expected string for ${field}, got ${typeof value}`);
  return value;
}

function requireSeedNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Expected finite number for ${field}, got ${value}`);
  return value;
}

function requireSeedNonNegativeNumber(value: unknown, field: string): number {
  const n = requireSeedNumber(value, field);
  if (n < 0) throw new Error(`Expected non-negative number for ${field}, got ${n}`);
  return n;
}

function requireSeedAllowancePeriod(value: unknown): "weekly" | "monthly" | "quarterly" {
  if (!(ALLOWANCE_PERIODS as readonly unknown[]).includes(value)) {
    throw new Error(`Expected allowancePeriod to be "weekly" | "monthly" | "quarterly", got ${JSON.stringify(value)}`);
  }
  return value as "weekly" | "monthly" | "quarterly";
}

function requireSeedRollover(value: unknown): "none" | "debt" | "balance" {
  if (!(ROLLOVERS as readonly unknown[]).includes(value)) {
    throw new Error(`Expected rollover to be "none" | "debt" | "balance", got ${JSON.stringify(value)}`);
  }
  return value as "none" | "debt" | "balance";
}

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
    allowancePeriod: requireSeedAllowancePeriod(raw.allowancePeriod),
    rollover: requireSeedRollover(raw.rollover),
    overrides,
  };
}
