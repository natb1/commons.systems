/**
 * Operational-layer carriers: claim records and evidence entries.
 *
 * These are the `orchestration` write class in file form — observed state,
 * appended and never authored (`tactic-intent-orchestration-layer-schema`).
 * They are NOT nodes: they live under `<store>/operational/`, which
 * `listNodesResilient` (`store.ts`'s `readdirSync(dir).filter(name =>
 * name.endsWith(".md") …)`, shared by `listNodes`, `listNodesStrict` and hence
 * `validateGraph`) never scans, since that scan reads only top-level `*.md` in
 * the store dir. So `validateGraph` cannot mistake one for a node.
 *
 * This module is pure: types, validators, deterministic ids, and path helpers.
 * Every filesystem effect lives in `operational-store.ts`.
 *
 * **PR authority split** (`strategy-graph-native-dispatch`, 2026-09-01): the
 * graph side stores observed evidence and *references* only. `pr` is a number —
 * a reference. Neither shape may carry expectations about PR content (no title,
 * no body, no expected diff), which is why both validators reject unknown keys:
 * such a field cannot be smuggled in.
 */
import { join } from "node:path";
import { createHash } from "node:crypto";
import { IntentionSchemaError } from "./errors.js";
import { isPlainObject } from "./schema.js";
import { assertPathSafeId } from "./store.js";

export const EVIDENCE_SCHEMA = "evidence.v1";
export const CLAIM_SCHEMA = "claim.v1";

/** The directory under the intentions store that holds every operational record. */
export const OPERATIONAL_DIRNAME = "operational";

export const DISPOSITIONS = ["fixed", "frontier-routed", "refuted"] as const;
export type Disposition = (typeof DISPOSITIONS)[number];

/**
 * Proof that an evidence entry records an *observed* fact rather than an
 * assertion. At least one member must be non-null; an entry with no proof is
 * refused.
 *
 * All four keys are always present after validation, each explicitly `null`
 * when unset. That normalization is load-bearing, not cosmetic: the entry's
 * path is derived from a hash of its canonical form, so `{sha}` and
 * `{sha, pr: null}` must canonicalize identically or the same observed fact
 * would land at two paths and defeat append idempotence.
 */
export interface EvidenceProof {
  /** Git object id of the landed commit, lowercase hex. */
  sha: string | null;
  /** PR number — a reference, never PR content. */
  pr: number | null;
  /** A stamp identifier (e.g. a scope-stamp or round stamp). */
  stamp: string | null;
  /** A CI check name or run identifier. */
  check: string | null;
}

/** An appended observed fact bearing on one strategy. Created once, never edited. */
export interface EvidenceEntry {
  schema: typeof EVIDENCE_SCHEMA;
  /** The strategy id the entry bears on. */
  strategy: string;
  /** Criterion id, or `null` when the entry bears on a prose gap. */
  criterion: string | null;
  /** The gap text when `criterion` is `null`, else `null`. */
  gap: string | null;
  /** The observed fact or finding, prose. */
  finding: string;
  disposition: Disposition | null;
  proof: EvidenceProof;
  /** A stable slug grouping recurrences of one finding class. */
  recurrence_key: string;
  /** The claim id the entry was produced under, or `null`. */
  claim: string | null;
  /** `YYYY-MM-DD`. */
  observed_at: string;
}

/** Who holds a claim. Identity only — no PR content. */
export interface ClaimHolder {
  session: string;
  worktree: string;
  branch: string;
}

/**
 * An exclusive, time-bounded reservation over part of one strategy's frontier.
 * One file per claim — no shared hot file (author directive, 2026-09-01).
 */
export interface ClaimRecord {
  schema: typeof CLAIM_SCHEMA;
  claim_id: string;
  strategy: string;
  /** The frontier-entry / criterion ids reserved by this claim. A set: no duplicates. */
  bite: string[];
  claimed_at: string;
  /** Required: a claim with no expiry is not time-bounded, and an expired claim is not live. */
  expires_at: string;
  holder: ClaimHolder;
  /** PR number or null — a reference, never PR content. */
  pr: number | null;
}

const EVIDENCE_KEYS: readonly string[] = [
  "schema",
  "strategy",
  "criterion",
  "gap",
  "finding",
  "disposition",
  "proof",
  "recurrence_key",
  "claim",
  "observed_at",
];

const PROOF_KEYS: readonly string[] = ["sha", "pr", "stamp", "check"];

const CLAIM_KEYS: readonly string[] = [
  "schema",
  "claim_id",
  "strategy",
  "bite",
  "claimed_at",
  "expires_at",
  "holder",
  "pr",
];

const HOLDER_KEYS: readonly string[] = ["session", "worktree", "branch"];

