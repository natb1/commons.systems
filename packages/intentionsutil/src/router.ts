import { createHash } from "node:crypto";
import { computeSignalPath, isSignalUnvalidated, resolveAttention } from "./attention.js";
import { isStrategyStale, REVIEWED_MARKER } from "./transitions.js";
import { PHASES } from "./schema.js";
import type { IntentionNode, Phase } from "./schema.js";

// Graph router v2, first half: selection (tactic-graph-router-selector).
//
// This module is the PURE part of the graph selector: same nodes in, same
// ordered candidate list out. Everything environmental — the origin/main store
// snapshot, the claimed set (live sessions + reservation ledger), the per-phase
// sensor gates that need gh (CI verdict, PR merged), pacing, and the selection
// log — lives in the shell wrapper
// (.claude/skills/dispatch-propagate/scripts/graph-select-target).
//
// Eligibility and ordering spec: intentions/tactic-graph-native-dispatch.md
// §3.1–3.2.

// --- Types -------------------------------------------------------------------

/**
 * The phase ladder, closest-to-done first (strategy clarification 22).
 *
 * Historical: this drove the within-rank selection tiebreak until
 * tactic-graph-frozen-tactic-dispatch replaced it with a progression ordinal
 * over the full `PHASES` order (see `progressionIndex`). The selection sort no
 * longer consults it; it is retained as a public export for downstream
 * consumers. Note the progression ordinal reorders `fix` vs `qa` relative to
 * this ladder (`qa` is now more-progressed than `fix`).
 */
export const PHASE_LADDER: readonly string[] = [
  "main-qa",
  "review",
  "fix",
  "qa",
  "implement",
  "align-tactics",
];

/** One selectable node, in selection order. */
export interface GraphCandidate {
  id: string;
  kind: "strategy" | "tactic";
  /** The tactic's persisted phase; `align-tactics` for a strategy. */
  phase: string;
  /** Resolved attention rank (the outermost ordering axis). */
  rank: number;
  /** The node's authored pace-gate bypass flag (strategy clarification 14). */
  pace_exempt: boolean;
  /** The tactic's execution.pr — the wrapper's sensor-gate input. Null for strategies. */
  pr: number | null;
  /**
   * True when this candidate is a soft-freeze re-evaluation session (strategy
   * clarification 10) rather than an ordinary decomposition round — a stale
   * frozen tactic re-surfacing at `align-tactics`
   * (tactic-graph-frozen-tactic-dispatch). False for a fresh draft-tactic or
   * strategy align candidate.
   */
  reevaluation: boolean;
}

/** A structured note the wrapper writes to the selection log. */
export interface SelectionEvent {
  event: "freeze" | "rounds-cap" | "stale-reading";
  strategy: string;
  detail: string;
}

export interface GraphSelection {
  /** Eligible nodes in selection order: rank desc, progression ordinal desc, id asc. */
  candidates: GraphCandidate[];
  /** Freeze / cap / gate events observed during the scan. */
  events: SelectionEvent[];
}

// --- Strategy substance fingerprint -------------------------------------------

/**
 * The serving strategy's substance fingerprint (strategy clarification 10):
 * sha256 over the canonical JSON of the substance fields — statement,
 * clarifications, conditions (`attributes.conditions`), serves,
 * success_signal, tooling_goals. State writes (`reading` / `gap` / `rounds` /
 * `office_hours` / attention) never change it.
 *
 * `serves` is order-normalized (sorted) so an edge reorder is not substance;
 * clarifications keep author order (their sequence is meaningful dialectic
 * history).
 */
export function strategyFingerprint(strategy: IntentionNode): string {
  const substance = {
    statement: strategy.statement,
    clarifications: strategy.clarifications,
    conditions: strategy.attributes.conditions ?? null,
    serves: [...strategy.serves].sort(),
    success_signal: strategy.success_signal,
    tooling_goals: strategy.tooling_goals,
  };
  return createHash("sha256").update(JSON.stringify(substance)).digest("hex");
}

