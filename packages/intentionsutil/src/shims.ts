/**
 * Shims: the retroactive-transcription inventory of the `overdue-shim` arm,
 * and the minimal `governs` accessor.
 *
 * A SHIM is an incumbent-form stand-in for a target-state surface this
 * migration has not yet reached — a hand-written transition note doing the
 * job a registered, ratcheted check will eventually do. The shim principle
 * (2026-09-01) is that every shim names its own liquidation: the target
 * element it stands in for, and the condition under which it is safe to
 * remove. `attributes.shims` on the declaring node is where that inventory
 * lives; this module reads it, derives which shims are OVERDUE (their
 * liquidation condition already holds while the shim is still declared), and
 * counts the live total.
 *
 * DATA, NOT NEW INTENT. The five module-level bootstrap shims plus the
 * refinement-annotation and P0-P4 transition-note shims (`strategy-graph-native-dispatch`),
 * the carrier shim (`tactic-bootstrap-operation`) and the write-class-shims
 * cross-reference (`tactic-intent-orchestration-layer-schema`) already exist
 * in PROSE form on their declaring nodes today. This module and the data edits that
 * land beside it are RETROACTIVE TRANSCRIPTION — the target element and
 * liquidation condition are copied verbatim from that prose, never
 * paraphrased, and no shim is liquidated by this transcription (liquidating is
 * an authoring act, out of this unit's scope).
 *
 * PURE. No fs, no process, no clock. `IntentionNode[]` and the check runs
 * arrive as arguments, exactly as `frontier-reconciliation.ts` requires of
 * every arm deriver. This module does not import `node:crypto` (a shim has no
 * fingerprint — the liquidation-overdue question is a check/criterion lookup,
 * not a content hash), so nothing here forces it off the browser-safe surface
 * the way `criteria.ts`'s and `basis-pins.ts`'s `createHash` import does.
 * It is not added to `graph.ts` regardless: that barrel is reserved for the
 * schema/attention/goals/errors core, and `frontier-reconciliation.ts` (which
 * wires this arm in) already sits on the root barrel alone, beside
 * `criteria.ts` and `basis-pins.ts`.
 *
 * DEPENDENCY DISCIPLINE, same shape as `criteria.ts`'s and `basis-pins.ts`'s:
 * `IntentionNode` and `ReconciliationFrontierEntry` / `ReconciliationCheckRun`
 * are imported TYPE-ONLY. `frontier-reconciliation.ts` imports
 * `deriveShimFrontier` and `liveShimCount` by VALUE to wire the arm in, so a
 * value import the other way would close a runtime cycle; a type-only import
 * is erased at compile time and carries no such risk. `schema.ts`'s rule 28
 * (part four) duplicates this module's shape rule locally rather than
 * importing it, for the identical reason `criteria.ts`'s header records: the
 * schema layer must not become a value dependency of a module it itself
 * mirrors.
 *
 * REJECT, DON'T IGNORE. `validateShim` refuses unknown keys, exactly as
 * `validateCriterion` and `validateBasisPin` do: a shim decides whether an
 * incumbent form still stands in for a target state, so a smuggled field must
 * not ride along unread.
 */
import { IntentionSchemaError } from "./errors.js";
import type { ReconciliationCheckRun, ReconciliationFrontierEntry } from "./frontier-reconciliation.js";
import type { IntentionNode } from "./schema.js";

/** One shim declaration, read from `attributes.shims`. */
export interface ShimDeclaration {
  /** Stable id, unique within the declaring node's own list. */
  id: string;
  /** The target-state element this shim stands in for, prose, verbatim from the source. */
  target: string;
  /** The liquidation condition, prose, verbatim from the source — never paraphrased. */
  liquidation: string;
  /**
   * A check id or criterion id when the liquidation condition is genuinely
   * machine-expressible today; `null` when it is not. A `null` shim is LIVE,
   * never overdue — it still counts toward `liveShimCount`.
   */
  liquidated_by: string | null;
  /** `YYYY-MM-DD` — the date this shim was declared (transcription date, for a retroactive entry). */
  declared: string;
}

/** The closed key set of a shim object. Order is the canonical field order. */
export const SHIM_KEYS: readonly string[] = ["id", "target", "liquidation", "liquidated_by", "declared"];

/** The attributes key carrying a node's own shim inventory. Valid on any node. */
export const SHIMS_KEY = "shims";

// --- Local guards -----------------------------------------------------------
// Same throw-`IntentionSchemaError`-naming-the-field idiom `criteria.ts` and
// `basis-pins.ts` use, re-implemented locally for the DEPENDENCY DISCIPLINE
// reason in the module header.

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

/** Shape only, like `criteria.ts`'s `requireDateString` — calendar validity is not this layer's job. */
function requireDateString(value: unknown, field: string): string {
  const s = requireNonEmptyString(value, field);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw new IntentionSchemaError(`Expected YYYY-MM-DD date string for ${field}, got "${s}"`);
  }
  return s;
}

