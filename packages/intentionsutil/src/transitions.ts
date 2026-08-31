import type { Execution, IntentionNode, Rounds, StrategyStampValue } from "./schema.js";
import { servingStrategyIds } from "./router.js";

// Graph router v2, second half: phase transitions, execution-state writes,
// the reconciler sweep, and completion pruning (tactic-graph-router-transitions).
//
// This module is the PURE decision layer that the transition-writer and
// reconciler shell wrappers call. Same inputs in, same decision out — no gh,
// no store I/O, no git. The environmental parts (reading origin/main, the PR
// mergeability sensor, arming gh auto-merge, the stamp file, the graph-commit
// call) live in the wrappers:
//   .claude/skills/dispatch-propagate/scripts/transition-node
//   .claude/skills/dispatch-propagate/scripts/reconcile-graph-merged
//   packages/intentionsutil/scripts/demote-node-to-implement
//
// Spec: intentions/tactic-graph-native-dispatch.md §1.1, §2.4; strategy
// clarifications 10, 18, 22.

// --- Execution markers -------------------------------------------------------

/**
 * The graph-native completion markers a tactic accumulates in
 * `execution.markers`, successors to the legacy `dispatch:planned`,
 * `dispatch:qa-done`, and `dispatch:reviewed` labels. A marker records that a
 * ladder phase completed; the selector reads them (e.g. the re-review reset
 * after a fix lands post-review).
 */
export const PLANNED_MARKER = "planned";
export const QA_DONE_MARKER = "qa-done";
export const REVIEWED_MARKER = "reviewed";

/** The marker each ladder phase writes on clean completion. */
export const PHASE_COMPLETION_MARKER: Record<string, string> = {
  implement: PLANNED_MARKER,
  qa: QA_DONE_MARKER,
  review: REVIEWED_MARKER,
};

// --- CI sensor verdict -------------------------------------------------------

/**
 * The PR's CI verdict as read by the transition writer's sensor layer (the
 * read side of `dispatch-phase`, carried over per spec §2.4). `unknown` when no
 * PR exists yet or checks have not reported — treated as not-failing so a
 * pre-PR implement completion is not forced into `fix`.
 */
export type CiVerdict = "passing" | "failing" | "unknown";

// --- Forward ladder ----------------------------------------------------------

/**
 * The linear success ladder (strategy clarification 22, spec §1.1),
 * closest-to-start first. `fix` is NOT on it — it is the CI-failure interrupt
 * (`fixInterrupt`), and `main-qa` is inserted only when needs-main residue is
 * present (`forwardPhase`). `main-qa` is the phase value `tactic-main-qa-phase`
 * adopted into the schema enum; a node carrying needs-main residue drains it
 * before `done` (same doctrine as `router.ts`'s `PHASE_LADDER`). A CI-fix
 * interrupt does NOT move a tactic off this ladder — it is carried orthogonally
 * on `execution.fix` (the selector owns that routing), so `phase` stays put.
 */
export const LADDER: readonly string[] = ["implement", "qa", "review", "done"];

/**
 * The phase reached when a worker COMPLETES `phase` cleanly. This is the
 * unconditional forward edge — `decideTransition` fires it CI-blind, never
 * routing into `fix` (a CI-fix interrupt is decided by the selector from
 * `execution.fix`, leaving `phase` in place).
 *
 *   implement → qa
 *   qa        → review
 *   review    → main-qa  (needs-main residue present) | done
 *   main-qa   → done
 *
 * Returns `null` for a phase with no forward edge (`done`, `fix`, or an unknown
 * phase). `review`'s clean completion in practice arms auto-merge rather than
 * writing `done` directly — the reconciler sweep absorbs the out-of-band merge —
 * but the ladder edge is still defined here for the reconciler and for a
 * merge-disabled fallback.
 */
export function forwardPhase(phase: string, hasResidue: boolean): string | null {
  switch (phase) {
    case "implement":
      return "qa";
    case "qa":
      return "review";
    case "review":
      return hasResidue ? "main-qa" : "done";
    case "main-qa":
      return "done";
    default:
      return null;
  }
}

// --- Fix interrupt -----------------------------------------------------------

/** Ladder phases a `fix` interrupt can fire from (strategy clarification 18). */
const FIX_INTERRUPTIBLE: ReadonlySet<string> = new Set(["implement", "qa", "review"]);

/** Retry-cap parity with the legacy `dispatch:fix-checks-attempt-<n>` label lane (fix-checks SKILL.md Step 5, escalating at 3 attempts). */
export const FIX_ATTEMPT_CAP = 3;

