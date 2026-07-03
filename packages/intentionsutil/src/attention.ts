import { IntentionSchemaError } from "./errors.js";
import type { IntentionNode } from "./schema.js";

// --- Types -------------------------------------------------------------------

/** The derived attention (rank) of one eligible node. Computed on read, NEVER stored. */
export interface ResolvedAttention {
  /** The node's rank — the sum of its own outgoing source set's amounts. */
  value: number;
  /**
   * Ids of the source nodes whose authored boosts/overrides contribute to this
   * node's rank, ordered by contribution (largest first, id ascending on ties)
   * — for explainability ("via strategy-x").
   */
  sources: string[];
}

// --- Resolver ------------------------------------------------------------------

/**
 * Resolve derived attention (rank) for every goal-layer node in the graph.
 *
 * Pure and deterministic: same nodes in, deep-equal map out. Derived values are
 * never written back to node frontmatter — same discipline as `trackers/`
 * (execution state) vs `intentions/` (intent).
 *
 * v2 model — additive source sets, undecayed and undiluted. See the
 * clarifications on `intentions/strategy-graph-drives-dispatch.md` for the
 * decision record (supersedes the same-day v1 conserved-flow / banded design
 * after the 2026-07-02 scenario interview).
 *
 * Each node accumulates an OUTGOING source set: a `Map<sourceId, amount>`. Rank
 * flows DOWN `parent` + `serves` edges without decay or dilution — a child
 * inherits an ancestor's full claim regardless of depth or sibling count ("hot
 * means hot"). Each authored source counts once per node (set union dedupes by
 * source id, so diamonds don't double-count; genuinely serving two strategies
 * adds both).
 *
 * Algorithm (memoized DFS per node):
 *   1. Eligible set — nodes whose kind node sets `attributes.goal_layer: true`.
 *      All other nodes get no result entry (but can still pass a source through,
 *      e.g. a virtue root relaying nothing).
 *   2. Incoming — the union (by source id) over the node's distributors of each
 *      distributor's outgoing set. A distributor is the node's `parent` (if it
 *      resolves) plus, for eligible nodes, each `serves` target that resolves.
 *      Amounts for the same source id are identical by construction (undiluted),
 *      so the union is a plain overwrite.
 *   3. Outgoing —
 *        - `attention.override` present → `{(self, override)}` (incoming
 *          discarded; the override CAPS this branch — a descendant reachable
 *          only through this node reads the capped value, but a descendant's
 *          OTHER parents still contribute their own claims);
 *        - else `attention.boost` present → incoming ∪ `{(self, boost)}`;
 *        - else → incoming.
 *   4. rank(node) = sum of the node's OWN outgoing set's amounts (for an
 *      override node, exactly the override value).
 *   5. Cycle guard — a `parent`/`serves` cycle surfaces as an
 *      IntentionSchemaError listing the cycle path.
 *
 * Rank 0 is the neutral baseline: with no injections anywhere every eligible
 * node resolves to value 0 with no sources.
 */
export function resolveAttention(nodes: IntentionNode[]): Map<string, ResolvedAttention> {
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const isEligible = (n: IntentionNode): boolean => {
    const kindNode = byId.get(`kind-${n.kind}`);
    return kindNode !== undefined && kindNode.attributes.goal_layer === true;
  };

  // Distribution edges. distributors(c) = { c.parent } ∪ (eligible c only)
  // { c.serves }, each restricted to ids that resolve. Sorted for determinism.
  const distributors = (c: IntentionNode): IntentionNode[] => {
    const ids = new Set<string>();
    if (c.parent !== null && byId.has(c.parent)) ids.add(c.parent);
    if (isEligible(c)) {
      for (const s of c.serves) {
        if (byId.has(s)) ids.add(s);
      }
    }
    return [...ids].sort().map((id) => byId.get(id) as IntentionNode);
  };

  // Outgoing source set per node, memoized DFS with cycle detection.
  const outgoing = new Map<string, Map<string, number>>();
  const onStack = new Set<string>();
  const stackPath: string[] = [];

  const compute = (n: IntentionNode): Map<string, number> => {
    const memo = outgoing.get(n.id);
    if (memo !== undefined) return memo;
    if (onStack.has(n.id)) {
      const cycle = [...stackPath.slice(stackPath.indexOf(n.id)), n.id];
      throw new IntentionSchemaError(`attention flow cycle: ${cycle.join(" -> ")}`);
    }
    onStack.add(n.id);
    stackPath.push(n.id);

    // Union incoming from all distributors. We ALWAYS walk distributors — even
    // for an override node whose incoming is discarded — so the cycle guard
    // sees every edge (traverse-and-discard).
    const incoming = new Map<string, number>();
    for (const d of distributors(n)) {
      for (const [src, amt] of compute(d)) {
        incoming.set(src, amt); // dedupe by src; amounts identical (undiluted)
      }
    }

    const attention = isEligible(n) ? n.attention : null;
    let out: Map<string, number>;
    if (attention !== null && attention.override !== null) {
      out = new Map([[n.id, attention.override]]); // cap: incoming discarded
    } else {
      if (attention !== null && attention.boost !== null) {
        incoming.set(n.id, attention.boost); // relative claim added
      }
      out = incoming;
    }

    onStack.delete(n.id);
    stackPath.pop();
    outgoing.set(n.id, out);
    return out;
  };

  // Iterate in id order for a deterministic result regardless of input order.
  const sorted = [...nodes].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const eligible = sorted.filter(isEligible);
  for (const n of eligible) compute(n);

  const result = new Map<string, ResolvedAttention>();
  for (const n of eligible) {
    const out = compute(n);
    let value = 0;
    for (const amt of out.values()) value += amt;
    const sources = [...out.entries()]
      .sort((a, b) => (a[1] !== b[1] ? b[1] - a[1] : a[0] < b[0] ? -1 : 1))
      .map(([src]) => src);
    result.set(n.id, { value, sources });
  }
  return result;
}
