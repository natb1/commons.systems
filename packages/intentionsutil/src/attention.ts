import { IntentionSchemaError } from "./errors.js";
import { TIERS, ownTier } from "./schema.js";
import type { IntentionNode } from "./schema.js";
import { deriveGap } from "./sensors.js";

// --- Types -------------------------------------------------------------------

/**
 * The shared ranking key: the lexicographic quadruple every consumer orders by,
 * descending, tier outermost.
 *
 *  - `tier` — the outer namespace axis (see `ResolvedAttention.tier`).
 *  - `band` — the best score among the node's PARENTS, read in this node's own
 *    resolved tier. It groups a node with its cohort before its own score
 *    breaks ties inside that cohort.
 *  - `score` — this node's own per-tier score (own contribution plus its whole
 *    deduped lineage's).
 *  - `depth` — how many distinct lineage nodes sit above it. Innermost, so a
 *    child outranks its parent whenever the three outer components tie.
 *
 * Exported so every consumer sorts by ONE comparator rather than re-deriving
 * the ordering (and re-deriving it slightly differently).
 */
export interface RankKey {
  tier: number;
  band: number;
  score: number;
  depth: number;
}

/**
 * Lexicographic DESCENDING comparator over `RankKey`: tier, then band, then
 * score, then depth. Suitable directly as an `Array.prototype.sort` argument —
 * `[...items].sort((a, b) => compareRankKeyDesc(a.rank, b.rank))`.
 *
 * Ties on all four components return 0; callers that need a total order break
 * the remaining tie themselves (by id, conventionally ascending).
 */
export function compareRankKeyDesc(a: RankKey, b: RankKey): number {
  if (a.tier !== b.tier) return b.tier - a.tier;
  if (a.band !== b.band) return b.band - a.band;
  if (a.score !== b.score) return b.score - a.score;
  return b.depth - a.depth;
}

/** The derived attention (rank) of one eligible node. Computed on read, NEVER stored. */
export interface ResolvedAttention extends RankKey {
  /**
   * The node's EFFECTIVE tier — the outer ranking axis, dominating every other
   * component lexicographically. It is `max` of the node's own tier (`ownTier`:
   * bug_fix/security marks or an explicit `attributes.tier`) and the effective
   * tier of every one of its parents, so a tier lift flows downward exactly
   * like a boost does.
   *
   * Required, not optional: an optional field invites a `?? 1` fallback at call
   * sites, which would silently sort a genuinely tier-3 node into tier 1 —
   * exactly the bug this axis exists to prevent.
   */
  tier: number;
  /**
   * The parent id whose score defined `band`, for explainability ("banded with
   * strategy-x"). `null` exactly when `band` is 0 — either the node has no
   * parents at all, or no parent carries any score in this node's tier.
   */
  bandSource: string | null;
  /**
   * Ids of the nodes whose per-tier contribution (authored boost in this node's
   * resolved tier, plus a recovering strategy's capture addend) actually feeds
   * this node's `score` — itself included when it contributes. Ordered by
   * contribution, largest first, id ascending on ties. Explainability only
   * ("via strategy-x"); nothing keys off it.
   */
  sources: string[];
}

// --- Weights -----------------------------------------------------------------
// Weights live in code, per clarification 11 — a weight change is an ordinary
// reviewed PR, never a graph edit. Authored per-tier boosts are used as-is
// (implicit weight 1); the one derived term below is scaled so a typical
// authored boost (small integers, 1-10 across the current graph) still
// dominates it.

/** Scales the normalized (0..1 per delegation, capped at 1) capture-resolution sum. */
const CAPTURE_TERM_WEIGHT = 1;

// --- Helpers -------------------------------------------------------------------

function isPlainObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Every map below is seeded/keyed from the SAME `nodes` source, so a lookup by
 * a known node id is a maintained invariant, not user input — `mustGet` turns a
 * violation into a clear error instead of an `as`-cast that would silently
 * paper over a real bug.
 */
function mustGet<V>(map: Map<string, V>, id: string, what: string): V {
  const value = map.get(id);
  if (value === undefined) {
    throw new IntentionSchemaError(`attention: expected ${what} for node id "${id}"`);
  }
  return value;
}

/**
 * A strategy's signal is unvalidated iff it has a gap, or no reading yet.
 *
 * `reading === null` is checked directly (not folded into the `deriveGap`
 * check alone) because `deriveGap` returns `null` whenever `success_signal`
 * is itself null — a strategy with no signal at all and no reading would
 * then read as "validated," which is wrong: a strategy that has not even
 * named a signal yet is exactly the unvalidated case this predicate exists
 * to flag. Keeping the `reading === null` disjunct preserves that case.
 */
