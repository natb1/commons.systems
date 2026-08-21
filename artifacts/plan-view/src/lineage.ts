import type { IntentionNode, ResolvedAttention } from "@commons-systems/intentionsutil";
import type { Lane, LaneKind, SourceContribution } from "./model.js";

/**
 * How many spine columns the table renders. The rest of a row's ancestry falls
 * to the gutter lanes.
 *
 * Two, not "all": rowspan nesting requires a LAMINAR family (any two blocks
 * nested or disjoint), which only holds along a path. Each extra column
 * multiplies the tie-fragmentation the node body warns about, and the third
 * contributor is almost never what set the row's rank.
 */
export const SPINE_DEPTH = 2;

/**
 * A node's OWN authored injection — the amount it contributes to every
 * descendant that inherits it.
 *
 * This is the value `resolveAttention`'s authored term seeds a node's outgoing
 * set with: `boosts[T]` ADDS `(self, boosts[T])` to the inherited union for the
 * tier being ranked. The amount keyed by this node in any descendant's source
 * map is exactly the number returned here — so a descendant's per-ancestor
 * contribution is recoverable from the public `sources` list without
 * re-deriving the fixpoint.
 *
 * The read is PER-TIER and must stay that way. `attention.boosts` is a sparse
 * map keyed by tier ("1"|"2"|"3"), and per-tier boosts ARE the tier isolation
 * the rank model depends on: in tier 2's ranking only `boosts["2"]` is ever
 * read (`packages/intentionsutil/src/attention.ts:416-419`, and the canonical
 * read at `:592`). Collapsing the map — summing it, or taking its max — would
 * leak one tier's authored weight into another's ranking and silently
 * contradict `resolveAttention`, whose `sources` this function must agree with.
 */
export function authoredAmount(node: IntentionNode | undefined, tier: number): number {
  const attention = node?.attention;
  if (attention === null || attention === undefined) return 0;
  return attention.boosts[String(tier)] ?? 0;
}

/**
 * A row's distinct ancestor contributions, largest first, id ascending on ties.
 *
 * `ResolvedAttention.sources` is already "ordered by contribution (largest
 * first, id ascending on ties)" and is already DEDUPLICATED and TRANSITIVE —
 * the authored term unions each distributor's whole outgoing set upward, so one
 * ancestor reachable by two routes appears once. That makes it the
 * deduplicated lineage sum the greenfield rank model describes, available today
 * from the public API. The amounts are re-read here rather than re-derived.
 */
export function sourceContributions(
  resolved: ResolvedAttention,
  byId: Map<string, IntentionNode>,
): SourceContribution[] {
  return resolved.sources
    .filter((id) => id !== undefined)
    .map((id) => ({ id, amount: authoredAmount(byId.get(id), resolved.tier) }));
}

/**
 * The row's band spine — its highest-contributing ancestors, root-most first.
 *
 * Spines are PATHS through the contribution ordering, so two rows sharing a top
 * contributor share their first spine cell and the blocks nest exactly. A row
 * whose own id appears in its sources (its own boost) is not its own ancestor
 * and is dropped.
 *
 * Caveat carried from `tactic-plan-view-table`: contiguity holds on the
 * contribution VALUE, not on the ancestor node — distinct ancestors injecting
 * equal amounts share a block, and blocks fragment on ties.
 */
export function bandSpine(rowId: string, sources: SourceContribution[]): string[] {
  return sources
    .filter((s) => s.id !== rowId && s.amount > 0)
    .slice(0, SPINE_DEPTH)
    .map((s) => s.id);
}

/**
 * The row's DIRECT parent-relation edges, typed by lane kind.
 *
 * The relation is the greenfield one recorded on
 * `tactic-attention-namespaced-rank`: `parent`, everything the node `serves`,
 * every delegation it `recovers`, and every node listing it in `blocked_by`
 * (reverse). Only DIRECT edges become lanes — a lane says "this row hangs off
 * that ancestor", which is a statement about an edge, not about reachability.
 *
 * Hue encodes KIND (three fixed categorical slots), never ancestor identity:
 * there are 57 strategies and 22 delegations in the live store, and `/dataviz`
 * forbids generating a 9th categorical hue. Identity rides on lane position,
 * label and hover instead.
 */
export function laneEdges(
  node: IntentionNode,
  byId: Map<string, IntentionNode>,
  reverseBlockers: Map<string, string[]>,
  spine: string[],
): Lane[] {
  const onSpine = new Set(spine);
  const lanes = new Map<string, LaneKind>();

  const add = (id: string, kind: LaneKind): void => {
    if (id === node.id || onSpine.has(id) || !byId.has(id)) return;
    // A first-wins map, not last-wins: `blocker` is the most specific claim a
    // lane can make about an edge and must not be overwritten by a later
    // `strategy` reading of the same id.
    if (!lanes.has(id)) lanes.set(id, kind);
  };

  // Reverse `blocked_by` only — the nodes that list THIS one as their blocker.
  // Those are its parents under the recorded relation. Its own `blocked_by`
  // entries are its blockers, which are descendants of it in this relation and
  // are already named by the `blocked` chip and the typed unavailable reason.
  for (const blocked of reverseBlockers.get(node.id) ?? []) add(blocked, "blocker");
  for (const id of node.recovers) add(id, "delegation");
  if (node.parent !== null) add(node.parent, "strategy");
  for (const id of node.serves) add(id, "strategy");

  return [...lanes].map(([id, kind]) => ({ id, kind }));
}

/** Reverse `blocked_by`: blocker id → the ids of the nodes it blocks. */
export function reverseBlockerIndex(nodes: IntentionNode[]): Map<string, string[]> {
  const reverse = new Map<string, string[]>();
  for (const node of nodes) {
    for (const blocker of node.blocked_by) {
      const list = reverse.get(blocker);
      if (list) list.push(node.id);
      else reverse.set(blocker, [node.id]);
    }
  }
  return reverse;
}
