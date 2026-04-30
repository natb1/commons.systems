/**
 * Single source of truth for the Rule entity.
 * All per-entity representations (domain, IDB, raw/upload, seed declaration, seed data)
 * are defined or imported here; adaptor functions live alongside them.
 */
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { GroupId } from "@commons-systems/authutil/groups";
import type { Brand } from "@commons-systems/firestoreutil/brand";
import { UploadValidationError, nullToEmpty } from "./_helpers.js";
import type { RuleSeedData } from "../../seeds/firestore.js";
import {
  RULE_TYPES,
  type RuleType,
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

function optionalNumber(value: unknown, field: string): number | null {
  if (value == null) return null;
  return requireNumber(value, field);
}

function requireRuleType(value: unknown): RuleType {
  const s = requireString(value, "rule type");
  if (!(RULE_TYPES as readonly string[]).includes(s)) {
    throw new DataIntegrityError(`Expected rule type to be ${RULE_TYPES.join(" or ")}, got ${value}`);
  }
  return s as RuleType;
}

// ── Branded ID ────────────────────────────────────────────────────────────────

export type RuleId = Brand<"RuleId">;

// ── Domain interface ──────────────────────────────────────────────────────────

export interface Rule {
  readonly id: RuleId;
  readonly type: RuleType;
  readonly pattern: string;
  readonly target: string;
  readonly priority: number;
  readonly institution: string | null;
  readonly account: string | null;
  readonly minAmount: number | null;
  readonly maxAmount: number | null;
  readonly excludeCategory: string | null;
  readonly matchCategory: string | null;
  readonly groupId: GroupId | null;
}

// ── IDB storage interface ─────────────────────────────────────────────────────

export interface IdbRule {
  id: string;
  type: RuleType;
  pattern: string;
  target: string;
  priority: number;
  institution: string | null;
  account: string | null;
  minAmount: number | null;
  maxAmount: number | null;
  excludeCategory: string | null;
  matchCategory: string | null;
}

// ── Raw upload interface ──────────────────────────────────────────────────────

export interface RawRule {
  id: string;
  type: string;
  pattern: string;
  target: string;
  priority: number;
  institution: string;
  account: string;
  minAmount?: number;
  maxAmount?: number;
  excludeCategory?: string;
  matchCategory?: string;
}

// ── Seed data type alias ──────────────────────────────────────────────────────
export type { RuleSeedData };

// ── Seed output type ──────────────────────────────────────────────────────────
// Defined here so budget-seed-data.d.ts can re-export it without circular refs.
export interface SeedRule {
  readonly id: string;
  readonly type: "categorization" | "budget_assignment";
  readonly pattern: string;
  readonly target: string;
  readonly priority: number;
  readonly institution: string | null;
  readonly account: string | null;
  readonly minAmount: number | null;
  readonly maxAmount: number | null;
  readonly excludeCategory: string | null;
  readonly matchCategory: string | null;
}

// ── Internal upload helpers ───────────────────────────────────────────────────

function requireId(value: unknown, entity: string, index: number): string {
  if (typeof value !== "string" || value === "") {
    throw new UploadValidationError(`${entity}[${index}] is missing a valid id`);
  }
  return value;
}

function requireUploadRuleType(value: string): RuleType {
  if (!(RULE_TYPES as readonly string[]).includes(value)) {
    throw new UploadValidationError(`Invalid rule type: "${value}"`);
  }
  return value as RuleType;
}

function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}

// ── Firestore → Rule ──────────────────────────────────────────────────────────

export function parseFirestoreRule(docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>): Rule {
  const data = docSnap.data();
  return {
    id: docSnap.id as RuleId,
    type: requireRuleType(data.type),
    pattern: requireString(data.pattern, "pattern"),
    target: requireString(data.target, "target"),
    priority: requireNumber(data.priority, "priority"),
    institution: optionalString(data.institution, "institution"),
    account: optionalString(data.account, "account"),
    minAmount: optionalNumber(data.minAmount, "minAmount"),
    maxAmount: optionalNumber(data.maxAmount, "maxAmount"),
    excludeCategory: optionalString(data.excludeCategory, "excludeCategory"),
    matchCategory: optionalString(data.matchCategory, "matchCategory"),
    groupId: optionalString(data.groupId, "groupId") as GroupId | null,
  };
}

