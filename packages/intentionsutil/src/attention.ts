import { IntentionSchemaError } from "./errors.js";
import type { IntentionNode } from "./schema.js";

// --- Types -------------------------------------------------------------------

/** One term's contribution to a node's composed rank, for explainability. */
export interface TermContribution {
  term: string;
  value: number;
}

/** The derived attention (rank) of one eligible node. Computed on read, NEVER stored. */
export interface ResolvedAttention {
  /** The node's rank — the weighted sum of every term's contribution. */
  value: number;
  /**
   * Ids of the source nodes whose authored boosts/overrides contribute to this
   * node's rank via the `authored` term, ordered by contribution (largest
   * first, id ascending on ties) — for explainability ("via strategy-x").
   */
  sources: string[];
  /**
   * Every registered term's contribution to `value`, in registry order — the
   * per-term breakdown behind the composed score (strategy clarification 11:
   * "expose the composed score and per-term contributions for explainability
   * in frontier views"). Optional so hand-built `ResolvedAttention` literals
   * (e.g. in tests driving `renderFrontier` directly) need not supply it;
   * `resolveAttention` itself always populates it.
   */
  terms?: TermContribution[];
}

// --- Weights -----------------------------------------------------------------
// Terms and weights live in code, per clarification 11 — a weight change is an
// ordinary reviewed PR, never a graph edit. The authored term's own DFS values
// are used as-is (implicit weight 1); the two derived terms below are scaled
// so a typical authored boost (small integers, 1-10 across the current graph)
// still dominates — a max derived contribution is
// SIGNAL_TERM_WEIGHT + CAPTURE_TERM_WEIGHT = 2.

/** Flat bonus for a node on the path to an unvalidated signal's terminal. */
const SIGNAL_TERM_WEIGHT = 1;

/** Scales the normalized (0..1 per delegation) capture-resolution sum. */
const CAPTURE_TERM_WEIGHT = 1;

// --- Helpers -------------------------------------------------------------------

function isPlainObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A strategy's signal is unvalidated iff it has a gap, or no reading yet. */
function isUnvalidated(strategy: IntentionNode): boolean {
  return strategy.gap !== null || strategy.reading === null;
}

// --- Capture-resolution scoring ------------------------------------------------
// Reads the two capture axes (kind-delegation: divergence, irreversibility) off
// a delegation node's freeform `attributes` (kind-specific, not schema-typed) —
// defensive parsing here is boundary validation, not a fallback: a
// missing/malformed axis simply contributes 0 rather than throwing, since
// `attributes` shape is data (the kind node), not a code contract.
//
// Both axes are authored as free text, not an enum the schema gates — the live
// store already carries compound/qualified values (`low-moderate`,
// `moderate — would-be`) alongside the plain `low`/`moderate`/`high` the
// kind-delegation field spec documents, so an exact-match switch silently
// zeroes real, already-recovered delegations (e.g. delegation-hosted-publishing
// feeds strategy-recover-publishing's capture term today). Token matching
// against the free text is the boundary-validation move here: real authored
// intent still parses, and only genuinely unrecognized text falls to 0.

const DIVERGENCE_LEVEL_SCORES: Record<string, number> = { low: 1, moderate: 2, high: 3 };

function divergenceScore(delegation: IntentionNode): number {
  const divergence = delegation.attributes.divergence;
  if (!isPlainObjectLike(divergence)) return 0;
  const level = divergence.level;
  if (typeof level !== "string") return 0;
  const tokens = level.toLowerCase().match(/low|moderate|high/g);
  if (tokens === null) return 0;
  // A compound value ("low-moderate") names two severities at once; score the
  // more severe one — understating capture risk is the wrong direction to
  // round on a term whose purpose is flagging it.
  return Math.max(...tokens.map((t) => DIVERGENCE_LEVEL_SCORES[t]));
}