/**
 * The `execution.attempts` key tracking a tactic's LIFETIME count of fresh
 * fix-interrupt entries — bumped by `apply-fix-state.ts`'s `--set-fix` only on
 * a genuinely fresh entry (`execution.fix` was null), and, unlike
 * `execution.fix.attempt`, never reset by `--clear-fix`. This is the counter
 * `FIX_CYCLE_CAP` compares against.
 */
export const FIX_CYCLE_ATTEMPT_KEY = "fix-cycle";

/**
 * Cross-cycle cap on fix-interrupt ENTRIES, distinct from `FIX_ATTEMPT_CAP`
 * (which bounds retries WITHIN one open `execution.fix` episode).
 * `--clear-fix` wipes `execution.fix` to null on resolution, so a node that
 * repeatedly enters the interrupt, resolves it, and re-stalls would otherwise
 * get a fresh `attempt: 1` budget every cycle and thrash indefinitely —
 * `reconcile-graph-review-stall`'s fix-interrupt entry is the primary caller
 * that can retrigger `--set-fix` after a prior episode already resolved (a
 * `phase: review` + `reviewed` tactic is excluded from normal selection, so
 * only that sweep, not the normal per-tick gate, can re-enter it). Counted via
 * `FIX_CYCLE_ATTEMPT_KEY` on `execution.attempts`, which `--clear-fix` never
 * touches.
 */
export const FIX_CYCLE_CAP = 3;

/**
 * Whether a live CI verdict at `phase` should set the orthogonal `execution.fix`
 * interrupt (spec §1.1, clarification 18). Only a `failing` verdict at an
 * interruptible ladder phase fires; `unknown`/`passing` never do, and a `done`
 * phase is never interrupted. This predicate is the SELECTOR's routing input —
 * `decideTransition` is CI-blind and never calls it. The interrupt no longer
 * overwrites `phase`; `phase` stays at its real ladder position while
 * `execution.fix` carries the in-flight fix state.
 */
export function fixInterrupt(phase: string, ci: CiVerdict): boolean {
  return ci === "failing" && FIX_INTERRUPTIBLE.has(phase);
}

// --- Conflict interrupt -------------------------------------------------------

/** Spin guard on conflict-resolution attempts; matches legacy `/fix-conflicts`' cap of 3. */
export const CONFLICT_ATTEMPT_CAP = 3;

/**
 * Whether a reviewed-awaiting-merge PR's `mergeable` value should set the
 * orthogonal `execution.conflict` interrupt (clarification 66). This is the
 * SELECTOR's mergeable-routing input, orthogonal to `phase` — exactly
 * parallel to `fixInterrupt`. Only `"CONFLICTING"` fires; `"MERGEABLE"` never
 * does, and `"UNKNOWN"` never does either — GitHub computes mergeability
 * asynchronously, so `UNKNOWN` means "not yet known" and the caller should
 * wait and re-check rather than treat it as a conflict.
 */
export function conflictInterrupt(mergeable: string): boolean {
  return mergeable === "CONFLICTING";
}

// --- Whole forward-transition decision ---------------------------------------

/** What the transition writer should do at the end of a phase worker's run. */
export interface TransitionDecision {
  /** The phase to write, or the current phase unchanged when `hold` is set. */
  phase: string;
  /**
   * True when a clean `review` completion should arm gh auto-merge and write NO
   * forward phase (the reconciler sweep lands `done`/`main-qa` post-merge).
   */
  armMerge: boolean;
  /**
   * True when a freshness gate held the transition: write no forward phase,
   * arm no merge. `phase` echoes the current phase for a strategy-fingerprint
   * hold, or is `"implement"` for a scope-fingerprint demotion (`demote`).
   */
  hold: boolean;
  /** True when the hold is a scope-fingerprint demotion to `implement`. */
  demote: boolean;
}