/** A stable grouping slug: lowercase alphanumerics joined by single dashes. */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** A git object id, sha1 or sha256, possibly abbreviated. */
const OBJECT_ID = /^[0-9a-f]{7,64}$/;

// --- Local guards ----------------------------------------------------------
// Mirrors schema.ts's "Local guards" block (`schema.ts:387-420`): the same
// throw-IntentionSchemaError-naming-the-field idiom, re-implemented here
// because schema.ts keeps its own copies module-private.

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new IntentionSchemaError(`Expected string for ${field}, got ${typeof value}`);
  }
  return value;
}

function requireNonEmptyString(value: unknown, field: string): string {
  const s = requireString(value, field);
  if (s.trim() === "") {
    throw new IntentionSchemaError(`Expected non-empty string for ${field}`);
  }
  return s;
}

function optionalNonEmptyString(value: unknown, field: string): string | null {
  if (value == null) return null;
  return requireNonEmptyString(value, field);
}

function requireOneOf<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  const s = requireString(value, field);
  const found = allowed.find((a) => a === s);
  if (found === undefined) {
    throw new IntentionSchemaError(
      `Invalid ${field}: "${s}" (expected one of ${allowed.join(", ")})`,
    );
  }
  return found;
}

/** PR numbers are counters: whole and >= 0. */
function optionalNonNegativeInt(value: unknown, field: string): number | null {
  if (value == null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new IntentionSchemaError(`Expected finite number for ${field}, got ${typeof value}`);
  }
  if (!Number.isInteger(value) || value < 0) {
    throw new IntentionSchemaError(`Expected non-negative integer for ${field}, got ${value}`);
  }
  return value;
}

/** Shape only, like `schema.ts`'s `requireDateString` — calendar validity is not this layer's job. */
function requireDateString(value: unknown, field: string): string {
  const s = requireString(value, field);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw new IntentionSchemaError(`Expected YYYY-MM-DD date string for ${field}, got "${s}"`);
  }
  return s;
}

/**
 * The repo's ISO-8601 instant profile: fixed-width UTC second precision,
 * `YYYY-MM-DDTHH:MM:SSZ`, exactly as `schema.ts`'s `requireTimestampString`
 * defines it.
 *
 * Fixed width is LOAD-BEARING for claim liveness: it makes lexicographic order
 * equal chronological order, so `expires_at > now` is a string comparison with
 * no date arithmetic and no timezone. Milliseconds left in would be a
 * same-second landmine (`"…:06.789Z" >= "…:06Z"` is FALSE — `.` is 0x2E, `Z`
 * is 0x5A), so a writer must truncate with `utcInstant` below.
 */
function requireInstant(value: unknown, field: string): string {
  const s = requireString(value, field);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(s)) {
    throw new IntentionSchemaError(
      `Expected YYYY-MM-DDTHH:MM:SSZ timestamp string for ${field}, got "${s}"`,
    );
  }
  return s;
}

function rejectUnknownKeys(value: Record<string, unknown>, allowed: readonly string[], field: string): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      throw new IntentionSchemaError(
        `Unknown key ${field}.${key}: the operational shapes are closed, so no ` +
          `expectation about PR content can be smuggled in (allowed: ${allowed.join(", ")})`,
      );
    }
  }
}

function requireObject(value: unknown, field: string): Record<string, unknown> {
  if (!isPlainObject(value)) {
    throw new IntentionSchemaError(`Expected object for ${field}, got ${typeof value}`);
  }
  return value;
}

/** The UTC instant for `date` in the fixed-width profile `requireInstant` accepts. */
export function utcInstant(date: Date = new Date()): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

// --- Validators -------------------------------------------------------------

function validateProof(value: unknown, field: string): EvidenceProof {
  const raw = requireObject(value, field);
  rejectUnknownKeys(raw, PROOF_KEYS, field);
  const sha = optionalNonEmptyString(raw.sha, `${field}.sha`);
  if (sha !== null && !OBJECT_ID.test(sha)) {
    throw new IntentionSchemaError(
      `Expected a lowercase hex git object id for ${field}.sha, got "${sha}"`,
    );
  }
  const proof: EvidenceProof = {
    sha,
    pr: optionalNonNegativeInt(raw.pr, `${field}.pr`),
    stamp: optionalNonEmptyString(raw.stamp, `${field}.stamp`),
    check: optionalNonEmptyString(raw.check, `${field}.check`),
  };
  if (proof.sha === null && proof.pr === null && proof.stamp === null && proof.check === null) {
    throw new IntentionSchemaError(
      `${field} carries no proof: evidence is an observed fact WITH proof, so at ` +
        `least one of ${PROOF_KEYS.join(", ")} must be non-null`,
    );
  }
  return proof;
}