function irreversibilityScore(delegation: IntentionNode): number {
  const irreversibility = delegation.attributes.irreversibility;
  if (!isPlainObjectLike(irreversibility)) return 0;
  const gated = irreversibility.gated;
  const gatedText = (typeof gated === "string" ? gated : String(gated ?? "")).trim().toLowerCase();
  if (gatedText.startsWith("true")) return 3;
  if (gatedText.startsWith("false")) return 1;
  // The store's real middle ground ("partially — ...", "largely — ...") is
  // real, described gating — distinct from both the fully-open and
  // fully-closed poles, never collapsed into either.
  return 2;
}

/** One delegation's capture severity, normalized to the 1/3..1 range (max axis sum 6). */
function captureScore(delegation: IntentionNode): number {
  return (divergenceScore(delegation) + irreversibilityScore(delegation)) / 6;
}

// --- Resolver ------------------------------------------------------------------

/**
 * Resolve derived attention (rank) for every goal-layer node in the graph.
 *
 * Pure and deterministic: same nodes in, deep-equal map out. Derived values
 * are never written back to node frontmatter — `intentions/` stores intent,
 * not derived execution state.
 *
 * v3 model — a term registry composed as a weighted sum (strategy
 * clarification 11, superseding the v2 single-term additive-flow design
 * described on `intentions/strategy-graph-drives-dispatch.md`). Terms:
 *
 *   - `authored` — the v2 additive-flow algorithm unchanged: rank flows down
 *     `parent` + `serves` edges without decay or dilution ("hot means hot"),
 *     via an outgoing `Map<sourceId, amount>` per node. An `override` REPLACES
 *     a node's outgoing set with `{(self, override)}` (incoming discarded — a
 *     cap on this node's own branch, though a descendant's OTHER parents still
 *     contribute their own claims); a `boost` adds `(self, boost)` to the
 *     incoming union. This term is also the one that reports `sources` (the
 *     "via strategy-x" explainability marker) and short-circuits the whole
 *     composition on `override` — clarification 11: "an override pins the
 *     value absolutely."
 *   - `signal` — structural: a node is on-path iff it (transitively) blocks —
 *     reachable by walking `blocked_by` in reverse (who lists me as a
 *     blocker), or inherits down a `parent` chain — a validates-terminal: a
 *     tactic bearing a `validates` edge to a strategy whose signal is
 *     unvalidated, or such a strategy itself (a strategy is its own
 *     validates-terminal while unvalidated). On-path contributes
 *     `SIGNAL_TERM_WEIGHT`; off-path contributes 0. Self-updating: a new
 *     `validates` edge upstream lifts every node that blocks it, with no other
 *     change.
 *   - `capture` — from the node's own `recovers` (strategies) or its serving
 *     strategy's `recovers` (tactics, via `serves`): each resolved delegation
 *     contributes its normalized divergence/irreversibility axis sum (kind-
 *     delegation), scaled by `CAPTURE_TERM_WEIGHT`.
 *
 * New attention conditions add as terms with weights — never bands.
 *
 * Cycle guards: the authored term's DFS surfaces a `parent`/`serves` cycle as
 * an `IntentionSchemaError` (values there are ill-defined under a cycle — see
 * below). The signal term's reachability DFS does NOT throw on a cycle: a
 * boolean OR-over-paths query is well-defined even with a cycle in the mix — a
 * node fully enclosed in a cycle with no external escape to a terminal simply
 * isn't on-path, which is the correct answer, not an error.
 *
 * Rank 0 is the neutral baseline: with no injections, no `validates` edges
 * (or all signals already validated), and no `recovers` edges anywhere, every
 * eligible node resolves to value 0 with no sources.
 */