/**
 * Decide the transition at the end of a phase worker's run, given the tactic's
 * current phase, whether the node carries needs-main residue, and the two
 * freshness-gate results.
 *
 * This decision is CI-BLIND: the forward ladder edge fires unconditionally and
 * is NEVER routed into `fix` here. A CI-fix interrupt is carried orthogonally on
 * `execution.fix` and routed by the selector (`fixInterrupt`), leaving `phase`
 * at its real ladder position — so there is nothing to resume and no marker to
 * clear at transition time. The re-review reset (clearing qa-done/reviewed when
 * a fix lands after review) likewise belongs to the selector, not here.
 *
 * Order of precedence (spec §1.1):
 *  1. Scope-fingerprint mismatch → demote to `implement` (the chain-of-custody
 *     backward transition; supersedes stay-at-phase).
 *  2. Strategy-fingerprint mismatch → hold at the current phase (soft-freeze;
 *     the selector queues the re-evaluation, a confirm re-stamps).
 *  3. Clean `review` completion → arm auto-merge, no phase write.
 *  4. Otherwise → the unconditional forward ladder edge.
 *
 * `scopeStale` and `strategyStale` are the caller's precomputed gate results
 * (the caller owns the origin/main reads and the stamp file). A missing stamp
 * fails open during bootstrap (`scopeStale === false`) and closed once the
 * worker-start gate lands — that policy is the caller's; this function trusts
 * the booleans it is handed.
 */
export function decideTransition(args: {
  phase: string;
  hasResidue: boolean;
  scopeStale: boolean;
  strategyStale: boolean;
}): TransitionDecision {
  const { phase, hasResidue, scopeStale, strategyStale } = args;

  // 1. Scope-fingerprint demotion (pre-merge only; the caller must not invoke
  //    this on a merged tactic — post-merge staleness routes via main-qa).
  if (scopeStale) {
    return { phase: "implement", armMerge: false, hold: true, demote: true };
  }

  // 2. Strategy soft-freeze hold at the completed phase.
  if (strategyStale) {
    return { phase, armMerge: false, hold: true, demote: false };
  }

  // 3. Clean review completion arms auto-merge; no graph-side phase write.
  if (phase === "review") {
    return { phase: "review", armMerge: true, hold: false, demote: false };
  }

  // 4. Unconditional forward ladder edge (CI-blind).
  const next = forwardPhase(phase, hasResidue);
  if (next === null) {
    return { phase, armMerge: false, hold: true, demote: false };
  }
  return { phase: next, armMerge: false, hold: false, demote: false };
}

// --- Execution-state mutation helpers ---------------------------------------

/**
 * Return a new `Execution` with one added marker (idempotent — an already
 * present marker is a no-op), preserving every other field. Markers are kept in
 * insertion order without duplicates.
 */
export function addMarker(execution: Execution, marker: string): Execution {
  if (execution.markers.includes(marker)) return execution;
  return { ...execution, markers: [...execution.markers, marker] };
}

/**
 * Return a new `Execution` with `phase`'s attempt counter incremented by one
 * (successor to the `dispatch:<phase>-attempt` labels), preserving every other
 * field.
 */
export function incrementAttempt(execution: Execution, phase: string): Execution {
  const current = execution.attempts[phase] ?? 0;
  return { ...execution, attempts: { ...execution.attempts, [phase]: current + 1 } };
}

// --- Reconciler (Unit 2) -----------------------------------------------------

/** GitHub's PR mergeability enum, as gh_pr_view_rest projects it. */
export type Mergeable = "MERGEABLE" | "CONFLICTING" | "UNKNOWN";

/**
 * The recovery lane `interruptRoute`'s ordered cascade resolves to, or `null`
 * when no interrupt is due. See `interruptRoute` for the cascade itself.
 */
export type InterruptRoute = "fix" | "conflict" | null;

/**
 * The recovery lane a stalled `phase: review` + `reviewed` tactic must be
 * routed to, or `null` when nothing has regressed.
 *
 *  - `"fix"` — the CI-fix interrupt (`execution.fix`), acted on by
 *    `/fix-checks` and resolved by `apply-fix-state --clear-fix`.
 *  - `"conflict"` — the conflict lane (`/dispatch-conflict`, or a tracked
 *    `provision-conflict` hold via `hold-node`), which resolves an
 *    origin/main merge conflict on the node's own branch.
 */
export type ReviewStallRoute = InterruptRoute;

