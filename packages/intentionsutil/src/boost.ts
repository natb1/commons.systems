import { resolveAttention } from "./attention.js";
import { IntentionSchemaError } from "./errors.js";
import { selectGraphTargets } from "./router.js";
import { dominantMainHealthBoost, kindIsNotGoalLayer } from "./schema.js";
import type { IntentionNode } from "./schema.js";

// Boost planner (tactic-attention-boost-scripts).
//
// Answers one question an author cannot answer by eyeballing the store: what
// OWN `attention.boost` must node X carry so that it tops the selector's
// candidate list (or reaches a named composed rank)?
//
// The trap this exists to close: the frontier view shows each node's COMPOSED
// rank while `intentions/*.md` records each node's OWN authored boost, and the
// two differ whenever a node inherits claims (down `parent`/`serves`, backward
// along `blocked_by`). Copying an incumbent's authored `boost:` value is
// therefore mis-sized in both directions — it overshoots when the target
// inherits more than the incumbent, and undershoots when it inherits less.
// This module sizes the boost against the RESOLVED ranks, by probing the real
// resolver and the real selector rather than re-deriving either.
//
// Read-only and pure: it never writes a node. The caller decides what to do
// with the plan.

// --- Types -------------------------------------------------------------------

/** One row of the ranking table shown to the author. */
export interface RankRow {
  id: string;
  kind: "strategy" | "tactic";
  /** `GraphCandidate.phase` — the directive rung the selector would dispatch. */
  phase: string;
  /** Composed rank from `resolveAttention`. */
  rank: number;
  /** The node's OWN authored boost, for contrast with `rank`. */
  own_boost: number | null;
  own_override: number | null;
  /** Main-health-derived: not part of the top-rank contest. */
  exempt: boolean;
}

export type BoostMode =
  | { kind: "top-candidate" } // beat every non-exempt selector candidate
  | { kind: "rank"; value: number }; // reach at least this composed rank

export interface BoostPlan {
  target: string;
  /** The target appears in `selectGraphTargets()`'s candidate list. */
  target_is_candidate: boolean;
  /** Resolved rank today; null when the target is not goal-layer-eligible. */
  target_current_rank: number | null;
  /** Full candidate list in selector order (rank desc, …), not truncated. */
  ranking: RankRow[];
  /** Highest-ranked non-exempt candidate other than the target. */
  incumbent: RankRow | null;
  /** MINIMAL own-boost meeting the mode, or null when unreachable. */
  recommended_boost: number | null;
  /** The target's composed rank at `recommended_boost`. */
  resulting_rank: number | null;
  /** `strategy-main-health`'s live boost (rule 18's threshold), or null. */
  ceiling: number | null;
  /** `recommended_boost >= ceiling` — the author must ACK rule 18. */
  needs_ack: boolean;
  /** Set iff `recommended_boost` is null. */
  unreachable_reason: string | null;
}

// --- Constants ---------------------------------------------------------------

const MAIN_HEALTH_ID = "strategy-main-health";

/** Default upper search bound when there is no live rule-18 ceiling. */
const DEFAULT_MAX_BOOST = 1000;

/** Rank comparisons are on floats (the capture term is fractional). */
const EPSILON = 1e-9;

// --- Planner -----------------------------------------------------------------

/**
 * Plan the minimal own `attention.boost` for `targetId` under `mode`.
 *
 * Throws `IntentionSchemaError` for an unknown id, a non-goal-layer target
 * (validateGraph rule 5: `attention` is goal-layer-only), or a failed
 * monotonicity self-check (see the binary-search comment below).
 */
