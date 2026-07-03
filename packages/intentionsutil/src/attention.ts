import { IntentionSchemaError } from "./errors.js";
import type { IntentionNode } from "./schema.js";

// --- Judgment constants ------------------------------------------------------
// All four are JUDGMENT CONSTANTS reviewed at office-hours, not fitted
// parameters. The resolver deliberately has only two signal terms (injection
// and provenance) — every added weight is a free parameter someone will one
// day defend.

/**
 * Multiplier on an injection whose node cannot trace a `serves`/`parent` chain
 * to any virtue. Own-virtue-justified work outranks work justified only by
 * delegatee-grafted constraints.
 */
export const PROVENANCE_DISCOUNT = 0.5;

/**
 * Multiplier on an injection whose node declares `subordinate_to`. Applied
 * unconditionally while the edge exists — removing the edge is the human
 * review act that lifts the damping.
 */
export const SUBORDINATION_DAMP = 0.25;

/**
 * A node is `top` band when its flow is at least this multiple of the mean
 * nonzero flow across eligible nodes.
 */
export const BAND_HIGH = 4;

/**
 * A node is `bottom` band when its flow is at most this fraction of the mean
 * nonzero flow across eligible nodes (or exactly zero while any injection
 * exists anywhere).
 */
export const BAND_LOW = 0.25;

// --- Types -------------------------------------------------------------------

export type AttentionBand = "top" | "middle" | "bottom";

/** The derived attention of one eligible node. Computed on read, NEVER stored. */
export interface ResolvedAttention {
  /** The node's retained flow — its rank value. Scale-free; only ratios matter. */
  value: number;
  /** Coarse cut of `value` consumed by routers; floats never leave this module's callers. */
  band: AttentionBand;
  /**
   * Ids of the nodes whose authored injections contributed to this flow,
   * ordered by contribution (largest first, id ascending on ties) — for
   * explainability ("via strategy-x").
   */
  sources: string[];
}

// --- Resolver ------------------------------------------------------------------

/**
 * Resolve derived attention for every goal-layer node in the graph.
 *
 * Pure and deterministic: same nodes in, deep-equal map out. Derived values
 * are never written back to node frontmatter — same discipline as `trackers/`
 * (execution state) vs `intentions/` (intent).
 *
 * Algorithm (two signal terms only):
 *   1. Eligible set — nodes whose kind node sets `attributes.goal_layer: true`.
 *      All other nodes get no entry.
 *   2. Injection — `attention.weight`, multiplied by the provenance factor
 *      (1 when the `serves` ∪ `parent` chain reaches a virtue, else
 *      PROVENANCE_DISCOUNT) and by SUBORDINATION_DAMP when `subordinate_to`
 *      is non-empty.
 *   3. Flow — conserved distribution: a node's flow is its damped injection
 *      plus its inherited share; a node with children passes its full flow
 *      divided evenly among them (sub-nodes via `parent`, plus eligible nodes
 *      that name it in `serves`) while retaining the flow value as its own
 *      rank. A `parent`/`serves` cycle is surfaced as an IntentionSchemaError
 *      listing the cycle path.
 *   4. Banding — scale-invariant against the mean of nonzero flows. When no
 *      injections exist anywhere, every eligible node is `middle` (the
 *      pre-attention status quo: nothing escalated, nothing suppressed).
 */