/**
 * Which recovery lane an armed `phase: review` tactic carrying the `reviewed`
 * marker needs, for the review-stall reconciler
 * (`tactic-graph-review-exclusion-stall-recovery`). Once a node reaches
 * `review` and picks up the `reviewed` marker, the selector's reviewed-marker
 * exclusion (`selectGraphTargets` in `router.ts`,
 * `tactic-graph-selector-reviewed-exclusion`) removes it from selection
 * entirely — so the normal CI-red fix-interrupt entry (`graph-select-target`'s
 * `_gate_maybe_interrupt`, which only runs on candidates the selector already
 * emits) never gets a chance to run on this node again, and a later CI
 * regression or merge conflict would otherwise strand it forever.
 *
 * The two regressions route to DIFFERENT lanes — they are not interchangeable:
 *
 *  - `ci === "failing"` → `"fix"`. Red CI is exactly what the `execution.fix`
 *    interrupt carries.
 *  - `mergeable === "CONFLICTING"` → `"conflict"`. A merge conflict must NOT
 *    enter `execution.fix`: `graph-select-target`'s `_gate_fix_active` reads
 *    CI, not mergeability, so a conflicted-but-green PR would be seen as
 *    resolved on the very next selection and `apply-fix-state --clear-fix`
 *    would strip the `reviewed` marker, reset `phase` to `review`, and
 *    `gh pr ready --undo` the PR back to draft — discarding a completed review
 *    verdict and re-running the whole review pass while the conflict itself
 *    stayed untouched. That is an unbounded review-cost amplifier anyone able
 *    to land a commit on main touching the PR's files could fire repeatedly.
 *    Only the conflict lane actually resolves the conflict, and it preserves
 *    the `reviewed` marker.
 *
 * `CONFLICTING` takes precedence over `failing` when both hold: the fix lane
 * would have to merge origin/main to even run, so the conflict must clear
 * first. Once it does, a later sweep sees `ci === "failing"` on the
 * (no-longer-conflicting) PR and routes to `"fix"` then.
 *
 * `UNKNOWN` mergeability and any non-`failing` CI verdict are NOT a regression:
 * GitHub computes mergeability asynchronously and self-heals `UNKNOWN` to a
 * real value on a later sweep — the same no-op posture
 * `dispatch-reconcile-ready` takes on an `UNKNOWN` read.
 *
 * The CONFLICTING-outranks-failing ordering documented above now lives in
 * `interruptRoute`, which this function delegates to at the fixed phase
 * `"review"` — see `interruptRoute` for the single documented home of the
 * precedence rule.
 */
export function reviewStallRoute(ci: CiVerdict, mergeable: Mergeable): ReviewStallRoute {
  return interruptRoute("review", ci, mergeable);
}

/**
 * The single ordered cascade over `(mergeable, ci)` for whether an interrupt is
 * due at `phase`, and which lane it enters. This is the ONE documented home of
 * the CONFLICTING-outranks-failing-CI precedence rule described above on
 * `reviewStallRoute` (see that comment for the full rationale — not restated
 * here) — consumed by BOTH:
 *
 *  - the review-stall sweep (`reviewStallRoute`, which delegates here at the
 *    fixed phase `"review"`); and
 *  - the normal selection gate (`graph-select-target`'s
 *    `_gate_maybe_interrupt`), which calls this function through a
 *    `node --import tsx/esm -e` bridge before writing any fix-attempt state.
 *
 * That normal path WAS merge-blind before that gate was wired: it only
 * checked `ci === "failing"` before writing a fix-attempt state, so a PR that
 * was BOTH `CONFLICTING` and red would get a fix-attempt state written and
 * burn one of a limited attempt budget (`FIX_ATTEMPT_CAP`) against a CI
 * verdict that actually describes stale pre-merge code — and the fix lane
 * cannot even run until the conflict clears, since fixing requires merging
 * origin/main first. Routing that case to `"conflict"` instead is what
 * `_gate_maybe_interrupt` now does: it declines the interrupt (no
 * `execution.fix` write, no graph-commit, no attempt consumed) and lets the
 * candidate fall through to provisioning's conflict lane, avoiding spending
 * both a graph write and an attempt on a verdict the conflict will
 * invalidate anyway.
 *
 * The sibling arm for a candidate that ALREADY carries an active interrupt
 * (`graph-select-target`'s `_gate_fix_active`) does NOT consume
 * `interruptRoute` and stays conflict-blind by design — see the comment
 * above `_gate_fix_active` in that file for the scope rationale; the two
 * sites are meant to agree.
 *
 * `UNKNOWN` mergeability is deliberately NOT treated as a conflict: GitHub
 * computes mergeability asynchronously and self-heals `UNKNOWN` to a real
 * value on a later check. Treating `UNKNOWN` as `CONFLICTING` would suppress
 * every fix interrupt during GitHub's compute window.
 *
 * A `null` return means no interrupt is due. The only two conditions that can
 * produce a non-null route are `ci === "failing"` and `mergeable ===
 * "CONFLICTING"` — a superset invariant a shell caller may exploit as a cheap
 * pre-filter (`ci === "failing" || mergeable === "CONFLICTING"`) before paying
 * for a full call, and which a later test pins so that optimization stays
 * correct.
 */
