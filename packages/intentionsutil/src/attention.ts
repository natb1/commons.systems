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
export function isSignalUnvalidated(strategy: IntentionNode): boolean {
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
  const tokens = level.toLowerCase().match(/\blow\b|\bmoderate\b|\bhigh\b/g);
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
  // A missing/malformed axis contributes 0 rather than partial (mirrors
  // `divergenceScore`): an unfilled `irreversibility` object must not score
  // HIGHER than one explicitly authored as fully open.
  if (typeof gated !== "string") return 0;
  const gatedText = gated.trim().toLowerCase();
  if (gatedText === "") return 0;
  if (gatedText.startsWith("true")) return 3;
  if (gatedText.startsWith("false")) return 1;
  // The store's real middle ground ("partially — ...", "largely — ...") is
  // real, described gating — a present, non-empty string that names neither
  // pole — distinct from both the fully-open and fully-closed poles, never
  // collapsed into either.
  return 2;
}

/** One delegation's capture severity, normalized to the 1/3..1 range (max axis sum 6). */
function captureScore(delegation: IntentionNode): number {
  return (divergenceScore(delegation) + irreversibilityScore(delegation)) / 6;
}

// --- Signal-path reachability ----------------------------------------------------

/**
 * Compute the set of node ids on a signal path: every node that (transitively)
 * blocks — reachable by walking `blocked_by` in reverse (who lists me as a
 * blocker), or inherits down a `parent` chain — a validates-terminal. A
 * validates-terminal is a tactic bearing a `validates` edge to a strategy whose
 * signal is unvalidated, or such a strategy itself (a strategy is its own
 * validates-terminal while unvalidated).
 *
 * This is `resolveAttention`'s signal-term reachability, exported so the graph
 * router's strategy-eligibility gate ("no non-draft child tactics on the
 * strategy's signal path") shares one implementation. The DFS does NOT throw on
 * a cycle: a boolean OR-over-paths query is well-defined even with a cycle in
 * the mix — a node fully enclosed in a cycle with no external escape to a
 * terminal simply isn't on-path, which is the correct answer, not an error.
 */