function requireNullableString(value: unknown, field: string): string | null {
  if (value === null) return null;
  return requireNonEmptyString(value, field);
}

// --- Validation --------------------------------------------------------------

/**
 * Validate one shim, returning it normalized (every key present, in canonical
 * field order). Throws `IntentionSchemaError` naming the offending field.
 */
export function validateShim(value: unknown, field = "shim"): ShimDeclaration {
  if (!isPlainRecord(value)) {
    throw new IntentionSchemaError(
      `Expected a {${SHIM_KEYS.join(", ")}} object for ${field}, got ${
        value === null ? "null" : Array.isArray(value) ? "an array" : typeof value
      }`,
    );
  }
  for (const key of Object.keys(value)) {
    if (!SHIM_KEYS.includes(key)) {
      throw new IntentionSchemaError(
        `Unknown key ${field}.${key}: the shim shape is closed, so no unread field can ride ` +
          `along on data that decides whether an incumbent form is still standing in for a ` +
          `target state (allowed: ${SHIM_KEYS.join(", ")})`,
      );
    }
  }
  return {
    id: requireNonEmptyString(value.id, `${field}.id`),
    target: requireNonEmptyString(value.target, `${field}.target`),
    liquidation: requireNonEmptyString(value.liquidation, `${field}.liquidation`),
    liquidated_by: requireNullableString(value.liquidated_by, `${field}.liquidated_by`),
    declared: requireDateString(value.declared, `${field}.declared`),
  };
}

/**
 * Validate an array of shims, rejecting a duplicate id within the list — same
 * reasoning as `validateCriteriaList`: two entries under one id make "the
 * shim with id X" ambiguous.
 */
export function validateShimList(value: unknown, field: string): ShimDeclaration[] {
  if (!Array.isArray(value)) {
    throw new IntentionSchemaError(
      `Expected an array of shims for ${field}, got ${value === null ? "null" : typeof value}`,
    );
  }
  const shims = value.map((entry, i) => validateShim(entry, `${field}[${i}]`));
  const seen = new Set<string>();
  for (const shim of shims) {
    if (seen.has(shim.id)) {
      throw new IntentionSchemaError(
        `Duplicate shim id "${shim.id}" in ${field}: ids are unique within one node's ` +
          `inventory, since a liquidation entry cites "the shim with id X"`,
      );
    }
    seen.add(shim.id);
  }
  return shims;
}

// --- Reads --------------------------------------------------------------------

/**
 * A node's own shim inventory, from `attributes.shims`, in authored order.
 *
 * Absence yields `[]` — almost every node predates the shim principle, which
 * is not a defect. A malformed VALUE throws rather than degrading to `[]`: an
 * unreadable shim list would silently drop every entry it carries off both the
 * `overdue-shim` arm and the live-shim count (`.claude/rules/code-style.md`).
 */
export function parseShims(node: IntentionNode): ShimDeclaration[] {
  const raw = node.attributes[SHIMS_KEY];
  if (raw === undefined || raw === null) return [];
  return validateShimList(raw, `${node.id}: attributes.${SHIMS_KEY}`);
}

/**
 * The live-shim count across the whole graph — every declared shim, overdue or
 * not. A cheap machine signal for the observe loop (digest table, sensor):
 * it never runs a check and never resolves `liquidated_by`, so it is safe to
 * compute on every read regardless of check-registry state.
 */
export function liveShimCount(nodes: readonly IntentionNode[]): number {
  let total = 0;
  for (const node of nodes) {
    total += parseShims(node).length;
  }
  return total;
}

// --- Overdue resolution --------------------------------------------------------

/**
 * Is `shim` OVERDUE against `checkRuns`?
 *
 * `liquidated_by === null` is never overdue — the condition is not
 * machine-expressible today, so nothing can mechanically report it met; the
 * shim is live, not overdue, and stays that way until an author re-declares it
 * with a resolvable id.
 *
 * Otherwise `liquidated_by` is resolved in two steps, CHECK FIRST:
 *
 *  1. It names a registered CHECK id — overdue iff that check's run is tier
 *     `gating` AND `ok`. (`checks.ts`'s `deriveTier` guarantees `gating` only
 *     when the bound criterion's authority is `ratified`, so a gating-and-
 *     passing check is sufficient on its own; no separate authority check is
 *     needed here.)
 *  2. Otherwise it names a CRITERION id — overdue iff at least one check run
 *     is bound to that criterion (`run.check.criterion === liquidated_by`) and
 *     every such run is `ok`. This is `deriveUnsatisfiedCriteria`'s
 *     satisfaction rule (`frontier-reconciliation.ts`), restated locally
 *     rather than imported: that rule is keyed off the criterion's
 *     `authority`/tier context the deriver already holds, while this arm only
 *     ever asks "is THIS ONE id satisfied", so restating the one-line rule
 *     costs less than threading a criteria map through for a single lookup.
 *
 * A `liquidated_by` that resolves to NEITHER a known check id nor a criterion
 * any check run binds to is not overdue: nothing observed proves its condition
 * met, so silence is the honest reading rather than a guess in either
 * direction.
 */
