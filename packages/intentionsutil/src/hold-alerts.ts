// hold-alerts — "which manual holds have been sitting unclaimed in the
// office-hours queue, while blocking something the graph says is important?"
//
// Pure: no filesystem, git, network, or daemon access. The whole decision is
// made from the `nodes` array handed in, so it is offline-testable with
// in-memory fixtures — and, because it composes existing primitives rather than
// re-deriving them, it inherits their invariants for free.
//
// Composition:
//   1. `listHoldCandidates` (./hold-sweep.ts) enumerates and classifies holds.
//      Alerting keeps only `cls === "manual"` — the holds with no
//      machine-checkable re-check predicate (`KIND_RECHECK[kind].policy ===
//      "manual"`), i.e. the ones that stay parked until a human or a dedicated
//      session picks them up. The set is DERIVED from KIND_RECHECK and is
//      deliberately not enumerated here, so a new manual kind surfaces in
//      alerting without an edit to this comment.
//      Reusing it as-is is what binds alerting to the canonical hold id, drops
//      holds whose source is gone, and drops holds whose `blocked_by` edge has
//      already cleared.
//   2. `resolveAttention` (./attention.ts), called exactly once, supplies the
//      `RankKey` quadruple `(tier, band, score, depth)` of the blocked source.
//   3. Age comes from the hold's own `office_hours.since`.

import { compareRankKeyDesc, resolveAttention, type RankKey } from "./attention.js";
import { listHoldCandidates } from "./hold-sweep.js";
import type { HoldKind } from "./holds.js";
import type { IntentionNode } from "./schema.js";

/** One manual hold that has gone unclaimed long enough to be worth surfacing. */
export interface UnclaimedHoldAlert {
  holdId: string;
  sourceId: string;
  kind: HoldKind;
  ageSeconds: number;
  sourceTier: number;
  /** The blocked source's `band` — the best score among its parents, in its tier. */
  sourceBand: number;
  /** The blocked source's own per-tier `score`. */
  sourceScore: number;
}

export interface HoldAlertOpts {
  /** The clock the age is measured against. */
  now: Date;
  /** Minimum age (inclusive) before a hold is alertable. */
  minAgeSeconds: number;
  /** How many top-ranked live nodes count as "important" for the source gate. */
  topK: number;
}

/**
 * List the manual-policy holds that have been unclaimed for at least
 * `opts.minAgeSeconds` while blocking a source in the graph's top `opts.topK`.
 *
 * Pure — see the module header.
 *
 * **Age.** Measured from the hold node's `office_hours.since` (a `YYYY-MM-DD`
 * `requireDateString`, `schema.ts:505-511`), as
 * `floor((opts.now - since) / 1000)`. That field is the right clock precisely
 * because `decideHold` (`scripts/hold-node-decide.ts:166-170`) deliberately does
 * NOT refresh `since` on a repeat occurrence — "its age is the signal". And
 * because `since` is durable graph state, this predicate needs no cross-pass
 * state file: two passes over the same graph agree without remembering anything.
 *
 * A manual-class hold with `office_hours === null` is NEVER emitted, and its
 * missing `since` is never coerced to age 0. Such a hold is structurally
 * possible — the terminal test at `hold-sweep.ts:127` requires `phase === "done"`
 * AND `office_hours === null`, so an unparked, not-yet-done hold classifies
 * `manual` — but it is not sitting in the office-hours queue at all, and
 * "unclaimed in the queue" is not a statement about it.
 *
 * **Top-K gate.** The pool is every node that is eligible (present in
 * `resolveAttention`'s map — that map holds exactly the goal-layer-eligible
 * nodes, per the `kind-<k>.attributes.goal_layer` test), live (`phase !==
 * "done"`), and unparked (`office_hours === null`). Their `RankKey` quadruples
 * are sorted with the shared `compareRankKeyDesc` and the Kth entry is the
 * cutoff; a candidate is emitted only when its source's key is at or above it —
 * `compareRankKeyDesc(rank, cutoff) <= 0`, since that comparator is descending,
 * so "sorts no later than the cutoff" IS "ranks at or above it". With fewer than
 * K such nodes there is no cutoff and every source qualifies.
 *
 * Top-K rather than an absolute score floor on purpose: resolved scores drift as
 * the graph changes, so an absolute floor needs periodic retuning, while "is
 * this blocking one of the top K things in the graph" does not.
 *
 * A candidate whose source has no resolved attention (an ineligible source) is
 * skipped — it has no rank key to gate or report on, and by construction it is
 * not in the top-K pool either.
 *
 * @returns Alerts sorted by the source's rank key descending, then `holdId`
 *   ascending.
 */
export function listUnclaimedHoldAlerts(
  nodes: IntentionNode[],
  opts: HoldAlertOpts,
): UnclaimedHoldAlert[] {
  // top-K of zero means zero sources are "important" — nothing can qualify.
  // (Not the same as "no cutoff": an absent cutoff below means "fewer than K
  // eligible nodes exist, so every one of them qualifies" — a positive K that
  // the pool falls short of, not a K of zero.)
  if (opts.topK <= 0) return [];

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const attention = resolveAttention(nodes);

  // The top-K pool: eligible (in the resolved map), live, unparked.
  const pool: RankKey[] = [];
  for (const node of nodes) {
    const resolved = attention.get(node.id);
    if (resolved === undefined) continue; // not goal-layer eligible
    if (node.phase === "done") continue;
    if (node.office_hours !== null) continue;
    pool.push(resolved);
  }
  pool.sort(compareRankKeyDesc);
  // Fewer than K entries ⇒ no cutoff ⇒ every source qualifies.
  const cutoff = pool.length >= opts.topK ? pool[opts.topK - 1] : null;

  // The rank key rides alongside each alert for the final sort: the emitted
  // record reports the source's tier/band/score, but ordering is the FULL
  // quadruple (depth included), so it agrees with every other consumer.
  const alerts: { alert: UnclaimedHoldAlert; rank: RankKey }[] = [];
  for (const candidate of listHoldCandidates(nodes)) {
    if (candidate.cls !== "manual") continue;

    const holdNode = byId.get(candidate.holdId);
    if (holdNode === undefined) continue; // unreachable: candidates come from `nodes`
    // Not in the office-hours queue at all — see the doc comment. Never coerced
    // to age 0.
    if (holdNode.office_hours === null) continue;

    const since = Date.parse(holdNode.office_hours.since);
    if (Number.isNaN(since)) continue;
    const ageSeconds = Math.floor((opts.now.getTime() - since) / 1000);
    if (ageSeconds < opts.minAgeSeconds) continue;

    const sourceRank = attention.get(candidate.sourceId);
    if (sourceRank === undefined) continue; // ineligible source: nothing to rank
    if (cutoff !== null && compareRankKeyDesc(sourceRank, cutoff) > 0) continue;

    alerts.push({
      alert: {
        holdId: candidate.holdId,
        sourceId: candidate.sourceId,
        kind: candidate.kind,
        ageSeconds,
        sourceTier: sourceRank.tier,
        sourceBand: sourceRank.band,
        sourceScore: sourceRank.score,
      },
      rank: sourceRank,
    });
  }

  alerts.sort((a, b) => {
    const byRank = compareRankKeyDesc(a.rank, b.rank);
    if (byRank !== 0) return byRank;
    return a.alert.holdId < b.alert.holdId ? -1 : a.alert.holdId > b.alert.holdId ? 1 : 0;
  });
  return alerts.map((a) => a.alert);
}
