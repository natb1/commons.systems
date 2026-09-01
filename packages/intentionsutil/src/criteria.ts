/**
 * Criteria: the intent-layer half of the reconciliation frontier.
 *
 * A criterion is a named, dated, authority-stamped statement of what "aligned"
 * means for one axis. Criteria are DATA — authored into node frontmatter under
 * `attributes.criteria`, and (for the non-functional standing set) under
 * `attributes.standing_criteria` on `kind-strategy`. Checks are CODE and live
 * elsewhere; nothing in this module knows a check exists.
 *
 * The module is pure: types, validators, a projection, and a fingerprint. No
 * filesystem, no process, no store read. `IntentionNode` arrives as an
 * argument, so every consumer — validator, deriver, report — reads the same
 * shape from the same place.
 *
 * DEPENDENCY DISCIPLINE. This module imports `IntentionSchemaError` and the
 * `IntentionNode` TYPE only. It deliberately does NOT import `schema.ts`'s
 * `isPlainObject` (as `operational-records.ts` does), because `schema.ts`
 * imports THIS module for its `attributes.criteria` shape rule: a value import
 * either way would close a cycle. The local guard block below is the same
 * throw-`IntentionSchemaError`-naming-the-field idiom `operational-records.ts`
 * copies from `schema.ts`'s own "Local guards" block, kept local for that
 * reason.
 *
 * REJECT, DON'T IGNORE. Both validators refuse unknown keys, exactly as
 * `claim.v1` / `evidence.v1` do (`operational-records.ts`): a criterion drives
 * a tier decision, so a smuggled field — an expectation, a status, a
 * hand-stored tier — must not be able to ride along unread.
 */
import { createHash } from "node:crypto";
import { IntentionSchemaError } from "./errors.js";
import type { IntentionNode } from "./schema.js";

/**
 * The class axis, three-valued (author-ratified `kind-kind` refinement,
 * 2026-09-01):
 *
 *  - FUNCTIONAL — does this do what it is meant to do. Per-strategy.
 *  - NON-FUNCTIONAL — is it done the way work here must be done (security,
 *    type-safety, test-integrity, style, token-economy). Standing: authored
 *    once and in force for every strategy.
 *  - ASSUMPTION — a world-premise the strategy rests on. Evaluated by
 *    ASSESSMENT and never bitten as a work item: an assumption that fails means
 *    re-derive the strategy, not schedule a task. This is the class
 *    `attributes.conditions` entries migrate into.
 *
 * The axis decides where a criterion lives: only non-functional criteria may
 * occupy the standing home.
 */
export const CRITERION_CLASSES = ["functional", "non-functional", "assumption"] as const;
export type CriterionClass = (typeof CRITERION_CLASSES)[number];

/**
 * Who stands behind the criterion.
 *
 *  - `ratified` — the author personally settled this text. Only a ratified
 *    criterion can ever sanction a gating check.
 *  - `delegated` — authored on trust under a standing delegation.
 *  - `deferred` — transcribed by Claude from existing doctrine and NOT yet
 *    ratified. This is the entry state for every transcription; ratification
 *    is an author act and never a side effect of writing the criterion down.
 */
export const CRITERION_AUTHORITIES = ["ratified", "delegated", "deferred"] as const;
export type CriterionAuthority = (typeof CRITERION_AUTHORITIES)[number];

/** One criterion. `recorded` is `YYYY-MM-DD`: the date the text was written down. */
export interface Criterion {
  /** Stable id, unique within the effective set. Referenced by checks and evidence. */
  id: string;
  /** The criterion itself, one sentence. */
  statement: string;
  class: CriterionClass;
  authority: CriterionAuthority;
  /** `YYYY-MM-DD`. */
  recorded: string;
}

/** The closed key set of a criterion object. Order is the canonical field order. */
export const CRITERION_KEYS: readonly string[] = [
  "id",
  "statement",
  "class",
  "authority",
  "recorded",
];

/** The attributes key carrying a node's own criteria. Valid on goal-layer nodes. */
export const CRITERIA_KEY = "criteria";

/** The attributes key carrying the standing non-functional set. */
export const STANDING_CRITERIA_KEY = "standing_criteria";

/**
 * The one node that homes the standing set. It is `kind-strategy` because the
 * standing criteria are a statement about what every STRATEGY's work must
 * satisfy, and the kind node is where that kind's cross-cutting semantics
 * already live.
 */
export const STANDING_CRITERIA_HOME = "kind-strategy";