/**
 * Validate an `evidence.v1` entry, returning it in normalized form (every key
 * present, unset optionals explicitly `null`, keys in declaration order).
 * Throws `IntentionSchemaError` naming the offending field.
 */
export function validateEvidenceEntry(value: unknown, field = "evidence"): EvidenceEntry {
  const raw = requireObject(value, field);
  rejectUnknownKeys(raw, EVIDENCE_KEYS, field);
  if (raw.schema !== EVIDENCE_SCHEMA) {
    throw new IntentionSchemaError(
      `Expected ${field}.schema === "${EVIDENCE_SCHEMA}", got ${JSON.stringify(raw.schema)}`,
    );
  }
  const strategy = requireNonEmptyString(raw.strategy, `${field}.strategy`);
  // The strategy id becomes a path component (`evidence/<strategy>/…`), so it
  // passes the SAME gate every other id-to-path-component conversion uses.
  assertPathSafeId(strategy);
  const criterion = optionalNonEmptyString(raw.criterion, `${field}.criterion`);
  const gap = optionalNonEmptyString(raw.gap, `${field}.gap`);
  if ((criterion === null) === (gap === null)) {
    throw new IntentionSchemaError(
      `Exactly one of ${field}.criterion / ${field}.gap must be non-null: an entry ` +
        `bears either on a named criterion or on a prose gap, never both and never neither`,
    );
  }
  const recurrence_key = requireNonEmptyString(raw.recurrence_key, `${field}.recurrence_key`);
  if (!SLUG.test(recurrence_key)) {
    throw new IntentionSchemaError(
      `Expected a lowercase-dashed slug for ${field}.recurrence_key, got "${recurrence_key}"`,
    );
  }
  return {
    schema: EVIDENCE_SCHEMA,
    strategy,
    criterion,
    gap,
    finding: requireNonEmptyString(raw.finding, `${field}.finding`),
    disposition:
      raw.disposition == null
        ? null
        : requireOneOf(raw.disposition, DISPOSITIONS, `${field}.disposition`),
    proof: validateProof(raw.proof, `${field}.proof`),
    recurrence_key,
    claim: optionalNonEmptyString(raw.claim, `${field}.claim`),
    observed_at: requireDateString(raw.observed_at, `${field}.observed_at`),
  };
}

function validateHolder(value: unknown, field: string): ClaimHolder {
  const raw = requireObject(value, field);
  rejectUnknownKeys(raw, HOLDER_KEYS, field);
  return {
    session: requireNonEmptyString(raw.session, `${field}.session`),
    worktree: requireNonEmptyString(raw.worktree, `${field}.worktree`),
    branch: requireNonEmptyString(raw.branch, `${field}.branch`),
  };
}

function validateBite(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new IntentionSchemaError(`Expected array for ${field}, got ${typeof value}`);
  }
  const bite = value.map((item, i) => requireNonEmptyString(item, `${field}[${i}]`));
  const seen = new Set<string>();
  for (const id of bite) {
    if (seen.has(id)) {
      throw new IntentionSchemaError(`Duplicate id "${id}" in ${field}: a bite is a set`);
    }
    seen.add(id);
  }
  return bite;
}

/**
 * Validate a `claim.v1` record, returning it in normalized form. Throws
 * `IntentionSchemaError` naming the offending field.
 */
export function validateClaimRecord(value: unknown, field = "claim"): ClaimRecord {
  const raw = requireObject(value, field);
  rejectUnknownKeys(raw, CLAIM_KEYS, field);
  if (raw.schema !== CLAIM_SCHEMA) {
    throw new IntentionSchemaError(
      `Expected ${field}.schema === "${CLAIM_SCHEMA}", got ${JSON.stringify(raw.schema)}`,
    );
  }
  const claim_id = requireNonEmptyString(raw.claim_id, `${field}.claim_id`);
  // The claim id IS the file name (`claims/<claim-id>.json`).
  assertPathSafeId(claim_id);
  const strategy = requireNonEmptyString(raw.strategy, `${field}.strategy`);
  const claimed_at = requireInstant(raw.claimed_at, `${field}.claimed_at`);
  const expires_at = requireInstant(raw.expires_at, `${field}.expires_at`);
  if (expires_at <= claimed_at) {
    throw new IntentionSchemaError(
      `${field}.expires_at (${expires_at}) must be after ${field}.claimed_at ` +
        `(${claimed_at}): a claim that expires at or before it is taken is never live`,
    );
  }
  return {
    schema: CLAIM_SCHEMA,
    claim_id,
    strategy,
    bite: validateBite(raw.bite, `${field}.bite`),
    claimed_at,
    expires_at,
    holder: validateHolder(raw.holder, `${field}.holder`),
    pr: optionalNonNegativeInt(raw.pr, `${field}.pr`),
  };
}