function isShimOverdue(
  shim: ShimDeclaration,
  checkRuns: readonly ReconciliationCheckRun[],
): boolean {
  if (shim.liquidated_by === null) return false;
  const byCheckId = checkRuns.find((run) => run.check.id === shim.liquidated_by);
  if (byCheckId !== undefined) {
    return byCheckId.tier === "gating" && byCheckId.result.ok;
  }
  const boundToCriterion = checkRuns.filter((run) => run.check.criterion === shim.liquidated_by);
  return boundToCriterion.length > 0 && boundToCriterion.every((run) => run.result.ok);
}

/**
 * THE `overdue-shim` ARM: one entry per shim whose `liquidated_by` resolves to
 * a check that is gating and passing, or to a satisfied criterion, while the
 * shim is still declared.
 *
 * "STILL DECLARED" is exactly "present in `attributes.shims` today" — there is
 * no separate liquidated/removed state to distinguish; liquidating a shim
 * means an author removes its entry from the list, which is out of this
 * module's scope (liquidation is an authoring act).
 *
 * Nodes are visited in id order and a node's own shims in authored order, so
 * two derivations of an unchanged graph emit the same entries in the same
 * order (`deriveReconciliationFrontier` re-sorts anyway; this makes the arm
 * stable on its own, matching `deriveStaleIntent`'s discipline).
 *
 * PURE and TOTAL: never throws on a well-formed graph (a malformed
 * `attributes.shims` throws via `parseShims`, which is a misconfiguration, not
 * a frontier finding). With zero gating checks and zero satisfied criteria —
 * today's actual registry state — every declared shim is live and none is
 * overdue, which is the honest bootstrap reading.
 */
export function deriveShimFrontier(
  nodes: readonly IntentionNode[],
  checkRuns: readonly ReconciliationCheckRun[],
): ReconciliationFrontierEntry[] {
  const entries: ReconciliationFrontierEntry[] = [];
  const ordered = [...nodes].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (const node of ordered) {
    for (const shim of parseShims(node)) {
      if (!isShimOverdue(shim, checkRuns)) continue;
      const boundRun = checkRuns.find((run) => run.check.id === shim.liquidated_by);
      entries.push({
        kind: "overdue-shim",
        id: `overdue-shim:${node.id}:${shim.id}`,
        subject: node.id,
        detail:
          `shim "${shim.id}" (target: ${shim.target}) is overdue — liquidated_by ` +
          `"${shim.liquidated_by}" is now satisfied; liquidation condition: ${shim.liquidation}`,
        criterion: shim.liquidated_by,
        // `ratified` is guaranteed rather than looked up when the resolution
        // was a gating-and-passing CHECK: `deriveTier` cannot produce `gating`
        // unless the bound criterion's authority is `ratified` (see
        // `isShimOverdue`). When resolution was instead a satisfied
        // CRITERION id directly, authority is genuinely unknown here — this
        // module holds no criteria map, only check runs — so it is left null
        // rather than guessed, the same nullable-by-design discipline
        // `ReconciliationFrontierEntry`'s header documents.
        authority: boundRun !== undefined && boundRun.tier === "gating" ? "ratified" : null,
      });
    }
  }
  return entries;
}

// --- The governs-marker accessor -----------------------------------------------

/**
 * Whether a surface is TARGET-GOVERNED (its checks exist in the registry and
 * have ratcheted to `gating`) or still INCUMBENT-GOVERNED (a hand-written
 * transition note is doing the job — the interim form, recorded as a shim,
 * whose liquidation path IS the check landing here and ratcheting).
 *
 * MINIMAL AND HONEST: this is a lookup against the check runs the caller
 * already derived tiers for, not a new derivation. It answers exactly one
 * question — "does a registered check for this surface exist and has it
 * ratcheted" — and nothing about the shim inventory itself. A surface with no
 * check run at all reads `incumbent-governed`, which is the correct default:
 * with the current registry (unit 6) every registered check binds to a
 * `deferred` criterion, so `deriveTier` can never return `gating` yet and
 * every surface reads `incumbent-governed` today. That is the honest bootstrap
 * reading — hand-written transition notes govern until an author ratifies the
 * bound criterion and the check earns its high-water mark.
 */
export type GovernanceState = "target-governed" | "incumbent-governed";

export function governs(
  checkId: string,
  checkRuns: readonly ReconciliationCheckRun[],
): GovernanceState {
  const run = checkRuns.find((r) => r.check.id === checkId);
  return run !== undefined && run.tier === "gating" ? "target-governed" : "incumbent-governed";
}
