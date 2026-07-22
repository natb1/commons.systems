// Grounding gap analysis — the sensor behind strategy-complete-grounding's
// success signal ("the tick gap analysis reports zero unmarked durable-layer
// nodes"). Pure functions over IntentionNode[]: enumerate the durable layer,
// partition marked vs unmarked, and rank the unmarked by deference/capture
// exposure so a worker can consume the ranking at tick.
//
// The marking convention (strategy-complete-grounding clarifications 1 and 5;
// kind-tradition's grounding clarification):
//
//   - Durable layer = nodes whose `kind` is one of virtue, strategy, kind,
//     delegation. Tactics inherit grounding through the strategy they serve,
//     and `tradition-*` records ARE the grounding, so both are exempt.
//   - A durable-layer node is MARKED when its `attributes` carry a
//     `traditions` list (tradition-* ids) or a `grounding` string
//     ("circumstantial: <why>" / "none-found: <date>"). Neither present =
//     unmarked, the gap this sensor reports.
//
// This module never WRITES marks (strategy clarification 4 — marks are
// author-side); it only reads the graph and reports.

import type { IntentionNode } from "./schema.js";

// --- Durable-layer membership ------------------------------------------------

/** The kinds that must carry grounding; tactics and traditions are exempt. */
export const DURABLE_KINDS: ReadonlySet<string> = new Set([
  "virtue",
  "strategy",
  "kind",
  "delegation",
]);

/** Whether a node belongs to the audited durable layer. */
export function isDurable(node: IntentionNode): boolean {
  return DURABLE_KINDS.has(node.kind);
}

// --- Mark detection ----------------------------------------------------------
// `attributes` is a free-form kind-specific map (Record<string, unknown>), not
// schema-typed. The mark is the mere PRESENCE of an own `traditions` or
// `grounding` key — an author who has considered the node's grounding writes
// one of them (even `"none-found: <date>"` counts). Absence = unconsidered.

function hasOwn(obj: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/** Whether the node carries an `attributes.traditions` mark. */
export function hasTraditionsMark(node: IntentionNode): boolean {
  return hasOwn(node.attributes, "traditions");
}

/** Whether the node carries an `attributes.grounding` mark. */
export function hasGroundingMark(node: IntentionNode): boolean {
  return hasOwn(node.attributes, "grounding");
}

/** Whether the node is marked by either convention. */
export function isMarked(node: IntentionNode): boolean {
  return hasTraditionsMark(node) || hasGroundingMark(node);
}

// --- Capture-axis scoring (delegation nodes) ---------------------------------
// Reads the two capture axes off a delegation's freeform attributes, in the
// same spirit as src/attention.ts's capture term: a missing/malformed axis
// scores 0 (boundary validation, not a fallback — attributes shape is data,
// not a code contract). Token/prefix matching, not exact-match, so the store's
// real compound values ("low-moderate", "partially — ...") parse to real
// intent instead of silently zeroing.

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Divergence severity of a delegation, ranked high > moderate > low-moderate >
 * low (strategy plan: parse the leading token of the free-text level). A
 * compound value is dispatched on its leading severity band, with
 * `low-moderate` checked before the bare `low` prefix it shares. Unrecognized
 * or absent → 0.
 */
export function divergenceRank(delegation: IntentionNode): number {
  const divergence = delegation.attributes.divergence;
  if (!isPlainObject(divergence)) return 0;
  const level = divergence.level;
  if (typeof level !== "string") return 0;
  const t = level.trim().toLowerCase();
  if (t.startsWith("high")) return 4;
  if (t.startsWith("moderate")) return 3;
  if (t.startsWith("low-moderate") || t.startsWith("low moderate")) return 2;
  if (t.startsWith("low")) return 1;
  return 0;
}

/**
 * Irreversibility of a delegation from `attributes.irreversibility.gated`: a
 * string beginning `true` outranks one beginning `false`; a present, non-empty
 * middle-ground string ("partially — ...") sits between; absent/malformed → 0
 * (mirrors src/attention.ts's `irreversibilityScore`).
 */
export function gatedRank(delegation: IntentionNode): number {
  const irreversibility = delegation.attributes.irreversibility;
  if (!isPlainObject(irreversibility)) return 0;
  const gated = irreversibility.gated;
  if (typeof gated !== "string") return 0;
  const g = gated.trim().toLowerCase();
  if (g === "") return 0;
  if (g.startsWith("true")) return 3;
  if (g.startsWith("false")) return 1;
  return 2;
}

/**
 * A delegation's own capture exposure. Divergence dominates gating: a one-step
 * divergence difference (weight 10) always outranks any gating difference
 * (0..3), so the ordering guarantee "delegation-divergence dominance" holds.
 */
export function delegationScore(delegation: IntentionNode): number {
  return divergenceRank(delegation) * 10 + gatedRank(delegation);
}

// --- Recovers-proximity (non-delegation durable nodes) -----------------------

// A non-delegation durable node's exposure is inherited from the nearest
// delegation reachable over serves/recovers edges (either direction), decaying
// with hop distance. Delegations sit in their own band strictly above every
// non-delegation (DELEGATION_BAND), so category 1 (delegations) always ranks
// above category 2 (non-delegations), per the strategy plan.
const DELEGATION_BAND = 1000;

interface Proximity {
  /** Nearest-delegation base score (max across delegations at the nearest hop). */
  base: number;
  /** Hop distance to the nearest delegation, or null if none reachable. */
  hops: number | null;
  /** The nearest delegation id (lowest id among the max-score set), for reporting. */
  nearest: string | null;
}

/**
 * BFS over the undirected serves/recovers graph from `start` to the nearest
 * delegation node. Returns the hop distance, the max delegationScore among the
 * delegations found at that nearest hop, and one representative id. No
 * delegation reachable → { base: 0, hops: null, nearest: null }.
 */
function nearestDelegation(
  start: IntentionNode,
  byId: Map<string, IntentionNode>,
  adjacency: Map<string, Set<string>>,
): Proximity {
  const visited = new Set<string>([start.id]);
  let frontier: string[] = [start.id];
  let hops = 0;
  while (frontier.length > 0) {
    // Collect delegations discovered at this BFS level.
    const delegationsHere: IntentionNode[] = [];
    for (const id of frontier) {
      const node = byId.get(id);
      // The start node is non-delegation by construction, so hop 0 yields none.
      if (node !== undefined && node.kind === "delegation") delegationsHere.push(node);
    }
    if (delegationsHere.length > 0) {
      let base = -1;
      let nearest: string | null = null;
      // Max score; ties broken by lowest id for a deterministic representative.
      for (const d of [...delegationsHere].sort((a, b) => (a.id < b.id ? -1 : 1))) {
        const score = delegationScore(d);
        if (score > base) {
          base = score;
          nearest = d.id;
        }
      }
      return { base, hops, nearest };
    }
    const next: string[] = [];
    for (const id of frontier) {
      for (const neighbor of adjacency.get(id) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          next.push(neighbor);
        }
      }
    }
    frontier = next;
    hops += 1;
  }
  return { base: 0, hops: null, nearest: null };
}

