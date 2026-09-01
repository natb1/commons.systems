/**
 * Checks: the code half of the reconciliation frontier, and the sanction gate.
 *
 * A CRITERION (`criteria.ts`) is data — a dated, authority-stamped statement of
 * what "aligned" means on one axis. A CHECK is the code that decides whether
 * that criterion currently holds, and — this is the point — enumerates the
 * individual items that are still out of line. An observe-tier failure is
 * therefore a *list of remaining migration work*, not a bare red.
 *
 * THE SANCTION GATE. A check's TIER is never stored and never authored. It is
 * derived, here, from two facts:
 *
 *   1. the AUTHORITY of the criterion the check binds to — only a `ratified`
 *      criterion can sanction a gating check, because gating is an act of
 *      authority over other people's work and Claude may not grant itself one;
 *   2. whether the check has ever passed on main — the HIGH-WATER ratchet, so
 *      a check is only allowed to block what it has already been observed to
 *      permit.
 *
 * Both conjuncts are required. `deriveTier` is the single home of that rule:
 * no caller re-derives it, and nothing may hand-store a tier. (The criterion
 * shape is closed for the same reason — see `criteria.ts`'s REJECT, DON'T
 * IGNORE note.)
 *
 * PURITY. This module does no filesystem work. The high-water half arrives
 * through the `HighWaterSource` interface, whose concrete store-backed
 * implementation lives in `high-water.ts`; `promotionRecord` BUILDS the
 * append payload but never writes it. That seam is what makes the tier rule
 * testable with a fake and keeps the persistence choice swappable.
 */
import { IntentionSchemaError } from "./errors.js";
import type { Criterion } from "./criteria.js";
import type { IntentionNode } from "./schema.js";
import { validateEvidenceEntry, EVIDENCE_SCHEMA, type EvidenceEntry } from "./operational-records.js";

// --- What a check reports ---------------------------------------------------

/**
 * One item of remaining work a check found — the seed of a frontier entry.
 *
 * DELIBERATELY MINIMAL: exactly the subset a check can know from where it
 * stands. A check knows WHAT is out of line (`subject`) and WHY (`detail`); it
 * does not know the criterion's authority, the derived tier, the owning
 * strategy, or the entry's rank — all of which are the DERIVER's to attach.
 *
 * Unit 3 (the reconciliation-frontier deriver) consumes these seeds and widens
 * each into the full `FrontierEntry` by joining it with the check declaration,
 * the criterion, and the derived tier. Keep this shape a strict subset of that
 * one: a field a check cannot honestly fill would be invented data.
 */
export interface FrontierEntrySeed {
  /** What is out of line — a file path, a node id, a symbol. Stable across runs. */
  subject: string;
  /** Why it is out of line, prose, one line. */
  detail: string;
}

/**
 * What a check hands back: a verdict AND the items behind it.
 *
 * `ok === true` with a non-empty `entries` is not a contradiction to this
 * shape and is not policed here — an observe-tier check reporting "these
 * remain, and that is expected today" is exactly the migration-frontier case.
 * The tier, not the check, decides what a non-empty list costs.
 */
export interface CheckResult {
  ok: boolean;
  /** One-line summary of the verdict, for the digest table. */
  detail: string;
  entries: FrontierEntrySeed[];
}

/**
 * What a check is given to run against.
 *
 * Three fields, each earning its place: `nodes` so a graph-reading check does
 * not re-read (and re-validate) the store per check; `storeDir` for a check
 * that must reach records the node list does not carry (the operational layer);
 * `repoRoot` for a check whose subject is the working tree rather than the
 * graph (a lint block, a decay sensor, a dangling tooling path).
 */
export interface CheckContext {
  /** Absolute path to the repository root. */
  repoRoot: string;
  /** Absolute path to the intentions store directory. */
  storeDir: string;
  /** The graph, read once by the runner and shared across checks. */
  nodes: readonly IntentionNode[];
}

/**
 * One registered check. `id` is the registry key and the identity the
 * high-water ratchet remembers; `criterion` is the criterion id it binds to —
 * exactly one, since `deriveTier` reads that criterion's authority.
 */
export interface CheckDeclaration {
  /** Stable registry key. Also the identity recorded in a promotion record. */
  id: string;
  /** The id of the criterion this check decides. Exactly one. */
  criterion: string;
  /** One line, for the digest table: what this check decides. */
  describe: string;
  run(ctx: CheckContext): CheckResult;
}

// --- The registry -----------------------------------------------------------