// --- Local guards -----------------------------------------------------------
// See the DEPENDENCY DISCIPLINE note in the module header for why these are
// re-implemented here rather than imported.

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new IntentionSchemaError(`Expected string for ${field}, got ${typeof value}`);
  }
  if (value.trim() === "") {
    throw new IntentionSchemaError(`Expected non-empty string for ${field}`);
  }
  return value;
}

function requireOneOf<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  const found = allowed.find((a) => a === value);
  if (found === undefined) {
    throw new IntentionSchemaError(
      `Invalid ${field}: ${JSON.stringify(value)} (expected one of ${allowed.join(", ")})`,
    );
  }
  return found;
}

/** Shape only, like `schema.ts`'s `requireDateString` — calendar validity is not this layer's job. */
function requireDateString(value: unknown, field: string): string {
  const s = requireNonEmptyString(value, field);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw new IntentionSchemaError(`Expected YYYY-MM-DD date string for ${field}, got "${s}"`);
  }
  return s;
}

// --- Validation -------------------------------------------------------------

/**
 * Validate one criterion, returning it normalized (every key present, in
 * canonical field order). Throws `IntentionSchemaError` naming the offending
 * field.
 */
export function validateCriterion(value: unknown, field = "criterion"): Criterion {
  if (!isPlainRecord(value)) {
    throw new IntentionSchemaError(
      `Expected a {${CRITERION_KEYS.join(", ")}} object for ${field}, got ${
        value === null ? "null" : Array.isArray(value) ? "an array" : typeof value
      }`,
    );
  }
  for (const key of Object.keys(value)) {
    if (!CRITERION_KEYS.includes(key)) {
      throw new IntentionSchemaError(
        `Unknown key ${field}.${key}: the criterion shape is closed, so no unread ` +
          `field can ride along on a criterion that drives a tier decision ` +
          `(allowed: ${CRITERION_KEYS.join(", ")})`,
      );
    }
  }
  return {
    id: requireNonEmptyString(value.id, `${field}.id`),
    statement: requireNonEmptyString(value.statement, `${field}.statement`),
    class: requireOneOf(value.class, CRITERION_CLASSES, `${field}.class`),
    authority: requireOneOf(value.authority, CRITERION_AUTHORITIES, `${field}.authority`),
    recorded: requireDateString(value.recorded, `${field}.recorded`),
  };
}

/**
 * Validate an array of criteria, rejecting a duplicate id within the list: two
 * entries under one id would make "the criterion with id X" ambiguous, and a
 * check binds to exactly one.
 */
export function validateCriteriaList(value: unknown, field: string): Criterion[] {
  if (!Array.isArray(value)) {
    throw new IntentionSchemaError(
      `Expected an array of criteria for ${field}, got ${value === null ? "null" : typeof value}`,
    );
  }
  const criteria = value.map((entry, i) => validateCriterion(entry, `${field}[${i}]`));
  const seen = new Set<string>();
  for (const criterion of criteria) {
    if (seen.has(criterion.id)) {
      throw new IntentionSchemaError(
        `Duplicate criterion id "${criterion.id}" in ${field}: ids are unique, since a ` +
          `check binds to exactly one criterion`,
      );
    }
    seen.add(criterion.id);
  }
  return criteria;
}

/**
 * Validate the standing set: every entry must be `non-functional`.
 *
 * The other two classes are both strategy-scoped, for the same reason from two
 * directions: a `functional` criterion is one strategy's own success
 * condition, and an `assumption` is one strategy's own world-premise. Either,
 * parked in the standing home, would silently bind every strategy to a claim
 * made about one — which is the failure this split exists to prevent.
 */
export function validateStandingCriteriaList(value: unknown, field: string): Criterion[] {
  const criteria = validateCriteriaList(value, field);
  for (const [i, criterion] of criteria.entries()) {
    if (criterion.class !== "non-functional") {
      throw new IntentionSchemaError(
        `${field}[${i}] ("${criterion.id}") is class "${criterion.class}", but the standing ` +
          `set is NON-FUNCTIONAL ONLY — a functional or assumption criterion is scoped to ` +
          `one strategy and belongs on it, under attributes.${CRITERIA_KEY}`,
      );
    }
  }
  return criteria;
}

// --- Reads ------------------------------------------------------------------

/**
 * A node's OWN criteria, from `attributes.criteria`, in authored order.
 *
 * Absence of the key yields `[]` — a node predating the migration records no
 * criteria, which is not a defect. A malformed VALUE throws rather than
 * degrading to `[]`: an unreadable criteria list is a misconfiguration, and
 * silently reading it as "no criteria" would disarm every check bound to it
 * (`.claude/rules/code-style.md`).
 */