/**
 * A tactic's SCOPE fingerprint (chain-of-custody, 2026-07-06): sha256 over the
 * node's `statement` plus its markdown body — the plan content a phase worker
 * executes against — and NOTHING from the frontmatter state fields
 * (`phase`/`execution`/`attempts`/`markers`/`office_hours`/`attention`), so a
 * transition or park write never changes it. Residue sections appended to the
 * body ARE scope and DO change it; the transition writer refreshes the stamp
 * after such an append so machinery appends do not trip the chain-of-custody
 * gate (see `tactic-graph-router-transitions`).
 *
 * Takes `(statement, body)` rather than a node because `readNode` intentionally
 * drops the body (only frontmatter is authoritative on read); the caller reads
 * the body verbatim via `readNodeBody` and passes both, keeping this function
 * pure and store-independent. The pair is hashed as canonical JSON so the field
 * boundary is unambiguous (a body starting with the statement text cannot alias
 * a different statement/body split).
 */
export function tacticScopeFingerprint(statement: string, body: string): string {
  return createHash("sha256").update(JSON.stringify({ statement, body })).digest("hex");
}

// --- Helpers -------------------------------------------------------------------

/** Draft phase: `phase: draft`, or equivalently no phase set (§1.1). */
function isDraft(tactic: IntentionNode): boolean {
  return tactic.phase === null || tactic.phase === "draft";
}

/** Open = in flight: a phase set, and neither draft nor done. (Type predicate:
 * a passing tactic provably carries a non-null phase.) */
function isOpenTactic(tactic: IntentionNode): tactic is IntentionNode & { phase: Phase } {
  return !isDraft(tactic) && tactic.phase !== "done";
}

/**
 * The strategies a tactic belongs to: its own `serves` plus the `serves` of
 * every `parent` ancestor (a subtree's root tactic serves the strategy; its
 * descendants belong through the chain). Cycle-safe.
 */
export function servingStrategyIds(tactic: IntentionNode, byId: Map<string, IntentionNode>): Set<string> {
  const result = new Set<string>();
  const visited = new Set<string>();
  let current: IntentionNode | undefined = tactic;
  while (current !== undefined && !visited.has(current.id)) {
    visited.add(current.id);
    for (const s of current.serves) result.add(s);
    current = current.parent !== null ? byId.get(current.parent) : undefined;
  }
  return result;
}

/**
 * Extract the newest ISO date (YYYY-MM-DD) mentioned anywhere in a free-text
 * reading, or null when the text carries no parseable date. Readings are
 * sensor/interview prose (e.g. "single holder, nothing documented (owner
 * interview, 2026-07-02)"), so the date embedded in the text is the reading's
 * timestamp for the fresh-reading gate.
 */
export function readingDate(reading: string): string | null {
  const matches = reading.match(/\d{4}-\d{2}-\d{2}/g);
  if (matches === null) return null;
  return matches.reduce((a, b) => (a > b ? a : b));
}

/**
 * blocked_by completeness: a blocker is complete when it is ABSENT from the
 * store (prune-on-done makes absence completion) or present with `phase:
 * done` (the transient window between the done transition and its prune).
 * A present, not-done blocker blocks.
 */
function blockersComplete(tactic: IntentionNode, byId: Map<string, IntentionNode>): boolean {
  for (const blockerId of tactic.blocked_by) {
    const blocker = byId.get(blockerId);
    if (blocker !== undefined && blocker.phase !== "done") return false;
  }
  return true;
}

/**
 * A candidate's progression ordinal over the full `PHASES` order (schema.ts):
 * the index of its effective phase, so a MORE-progressed candidate carries a
 * HIGHER index. The sort comparator reverses this (descending) to drain
 * closest-to-done first.
 *
 * A strategy carries no persisted phase — its directive rung is `align-tactics`
 * (index 1). A tactic uses its node's persisted `phase`, falling back to
 * `draft` (index 0) when the node lookup somehow fails, matching the draft
 * convention (`phase: null` == draft).
 *
 * Note this reorders `fix` vs `qa` relative to the retired `PHASE_LADDER`: under
 * `PHASES`, `qa` (index 4) is more-progressed than `fix` (index 3), so `qa` now
 * sorts before `fix` — a deliberate behavior change.
 */
function progressionIndex(candidate: GraphCandidate, byId: Map<string, IntentionNode>): number {
  const node = byId.get(candidate.id);
  const p: Phase =
    candidate.kind === "strategy" ? "align-tactics" : node?.phase ?? "draft";
  return PHASES.indexOf(p);
}

// --- Selector ------------------------------------------------------------------