/** Build the undirected serves/recovers adjacency over existing node ids. */
function buildAdjacency(nodes: IntentionNode[], byId: Map<string, IntentionNode>): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>();
  const link = (a: string, b: string): void => {
    let set = adjacency.get(a);
    if (set === undefined) {
      set = new Set<string>();
      adjacency.set(a, set);
    }
    set.add(b);
  };
  for (const node of nodes) {
    for (const target of [...node.serves, ...node.recovers]) {
      if (byId.has(target)) {
        link(node.id, target);
        link(target, node.id);
      }
    }
  }
  return adjacency;
}

// --- Tie-breaks --------------------------------------------------------------
// At equal exposure: virtue outranks kind outranks strategy (2026-07-07
// interview: "virtue roots outrank strategies at equal exposure"), then id
// ascending for determinism. Delegations sit in their own band and never tie
// with these three.
const KIND_TIE_RANK: Record<string, number> = { virtue: 3, kind: 2, strategy: 1, delegation: 0 };

// --- Report ------------------------------------------------------------------

/** One unmarked durable-layer node in the ranking, with its exposure factors. */
export interface RankedUnmarked {
  rank: number;
  id: string;
  kind: string;
  exposure: number;
  /** Human-readable exposure factors, e.g. "divergence=high gated=true" or "nearest=delegation-x hops=2". */
  factors: string;
}

/** The full grounding gap report. */
export interface GroundingReport {
  durableTotal: number;
  markedByTraditions: number;
  markedByGrounding: number;
  unmarked: number;
  ranked: RankedUnmarked[];
}

/**
 * Analyze the graph's grounding coverage: durable-layer census, mark
 * partition, and the unmarked nodes ranked by deference/capture exposure
 * (descending). Pure and deterministic.
 */
export function analyzeGrounding(nodes: IntentionNode[]): GroundingReport {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const durable = nodes.filter(isDurable);

  const markedByTraditions = durable.filter(hasTraditionsMark).length;
  const markedByGrounding = durable.filter(hasGroundingMark).length;
  const unmarkedNodes = durable.filter((n) => !isMarked(n));

  const adjacency = buildAdjacency(nodes, byId);

  interface Scored {
    node: IntentionNode;
    exposure: number;
    factors: string;
  }

  const scored: Scored[] = unmarkedNodes.map((node) => {
    if (node.kind === "delegation") {
      const dScore = delegationScore(node);
      return {
        node,
        exposure: DELEGATION_BAND + dScore,
        factors: `divergence=${divergenceRank(node)} gated=${gatedRank(node)}`,
      };
    }
    const { base, hops, nearest } = nearestDelegation(node, byId, adjacency);
    // Fewer hops = higher exposure; inherit the delegation's own score as base.
    const exposure = hops === null ? 0 : base / (hops + 1);
    const factors =
      hops === null
        ? "no-delegation-reachable"
        : `nearest=${nearest} hops=${hops} base=${base}`;
    return { node, exposure, factors };
  });

  scored.sort((a, b) => {
    if (a.exposure !== b.exposure) return b.exposure - a.exposure;
    const ka = KIND_TIE_RANK[a.node.kind] ?? -1;
    const kb = KIND_TIE_RANK[b.node.kind] ?? -1;
    if (ka !== kb) return kb - ka;
    return a.node.id < b.node.id ? -1 : a.node.id > b.node.id ? 1 : 0;
  });

  const ranked: RankedUnmarked[] = scored.map((s, i) => ({
    rank: i + 1,
    id: s.node.id,
    kind: s.node.kind,
    exposure: s.exposure,
    factors: s.factors,
  }));

  return {
    durableTotal: durable.length,
    markedByTraditions,
    markedByGrounding,
    unmarked: unmarkedNodes.length,
    ranked,
  };
}