export function parseCriteria(node: IntentionNode): Criterion[] {
  const raw = node.attributes[CRITERIA_KEY];
  if (raw === undefined || raw === null) return [];
  return validateCriteriaList(raw, `${node.id}: attributes.${CRITERIA_KEY}`);
}

/**
 * The standing non-functional criteria, read off the `kind-strategy` node
 * found in `nodes`.
 *
 * THROWS when that node is absent from the passed array rather than returning
 * `[]`. A truncated node list — a partial fixture, a filtered read, a
 * single-node dump — would otherwise yield an empty standing set, and an empty
 * standing set silently disarms every non-functional check for every strategy.
 * That failure is invisible at the call site, so it is refused at the read.
 */
export function standingCriteria(nodes: readonly IntentionNode[]): Criterion[] {
  const home = nodes.find((n) => n.id === STANDING_CRITERIA_HOME);
  if (home === undefined) {
    throw new IntentionSchemaError(
      `Cannot read the standing criteria: ${STANDING_CRITERIA_HOME} is not in the passed ` +
        `node list (${nodes.length} node(s)). An empty standing set would silently disarm ` +
        `every non-functional check, so a truncated list is refused rather than defaulted`,
    );
  }
  const raw = home.attributes[STANDING_CRITERIA_KEY];
  if (raw === undefined || raw === null) return [];
  return validateStandingCriteriaList(
    raw,
    `${STANDING_CRITERIA_HOME}: attributes.${STANDING_CRITERIA_KEY}`,
  );
}

// --- The projection ---------------------------------------------------------

/**
 * THE PROJECTION: the criteria in force for `strategy` — its own criteria
 * union the standing set, id-sorted.
 *
 * This is the single home of the "derived onto every touched strategy on read,
 * never a stored copy" rule. No caller may re-implement the union: a stored
 * copy of the standing set on each strategy is exactly the stale-by-design
 * state the frontier design exists to eliminate. Modelled on
 * `strategyAlignSelectable` (`router.ts`) as a single-callsite rule.
 *
 * A duplicate id ACROSS the two sources throws rather than shadowing. Silent
 * shadowing would let one strategy quietly redefine a standing criterion —
 * weakening the standing set for itself while the id still reads as the
 * ratified one everywhere else.
 */
export function effectiveCriteria(
  strategy: IntentionNode,
  nodes: readonly IntentionNode[],
): Criterion[] {
  const own = parseCriteria(strategy);
  const standing = standingCriteria(nodes);
  const standingById = new Map(standing.map((c) => [c.id, c]));
  for (const criterion of own) {
    if (standingById.has(criterion.id)) {
      throw new IntentionSchemaError(
        `${strategy.id}: attributes.${CRITERIA_KEY} redefines criterion id "${criterion.id}", ` +
          `which the standing set already defines — a strategy may add criteria but never ` +
          `shadow a standing one; rename it or amend the standing set on ` +
          `${STANDING_CRITERIA_HOME}`,
      );
    }
  }
  return sortById([...own, ...standing]);
}

/** Ascending by id, UTF-16 code unit order — the same order `Array#sort` gives by default. */
function sortById(criteria: readonly Criterion[]): Criterion[] {
  return [...criteria].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

// --- Fingerprint ------------------------------------------------------------

/**
 * The criteria set's fingerprint: sha256 over the canonical JSON of the
 * id-sorted criteria, hex.
 *
 * Same recipe SHAPE as `strategyFingerprint` (`router.ts`) — build an explicit
 * substance object in a fixed field order, `JSON.stringify` it, sha256 the
 * result — so the repo carries ONE hashing convention rather than two. The
 * rebuild in `CRITERION_KEYS` order is what makes the digest stable under a
 * key reordering in the source YAML: two authors who spell the same criterion
 * with the keys in different orders pin the same fingerprint.
 *
 * Used to pin an assessment to the exact criteria set it was made against, so
 * a later amendment is detectable rather than silently inherited.
 */
export function criteriaFingerprint(criteria: readonly Criterion[]): string {
  const substance = sortById(criteria).map((c) => ({
    id: c.id,
    statement: c.statement,
    class: c.class,
    authority: c.authority,
    recorded: c.recorded,
  }));
  return createHash("sha256").update(JSON.stringify(substance)).digest("hex");
}