export function computeSignalPath(nodes: IntentionNode[]): Set<string> {
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const terminalIds = new Set<string>();
  for (const n of nodes) {
    if (n.kind === "strategy" && isSignalUnvalidated(n)) {
      terminalIds.add(n.id);
    } else if (n.kind === "tactic") {
      for (const target of n.validates) {
        const strategy = byId.get(target);
        if (strategy !== undefined && strategy.kind === "strategy" && isSignalUnvalidated(strategy)) {
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

  // `provisional` marks a `false` that was only reached by short-circuiting on a
  // node still mid-DFS (a cycle formed by MIXING `parent` and `blocked_by`
  // edges). Such a `false` saw only the truncated cycle view, not the node's
  // true reachability, so it must NOT be memoized: caching it would permanently
  // mis-record a node as off-path when its sole route to a terminal runs back
  // through an ancestor that had not yet resolved, and would make the result
  // depend on input/traversal order. It is recomputed instead — every node is
  // entered as a fresh DFS root by the loop below, at which point its former
  // on-stack ancestors are fully-resolved descendants. A `true` is always final
  // (some path reached a terminal) and is always cached.
  const resolveOnPath = (id: string): { result: boolean; provisional: boolean } => {
    const memo = onPathMemo.get(id);
    if (memo !== undefined) return { result: memo, provisional: false };
    if (onPathStack.has(id)) return { result: false, provisional: true }; // cycle short-circuit
    onPathStack.add(id);

    let result = terminalIds.has(id);
    let provisional = false;
    if (!result) {
      const node = byId.get(id);
      if (node?.parent !== null && node?.parent !== undefined && byId.has(node.parent)) {
        const parent = resolveOnPath(node.parent);
        if (parent.result) result = true;
        else provisional = provisional || parent.provisional;
      }
    }
    if (!result) {
      for (const blocked of reverseBlockers.get(id) ?? []) {
        const sub = resolveOnPath(blocked);
        if (sub.result) {
          result = true;
          break;
        }
        provisional = provisional || sub.provisional;
      }
    }

    onPathStack.delete(id);
    // Cache only final answers: any `true`, or a `false` that did not depend on
    // an unresolved cycle short-circuit. Provisional falses recompute later.
    if (result || !provisional) {
      onPathMemo.set(id, result);
      return { result, provisional: false };
    }
    return { result, provisional: true };
  };

  // Enter every node as a fresh DFS root in id order (deterministic regardless
  // of input order), so provisional falses from an earlier root resolve.
  const result = new Set<string>();
  const sortedIds = nodes.map((n) => n.id).sort();
  for (const id of sortedIds) {
    if (resolveOnPath(id).result) result.add(id);
  }
  return result;
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
 *   - `authored` — additive-flow rank via an outgoing `Map<sourceId, amount>`
 *     per node, without decay or dilution ("hot means hot"). A node's outgoing
 *     set flows to its distributees along three edge relations: down `parent`
 *     and `serves` to its subtree (the v2 downward flow), AND backward along
 *     `blocked_by` to its blockers — every node X distributes its set to each
 *     id in `X.blocked_by`, so a boost/override on a blocked node lifts its
 *     whole critical path, recursively and interleaved with the downward flow
 *     (2026-07-07 `strategy-graph-drives-dispatch` clarifications: applying
 *     attention prioritizes the full critical path to the hot node). An
 *     `override` REPLACES a node's outgoing set with `{(self, override)}`
 *     (incoming discarded — a cap on this node's own branch, though a
 *     distributee's OTHER sources still contribute their own claims); a `boost`
 *     adds `(self, boost)` to the incoming union. Computed as a monotone
 *     fixpoint (the widened relation admits legitimate mixed
 *     parent/serves/blocked_by cycles — e.g. a node blocked by a tactic inside
 *     its own subtree): each non-override node's outgoing = union of its
 *     distributors' outgoing plus its own boost entry, iterated to convergence
 *     (unions only grow, override outputs are constant). This term is also the
 *     one that reports `sources` (the "via strategy-x" explainability marker)
 *     and short-circuits the whole composition on `override` — clarification
 *     11: "an override pins the value absolutely."
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
 * Cycle guards: the authored term throws an `IntentionSchemaError` only on a
 * pure `parent`-edge cycle (a node that is its own ancestor — malformed, and
 * NOT caught by `validateGraph`, whose rule 15 rejects only `blocked_by`
 * cycles); its values are ill-defined there. Cycles that involve a `blocked_by`
 * edge are legitimate under the backward flow and resolve via the monotone
 * fixpoint. The signal term's reachability DFS does NOT throw on a cycle: a
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

  // --- Authored term (monotone fixpoint over the widened relation) -------

  // reverseBlockers(id) = every node that lists `id` in its OWN blocked_by —
  // i.e. the nodes `id` blocks. Same construction as `computeSignalPath` above.
  // A node X flows its outgoing set BACKWARD to each of its blockers (the ids in
  // X.blocked_by), so a boost/override on a blocked node lifts its blockers, and
  // their subtrees inherit via the normal downward flow. Built once.
  const reverseBlockers = new Map<string, string[]>();
  for (const n of nodes) {
    for (const blocker of n.blocked_by) {
      const list = reverseBlockers.get(blocker);
      if (list) list.push(n.id);
      else reverseBlockers.set(blocker, [n.id]);
    }
  }

  // Distribution edges into c — the nodes whose outgoing set c inherits:
  //   { c.parent } ∪ (eligible c only) { c.serves } ∪ { X : c ∈ X.blocked_by }.
  // The first two are the v2 downward flow; the third is the backward
  // blocked_by flow (reverseBlockers(c) = the nodes c blocks, each of which
  // distributes its sources to c). Each restricted to ids that resolve; sorted
  // for determinism.
  const distributorIds = (c: IntentionNode): string[] => {
    const ids = new Set<string>();
    if (c.parent !== null && byId.has(c.parent)) ids.add(c.parent);
    if (isEligible(c)) {
      for (const s of c.serves) {
        if (byId.has(s)) ids.add(s);
      }
    }
    for (const blocked of reverseBlockers.get(c.id) ?? []) {
      if (byId.has(blocked)) ids.add(blocked);
    }
    return [...ids].sort();
  };

  // A pure `parent`-edge cycle is a malformed graph (a node that is its own
  // ancestor) that `validateGraph` does NOT catch — rule 15 rejects only
  // `blocked_by` cycles. `parent` is a single pointer per node, so following it
  // from any node either reaches a root (`parent === null`) or repeats; a
  // repeat is the cycle. Surface it as a clear error (authored values are
  // ill-defined under a pure authored cycle) rather than let the fixpoint
  // silently converge it to 0. Cycles that involve a `blocked_by` edge are
  // legitimate under the backward flow and are handled by the fixpoint — this
  // guard fires ONLY on parent-only cycles.
  for (const start of nodes) {
    const seen = new Set<string>();
    let cur: IntentionNode | undefined = start;
    while (cur !== undefined && cur.parent !== null) {
      if (seen.has(cur.id)) {
        throw new IntentionSchemaError(
          `attention flow cycle: ${[...seen, cur.id].join(" -> ")}`,
        );
      }
      seen.add(cur.id);
      cur = byId.get(cur.parent);
    }
  }

  // Outgoing source set per node, computed as a monotone fixpoint. Seed each
  // node from its own authored field: override → the constant `{(self,
  // override)}` (incoming discarded — a branch cap); boost → `{(self, boost)}`;
  // else empty. Then sweep in sorted id order, recomputing every non-override
  // node's outgoing = union of its distributors' outgoing plus its own boost
  // entry, until a full sweep changes nothing. Unions only grow and override
  // outputs are constant, so the iteration is monotone and convergence is
  // guaranteed; the sorted sweep makes the result independent of input order.
  const authoredOutgoing = new Map<string, Map<string, number>>();
  const isOverrideNode = new Set<string>();
  for (const n of nodes) {
    const attention = isEligible(n) ? n.attention : null;
    if (attention !== null && attention.override !== null) {
      authoredOutgoing.set(n.id, new Map([[n.id, attention.override]]));
      isOverrideNode.add(n.id);
    } else if (attention !== null && attention.boost !== null) {
      authoredOutgoing.set(n.id, new Map([[n.id, attention.boost]]));
    } else {
      authoredOutgoing.set(n.id, new Map());
    }
  }

  const sortedNodeIds = nodes.map((n) => n.id).sort();
  const mapsDiffer = (a: Map<string, number>, b: Map<string, number>): boolean => {
    if (a.size !== b.size) return true;
    for (const [k, v] of a) if (b.get(k) !== v) return true;
    return false;
  };

  let changed = true;
  while (changed) {
    changed = false;
    for (const id of sortedNodeIds) {
      if (isOverrideNode.has(id)) continue; // constant outgoing
      const node = byId.get(id) as IntentionNode;
      const next = new Map<string, number>();
      const attention = isEligible(node) ? node.attention : null;
      if (attention !== null && attention.boost !== null) {
        next.set(id, attention.boost); // own relative claim
      }
      for (const d of distributorIds(node)) {
        for (const [src, amt] of authoredOutgoing.get(d) as Map<string, number>) {
          next.set(src, amt); // dedupe by src; amounts identical (undiluted)
        }
      }
      if (mapsDiffer(next, authoredOutgoing.get(id) as Map<string, number>)) {
        authoredOutgoing.set(id, next);
        changed = true;
      }
    }
  }

  // --- Signal-satisfaction term -------------------------------------------
  // Shared with the graph router's strategy-eligibility gate — see
  // computeSignalPath above for the reachability semantics and cycle handling.

  const onPathIds = computeSignalPath(nodes);
  const isOnPath = (id: string): boolean => onPathIds.has(id);

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
    // Cap at 1 so the capture term never exceeds CAPTURE_TERM_WEIGHT: the
    // "Weights" invariant (derived terms max out at SIGNAL_TERM_WEIGHT +
    // CAPTURE_TERM_WEIGHT = 2, so an authored boost still dominates) only holds
    // if a node recovering several high-severity delegations can't sum past 1.
    return Math.min(1, sum);
  };

  // --- Compose --------------------------------------------------------------

  // Iterate in id order for a deterministic result regardless of input order.
  const sorted = [...nodes].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const eligible = sorted.filter(isEligible);

  const result = new Map<string, ResolvedAttention>();
  for (const n of eligible) {
    const authoredOut = authoredOutgoing.get(n.id) as Map<string, number>;
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
