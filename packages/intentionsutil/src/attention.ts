import { IntentionSchemaError } from "./errors.js";
import { ownTier } from "./schema.js";
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
   * The node's EFFECTIVE tier — the outer ranking axis, dominating `value`
   * lexicographically: order by `(tier, value)`, never by `value` alone. It is
   * `max` of the node's own tier (`ownTier`: bug_fix/security marks or an
   * explicit `attributes.tier`) and the effective tier of every node that
   * distributes to it (parent/serves), so a tier lift flows downward exactly
   * like the authored term does.
   *
   * Required, not optional: an optional field invites a `?? 1` fallback at call
   * sites, which would silently sort a genuinely tier-3 node into tier 1 —
   * exactly the bug this axis exists to prevent.
   */
  tier: number;
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

/** A strategy's signal is unvalidated iff it has a gap, or no reading yet. */
export function isSignalUnvalidated(strategy: IntentionNode): boolean {
  return strategy.gap !== null || strategy.reading === null;
}

// --- Delegation capture axes (kind-delegation) ---------------------------------
// The two capture axes (kind-delegation: divergence, irreversibility) live on a
// delegation node's freeform `attributes` (kind-specific, not schema-typed).
// Every axis field below is an ENUM, read EXACTLY — no prefix matching, no
// token scanning over free text. The prose nuance behind an assessment lives in
// the sibling `note`/description fields and the node body, never in the enum
// member itself, so a reader never has to parse an authored sentence.
//
// Defensive parsing here is boundary validation, not a fallback: a
// missing/out-of-enum axis simply contributes 0 rather than throwing, since
// `attributes` shape is data (the kind node), not a code contract. The
// enum is enforced graph-side (`validateGraph`), not by `validateNode` — the
// attributes map is deliberately freeform per kind.

/** `divergence.level` — kind-delegation's divergence axis. */
export const DIVERGENCE_LEVELS = ["low", "moderate", "high"] as const;
export type DivergenceLevel = (typeof DIVERGENCE_LEVELS)[number];

/**
 * `irreversibility.recovery_cost` — what recovering the capability costs.
 * `unassessed` is a deliberate member meaning "not yet measured", distinct from
 * every cost band: it triggers neither arm of the classification derivation.
 */
export const RECOVERY_COSTS = [
  "none",
  "low",
  "moderate",
  "high",
  "prohibitive",
  "unassessed",
] as const;
export type RecoveryCost = (typeof RECOVERY_COSTS)[number];

/**
 * `irreversibility.gated.level` — how far the recovery knowledge is held by the
 * delegatee. Three bands, not a boolean: 41% of the corpus reads a middle band
 * ("partially"), and `true` never occurs at all, so a boolean would corrupt the
 * derivation. The assessment prose lives in the sibling `gated.note` field.
 */
export const GATED_LEVELS = ["none", "partial", "large"] as const;
export type GatedLevel = (typeof GATED_LEVELS)[number];

/** A delegation's classification — derived from the axes, never stored. */
export type DelegationClassification = "tool" | "platform" | "captured";

function isPlainObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Exact membership read: a non-member (or non-string) is `null`, never coerced. */
function readEnum<T extends string>(value: unknown, members: readonly T[]): T | null {
  if (typeof value !== "string") return null;
  return (members as readonly string[]).includes(value) ? (value as T) : null;
}

/**
 * The `attributes` map of a delegation, whether given the node or the map. Both
 * are accepted so callers holding only the parsed attributes (a validator, a
 * renderer) need not synthesize a node; a node is detected by its own
 * object-shaped `attributes` key.
 */
function delegationAttributes(
  delegation: IntentionNode | Record<string, unknown>,
): Record<string, unknown> {
  const own = (delegation as Partial<IntentionNode>).attributes;
  return isPlainObjectLike(own) ? own : (delegation as Record<string, unknown>);
}

/** `attributes.divergence.level`, or null if absent/out-of-enum. */
export function readDivergenceLevel(
  delegation: IntentionNode | Record<string, unknown>,
): DivergenceLevel | null {
  const divergence = delegationAttributes(delegation).divergence;
  if (!isPlainObjectLike(divergence)) return null;
  return readEnum(divergence.level, DIVERGENCE_LEVELS);
}