export function isSignalUnvalidated(strategy: IntentionNode): boolean {
  return strategy.reading === null || deriveGap(strategy) !== null;
}

/**
 * The reverse `blocked_by` relation: `id -> every node that lists `id` in its
 * OWN blocked_by` — i.e. the nodes `id` blocks.
 *
 * ONE construction, shared by two consumers that must agree on its direction:
 *
 *  - `computeSignalPath`, where walking it (plus `parent`, downward) is how a
 *    node reaches a validates-terminal: completing it is on the path to
 *    completing something that validates a signal.
 *  - the parent relation inside `resolveAttention`, where a node's blockees are
 *    among its parents for exactly the same reason — the work `id` unblocks is
 *    what `id` is FOR, so `id` inherits its urgency.
 *
 * Values are in input order; every caller either sorts or treats them as a set.
 */
export function buildReverseBlockedBy(nodes: IntentionNode[]): Map<string, string[]> {
  const reverseBlockers = new Map<string, string[]>();
  for (const n of nodes) {
    for (const blocker of n.blocked_by) {
      const list = reverseBlockers.get(blocker);
      if (list) list.push(n.id);
      else reverseBlockers.set(blocker, [n.id]);
    }
  }
  return reverseBlockers;
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

/**
 * The capture addend a node contributes ON ITS OWN BEHALF: the summed severity
 * of the delegations IT recovers, capped at 1.
 *
 * Attribution sits on the node that OWNS the `recovers` edges (a strategy) and
 * nowhere else. It used to be recomputed from the TACTIC side by walking
 * `serves` back up to the recovering strategy; that walk is gone, because
 * `recovers` (and `serves`) are now parent edges, so the owning strategy's
 * addend reaches every descendant as ordinary lineage — one mechanism instead
 * of two, and correct at any depth rather than only one `serves` hop away.
 *
 * Tier-agnostic: capture severity is a property of the delegation, not of a
 * tier namespace, so the same addend applies in every tier's ranking.
 */
function captureAddendFor(n: IntentionNode, byId: Map<string, IntentionNode>): number {
  let sum = 0;
  for (const id of new Set(n.recovers)) {
    const delegation = byId.get(id);
    if (delegation !== undefined && delegation.kind === "delegation") {
      sum += captureScore(delegation);
    }
  }
  // Cap at 1 so ONE node's own addend never exceeds CAPTURE_TERM_WEIGHT: a
  // single node recovering several high-severity delegations cannot sum past 1.
  //
  // The cap is PER NODE, not per resolved score. `score` sums the contribution
  // of every distinct member of `{n} ∪ lineage(n)`, so a node whose lineage
  // holds several recovering strategies accumulates one capped addend from each
  // and its total capture contribution CAN exceed 1 (the live store already
  // reaches 1.67). That is the same additive treatment authored boosts get and
  // is deliberate; what it means is that "an authored boost always dominates
  // the derived term" holds per node, not per resolved score.
  return CAPTURE_TERM_WEIGHT * Math.min(1, sum);
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
 * Exported for the graph router's strategy-eligibility gate ("no non-draft
 * child tactics on the strategy's signal path"). It no longer feeds the rank:
 * the standalone signal TERM is gone (rank is the tier/band/score/depth key
 * below), but this reachability predicate is unchanged and still consumed. The
 * DFS does NOT throw on a cycle: a boolean OR-over-paths query is well-defined
 * even with a cycle in the mix — a node fully enclosed in a cycle with no
 * external escape to a terminal simply isn't on-path, which is the correct
 * answer, not an error.
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

  const reverseBlockers = buildReverseBlockedBy(nodes);

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

// --- Band --------------------------------------------------------------------

/**
 * The band axis: the best score among a node's PARENTS, read in the CHILD's
 * resolved tier.
 *
 * Doctrine (unified relation, per-tier boosts): band groups a node with the
 * strongest thing it hangs off, so a whole cohort under one hot parent sorts
 * together before each member's own score breaks ties inside the cohort. It is
 * derived from the parents' RESOLVED per-tier score, not from any authored term
 * read directly off the parent — a parent that is itself only hot by
 * inheritance bands its children just as strongly as one that authored the
 * boost, which is what "the cohort under this parent" is supposed to mean.
 *
 * The tier read is the CHILD's resolved tier, not each parent's own. A parent
 * sitting in a lower tier still bands its child by whatever that parent scores
 * in the CHILD's tier (usually 0, since a lower-tier node rarely authors a
 * higher-tier boost) — which is what keeps tier a real namespace rather than a
 * label that leaks magnitudes across scales.
 *
 * OWED RE-VALIDATION: the follow-up node `tactic-review-band-derivation-ratification`
 * owes re-validating precisely this choice — that band derives from the
 * parents' resolved rank rather than from their authored term. Both readings
 * were live when this was written; this one was taken so that inheritance and
 * authorship band identically. Revisit there, not here.
 *
 * Ties are broken by ascending parent id, so `bandSource` is deterministic.
 * `bandSource` is null exactly when `band` is 0 (no parents, or no parent
 * carries any score in this tier) — there is no meaningful source for a
 * zero band.
 */
function bandFor(
  parents: string[],
  tierKey: string,
  scoreByTier: Map<string, Map<string, number>>,
): { band: number; bandSource: string | null } {
  const scores = mustGet(scoreByTier, tierKey, "per-tier score table");
  let band = 0;
  let bandSource: string | null = null;
  for (const p of parents) {
    const parentScore = mustGet(scores, p, "score entry");
    if (parentScore > band) {
      band = parentScore;
      bandSource = p;
    }
  }
  return { band, bandSource };
}

// --- Resolver ------------------------------------------------------------------

/**
 * Resolve derived attention (rank) for every goal-layer node in the graph.
 *
 * Pure and deterministic: same nodes in, deep-equal map out. Derived values
 * are never written back to node frontmatter — `intentions/` stores intent,
 * not derived execution state.
 *
 * ## One relation
 *
 * `parents(n) = { n.parent } ∪ n.serves ∪ n.recovers ∪ { c : n ∈ c.blocked_by,
 * c not done }` — the node it hangs under, the nodes it expresses, the
 * delegations it unwinds, and the nodes it STILL unblocks. Every axis below
 * (tier, lineage, score, band) is derived from this ONE relation; there is no
 * second edge set and no per-axis special case.
 * `serves`/`recovers`/reverse-`blocked_by` are gated on the node being
 * goal-layer eligible, because a delegation's `serves` is deliberately
 * unenforced and must not be read as an attention edge. The reverse-`blocked_by`
 * half additionally drops DONE blockees (see the construction below): a done
 * parent stays transparent, but a done blockee leaves the relation entirely.
 *
 * ## Axes
 *
 *  - **tier** — `max(ownTier(n), max over parents p of tier(p))`, a monotone
 *    fixpoint. Resolved for EVERY node (an ineligible node can sit mid-chain
 *    relaying tier), though only eligible nodes get a `ResolvedAttention`.
 *  - **lineage** — `lineage(n) = ∪ over parents p of ({p} \ done) ∪ lineage(p)`,
 *    a monotone SET-union fixpoint. A set, not a path walk: an ancestor reached
 *    by two routes is one member, so it contributes once.
 *  - **score** — in tier T, the summed tier-T contribution of `{n} ∪ lineage(n)`.
 *    A node's contribution is its authored `attention.boosts[T]` (absent ⇒ 0 —
 *    "unauthored", never a minimum of 1) plus, for a strategy that owns
 *    `recovers` edges, its capture addend. Per-tier boosts ARE the tier
 *    isolation: in tier 2's ranking only `boosts["2"]` is ever read, so a
 *    tier-1 boost is invisible there by construction, with no filter to
 *    maintain.
 *  - **band** — see `bandFor`.
 *  - **depth** — `|lineage(n)|`.
 *
 * Consumers order by `compareRankKeyDesc` — `(tier, band, score, depth)`
 * descending — never by any single component.
 *
 * ## Terminal (`phase: "done"`) nodes
 *
 * A done node contributes NOTHING: its boost reads as 0, its own tier mark is
 * ignored (it asserts tier 1), and it is not a member of any lineage set, so it
 * adds no depth. As a PARENT it stays TRANSPARENT — traversal passes THROUGH
 * it, and it still relays an inherited tier — so a live child under a done
 * parent keeps everything above that parent. Severing the edge instead would
 * demote live children to band 0, which is wrong.
 *
 * As a BLOCKEE the ruling is the opposite: the edge is severed. Transparency is
 * right downward because a done parent still expresses what its live children
 * are FOR; it is wrong upward because a done blockee is no longer being held up
 * by anything, so a blocker must not go on inheriting its urgency.
 *
 * ## Cycles
 *
 * A pure `parent`-edge cycle still throws (see the guard below): it is a
 * malformed graph `validateGraph` does not catch, and `parent` is one pointer
 * per node so the check stays cheap. A MIXED cycle across the widened relation
 * (say `a.parent = b` with `a.blocked_by = [b]`) CAN arise again — the earlier
 * claim that it could not was true only while `blocked_by` was out of the
 * relation. It is not an error here: under the dedup set-union fixpoint a
 * cycle's members simply converge on overlapping lineage sets (sets are
 * bounded, so the iteration terminates), rather than diverging. REJECTING such
 * a cycle on the write path is out of scope for this resolver and belongs to
 * the sibling `tactic-attention-unified-relation-cycle-rule`; the obligation
 * here is only that resolution never hangs, which the fixpoint guarantees.
 *
 * Rank 0 is the neutral baseline: with no boosts anywhere and no `recovers`
 * edges, every eligible node resolves to score 0, band 0 and no sources.
 */
export function resolveAttention(nodes: IntentionNode[]): Map<string, ResolvedAttention> {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const sortedNodeIds = nodes.map((n) => n.id).sort();
  const doneIds = new Set(nodes.filter((n) => n.phase === "done").map((n) => n.id));

  const isEligible = (n: IntentionNode): boolean => {
    const kindNode = byId.get(`kind-${n.kind}`);
    return kindNode !== undefined && kindNode.attributes.goal_layer === true;
  };

  // --- Parent relation (precomputed ONCE) ----------------------------------

  // Built once, before any fixpoint, and read from by all three sweeps below
  // (lineage, tier) plus the band pass. It is a pure function of immutable
  // input node data, so hoisting it out of the sweeps changes no result — only
  // the cost, which matters now that several fixpoints share the relation.
  const reverseBlocked = buildReverseBlockedBy(nodes);
  const parentIds = new Map<string, string[]>();
  for (const n of nodes) {
    const ids = new Set<string>();
    if (n.parent !== null && byId.has(n.parent)) ids.add(n.parent);
    if (isEligible(n)) {
      for (const s of n.serves) if (byId.has(s)) ids.add(s);
      for (const r of n.recovers) if (byId.has(r)) ids.add(r);
      // A DONE blockee is dropped from the relation entirely — not merely made
      // transparent like a done PARENT. The two directions are not symmetric.
      // A done parent still expresses what its live children are FOR, so its
      // own lineage must keep reaching them. A done blockee expresses nothing
      // any more: `id` is not holding it up, because it is finished. Keeping
      // the edge would let a blocker inherit, forever, the tier/band/score of
      // work that already completed — and `blocked_by` edges to done nodes are
      // never cleaned up (`blockersComplete` treats a done blocker as cleared
      // rather than rewriting the edge), so those stale edges accumulate. This
      // is the same "a done blocker is cleared" convention `openBlockers` and
      // the retired `officeHours` surfacing lift both applied.
      for (const b of reverseBlocked.get(n.id) ?? []) {
        if (byId.has(b) && !doneIds.has(b)) ids.add(b);
      }
    }
    parentIds.set(n.id, [...ids].sort());
  }

  // A pure `parent`-edge cycle is a malformed graph (a node that is its own
  // ancestor) that `validateGraph` does NOT catch — rule 15 rejects only
  // `blocked_by` cycles. `parent` is a single pointer per node, so following it
  // from any node either reaches a root (`parent === null`) or repeats; a
  // repeat is the cycle. Surface it as a clear error rather than let the
  // fixpoint silently converge it. This guards ONLY the single-pointer parent
  // chain — it is deliberately NOT extended to the widened relation, which can
  // form mixed cycles that converge harmlessly (see the doc comment above).
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

  // --- Lineage (monotone SET-union fixpoint over the parent relation) ------

  // lineage(n) = ∪ over parents p of ({p} minus done nodes) ∪ lineage(p).
  // Seeded empty, then swept in sorted id order until a full sweep adds
  // nothing. Sets only grow and are bounded by the node count, so convergence
  // is guaranteed even through a mixed cycle; comparing sizes across a sweep is
  // a sufficient change test precisely because growth is monotone. The least
  // fixpoint does not depend on sweep order, so the result is input-order
  // independent.
  const lineage = new Map<string, Set<string>>();
  for (const id of sortedNodeIds) lineage.set(id, new Set<string>());

  let lineageChanged = true;
  while (lineageChanged) {
    lineageChanged = false;
    for (const id of sortedNodeIds) {
      const set = mustGet(lineage, id, "lineage entry");
      const before = set.size;
      for (const p of mustGet(parentIds, id, "parentIds entry")) {
        // A done parent is traversed THROUGH but never joins the set: it
        // contributes no score and no depth, while its own lineage (everything
        // above it) still flows down.
        if (!doneIds.has(p)) set.add(p);
        for (const ancestor of mustGet(lineage, p, "lineage entry")) set.add(ancestor);
      }
      if (set.size !== before) lineageChanged = true;
    }
  }

  // --- Effective tier (monotone fixpoint over the SAME relation) -----------

  // effectiveTier(n) = max(ownTier(n), max over parents p of effectiveTier(p)),
  // where a done node's OWN mark is ignored (it asserts the default tier) while
  // it still relays whatever it inherits. Values only increase and are bounded
  // by the top tier, so convergence is guaranteed.
  //
  // Resolved for EVERY node, not just eligible ones: an ineligible node (a
  // virtue, say) can sit mid-chain and relay a tier to its descendants, so
  // skipping it would silently cut the chain. Only eligible nodes still get a
  // `ResolvedAttention` entry in the output map.
  const effectiveTier = new Map<string, number>();
  for (const n of nodes) effectiveTier.set(n.id, doneIds.has(n.id) ? 1 : ownTier(n));

  let tierChanged = true;
  while (tierChanged) {
    tierChanged = false;
    for (const id of sortedNodeIds) {
      let next = mustGet(effectiveTier, id, "effectiveTier entry");
      for (const p of mustGet(parentIds, id, "parentIds entry")) {
        next = Math.max(next, mustGet(effectiveTier, p, "effectiveTier entry"));
      }
      if (next !== mustGet(effectiveTier, id, "effectiveTier entry")) {
        effectiveTier.set(id, next);
        tierChanged = true;
      }
    }
  }

  // --- Per-tier contribution and score -------------------------------------

  const tierKeys = TIERS.map((t) => String(t));

  // One node's own contribution in tier T: its authored boost on that tier's
  // scale (absent ⇒ 0, the "unauthored" reading — never a floor of 1) plus its
  // own capture addend. A done node contributes nothing at all.
  const contributionOf = (id: string, tierKey: string): number => {
    const n = mustGet(byId, id, "node");
    if (n.phase === "done") return 0;
    const attention = isEligible(n) ? n.attention : null;
    const authored = attention?.boosts[tierKey] ?? 0;
    return authored + captureAddendFor(n, byId);
  };

  // contributors(n) = {n} ∪ lineage(n), as a SET — so an ancestor reached by
  // several paths is summed once, and a node caught in a cycle (where it can
  // appear in its own lineage) is not double-counted either.
  const contributors = new Map<string, string[]>();
  for (const id of sortedNodeIds) {
    const set = new Set(mustGet(lineage, id, "lineage entry"));
    set.add(id);
    contributors.set(id, [...set].sort());
  }

  const scoreByTier = new Map<string, Map<string, number>>();
  for (const tierKey of tierKeys) {
    const scores = new Map<string, number>();
    for (const id of sortedNodeIds) {
      let score = 0;
      for (const c of mustGet(contributors, id, "contributors entry")) {
        score += contributionOf(c, tierKey);
      }
      scores.set(id, score);
    }
    scoreByTier.set(tierKey, scores);
  }

  // --- Compose --------------------------------------------------------------

  // Iterate in id order for a deterministic result regardless of input order.
  const result = new Map<string, ResolvedAttention>();
  for (const id of sortedNodeIds) {
    const node = mustGet(byId, id, "node");
    if (!isEligible(node)) continue;

    const tier = mustGet(effectiveTier, id, "effectiveTier entry");
    const tierKey = String(tier);
    const score = mustGet(mustGet(scoreByTier, tierKey, "per-tier score table"), id, "score entry");
    const parents = mustGet(parentIds, id, "parentIds entry");
    const { band, bandSource } = bandFor(parents, tierKey, scoreByTier);
    const lineageSet = mustGet(lineage, id, "lineage entry");

    // Explainability only: who actually put magnitude on this node, largest
    // contribution first, id ascending on ties.
    const sources = mustGet(contributors, id, "contributors entry")
      .map((c) => ({ id: c, amount: contributionOf(c, tierKey) }))
      .filter((c) => c.amount > 0)
      .sort((a, b) => (a.amount !== b.amount ? b.amount - a.amount : a.id < b.id ? -1 : 1))
      .map((c) => c.id);

    result.set(id, { tier, band, score, depth: lineageSet.size, bandSource, sources });
  }
  return result;
}
