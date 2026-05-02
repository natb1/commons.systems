/**
 * Single source of truth for the NormalizationRule entity.
 * All per-entity representations (domain, IDB, raw/upload, seed declaration, seed data)
 * are defined or imported here; adaptor functions live alongside them.
 */
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { GroupId } from "@commons-systems/authutil/groups";
import type { Brand } from "@commons-systems/firestoreutil/brand";
import {
  emptyToNull,
  nullToEmpty,
  optionalString,
  requireNumber,
  requireSeedNumber,
  requireSeedString,
  requireString,
  requireUploadId,
} from "./_helpers.js";
import type { NormalizationRuleSeedData } from "../../seeds/firestore.js";

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
    id: requireUploadId(r.id, "normalizationRule", i) as NormalizationRuleId,
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