export function planBoost(
  nodes: IntentionNode[],
  targetId: string,
  mode: BoostMode,
  opts?: { includeExempt?: boolean; maxBoost?: number },
): BoostPlan {
  const includeExempt = opts?.includeExempt ?? false;
  const maxBoost = opts?.maxBoost ?? DEFAULT_MAX_BOOST;

  const byId = new Map(nodes.map((n) => [n.id, n]));

  // 1. Unknown id — a clear error, never a fallback.
  const target = byId.get(targetId);
  if (target === undefined) {
    throw new IntentionSchemaError(`boost: no node with id "${targetId}" in the graph`);
  }

  // 2. Attention is goal-layer-only (validateGraph rule 5). Reuse the single
  //    gate definition rather than re-deriving `kind-<kind>.attributes.goal_layer`.
  if (kindIsNotGoalLayer(target.kind, byId)) {
    throw new IntentionSchemaError(
      `boost: "${targetId}" has kind "${target.kind}", which is not a goal-layer kind — ` +
        `attention is only valid on goal-layer kinds (validateGraph rule 5), so no boost applies`,
    );
  }

  // 3. The selector and the resolver are the authoritative sources for the
  //    candidate list, its ordering, and every node's composed rank.
  const baseSelection = selectGraphTargets(nodes);
  const baseAttention = resolveAttention(nodes);

  // 4. Main-health exemption: main-health and its subtree are the always-on
  //    trunk-health signal, not discretionary work, so "top ranking" means #1
  //    BELOW main-health. A candidate is exempt when it IS main-health or when
  //    its resolved `sources` carry main-health's claim. `includeExempt` drops
  //    the exemption from the contest (the flag itself still reports the
  //    main-health derivation).
  const isExempt = (id: string): boolean =>
    id === MAIN_HEALTH_ID || (baseAttention.get(id)?.sources.includes(MAIN_HEALTH_ID) ?? false);
  const contested = (id: string): boolean =>
    id !== targetId && (includeExempt || !isExempt(id));

  const ranking: RankRow[] = baseSelection.candidates.map((c) => {
    const node = byId.get(c.id);
    return {
      id: c.id,
      kind: c.kind,
      phase: c.phase,
      rank: c.rank,
      own_boost: node?.attention?.boost ?? null,
      own_override: node?.attention?.override ?? null,
      exempt: isExempt(c.id),
    };
  });

  const targetIsCandidate = baseSelection.candidates.some((c) => c.id === targetId);
  const targetCurrentRank = baseAttention.get(targetId)?.value ?? null;
  // `ranking` is already in selector order, so the first contested row is the
  // incumbent.
  const incumbent = ranking.find((r) => contested(r.id)) ?? null;

  // 5. Rule-18 ceiling, read live from the graph.
  const ceiling = dominantMainHealthBoost(nodes);

  // 6. Probe: re-resolve the graph with the target's attention replaced by the
  //    candidate own-boost. `rationale` is never empty — the schema requires a
  //    non-empty string and `validateAttention` is the gate — so an absent one
  //    is filled with a placeholder that never reaches the store.
  const probeRationale =
    target.attention !== null && target.attention.rationale !== ""
      ? target.attention.rationale
      : "boost-planner probe";
  const probeCache = new Map<number, { rank: number; tops: boolean }>();
  const probe = (b: number): { rank: number; tops: boolean } => {
    const cached = probeCache.get(b);
    if (cached !== undefined) return cached;
    const probed = nodes.map((n) =>
      n.id === targetId
        ? { ...n, attention: { boost: b, override: null, rationale: probeRationale } }
        : n,
    );
    const attention = resolveAttention(probed);
    const rank = attention.get(targetId)?.value ?? 0;
    const candidates = selectGraphTargets(probed).candidates;
    const present = candidates.some((c) => c.id === targetId);
    const tops =
      present && candidates.every((c) => !contested(c.id) || rank > c.rank + EPSILON);
    const result = { rank, tops };
    probeCache.set(b, result);
    return result;
  };

  const meetsMode = (b: number): boolean =>
    mode.kind === "top-candidate" ? probe(b).tops : probe(b).rank >= mode.value - EPSILON;

  // 7. Minimal `b` by integer binary search.
  //
  //    Why binary search is sound here: a boost `b` on X adds the single claim
  //    `(X, b)` to X's outgoing set, and that claim flows to exactly the same
  //    set of distributees at every `b` (the flow relation — parent/serves/
  //    blocked_by — does not depend on the amount). So each node's composed
  //    rank is either constant in `b` or rises by exactly `b`; every
  //    peer-minus-target difference is therefore monotone non-decreasing in
  //    `b`, which makes both `tops` and "rank >= value" monotone predicates.
  //
  //    That argument depends on `resolveAttention`'s CURRENT flow model, which
  //    may still change — so the search self-checks its answer below instead of
  //    trusting the property. A failed self-check throws; it must never
  //    silently return a wrong minimum.
  const searchMinimal = (lo: number, hi: number): number | null => {
    if (hi < lo) return null;
    if (!meetsMode(hi)) return null;
    let low = lo;
    let high = hi;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (meetsMode(mid)) high = mid;
      else low = mid + 1;
    }
    // Self-check the monotonicity assumption at the boundary.
    if (!meetsMode(low) || (low > lo && meetsMode(low - 1))) {
      throw new IntentionSchemaError(
        `boost: non-monotone attention response around boost ${low} for "${targetId}" — ` +
          `binary search cannot size a minimal boost on this graph (the flow model ` +
          `no longer guarantees monotonicity; size the boost by hand)`,
      );
    }
    return low;
  };

  const finish = (
    recommended: number | null,
    unreachableReason: string | null,
  ): BoostPlan => ({
    target: targetId,
    target_is_candidate: targetIsCandidate,
    target_current_rank: targetCurrentRank,
    ranking,
    incumbent,
    recommended_boost: recommended,
    resulting_rank: recommended === null ? null : probe(recommended).rank,
    ceiling,
    needs_ack: recommended !== null && ceiling !== null && recommended >= ceiling,
    unreachable_reason: unreachableReason,
  });

  // A node the selector does not emit can never BE the top candidate, no matter
  // its rank — say so instead of searching. (Rank mode is still well-defined:
  // ranks are resolved for every goal-layer node, candidate or not.)
  if (mode.kind === "top-candidate" && !targetIsCandidate) {
    return finish(
      null,
      `"${targetId}" is not in the selector's candidate list (selectGraphTargets omits it — ` +
        `e.g. parked via office_hours, at phase draft/done, or held by an open blocker), ` +
        `so no boost can make it the top candidate`,
    );
  }

  // `hi` stays strictly BELOW the rule-18 ceiling on the first pass, so the
  // ordinary answer never needs an ACK. `hi < 1` (ceiling 1) means there is no
  // candidate boost below the ceiling at all — fall straight through to the
  // ceiling re-search.
  const hi = ceiling !== null ? ceiling - 1 : maxBoost;
  const belowCeiling = hi >= 1 ? searchMinimal(1, hi) : null;
  if (belowCeiling !== null) return finish(belowCeiling, null);

  // 8. Nothing below the ceiling works. Re-search AT and above it; the caller
  //    decides whether the author acknowledges rule 18.
  if (ceiling !== null) {
    const atCeiling = searchMinimal(ceiling, ceiling * 10);
    if (atCeiling !== null) return finish(atCeiling, null);
  }

  // Still nothing. Name WHY, distinguishing the two real causes.
  const searchedTo = ceiling !== null ? ceiling * 10 : maxBoost;
  // Only the top-candidate contest can be blocked structurally: a named rank is
  // a pure threshold on the target's own value, which rises with every boost,
  // so its only failure mode is the search bound.
  const blockers =
    mode.kind === "top-candidate"
      ? constantDeltaPeers(
          probe,
          ranking,
          contested,
          targetId,
          nodes,
          probeRationale,
          searchedTo,
        )
      : [];
  if (blockers.length > 0) {
    const detail = blockers.map((p) => `${p.id} (+${round(p.delta)})`).join(", ");
    return finish(
      null,
      `no boost can top the list: ${detail} receive "${targetId}"'s own claim through the ` +
        `attention flow (they sit in its subtree via parent/serves, or it lists them in ` +
        `blocked_by), so they rise with every boost and stay ahead by a constant margin`,
    );
  }
  return finish(
    null,
    mode.kind === "top-candidate"
      ? `no boost up to ${searchedTo} tops the candidate list — raise the search bound (maxBoost)`
      : `no boost up to ${searchedTo} reaches rank ${mode.value} — raise the search bound (maxBoost)`,
  );
}