// ── Raw upload → Rule ─────────────────────────────────────────────────────────

export function parseRawRule(r: RawRule, i: number): Rule {
  return {
    id: requireId(r.id, "rule", i) as RuleId,
    type: requireUploadRuleType(r.type),
    pattern: r.pattern ?? "",
    target: r.target ?? "",
    priority: r.priority ?? 0,
    institution: emptyToNull(r.institution ?? ""),
    account: emptyToNull(r.account ?? ""),
    minAmount: r.minAmount ?? null,
    maxAmount: r.maxAmount ?? null,
    excludeCategory: emptyToNull(r.excludeCategory ?? ""),
    matchCategory: emptyToNull(r.matchCategory ?? ""),
    groupId: null as GroupId | null,
  };
}

// ── Rule → IdbRule ────────────────────────────────────────────────────────────

export function ruleToIdbRecord(r: Rule): IdbRule {
  return {
    id: r.id,
    type: r.type,
    pattern: r.pattern,
    target: r.target,
    priority: r.priority,
    institution: r.institution,
    account: r.account,
    minAmount: r.minAmount,
    maxAmount: r.maxAmount,
    excludeCategory: r.excludeCategory,
    matchCategory: r.matchCategory,
  };
}

// ── IdbRule → Rule ────────────────────────────────────────────────────────────

export function idbToRule(row: IdbRule): Rule {
  return {
    id: row.id as RuleId,
    type: row.type,
    pattern: row.pattern,
    target: row.target,
    priority: row.priority,
    institution: row.institution,
    account: row.account,
    minAmount: row.minAmount,
    maxAmount: row.maxAmount,
    excludeCategory: row.excludeCategory,
    matchCategory: row.matchCategory,
    groupId: null as GroupId | null,
  };
}

// ── IdbRule → export JSON ─────────────────────────────────────────────────────

export function ruleToRawJson(r: IdbRule): object {
  return {
    id: r.id,
    type: r.type,
    pattern: r.pattern,
    target: r.target,
    priority: r.priority,
    institution: nullToEmpty(r.institution),
    account: nullToEmpty(r.account),
    ...(r.minAmount != null ? { minAmount: r.minAmount } : {}),
    ...(r.maxAmount != null ? { maxAmount: r.maxAmount } : {}),
    ...(r.excludeCategory ? { excludeCategory: r.excludeCategory } : {}),
    ...(r.matchCategory ? { matchCategory: r.matchCategory } : {}),
  };
}

// ── RuleSeedData → SeedRule (build-time) ──────────────────────────────────────

function requireSeedString(value: unknown, field: string): string {
  if (typeof value !== "string") throw new Error(`Expected string for ${field}, got ${typeof value}`);
  return value;
}

function requireSeedNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Expected finite number for ${field}, got ${value}`);
  return value;
}

function requireSeedRuleType(value: unknown): "categorization" | "budget_assignment" {
  if (!(RULE_TYPES as readonly unknown[]).includes(value)) {
    throw new Error(`Expected rule type to be "categorization" | "budget_assignment", got ${JSON.stringify(value)}`);
  }
  return value as "categorization" | "budget_assignment";
}

export function serializeSeedRule(raw: RuleSeedData, id: string): SeedRule {
  return {
    id,
    type: requireSeedRuleType(raw.type),
    pattern: requireSeedString(raw.pattern, "pattern"),
    target: requireSeedString(raw.target, "target"),
    priority: requireSeedNumber(raw.priority, "priority"),
    institution: raw.institution,
    account: raw.account,
    minAmount: raw.minAmount,
    maxAmount: raw.maxAmount,
    excludeCategory: raw.excludeCategory,
    matchCategory: raw.matchCategory,
  };
}
