import { createHash } from "node:crypto";
import { computeSignalPath, isSignalUnvalidated, resolveAttention } from "./attention.js";
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
 * The phase ladder, closest-to-done first (strategy clarification 22). Within
 * one resolved-attention rank level, candidates drain in this order; the
 * `align-tactics` rung is where eligible strategies (an `/align-tactics`
 * session) sort. `main-qa` is listed ahead of the schema's current `Phase`
 * enum adopting it (tactic-main-qa-phase owns the enum change); until then no
 * stored node can carry it, so the rung is inert.
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
   * True when this strategy candidate is the soft-freeze re-evaluation session
   * (strategy clarification 10) rather than an ordinary decomposition round.
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
  /** Eligible nodes in selection order: rank desc, phase ladder, id asc. */
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

function ladderIndex(phase: string): number {
  const idx = PHASE_LADDER.indexOf(phase);
  // An unknown phase (schema drift) sorts after every ladder rung rather than
  // throwing: the wrapper's sensor gate is the loud failure point for a phase
  // it cannot map.
  return idx === -1 ? PHASE_LADDER.length : idx;
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
 * `reading` null); fresh-reading gate (`rounds.count == 0`, or a reading dated
 * newer than `rounds.last_completed` — a reading with no parseable date fails
 * the gate and logs a `stale-reading` event); `rounds.count < 2` (at the cap a
 * `rounds-cap` event is logged and the strategy is skipped — the park write
 * belongs to the transition writer, never to selection, which makes no graph
 * writes).
 *
 * Soft-freeze gate (strategy clarification 10): an open tactic stamped with a
 * non-null `execution.strategy_fingerprint` differing from the serving
 * strategy's current substance fingerprint freezes the subtree — its tactics
 * are excluded from selection (in-flight phases finish on their own), one
 * re-evaluation `/align-tactics` candidate is emitted for the strategy
 * (bypassing the child/signal/rounds gates; `office_hours` still applies), and
 * a `freeze` event is logged. Null fingerprints are not stale — stamping
 * starts when the align machinery lands.
 *
 * Order: resolved attention rank outermost (node-keyed, directly from
 * `resolveAttention` — the retired node↔issue rank-map bridge is not revived);
 * within a rank level the phase ladder closest-to-done first; id ascending as
 * the deterministic tiebreak.
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
  const frozenStrategyIds = new Set<string>();
  for (const s of strategies) {
    const fp = strategyFingerprint(s);
    const children = childrenOf.get(s.id) ?? [];
    const stale = children.filter(
      (t) =>
        isOpenTactic(t) &&
        t.execution !== null &&
        t.execution.strategy_fingerprint !== null &&
        t.execution.strategy_fingerprint !== fp,
    );
    if (stale.length === 0) continue;
    frozenStrategyIds.add(s.id);
    for (const t of children) frozenTacticIds.add(t.id);
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

    if (frozenStrategyIds.has(s.id)) {
      // The one queued re-evaluation session for a frozen subtree.
      candidates.push(asCandidate(true));
      continue;
    }

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

    // Fresh-reading gate: a first round is always fresh; a later round needs a
    // reading newer than the last completed round.
    if (count > 0) {
      const last = s.rounds?.last_completed ?? null;
      if (s.reading === null) {
        events.push({
          event: "stale-reading",
          strategy: s.id,
          detail: `rounds.count=${count} but reading is null`,
        });
        continue;
      }
      if (last !== null) {
        const date = readingDate(s.reading);
        if (date === null || date <= last.slice(0, 10)) {
          events.push({
            event: "stale-reading",
            strategy: s.id,
            detail: `no reading newer than rounds.last_completed=${last}`,
          });
          continue;
        }
      }
    }

    candidates.push(asCandidate(false));
  }

  // --- Order -------------------------------------------------------------------
  candidates.sort((a, b) => {
    if (a.rank !== b.rank) return b.rank - a.rank;
    const al = ladderIndex(a.phase);
    const bl = ladderIndex(b.phase);
    if (al !== bl) return al - bl;
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