// --- Unreachability diagnosis -------------------------------------------------

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Peers that stay ahead of the target by the SAME margin at two very different
 * boosts — i.e. they receive the target's own claim and rise with it. These are
 * the structural blockers (cause (a)); an empty list means the search simply
 * hit its bound (cause (b)).
 */
function constantDeltaPeers(
  probe: (b: number) => { rank: number },
  ranking: RankRow[],
  contested: (id: string) => boolean,
  targetId: string,
  nodes: IntentionNode[],
  probeRationale: string,
  hi: number,
): { id: string; delta: number }[] {
  const rankOfPeersAt = (b: number): Map<string, number> => {
    const probed = nodes.map((n) =>
      n.id === targetId
        ? { ...n, attention: { boost: b, override: null, rationale: probeRationale } }
        : n,
    );
    const attention = resolveAttention(probed);
    return new Map([...attention].map(([id, a]) => [id, a.value]));
  };

  const lowBoost = 1;
  const highBoost = Math.max(2, hi);
  const low = rankOfPeersAt(lowBoost);
  const high = rankOfPeersAt(highBoost);
  const targetLow = probe(lowBoost).rank;
  const targetHigh = high.get(targetId) ?? 0;

  const result: { id: string; delta: number }[] = [];
  for (const row of ranking) {
    if (!contested(row.id)) continue;
    const deltaLow = (low.get(row.id) ?? 0) - targetLow;
    const deltaHigh = (high.get(row.id) ?? 0) - targetHigh;
    if (deltaHigh >= -EPSILON && Math.abs(deltaLow - deltaHigh) < EPSILON) {
      result.push({ id: row.id, delta: deltaHigh });
    }
  }
  return result;
}
