import type { Execution, IntentionNode, Rounds } from "./schema.js";
import { servingStrategyIds } from "./router.js";

// Graph router v2, second half: phase transitions, execution-state writes,
// the reconciler sweep, and completion pruning (tactic-graph-router-transitions).
//
// This module is the PURE decision layer that the transition-writer and
// reconciler shell wrappers call. Same inputs in, same decision out — no gh,
// no store I/O, no git. The environmental parts (reading origin/main, the CI
// verdict / PR mergeability sensors, arming gh auto-merge, the stamp file, the
// graph-commit call) live in the wrappers:
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
 * ladder phase completed; the fix-interrupt resume logic reads them to find
 * where a tactic left off.
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
 * before `done` (same doctrine as `router.ts`'s `PHASE_LADDER`).
 */
export const LADDER: readonly string[] = ["implement", "qa", "review", "done"];

/**
 * The phase reached when a worker COMPLETES `phase` cleanly (CI-green). The
 * `fix` interrupt is decided separately by `fixInterrupt`; this is the
 * green-path forward edge only.
 *
 *   implement → qa
 *   qa        → review
 *   review    → main-qa  (needs-main residue present) | done
 *   main-qa   → done
 *
 * Returns `null` for a phase with no forward edge (`done`, or `fix` which
 * resumes via `resumeAfterFix`, or an unknown phase). `review`'s clean
 * completion in practice arms auto-merge rather than writing `done` directly —
 * the reconciler sweep absorbs the out-of-band merge — but the ladder edge is
 * still defined here for the reconciler and for a merge-disabled fallback.
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

/**
 * Whether a live CI verdict at `phase` should route the tactic into `fix`
 * (spec §1.1, clarification 18; legacy `dispatch-phase` parity: CI verdict is
 * checked before phase logic, so a tactic already past qa/review routes back to
 * the fixer on a CI regression). Only a `failing` verdict at an interruptible
 * ladder phase fires; `unknown`/`passing` never do, and a phase already `fix`
 * or `done` is never re-interrupted.
 */
export function fixInterrupt(phase: string, ci: CiVerdict): boolean {
  return ci === "failing" && FIX_INTERRUPTIBLE.has(phase);
}

/**
 * Where a tactic resumes when it leaves `fix` with a green CI verdict: the next
 * ladder phase after the furthest completion marker it carries. A tactic that
 * had finished review before the regression resumes at `done` (or `main-qa`
 * with residue); one that had only finished qa resumes at `review`; one past
 * implement resumes at `qa`; a bare tactic resumes at `implement`.
 */
export function resumeAfterFix(markers: readonly string[], hasResidue: boolean): string {
  const has = (m: string): boolean => markers.includes(m);
  if (has(REVIEWED_MARKER)) return hasResidue ? "main-qa" : "done";
  if (has(QA_DONE_MARKER)) return "review";
  if (has(PLANNED_MARKER)) return "qa";
  return "implement";
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
 * current phase, its completion markers, the live CI verdict, whether the node
 * carries needs-main residue, and the two freshness-gate results.
 *
 * Order of precedence (spec §1.1):
 *  1. Scope-fingerprint mismatch → demote to `implement` (the chain-of-custody
 *     backward transition; supersedes stay-at-phase).
 *  2. Strategy-fingerprint mismatch → hold at the current phase (soft-freeze;
 *     the selector queues the re-evaluation, a confirm re-stamps).
 *  3. CI failing at an interruptible phase → `fix`.
 *  4. Leaving `fix` with green CI → resume at the marker-implied phase.
 *  5. Clean `review` completion → arm auto-merge, no phase write.
 *  6. Otherwise → the forward ladder edge.
 *
 * `scopeStale` and `strategyStale` are the caller's precomputed gate results
 * (the caller owns the origin/main reads and the stamp file). A missing stamp
 * fails open during bootstrap (`scopeStale === false`) and closed once the
 * worker-start gate lands — that policy is the caller's; this function trusts
 * the booleans it is handed.
 */
export function decideTransition(args: {
  phase: string;
  markers: readonly string[];
  ci: CiVerdict;
  hasResidue: boolean;
  scopeStale: boolean;
  strategyStale: boolean;
}): TransitionDecision {
  const { phase, markers, ci, hasResidue, scopeStale, strategyStale } = args;

  // 1. Scope-fingerprint demotion (pre-merge only; the caller must not invoke
  //    this on a merged tactic — post-merge staleness routes via main-qa).
  if (scopeStale) {
    return { phase: "implement", armMerge: false, hold: true, demote: true };
  }

  // 2. Strategy soft-freeze hold at the completed phase.
  if (strategyStale) {
    return { phase, armMerge: false, hold: true, demote: false };
  }

  // 3. CI-failure interrupt.
  if (fixInterrupt(phase, ci)) {
    return { phase: "fix", armMerge: false, hold: false, demote: false };
  }

  // 4. Resume out of fix on green CI.
  if (phase === "fix") {
    if (ci === "passing") {
      return { phase: resumeAfterFix(markers, hasResidue), armMerge: false, hold: false, demote: false };
    }
    // Still red — stay in fix.
    return { phase: "fix", armMerge: false, hold: true, demote: false };
  }

  // 5. Clean review completion arms auto-merge; no graph-side phase write.
  if (phase === "review") {
    return { phase: "review", armMerge: true, hold: false, demote: false };
  }

  // 6. Forward ladder edge.
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
 * pruned in this same commit) and supplies the ISO date.
 */
export function stampRound(rounds: Rounds | null, date: string): Rounds {
  return { count: (rounds?.count ?? 0) + 1, last_completed: date };
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
 * The strategy-fingerprint gate result (soft-freeze, strategy clarification
 * 10): the serving strategy's current substance fingerprint differs from the
 * one stamped on `execution.strategy_fingerprint`. A null stamp is never
 * stale (stamping starts when the align machinery lands).
 */
export function isStrategyStale(execution: Execution | null, currentFingerprint: string): boolean {
  if (execution === null || execution.strategy_fingerprint === null) return false;
  return execution.strategy_fingerprint !== currentFingerprint;
}