/**
 * An id-keyed registry of checks, mirroring `SensorRegistry`
 * (`sensors.ts`) in surface: `register` / `names` / `resolve`, with `names()`
 * returning a read-only snapshot and `resolve()` throwing
 * `IntentionSchemaError` naming the missing id and listing every registered
 * one — no silent skip, no fallback (`.claude/rules/code-style.md`).
 *
 * ONE DELIBERATE DIVERGENCE from `SensorRegistry`: a duplicate registration
 * THROWS here rather than overwriting. A sensor is read on demand by the node
 * that names it, so a late overwrite is a substitution the caller asked for. A
 * check is swept over by a runner that enumerates `names()`, so an overwrite
 * would silently DELETE a check from the sweep — the frontier would shrink
 * with no failure anywhere, which is the exact failure mode this whole surface
 * exists to prevent.
 *
 * Empty on construction: it hardcodes no default check set. Units 6-7 register
 * the concrete checks.
 */
export class CheckRegistry {
  private readonly checks = new Map<string, CheckDeclaration>();

  /**
   * Register a check under its `id`. Throws `IntentionSchemaError` on a
   * duplicate id — see the class note for why this is not an overwrite.
   */
  register(check: CheckDeclaration): void {
    const existing = this.checks.get(check.id);
    if (existing !== undefined) {
      throw new IntentionSchemaError(
        `A check is already registered under id "${check.id}" ("${existing.describe}"). ` +
          `Registration is create-only: an overwrite would silently drop a check from the ` +
          `frontier sweep, shrinking the reported frontier with no failure anywhere.`,
      );
    }
    this.checks.set(check.id, check);
  }

  /**
   * The ids under which checks are currently registered — a read-only
   * snapshot; mutating it does not touch the registry. The runner and the
   * registration census derive their membership from here rather than
   * duplicating the list by hand.
   */
  names(): ReadonlySet<string> {
    return new Set(this.checks.keys());
  }

  /**
   * Resolve a check by id. Throws `IntentionSchemaError` naming the missing id
   * and the registered ids on an unregistered one.
   */
  resolve(id: string): CheckDeclaration {
    const check = this.checks.get(id);
    if (check === undefined) {
      const registered = [...this.checks.keys()].sort();
      const known = registered.length === 0 ? "(none registered)" : registered.join(", ");
      throw new IntentionSchemaError(
        `No check registered under id "${id}". Registered checks: ${known}.`,
      );
    }
    return check;
  }
}

// --- The derived tier -------------------------------------------------------

/**
 * A check's tier.
 *
 *  - `observe` — the check runs and reports; a failure is a frontier listing.
 *  - `gating` — the check runs and a failure blocks.
 *
 * Never authored, never stored: always the output of `deriveTier`.
 */
export type CheckTier = "observe" | "gating";

/**
 * The high-water seam: has this check ever been observed passing on main?
 *
 * `deriveTier` takes THIS INTERFACE and never a concrete store, so the pure
 * tier rule is testable with a fake and the persistence choice stays
 * swappable. `high-water.ts` carries the append-only store-backed
 * implementation.
 */
export interface HighWaterSource {
  has(checkId: string): boolean;
}

/**
 * THE SANCTION GATE, in one function.
 *
 * `gating` iff the bound criterion's authority is `ratified` AND the check has
 * ever passed on main. Otherwise `observe`. Both conjuncts required; no third
 * path.
 *
 * An UNBOUND check — one whose `criterion` id is not in `criteriaById` —
 * THROWS. Defaulting it to `observe` would be the friendly-looking choice and
 * is exactly wrong: an unbound check is a registry defect (a renamed
 * criterion, a check registered against a criterion that was never authored),
 * and a default would bury it as an ordinary observe-tier row nobody reads
 * twice.
 *
 * @param criteriaById the EFFECTIVE criteria in force, keyed by id — build it
 *   from `effectiveCriteria` (`criteria.ts`), never from a node's own
 *   `attributes.criteria` alone, or the standing set goes unseen.
 */
export function deriveTier(
  check: CheckDeclaration,
  criteriaById: ReadonlyMap<string, Criterion>,
  highWater: HighWaterSource,
): CheckTier {
  const criterion = criteriaById.get(check.criterion);
  if (criterion === undefined) {
    const known = [...criteriaById.keys()].sort();
    const listed = known.length === 0 ? "(none in force)" : known.join(", ");
    throw new IntentionSchemaError(
      `Check "${check.id}" binds to criterion "${check.criterion}", which is not in the ` +
        `effective criteria set. An unbound check is a registry defect, not an observe-tier ` +
        `row — defaulting its tier would hide the defect. Criteria in force: ${listed}.`,
    );
  }
  if (criterion.authority !== "ratified") return "observe";
  return highWater.has(check.id) ? "gating" : "observe";
}