/**
 * Compute the ordered graph-selection candidates over a store snapshot.
 *
 * Tactic eligibility (§3.1): `office_hours` null; `phase` set and neither
 * `draft` nor `done`; `blocked_by` fully complete (absence = completion);
 * subtree not soft-frozen. The phase SENSOR gate (CI verdict present before
 * fix/qa/review, PR merged before main-qa) is environmental and applied by the
 * wrapper, which receives each candidate's `phase` and `pr`.
 *
 * Strategy eligibility (§3.1): `office_hours` null; no non-draft child tactic
 * on the strategy's signal path (drafts are input; off-path tactics linger at
 * derived demoted rank by design); signal unvalidated (`gap` non-null or
 * `reading` null); `rounds.count < 2` (at the cap a `rounds-cap` event is
 * logged and the strategy is skipped — the park write belongs to the transition
 * writer, never to selection, which makes no graph writes); then the
 * fresh-reading gate, keyed off the last align-landing: eligible when
 * `rounds.last_aligned` is null (never aligned) or when `reading` is present and
 * dated strictly newer than `rounds.last_aligned` — a reading with no parseable
 * date, or no reading at all once `last_aligned` is set, fails the gate and logs
 * a `stale-reading` event.
 *
 * Soft-freeze gate (strategy clarification 10): an open tactic stamped with a
 * non-null `execution.strategy_fingerprint` differing from the serving
 * strategy's current substance fingerprint freezes only that stale-stamped
 * child — not its whole sibling subtree — excluding it from its normal phase
 * skill (in-flight phases finish on their own), and a `freeze` event is
 * logged. Per tactic-graph-frozen-tactic-dispatch (clarification 52) the
 * re-evaluation now targets the frozen TACTICS directly: each stale child
 * re-surfaces as a `kind: "tactic", phase: "align-tactics", reevaluation:
 * true` candidate (office_hours null and complete blockers still apply),
 * rather than the strategy id. A fresh-stamped or null-stamped sibling under
 * the same strategy is untouched by another child's staleness and keeps its
 * ordinary phase-skill candidate. Null fingerprints are not stale — stamping
 * starts when the align machinery lands.
 *
 * Frozen-tactic candidates (tactic-graph-frozen-tactic-dispatch): draft/raw
 * tactics (`phase: draft` or null) are also first-class selectable candidates
 * that route to `/align-tactics` (`reevaluation: false`, `pr: null`), gated on
 * office_hours null and complete blockers. Their candidate `phase` is the
 * directive rung `align-tactics`, but the progression ordinal reads the node's
 * REAL phase (draft, index 0) for sorting, so a draft sorts last among ties.
 * A strategy with only draft children still emits its own fresh-round
 * align-tactics candidate; the two compete by rank.
 *
 * Order: resolved attention rank outermost (node-keyed, directly from
 * `resolveAttention` — the retired node↔issue rank-map bridge is not revived);
 * within a rank level the progression ordinal (full `PHASES` order) sorts the
 * more-progressed candidate first; id ascending as the deterministic tiebreak.
 */