// --- Canonicalization and deterministic ids ---------------------------------

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) out[key] = sortKeysDeep(value[key]);
    return out;
  }
  return value;
}

/**
 * The canonical serialization of an operational record: `JSON.stringify` with
 * every object's keys sorted ascending by UTF-16 code unit, recursively, array
 * order preserved, no insignificant whitespace.
 *
 * This is the one definition used for BOTH the content hash and the bytes on
 * disk, which is what makes append idempotent: two writers that build the same
 * record with keys in different orders produce identical bytes, hash to the
 * same `hash12`, and therefore collapse onto the same path instead of
 * appending the same fact twice.
 *
 * Validation runs first and normalizes unset optionals to explicit `null`, so
 * a missing key and a null key also canonicalize identically. `undefined` never
 * reaches here for that reason.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value));
}

/** The bytes an operational record occupies on disk: canonical JSON plus a trailing newline. */
export function recordFileContent(value: unknown): string {
  return `${canonicalJson(value)}\n`;
}

/** First 12 hex chars of the sha256 of the canonicalized payload. */
export function contentHash12(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value), "utf8").digest("hex").slice(0, 12);
}

// --- Path helpers -----------------------------------------------------------

/** `<dir>/operational` — the root of the operational layer inside an intentions store. */
export function operationalDir(dir: string): string {
  return join(dir, OPERATIONAL_DIRNAME);
}

/** `<dir>/operational/claims` — one file per claim. */
export function claimsDir(dir: string): string {
  return join(operationalDir(dir), "claims");
}

/** `<dir>/operational/evidence/<strategy-id>` — one file per entry. */
export function evidenceDir(dir: string, strategy: string): string {
  assertPathSafeId(strategy);
  return join(operationalDir(dir), "evidence", strategy);
}

/** `<claim-id>.json`. */
export function claimPath(dir: string, claimId: string): string {
  assertPathSafeId(claimId);
  return join(claimsDir(dir), `${claimId}.json`);
}

/** `<YYYYMMDD>-<hash12>.json`, both halves derived from the entry itself. */
export function evidenceFileName(entry: EvidenceEntry): string {
  return `${entry.observed_at.replace(/-/g, "")}-${contentHash12(entry)}.json`;
}

/**
 * The one path an entry may occupy. Content-addressed by construction: an
 * identical entry always resolves here, and a different entry effectively never
 * does — which is why `appendEvidence` can treat a differing payload at this
 * path as an error rather than a merge.
 */
export function evidencePath(dir: string, entry: EvidenceEntry): string {
  return join(evidenceDir(dir, entry.strategy), evidenceFileName(entry));
}

// --- Claim exclusivity ------------------------------------------------------

/**
 * A claim is live when it has not expired at `now`.
 *
 * `now` is validated for the SAME reason `conflictingClaims` validates it: the
 * comparison is lexicographic, so a millisecond-precision instant — which is
 * exactly what `new Date().toISOString()` hands a caller — silently inverts
 * within one second (`"…:06Z" > "…:06.789Z"` is TRUE because `Z` is 0x5A and
 * `.` is 0x2E), reading an already-expired claim as live. Throwing beats a
 * fence that fails open. Use `utcInstant()` to build one.
 */
export function isClaimLive(claim: ClaimRecord, now: string = utcInstant()): boolean {
  requireInstant(now, "now");
  return claim.expires_at > now;
}

/** Two live claims on one strategy whose bites intersect. */
export interface ClaimConflict {
  strategy: string;
  a: ClaimRecord;
  b: ClaimRecord;
  /** The intersecting ids, sorted, so the report is stable. */
  overlap: string[];
}

/**
 * Every pair of live claims on the same strategy whose `bite` sets intersect.
 *
 * Exclusivity is *asserted* here and *enforced* by the serialized landing lock;
 * this function is what the enforcement calls. Expired claims are not live and
 * so never conflict — that is what makes a claim a time-bounded reservation
 * rather than a permanent one a dead session could hold forever.
 */
export function conflictingClaims(
  claims: readonly ClaimRecord[],
  now: string = utcInstant(),
): ClaimConflict[] {
  requireInstant(now, "now");
  const live = claims.filter((claim) => isClaimLive(claim, now));
  const conflicts: ClaimConflict[] = [];
  for (let i = 0; i < live.length; i += 1) {
    for (let j = i + 1; j < live.length; j += 1) {
      const a = live[i];
      const b = live[j];
      if (a.strategy !== b.strategy) continue;
      const bBite = new Set(b.bite);
      const overlap = a.bite.filter((id) => bBite.has(id)).sort();
      if (overlap.length > 0) conflicts.push({ strategy: a.strategy, a, b, overlap });
    }
  }
  return conflicts;
}