export function resolveAttention(nodes: IntentionNode[]): Map<string, ResolvedAttention> {
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const isEligible = (n: IntentionNode): boolean => {
    const kindNode = byId.get(`kind-${n.kind}`);
    return kindNode !== undefined && kindNode.attributes.goal_layer === true;
  };

  // Provenance: walk `serves` ∪ `parent` transitively upward looking for a
  // virtue. Memoized per node; a visited set guards against revisits (and
  // makes the walk total even on a cyclic graph — the cycle error below is
  // the authoritative guard).
  const reachesVirtue = (start: IntentionNode): boolean => {
    const visited = new Set<string>();
    const stack = [start];
    while (stack.length > 0) {
      const n = stack.pop();
      if (n === undefined || visited.has(n.id)) continue;
      visited.add(n.id);
      if (n.kind === "virtue") return true;
      const next = n.parent === null ? [...n.serves] : [...n.serves, n.parent];
      for (const id of next) {
        const target = byId.get(id);
        if (target !== undefined) stack.push(target);
      }
    }
    return false;
  };

  // Damped injection per eligible node.
  const injection = (n: IntentionNode): number => {
    if (!isEligible(n) || n.attention === null) return 0;
    const provenance = reachesVirtue(n) ? 1 : PROVENANCE_DISCOUNT;
    const damp = n.attention.subordinate_to.length > 0 ? SUBORDINATION_DAMP : 1;
    return n.attention.weight * provenance * damp;
  };

  // Distribution edges. children(s) = { nodes with parent === s.id } ∪
  // { eligible nodes with s.id ∈ serves }; a child's distributors are the
  // reverse view of the same definition.
  const childCount = new Map<string, number>();
  for (const c of nodes) {
    const drawsFrom = new Set<string>();
    if (c.parent !== null && byId.has(c.parent)) drawsFrom.add(c.parent);
    if (isEligible(c)) {
      for (const s of c.serves) {
        if (byId.has(s)) drawsFrom.add(s);
      }
    }
    for (const p of drawsFrom) {
      childCount.set(p, (childCount.get(p) ?? 0) + 1);
    }
  }
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

  // Flow + per-source contributions, memoized DFS with cycle detection.
  const flows = new Map<string, number>();
  const contributions = new Map<string, Map<string, number>>();
  const onStack = new Set<string>();
  const stackPath: string[] = [];

  const resolveFlow = (n: IntentionNode): number => {
    const memo = flows.get(n.id);
    if (memo !== undefined) return memo;
    if (onStack.has(n.id)) {
      const cycle = [...stackPath.slice(stackPath.indexOf(n.id)), n.id];
      throw new IntentionSchemaError(
        `attention flow cycle: ${cycle.join(" -> ")}`,
      );
    }
    onStack.add(n.id);
    stackPath.push(n.id);

    const inj = injection(n);
    const contrib = new Map<string, number>();
    if (inj > 0) contrib.set(n.id, inj);
    let flow = inj;
    for (const p of distributors(n)) {
      const share = resolveFlow(p) / (childCount.get(p.id) as number);
      flow += share;
      const parentFlow = flows.get(p.id) as number;
      if (parentFlow > 0) {
        const scale = 1 / (childCount.get(p.id) as number);
        for (const [src, amt] of contributions.get(p.id) as Map<string, number>) {
          contrib.set(src, (contrib.get(src) ?? 0) + amt * scale);
        }
      }
    }

    onStack.delete(n.id);
    stackPath.pop();
    flows.set(n.id, flow);
    contributions.set(n.id, contrib);
    return flow;
  };

  // Iterate in id order for a deterministic result regardless of input order.
  const sorted = [...nodes].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const eligible = sorted.filter(isEligible);
  for (const n of eligible) resolveFlow(n);

  // Banding, scale-invariant: mean of nonzero eligible flows.
  const nonzero = eligible
    .map((n) => flows.get(n.id) as number)
    .filter((f) => f > 0);
  const mean = nonzero.length > 0 ? nonzero.reduce((a, b) => a + b, 0) / nonzero.length : 0;

  const band = (flow: number): AttentionBand => {
    // No injections anywhere → the pre-attention status quo: all middle.
    if (mean === 0) return "middle";
    if (flow === 0 || flow <= mean * BAND_LOW) return "bottom";
    if (flow >= mean * BAND_HIGH) return "top";
    return "middle";
  };

  const result = new Map<string, ResolvedAttention>();
  for (const n of eligible) {
    const flow = flows.get(n.id) as number;
    const contrib = contributions.get(n.id) as Map<string, number>;
    const sources = [...contrib.entries()]
      .sort((a, b) => (a[1] !== b[1] ? b[1] - a[1] : a[0] < b[0] ? -1 : 1))
      .map(([src]) => src);
    result.set(n.id, { value: flow, band: band(flow), sources });
  }
  return result;
}