export function selectGraphTargets(nodes: IntentionNode[]): GraphSelection {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const attention = resolveAttention(nodes);
  const onPath = computeSignalPath(nodes);
  const events: SelectionEvent[] = [];

  const strategies = nodes.filter((n) => n.kind === "strategy");
  const tactics = nodes.filter((n) => n.kind === "tactic");

  // Child tactics per strategy (serves-edge membership, parent-chain inherited).
  const childrenOf = new Map<string, IntentionNode[]>();
  for (const s of strategies) childrenOf.set(s.id, []);
  for (const t of tactics) {
    for (const sid of servingStrategyIds(t, byId)) {
      childrenOf.get(sid)?.push(t);
    }
  }

  // --- Soft-freeze scan ------------------------------------------------------
  const frozenTacticIds = new Set<string>();
  for (const s of strategies) {
    const fp = strategyFingerprint(s);
    const children = childrenOf.get(s.id) ?? [];
    // Per-strategy staleness: a child freezes THIS strategy only if its stamp
    // carries an entry for `s.id` that differs from `s`'s current fingerprint
    // (or a legacy bare-string stamp differing from it). A multi-serves tactic
    // whose map is fresh against `s.id` does not freeze `s`, even if another of
    // its serving strategies has since drifted.
    const stale = children.filter((t) => isOpenTactic(t) && isStrategyStale(t.execution, s.id, fp));
    if (stale.length === 0) continue;
    for (const t of stale) frozenTacticIds.add(t.id);
    events.push({
      event: "freeze",
      strategy: s.id,
      detail: `stale strategy_fingerprint on ${stale.map((t) => t.id).join(", ")}`,
    });
  }

  const candidates: GraphCandidate[] = [];

  // --- Tactic candidates -------------------------------------------------------
  for (const t of tactics) {
    if (t.office_hours !== null) continue;
    if (!isOpenTactic(t)) continue;
    if (frozenTacticIds.has(t.id)) continue;
    if (!blockersComplete(t, byId)) continue;
    if (t.phase === "review" && t.execution?.markers.includes(REVIEWED_MARKER)) continue;
    candidates.push({
      id: t.id,
      kind: "tactic",
      phase: t.phase,
      rank: attention.get(t.id)?.value ?? 0,
      pace_exempt: t.pace_exempt,
      pr: t.execution?.pr ?? null,
      reevaluation: false,
    });
  }

  // --- Frozen tactic candidates ------------------------------------------------
  // Draft/raw tactics and soft-frozen tactics are first-class selectable nodes
  // that route to /align-tactics (tactic-graph-frozen-tactic-dispatch). A draft
  // is a decomposition input surfaced for its own align session; a soft-frozen
  // tactic's normal phase skill is suppressed above, but a re-evaluation
  // /align-tactics candidate is emitted here so the stale plan is re-aligned
  // against the drifted strategy. Both gate on office_hours null and complete
  // blockers. A tactic that is neither draft nor soft-frozen is already handled
  // by the executable loop above (or is done / not eligible) and skipped here.
  for (const t of tactics) {
    if (t.office_hours !== null) continue;
    if (!blockersComplete(t, byId)) continue;
    if (isDraft(t)) {
      candidates.push({
        id: t.id,
        kind: "tactic",
        phase: "align-tactics", // directive rung, not the node's real (null) phase
        rank: attention.get(t.id)?.value ?? 0,
        pace_exempt: t.pace_exempt,
        pr: null,
        reevaluation: false,
      });
    } else if (frozenTacticIds.has(t.id) && isOpenTactic(t)) {
      candidates.push({
        id: t.id,
        kind: "tactic",
        phase: "align-tactics",
        rank: attention.get(t.id)?.value ?? 0,
        pace_exempt: t.pace_exempt,
        pr: t.execution?.pr ?? null,
        reevaluation: true,
      });
    }
  }

  // --- Strategy candidates -------------------------------------------------------
  for (const s of strategies) {
    if (s.office_hours !== null) continue;

    const asCandidate = (reevaluation: boolean): GraphCandidate => ({
      id: s.id,
      kind: "strategy",
      phase: "align-tactics",
      rank: attention.get(s.id)?.value ?? 0,
      pace_exempt: s.pace_exempt,
      pr: null,
      reevaluation,
    });

    // No non-draft child tactics on the strategy's signal path.
    const children = childrenOf.get(s.id) ?? [];
    if (children.some((t) => !isDraft(t) && onPath.has(t.id))) continue;

    // Signal unvalidated.
    if (!isSignalUnvalidated(s)) continue;

    // Round cap: at rounds.count >= 2 the router parks the strategy instead of
    // selecting it. Selection makes no graph writes, so here the cap is a
    // logged skip; the park write is the transition writer's.
    const count = s.rounds?.count ?? 0;
    if (count >= 2) {
      events.push({
        event: "rounds-cap",
        strategy: s.id,
        detail: `rounds.count=${count} >= 2; park instead of a new round`,
      });
      continue;
    }

    // Fresh-reading gate: keyed off the last align-landing (`rounds.last_aligned`),
    // not the round counter — born-parked reading children never prune, so
    // `rounds.count` can stay 0 while the strategy has been aligned repeatedly.
    // Never aligned (`last_aligned` null): always fresh. Otherwise require a
    // reading strictly newer than the last align.
    const lastAligned = s.rounds?.last_aligned ?? null;
    if (lastAligned !== null) {
      if (s.reading === null) {
        events.push({
          event: "stale-reading",
          strategy: s.id,
          detail: `rounds.last_aligned set (${lastAligned}) but reading is null`,
        });
        continue;
      }
      const date = readingDate(s.reading);
      if (date === null || date <= lastAligned.slice(0, 10)) {
        events.push({
          event: "stale-reading",
          strategy: s.id,
          detail: `no reading newer than rounds.last_aligned=${lastAligned}`,
        });
        continue;
      }
    }

    candidates.push(asCandidate(false));
  }

  // --- Order -------------------------------------------------------------------
  candidates.sort((a, b) => {
    if (a.rank !== b.rank) return b.rank - a.rank;
    const ap = progressionIndex(a, byId);
    const bp = progressionIndex(b, byId);
    if (ap !== bp) return bp - ap;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  return { candidates, events };
}

/**
 * Would the graph selector emit `strategy` as an `align-tactics` candidate over
 * this store snapshot right now? True iff `strategy` appears among
 * `selectGraphTargets(nodes).candidates` as a `kind: "strategy"` candidate at
 * the derived `align-tactics` rung — covering both a fresh align-arm-eligible
 * strategy and the one queued soft-freeze re-evaluation session.
 *
 * The selector is the single source of truth for align-selectability (single-
 * callsite doctrine): this helper is membership in its output, never a re-
 * implementation of its per-strategy gates (child/signal/rounds/freeze). The
 * worker-start re-validation gate (`check-node-selection.ts`) calls it so a
 * strategy selected at `align-tactics` re-validates against exactly the
 * selector's current verdict, closing the `null !== "align-tactics"` literal-
 * equality regression that exit-12'd every strategy.
 *
 * `office_hours` gating is intentionally in scope (a parked strategy is not
 * emitted), but the gate applies its dedicated not-parked check first, so in
 * practice this is only reached for an unparked node.
 */
export function strategyAlignSelectable(strategy: IntentionNode, nodes: IntentionNode[]): boolean {
  return selectGraphTargets(nodes).candidates.some(
    (c) => c.id === strategy.id && c.kind === "strategy" && c.phase === "align-tactics",
  );
}

/**
 * The strategy's highest-ranked eligible FROZEN descendant, or null
 * (tactic-graph-frozen-tactic-dispatch). A frozen descendant is a tactic that
 * (a) counts `strategy.id` among its `servingStrategyIds` (serves/parent-chain
 * membership) and (b) the selector emits as a `kind: "tactic",
 * phase: "align-tactics"` candidate — i.e. a draft/raw or soft-frozen tactic
 * with office_hours null and complete blockers.
 *
 * The selector is the single source of truth: this walks its ALREADY-SORTED
 * candidate list (rank desc, progression ordinal desc, id asc) and returns the
 * node behind the first qualifying candidate, so ranking/tiebreaks match the
 * real selection exactly. Returns null for a zero-tactic strategy or one whose
 * descendants are all non-frozen.
 */
export function resolveFrozenDescendant(
  strategy: IntentionNode,
  nodes: IntentionNode[],
): IntentionNode | null {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const c of selectGraphTargets(nodes).candidates) {
    if (c.kind !== "tactic" || c.phase !== "align-tactics") continue;
    const node = byId.get(c.id);
    if (node === undefined) continue;
    if (!servingStrategyIds(node, byId).has(strategy.id)) continue;
    return node;
  }
  return null;
}

/**
 * Would the graph selector emit `tactic` as an `align-tactics` candidate over
 * this store snapshot right now? True iff `tactic` appears among
 * `selectGraphTargets(nodes).candidates` as a `kind: "tactic"` candidate at the
 * directive `align-tactics` rung — the frozen-tactic (draft/raw or soft-frozen)
 * analog of `strategyAlignSelectable`.
 *
 * The selector is the single source of truth for frozen-tactic selectability
 * (single-callsite doctrine): this is membership in its output, never a
 * re-implementation of its per-tactic gates (draft/soft-freeze/office_hours/
 * blockers). The worker-start re-validation gate calls it so a tactic selected
 * at `align-tactics` re-validates against exactly the selector's current
 * verdict.
 */
export function frozenTacticSelectable(tactic: IntentionNode, nodes: IntentionNode[]): boolean {
  return selectGraphTargets(nodes).candidates.some(
    (c) => c.id === tactic.id && c.kind === "tactic" && c.phase === "align-tactics",
  );
}
