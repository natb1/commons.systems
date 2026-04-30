/**
 * Single source of truth for the NormalizationRule entity.
 * All per-entity representations (domain, IDB, raw/upload, seed declaration, seed data)
 * are defined or imported here; adaptor functions live alongside them.
 */
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { GroupId } from "@commons-systems/authutil/groups";
import type { Brand } from "@commons-systems/firestoreutil/brand";
import { UploadValidationError, nullToEmpty } from "./_helpers.js";
import type { NormalizationRuleSeedData } from "../../seeds/firestore.js";

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

// ── Branded ID ────────────────────────────────────────────────────────────────

export type NormalizationRuleId = Brand<"NormalizationRuleId">;

// ── Domain interface ──────────────────────────────────────────────────────────

export interface NormalizationRule {
  readonly id: NormalizationRuleId;
  readonly pattern: string;
  readonly patternType: string | null;
  readonly canonicalDescription: string;
  readonly dateWindowDays: number;
  readonly institution: string | null;
  readonly account: string | null;
  readonly priority: number;
  readonly groupId: GroupId | null;
}

// ── IDB storage interface ─────────────────────────────────────────────────────

export interface IdbNormalizationRule {
  id: string;
  pattern: string;
  patternType: string | null;
  canonicalDescription: string;
  dateWindowDays: number;
  institution: string | null;
  account: string | null;
  priority: number;
}

// ── Raw upload interface ──────────────────────────────────────────────────────

export interface RawNormalizationRule {
  id: string;
  pattern: string;
  patternType: string;
  canonicalDescription: string;
  dateWindowDays: number;
  institution: string;
  account: string;
  priority: number;
}

// ── Seed data type alias ──────────────────────────────────────────────────────
export type { NormalizationRuleSeedData };

// ── Seed output type ──────────────────────────────────────────────────────────
// Defined here so budget-seed-data.d.ts can re-export it without circular refs.
export interface SeedNormalizationRule {
  readonly id: string;
  readonly pattern: string;
  readonly patternType: string | null;
  readonly canonicalDescription: string;
  readonly dateWindowDays: number;
  readonly institution: string | null;
  readonly account: string | null;
  readonly priority: number;
}

// ── Internal upload helpers ───────────────────────────────────────────────────

function requireId(value: unknown, entity: string, index: number): string {
  if (typeof value !== "string" || value === "") {
    throw new UploadValidationError(`${entity}[${index}] is missing a valid id`);
  }
  return value;
}

function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}

// ── Firestore → NormalizationRule ─────────────────────────────────────────────

export function parseFirestoreNormalizationRule(docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>): NormalizationRule {
  const data = docSnap.data();
  return {
    id: docSnap.id as NormalizationRuleId,
    pattern: requireString(data.pattern, "pattern"),
    patternType: optionalString(data.patternType, "patternType"),
    canonicalDescription: requireString(data.canonicalDescription, "canonicalDescription"),
    dateWindowDays: data.dateWindowDays == null ? 0 : requireNumber(data.dateWindowDays, "dateWindowDays"),
    institution: optionalString(data.institution, "institution"),
    account: optionalString(data.account, "account"),
    priority: requireNumber(data.priority, "priority"),
    groupId: optionalString(data.groupId, "groupId") as GroupId | null,
  };
}

// ── Raw upload → NormalizationRule ────────────────────────────────────────────

export function parseRawNormalizationRule(r: RawNormalizationRule, i: number): NormalizationRule {
  return {
    id: requireId(r.id, "normalizationRule", i) as NormalizationRuleId,
    pattern: r.pattern ?? "",
    patternType: emptyToNull(r.patternType ?? ""),
    canonicalDescription: r.canonicalDescription ?? "",
    dateWindowDays: r.dateWindowDays ?? 0,
    institution: emptyToNull(r.institution ?? ""),
    account: emptyToNull(r.account ?? ""),
    priority: r.priority ?? 0,
    groupId: null as GroupId | null,
  };
}

// ── NormalizationRule → IdbNormalizationRule ──────────────────────────────────

export function normalizationRuleToIdbRecord(r: NormalizationRule): IdbNormalizationRule {
  return {
    id: r.id,
    pattern: r.pattern,
    patternType: r.patternType,
    canonicalDescription: r.canonicalDescription,
    dateWindowDays: r.dateWindowDays,
    institution: r.institution,
    account: r.account,
    priority: r.priority,
  };
}

// ── IdbNormalizationRule → NormalizationRule ──────────────────────────────────

export function idbToNormalizationRule(row: IdbNormalizationRule): NormalizationRule {
  return {
    id: row.id as NormalizationRuleId,
    pattern: row.pattern,
    patternType: row.patternType,
    canonicalDescription: row.canonicalDescription,
    dateWindowDays: row.dateWindowDays,
    institution: row.institution,
    account: row.account,
    priority: row.priority,
    groupId: null as GroupId | null,
  };
}

// ── IdbNormalizationRule → export JSON ───────────────────────────────────────

export function normalizationRuleToRawJson(r: IdbNormalizationRule): object {
  return {
    id: r.id,
    pattern: r.pattern,
    patternType: nullToEmpty(r.patternType),
    canonicalDescription: r.canonicalDescription,
    dateWindowDays: r.dateWindowDays,
    institution: nullToEmpty(r.institution),
    account: nullToEmpty(r.account),
    priority: r.priority,
  };
}

// ── NormalizationRuleSeedData → SeedNormalizationRule (build-time) ────────────

function requireSeedString(value: unknown, field: string): string {
  if (typeof value !== "string") throw new Error(`Expected string for ${field}, got ${typeof value}`);
  return value;
}

function requireSeedNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Expected finite number for ${field}, got ${value}`);
  return value;
}

export function serializeSeedNormalizationRule(raw: NormalizationRuleSeedData, id: string): SeedNormalizationRule {
  return {
    id,
    pattern: requireSeedString(raw.pattern, "pattern"),
    patternType: raw.patternType ?? null,
    canonicalDescription: requireSeedString(raw.canonicalDescription, "canonicalDescription"),
    dateWindowDays: raw.dateWindowDays ?? 0,
    institution: raw.institution ?? null,
    account: raw.account ?? null,
    priority: requireSeedNumber(raw.priority, "priority"),
  };
}