export function resolveAttention(nodes: IntentionNode[]): Map<string, ResolvedAttention> {
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const isEligible = (n: IntentionNode): boolean => {
    const kindNode = byId.get(`kind-${n.kind}`);
    return kindNode !== undefined && kindNode.attributes.goal_layer === true;
  };

  // --- Authored term (v2 algorithm, unchanged) ---------------------------

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
  const authoredOutgoing = new Map<string, Map<string, number>>();
  const onStack = new Set<string>();
  const stackPath: string[] = [];

  const computeAuthored = (n: IntentionNode): Map<string, number> => {
    const memo = authoredOutgoing.get(n.id);
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
      for (const [src, amt] of computeAuthored(d)) {
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
    authoredOutgoing.set(n.id, out);
    return out;
  };

  // --- Signal-satisfaction term -------------------------------------------

  const terminalIds = new Set<string>();
  for (const n of nodes) {
    if (n.kind === "strategy" && isUnvalidated(n)) {
      terminalIds.add(n.id);
    } else if (n.kind === "tactic") {
      for (const target of n.validates) {
        const strategy = byId.get(target);
        if (strategy !== undefined && strategy.kind === "strategy" && isUnvalidated(strategy)) {
          terminalIds.add(n.id);
          break;
        }
      }
    }
  }

  // reverseBlockers(id) = every node that lists `id` in its OWN blocked_by —
  // i.e. the nodes `id` blocks. Walking this (plus parent, downward) is how a
  // node reaches a validates-terminal: completing it is on the path to
  // completing something that validates a signal.
  const reverseBlockers = new Map<string, string[]>();
  for (const n of nodes) {
    for (const blocker of n.blocked_by) {
      const list = reverseBlockers.get(blocker);
      if (list) list.push(n.id);
      else reverseBlockers.set(blocker, [n.id]);
    }
  }

  const onPathMemo = new Map<string, boolean>();
  const onPathStack = new Set<string>();

  const isOnPath = (id: string): boolean => {
    const memo = onPathMemo.get(id);
    if (memo !== undefined) return memo;
    if (onPathStack.has(id)) return false; // cycle: this path contributes nothing, don't cache
    onPathStack.add(id);

    let result = terminalIds.has(id);
    if (!result) {
      const node = byId.get(id);
      if (node?.parent !== null && node?.parent !== undefined && byId.has(node.parent)) {
        result = isOnPath(node.parent);
      }
    }
    if (!result) {
      for (const blocked of reverseBlockers.get(id) ?? []) {
        if (isOnPath(blocked)) {
          result = true;
          break;
        }
      }
    }

    onPathStack.delete(id);
    onPathMemo.set(id, result);
    return result;
  };

  // --- Capture-resolution term ---------------------------------------------

  const captureScoreFor = (n: IntentionNode): number => {
    const strategies: IntentionNode[] =
      n.kind === "strategy"
        ? [n]
        : n.serves
            .map((id) => byId.get(id))
            .filter((s): s is IntentionNode => s !== undefined && s.kind === "strategy");

    const delegationIds = new Set<string>();
    for (const strategy of strategies) {
      for (const id of strategy.recovers) delegationIds.add(id);
    }

    let sum = 0;
    for (const id of delegationIds) {
      const delegation = byId.get(id);
      if (delegation !== undefined && delegation.kind === "delegation") {
        sum += captureScore(delegation);
      }
    }
    return sum;
  };

  // --- Compose --------------------------------------------------------------

  // Iterate in id order for a deterministic result regardless of input order.
  const sorted = [...nodes].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const eligible = sorted.filter(isEligible);
  for (const n of eligible) computeAuthored(n);

  const result = new Map<string, ResolvedAttention>();
  for (const n of eligible) {
    const authoredOut = computeAuthored(n);
    let authoredValue = 0;
    for (const amt of authoredOut.values()) authoredValue += amt;
    const sources = [...authoredOut.entries()]
      .sort((a, b) => (a[1] !== b[1] ? b[1] - a[1] : a[0] < b[0] ? -1 : 1))
      .map(([src]) => src);

    const overridden = n.attention !== null && n.attention.override !== null;
    if (overridden) {
      // Clarification 11: an override pins the value absolutely — derived
      // terms never silently overwhelm (or even touch) it.
      result.set(n.id, {
        value: authoredValue,
        sources,
        terms: [{ term: "authored", value: authoredValue }],
      });
      continue;
    }

    const signalValue = isOnPath(n.id) ? SIGNAL_TERM_WEIGHT : 0;
    const captureValue = CAPTURE_TERM_WEIGHT * captureScoreFor(n);
    const value = authoredValue + signalValue + captureValue;
    result.set(n.id, {
      value,
      sources,
      terms: [
        { term: "authored", value: authoredValue },
        { term: "signal", value: signalValue },
        { term: "capture", value: captureValue },
      ],
    });
  }
  return result;
}