export function interruptRoute(phase: string, ci: CiVerdict, mergeable: Mergeable): InterruptRoute {
  if (mergeable === "CONFLICTING") return "conflict";
  if (fixInterrupt(phase, ci)) return "fix";
  return null;
}

/**
 * The phase a merged-out-of-band tactic reconciles to: `main-qa` when the node
 * carries a needs-main residue section (verified post-merge, strategy
 * clarification 22), else `done`. A closed-not-merged PR always reconciles to
 * `done` — use `reconcileClosedPhase`.
 */
export function reconcileMergedPhase(hasResidue: boolean): "main-qa" | "done" {
  return hasResidue ? "main-qa" : "done";
}

/** A closed-not-merged tactic PR reconciles straight to `done` (abandoned work). */
export function reconcileClosedPhase(): "done" {
  return "done";
}

/**
 * The canonical needs-main residue heading matcher. The qa phase records
 * needs-main residue as an H2 section on the node body whose heading text
 * begins with "needs-main" (case-insensitive) — e.g. `## needs-main`,
 * `## Needs-main residue`, `## Needs-main QA`. This is the single detector the
 * reconciler and the transition writer share so the residue branch (merged →
 * `main-qa`, review → `main-qa`) is decided identically everywhere.
 */
export function hasNeedsMainResidue(body: string): boolean {
  for (const line of body.split("\n")) {
    const m = line.match(/^##\s+(.*)$/);
    if (m !== null && /^needs-main(?:\s|$)/i.test(m[1].trim())) return true;
  }
  return false;
}

/**
 * Stamp a completed round on a strategy when its last non-draft child prunes
 * (spec §1.1 line 134): `count += 1`, `last_completed := date`. Pure — the
 * caller decides WHEN (its last non-draft child reached `done` and is being
 * pruned in this same commit) and supplies the ISO date. `last_aligned` is
 * preserved unchanged — it is stamped elsewhere, at align-landing time, not
 * on completion.
 */
export function stampRound(rounds: Rounds | null, date: string): Rounds {
  return { count: (rounds?.count ?? 0) + 1, last_completed: date, last_aligned: rounds?.last_aligned ?? null };
}

// --- Completion pruning graph edits (Unit 2) --------------------------------

/**
 * The ids of nodes that list `prunedId` in their `blocked_by`. When a `done`
 * tactic is pruned, `validateGraph` Rule 13 rejects any surviving `blocked_by`
 * that no longer resolves, so these inbound edges MUST have `prunedId` removed
 * in the SAME commit as the prune. Absence already reads as completion to the
 * selector (`blockersComplete`), so removal is safe and semantics-preserving.
 */
export function inboundBlockers(prunedId: string, nodes: readonly IntentionNode[]): string[] {
  return nodes.filter((n) => n.blocked_by.includes(prunedId)).map((n) => n.id);
}

/**
 * The ids of nodes that list `prunedId` in their `superseded_by` — the rule-24
 * counterpart of `inboundBlockers` above. `validateGraph` Rule 24 rejects any
 * surviving `superseded_by` that no longer resolves, the same way Rule 13 treats
 * `blocked_by`, so a prune MUST strip `prunedId` from these inbound edges in the
 * SAME commit. Without this scan rule 24's ledger entry rested on "nodes are
 * never pruned", which the function directly above already falsifies for rule 13.
 *
 * Removal is safe and semantics-preserving here too, though a different reader
 * is why: retirement is carried by `status` — `isSuperseded` tests
 * `status === SUPERSEDED_STATUS` and never looks at the edge — so a node stays
 * retired once the edge is dropped. The edge is provenance, naming WHERE the
 * intent moved, and a pruned target is no longer there to name.
 */
export function inboundSuperseders(prunedId: string, nodes: readonly IntentionNode[]): string[] {
  return nodes.filter((n) => n.superseded_by.includes(prunedId)).map((n) => n.id);
}

/**
 * Whether a `strategy` node is a serving strategy of `tactic` and `tactic` is
 * its LAST non-draft child — i.e. no OTHER non-draft tactic still serves that
 * strategy once `tactic` prunes. Draft tactics are `/align-tactics` input, not
 * children, so they never keep a round open. When true, pruning `tactic` closes
 * a round on `strategy` (`stampRound`).
 *
 * `nodes` is the full store; a tactic is "non-draft" when its `phase` is set and
 * not `draft`. `tactic` itself is excluded from the remaining-children scan (it
 * is the one being pruned).
 */
export function strategiesToStamp(tactic: IntentionNode, nodes: readonly IntentionNode[]): string[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const serving = servingStrategyIds(tactic, byId);
  const out: string[] = [];
  for (const sid of serving) {
    const others = nodes.filter(
      (n) =>
        n.id !== tactic.id &&
        n.kind === "tactic" &&
        n.phase !== null &&
        n.phase !== "draft" &&
        servingStrategyIds(n, byId).has(sid),
    );
    if (others.length === 0) out.push(sid);
  }
  return out.sort();
}

// --- Freshness-gate helpers --------------------------------------------------

/** A parsed phase-start scope stamp (`<fingerprint> <origin-main-sha>`). */
export interface ScopeStamp {
  fingerprint: string;
  sha: string;
}

/**
 * Parse the worker-start gate's stamp file content
 * (`tactic-worker-start-revalidation` Unit 2 format: `<fingerprint> <sha>` on
 * one line). Returns `null` for empty/malformed content so the caller applies
 * its missing-stamp policy (fail-open during bootstrap, fail-closed after)
 * rather than this parser inventing a fallback.
 */
export function parseScopeStamp(content: string): ScopeStamp | null {
  const parts = content.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0] === "" || parts[1] === "") return null;
  return { fingerprint: parts[0], sha: parts[1] };
}