/** `attributes.irreversibility.recovery_cost`, or null if absent/out-of-enum. */
export function readRecoveryCost(
  delegation: IntentionNode | Record<string, unknown>,
): RecoveryCost | null {
  const irreversibility = delegationAttributes(delegation).irreversibility;
  if (!isPlainObjectLike(irreversibility)) return null;
  return readEnum(irreversibility.recovery_cost, RECOVERY_COSTS);
}

/** `attributes.irreversibility.gated.level`, or null if absent/out-of-enum. */
export function readGatedLevel(
  delegation: IntentionNode | Record<string, unknown>,
): GatedLevel | null {
  const irreversibility = delegationAttributes(delegation).irreversibility;
  if (!isPlainObjectLike(irreversibility)) return null;
  const gated = irreversibility.gated;
  if (!isPlainObjectLike(gated)) return null;
  return readEnum(gated.level, GATED_LEVELS);
}

// --- Classification derivation ---------------------------------------------

/**
 * Derive a delegation's classification from its two axes. This implements the
 * rule stated in `intentions/kind-delegation.md` (rationale, 2026-07-09) —
 * that node is the rule's one home; this function is only its mechanization,
 * so any change to the rule is made there first and mirrored here:
 *
 *   captured = high divergence OR gated/prohibitive recovery;
 *   platform = moderate divergence OR high recovery cost;
 *   tool     = otherwise.
 *
 * "gated" in that rule resolves to `irreversibility.gated.level === "large"` —
 * the top band of the three-band axis. `unassessed` recovery cost triggers
 * neither arm: it asserts nothing about cost, so it cannot lift the record.
 *
 * Applies uniformly to `origin: declined` records: a declined delegation
 * derives over its would-be axes exactly as an entered one does — the record
 * documents the attachment that WOULD exist, and classifying it is the point.
 *
 * Classification is derived on read and never stored, so it can never again
 * contradict the axes it claims to derive from.
 */
export function deriveClassification(
  delegation: IntentionNode | Record<string, unknown>,
): DelegationClassification {
  const divergence = readDivergenceLevel(delegation);
  const cost = readRecoveryCost(delegation);
  const gated = readGatedLevel(delegation);

  if (divergence === "high" || gated === "large" || cost === "prohibitive") return "captured";
  if (divergence === "moderate" || cost === "high") return "platform";
  return "tool";
}

// --- Capture-resolution scoring ------------------------------------------------

const DIVERGENCE_LEVEL_SCORES: Record<DivergenceLevel, number> = { low: 1, moderate: 2, high: 3 };

function divergenceScore(delegation: IntentionNode): number {
  const level = readDivergenceLevel(delegation);
  return level === null ? 0 : DIVERGENCE_LEVEL_SCORES[level];
}

// A missing/out-of-enum `gated` contributes 0 rather than the `none` band's 1
// (mirrors `divergenceScore`): an unfilled `irreversibility` object must not
// score HIGHER than one explicitly authored as fully open. That 0-vs-1 gap is
// the whole point of keeping `none` an authored enum member rather than the
// absence of a value.
const GATED_LEVEL_SCORES: Record<GatedLevel, number> = { none: 1, partial: 2, large: 3 };