// --- The promotion record ---------------------------------------------------

/**
 * The reserved `strategy` bucket every high-water promotion record is filed
 * under.
 *
 * WHY A SYNTHETIC KEY. `evidencePath` (`operational-records.ts`) keys the
 * evidence layout by strategy id, and a promotion is not a fact about any one
 * strategy: it is a fact about a CHECK, which may decide a standing
 * non-functional criterion in force for every strategy at once. Filing
 * promotions under a real strategy would either pick one arbitrarily or mix
 * ratchet bookkeeping into that strategy's substantive evidence.
 *
 * A `CheckDeclaration` also carries no owning-strategy field, so the
 * alternative — deriving the criterion's owning strategy — would mean adding
 * one and threading it through every registration. The synthetic bucket is the
 * least-invention option consistent with the store's API: it needs no new path
 * helper, no new field, and no new primitive, and every promotion lands in one
 * directory so the ratchet is a single `readEvidence` call.
 *
 * The `check-` prefix keeps it disjoint from real strategy ids (all `strategy-`)
 * and it is path-safe, which is all `validateEvidenceEntry` requires of the
 * field. It names no node and is not expected to.
 */
export const HIGH_WATER_STRATEGY = "check-high-water";

/**
 * The `recurrence_key` every promotion record carries. It is what makes a
 * promotion distinguishable from any other evidence that might one day share
 * the bucket, and it is the slug `high-water.ts` filters on.
 */
export const PROMOTION_RECURRENCE_KEY = "check-high-water";

/**
 * Build the `evidence.v1` payload recording "this check passed on main at
 * `<sha>`" — the append that promotes a check onto the high-water ratchet.
 *
 * It BUILDS; it does not write. `high-water.ts` appends it.
 *
 * FIELD MAPPING, all real `evidence.v1` semantics, nothing repurposed:
 *  - `strategy` — the reserved bucket above.
 *  - `criterion` — the criterion the check binds to (so `gap` is `null`;
 *    the validator requires exactly one of the two).
 *  - `proof.check` — the CHECK ID. `proof.check` is documented as "a CI check
 *    name or run identifier", which is precisely what this is, and it is what
 *    `high-water.ts`'s `has` reads back.
 *  - `proof.sha` — the main commit the pass was observed at. Together with
 *    `proof.check` this satisfies the at-least-one-proof rule twice over.
 *  - `disposition` — `null`. A promotion disposes of no finding; forcing it to
 *    `fixed` would assert a repair that never happened.
 *
 * @param observedAt `YYYY-MM-DD`, INJECTED, never computed here. The record's
 *   on-disk path is content-addressed over the whole payload, so a
 *   clock-derived date would make the same observed fact land at a different
 *   path tomorrow and defeat append idempotence. Callers pass an explicit date
 *   (production: the date of the observed main run; tests: a fixture date).
 *   `utcInstant()` in `operational-records.ts` is the instant-profile sibling
 *   for the fields that take a timestamp; `observed_at` takes a plain date.
 * @returns the validated, normalized entry — ready for `appendEvidence`.
 * @throws IntentionSchemaError if any argument fails `evidence.v1` validation
 *   (a malformed sha, a non-date `observedAt`, an empty id).
 */
export function promotionRecord(
  check: CheckDeclaration,
  sha: string,
  observedAt: string,
): EvidenceEntry {
  return validateEvidenceEntry({
    schema: EVIDENCE_SCHEMA,
    strategy: HIGH_WATER_STRATEGY,
    criterion: check.criterion,
    gap: null,
    finding: `Check "${check.id}" passed on main at ${sha}.`,
    disposition: null,
    proof: { sha, pr: null, stamp: null, check: check.id },
    recurrence_key: PROMOTION_RECURRENCE_KEY,
    claim: null,
    observed_at: observedAt,
  });
}

/**
 * Is this entry a high-water promotion for `checkId`?
 *
 * Lives here, beside the builder, so the write shape and the read filter can
 * never drift apart. `high-water.ts` is its only caller.
 */
export function isPromotionFor(entry: EvidenceEntry, checkId: string): boolean {
  return entry.recurrence_key === PROMOTION_RECURRENCE_KEY && entry.proof.check === checkId;
}