/**
 * The scope-fingerprint gate result: the current `origin/main` scope
 * fingerprint differs from the phase-start stamp the worker-start gate saved.
 * A `null` stamp (missing/malformed) is NOT stale here — the caller owns the
 * bootstrap fail-open / post-launch fail-closed policy.
 */
export function isScopeStale(stamp: ScopeStamp | null, currentFingerprint: string): boolean {
  if (stamp === null) return false;
  return stamp.fingerprint !== currentFingerprint;
}

/**
 * Extract the comparable fingerprint hash from a stamp map entry. Each entry
 * is either the legacy bare-string form (the hash itself) or the widened
 * `{hash, sha}` object form (Unit 1, `StrategyStampValue`) that additionally
 * carries the `origin/main` sha the stamp was taken at. This is the single
 * home of that shape discrimination — callers compare hashes via this helper
 * instead of duplicating the `string | {hash,sha}` branch inline.
 */
export function stampHash(value: StrategyStampValue): string {
  return typeof value === "string" ? value : value.hash;
}

/**
 * Per-strategy staleness against a raw stamp value (soft-freeze, strategy
 * clarification 10). The stamp is one of:
 *   - `null` — never stale (stamping starts when the align machinery lands).
 *   - a `Record<strategy-id, StrategyStampValue>` map — stale iff the map
 *     carries a key for `strategyId` AND its stamped hash differs from
 *     `currentFingerprint`; a serving strategy ABSENT from the map is never
 *     stale (per-strategy null). Each map value is either a bare-string hash
 *     or the widened `{hash, sha}` object recording the `origin/main` sha the
 *     stamp was taken at — `stampHash` extracts the comparable hash from
 *     either shape.
 *   - a bare string (deprecated-legacy) — stale iff it differs from
 *     `currentFingerprint`, ignoring `strategyId`. This preserves the legacy
 *     compare-against-every-serving-strategy semantics: one string cannot equal
 *     two substance hashes, so a legacy multi-serves stamp stays frozen until a
 *     re-stamp converts it to map form.
 */
export function isFingerprintStale(
  stamp: string | Record<string, StrategyStampValue> | null,
  strategyId: string,
  currentFingerprint: string,
): boolean {
  if (stamp === null) return false;
  if (typeof stamp === "string") return stamp !== currentFingerprint;
  if (!Object.hasOwn(stamp, strategyId)) return false;
  return stampHash(stamp[strategyId]) !== currentFingerprint;
}

/**
 * The strategy-fingerprint gate result for a specific serving strategy: the
 * strategy's current substance fingerprint differs from the entry stamped on
 * `execution.strategy_fingerprint`. A null execution or null stamp is never
 * stale. Delegates to `isFingerprintStale` — the single home of the per-strategy
 * staleness rule.
 */
export function isStrategyStale(
  execution: Execution | null,
  strategyId: string,
  currentFingerprint: string,
): boolean {
  if (execution === null) return false;
  return isFingerprintStale(execution.strategy_fingerprint, strategyId, currentFingerprint);
}