function irreversibilityScore(delegation: IntentionNode): number {
  const level = readGatedLevel(delegation);
  return level === null ? 0 : GATED_LEVEL_SCORES[level];
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
 *     set flows DOWNWARD ONLY, along `parent` and `serves`, to its subtree.
 *     It does NOT flow backward along `blocked_by`: a boost on a blocked node
 *     no longer lifts its blockers. Blocking precedence is a separate,
 *     structural concern of the selector — an authored value flowing into a
 *     blocker made the blocker's rank a function of who happened to be blocked
 *     on it, which is not what the author claimed. An `override` REPLACES a
 *     node's outgoing set with `{(self, override)}` (incoming discarded — a cap
 *     on this node's own branch, though a distributee's OTHER sources still
 *     contribute their own claims); a `boost` adds `(self, boost)` to the
 *     incoming union. Computed as a monotone fixpoint: each non-override node's
 *     outgoing = union of its distributors' outgoing plus its own boost entry,
 *     iterated to convergence (unions only grow, override outputs are
 *     constant). The fixpoint is kept as-is — it is still correct and still the
 *     mechanism — but with `blocked_by` out of the distributor relation, MIXED
 *     parent/blocked_by cycles can no longer arise at all; the only cycle the
 *     relation can now form is a pure `parent` (or parent/serves) cycle, and
 *     the pure-parent-cycle guard below is what remains active against it.
 *     This term is also the one that reports `sources` (the "via strategy-x"
 *     explainability marker) and short-circuits the whole composition on
 *     `override` — clarification 11: "an override pins the value absolutely."
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
 * Orthogonal to the weighted sum, every result also carries a `tier` — the
 * OUTER ranking axis. `tier` is resolved as its own monotone fixpoint over the
 * SAME downward distributor relation: `effectiveTier(n) = max(ownTier(n), max
 * over distributors d of effectiveTier(d))`. So a tier-3 strategy lifts every
 * tactic serving it, and tier never flows upward. It is resolved for EVERY node
 * (an ineligible node can still sit mid-chain relaying tier to descendants),
 * though only eligible nodes get a `ResolvedAttention` entry. Consumers order
 * lexicographically by `(tier, value)` — tier dominates, value breaks ties
 * within a tier. An `override` pins `value` only; `tier` is a separate axis and
 * is still computed and reported on an overridden node.
 *
 * Cycle guards: the authored term throws an `IntentionSchemaError` only on a
 * pure `parent`-edge cycle (a node that is its own ancestor — malformed, and
 * NOT caught by `validateGraph`, whose rule 15 rejects only `blocked_by`
 * cycles); its values are ill-defined there. With `blocked_by` no longer in the
 * distributor relation, a mixed parent/blocked_by cycle can no longer arise, so
 * that guard is the only cycle guard the authored/tier fixpoints need. The
 * signal term's reachability DFS does NOT throw on a cycle: a
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

  // --- Distributor relation (downward only) -------------------------------

  // Distribution edges into c — the nodes whose outgoing set c inherits:
  //   { c.parent } ∪ (eligible c only) { c.serves }.
  // Downward only. `blocked_by` is deliberately NOT part of this relation: a
  // boost on a blocked node does not flow back into its blockers (blocking
  // precedence is the selector's structural concern, not an authored value's).
  // Each entry is restricted to ids that resolve; sorted for determinism.
  // Shared by the authored-term fixpoint and the effective-tier fixpoint below.
  const distributorIds = (c: IntentionNode): string[] => {
    const ids = new Set<string>();
    if (c.parent !== null && byId.has(c.parent)) ids.add(c.parent);
    if (isEligible(c)) {
      for (const s of c.serves) {
        if (byId.has(s)) ids.add(s);
      }
    }
    return [...ids].sort();
  };

  // A pure `parent`-edge cycle is a malformed graph (a node that is its own
  // ancestor) that `validateGraph` does NOT catch — rule 15 rejects only
  // `blocked_by` cycles. `parent` is a single pointer per node, so following it
  // from any node either reaches a root (`parent === null`) or repeats; a
  // repeat is the cycle. Surface it as a clear error (authored values are
  // ill-defined under a pure authored cycle) rather than let the fixpoint
  // silently converge it to 0. This is now the ONLY cycle the distributor
  // relation can form: with `blocked_by` removed from it, a mixed
  // parent/blocked_by cycle can no longer arise at all, so this pure-parent
  // guard is the one that remains active.
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

  // --- Authored term (monotone fixpoint over the downward relation) --------

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

  // Both maps below are seeded/keyed from the SAME `nodes`/`sortedNodeIds`
  // source, so a lookup by a known node id is a maintained invariant, not
  // user input — `mustGet` turns a violation into a clear error instead of an
  // `as`-cast that would silently paper over a real bug.
  function mustGet<V>(map: Map<string, V>, id: string, what: string): V {
    const value = map.get(id);
    if (value === undefined) {
      throw new IntentionSchemaError(`attention: expected ${what} for node id "${id}"`);
    }
    return value;
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const id of sortedNodeIds) {
      if (isOverrideNode.has(id)) continue; // constant outgoing
      const node = mustGet(byId, id, "node");
      const next = new Map<string, number>();
      const attention = isEligible(node) ? node.attention : null;
      if (attention !== null && attention.boost !== null) {
        next.set(id, attention.boost); // own relative claim
      }
      for (const d of distributorIds(node)) {
        for (const [src, amt] of mustGet(authoredOutgoing, d, "authoredOutgoing entry")) {
          next.set(src, amt); // dedupe by src; amounts identical (undiluted)
        }
      }
      if (mapsDiffer(next, mustGet(authoredOutgoing, id, "authoredOutgoing entry"))) {
        authoredOutgoing.set(id, next);
        changed = true;
      }
    }
  }

  // --- Effective tier (monotone fixpoint over the SAME downward relation) --

  // effectiveTier(n) = max(ownTier(n), max over distributors d of
  // effectiveTier(d)). Same shape and sweep style as the authored fixpoint
  // above: seed from the node's own value, then sweep in sorted id order until
  // a full pass changes nothing. Values only increase and are bounded above by
  // the top tier, so convergence is guaranteed; the sorted sweep keeps the
  // result independent of input order.
  //
  // Resolved for EVERY node, not just eligible ones: an ineligible node (a
  // virtue, say) can sit mid-chain and relay a tier to its descendants, so
  // skipping it would silently cut the chain. Only eligible nodes still get a
  // `ResolvedAttention` entry in the output map.
  const effectiveTier = new Map<string, number>();
  for (const n of nodes) effectiveTier.set(n.id, ownTier(n));

  let tierChanged = true;
  while (tierChanged) {
    tierChanged = false;
    for (const id of sortedNodeIds) {
      const node = mustGet(byId, id, "node");
      let next = mustGet(effectiveTier, id, "effectiveTier entry");
      for (const d of distributorIds(node)) {
        next = Math.max(next, mustGet(effectiveTier, d, "effectiveTier entry"));
      }
      if (next !== mustGet(effectiveTier, id, "effectiveTier entry")) {
        effectiveTier.set(id, next);
        tierChanged = true;
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
    const tier = mustGet(effectiveTier, n.id, "effectiveTier entry");

    // TIER IS AN ISOLATION BOUNDARY (author ruling 2026-07-31, design decision
    // (b)). Authored authority does not flow ACROSS a tier namespace: only a
    // claim authored by a source sitting in this node's own effective tier
    // contributes to its value. Filtering here rather than in the authored
    // fixpoint keeps that fixpoint a pure "who reaches whom" relation, and
    // keeps the isolation rule stated in exactly one place.
    //
    // Effective tier is max-lifted along the SAME distributor edges the
    // authored fixpoint walks, so every source reaching `n` has an effective
    // tier <= `n`'s: this filter only ever drops strictly-LOWER-tier sources,
    // and can never drop the node's own claim, which by construction sits at
    // the node's own tier. That is also why it cannot introduce a tier
    // inversion — it removes contributions, never adds them.
    const authoredOut = mustGet(authoredOutgoing, n.id, "authoredOutgoing entry");
    const contributing = [...authoredOut.entries()].filter(
      ([src]) => mustGet(effectiveTier, src, "effectiveTier entry") === tier,
    );
    let authoredValue = 0;
    for (const [, amt] of contributing) authoredValue += amt;
    const sources = contributing
      .sort((a, b) => (a[1] !== b[1] ? b[1] - a[1] : a[0] < b[0] ? -1 : 1))
      .map(([src]) => src);

    const overridden = n.attention !== null && n.attention.override !== null;
    if (overridden) {
      // Clarification 11: an override pins the value absolutely — derived
      // terms never silently overwhelm (or even touch) it. It pins the VALUE
      // only: tier is a separate, outer axis, so an overridden node still
      // reports its computed (possibly inherited) effective tier.
      result.set(n.id, {
        value: authoredValue,
        tier,
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
      tier,
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
