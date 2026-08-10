import { createHash } from "node:crypto";
import { computeSignalPath, isSignalUnvalidated, resolveAttention } from "./attention.js";
import { isStrategyStale, REVIEWED_MARKER } from "./transitions.js";
import { ownTier, PHASES } from "./schema.js";
import type { FixState, IntentionNode, Phase } from "./schema.js";

// Graph router v2, first half: selection (tactic-graph-router-selector).
//
// This module is the PURE part of the graph selector: same nodes in, same
// ordered candidate list out. Everything environmental — the origin/main store
// snapshot, the claimed set (live sessions + reservation ledger), the per-phase
// sensor gates that need gh (CI verdict, PR merged), pacing, and the selection
// log — lives in the shell wrapper
// (.claude/skills/dispatch-propagate/scripts/graph-select-target).
//
// Eligibility and ordering spec: intentions/tactic-graph-native-dispatch.md
// §3.1–3.2.

// --- Types -------------------------------------------------------------------

/** One selectable node, in selection order. */
export interface GraphCandidate {
  id: string;
  kind: "strategy" | "tactic";
  /** The tactic's persisted phase; `align-tactics` for a strategy. */
  phase: string;
  /**
   * The node's OWN resolved attention rank — the inner ordering axis, under
   * `tier`. Reported as resolved for THIS node; never lifted by blocking.
   */
  rank: number;
  /**
   * The node's OWN resolved effective tier (`resolveAttention`'s `tier`) — the
   * outer ordering axis. Order lexicographically by `(tier, rank)`, never by
   * `rank` alone. Like `rank`, this is the node's own reported value and is
   * never lifted by blocking.
   */
  tier: number;
  /**
   * The lexicographic `(tier, rank)` pair this candidate actually SORTS at —
   * its selection precedence, which is the lexicographic max of the node's own
   * `(tier, rank)` and the precedence of every node it blocks (recursive,
   * max-based, never additive; see `effectivePrecedence`).
   *
   * Kept alongside `tier`/`rank` rather than replacing them: a blocker is
   * RANKED higher (it drains at the urgency of what waits on it) without being
   * BOOSTED higher (its own reported attention is untouched).
   */
  precedence: { tier: number; rank: number };
  /** The node's authored pace-gate bypass flag (strategy clarification 14). */
  pace_exempt: boolean;
  /** The tactic's execution.pr — the wrapper's sensor-gate input. Null for strategies. */
  pr: number | null;
  /**
   * The tactic's raw `execution.fix` interrupt state, or null. Surfaced so the
   * shell sensor-gate (`graph-select-target`) reads the interrupt AND its
   * `pushed_sha` (the pending-CI guard) straight off the candidate object
   * without a second store read — the CI-routing decision (enter/resolve fix)
   * is bash's, but the state it keys on stays in this pure TS layer. Null for
   * strategies and for a tactic with no active interrupt. Note `phase` above is
   * already overwritten to `"fix"` whenever this is non-null.
   */
  fix: FixState | null;
  /**
   * True when this candidate is a soft-freeze re-evaluation session (strategy
   * clarification 10) rather than an ordinary decomposition round — a stale
   * frozen tactic re-surfacing at `align-tactics`
   * (tactic-graph-frozen-tactic-dispatch). False for a fresh draft-tactic or
   * strategy align candidate.
   */
  reevaluation: boolean;
}

/** A structured note the wrapper writes to the selection log. */
export interface SelectionEvent {
  event: "freeze" | "rounds-cap" | "stale-reading" | "precedence-cycle";
  /**
   * The node the event is about: the serving strategy for
   * `freeze`/`rounds-cap`/`stale-reading`, and the node the cycle's back edge
   * re-entered for `precedence-cycle` (which is a tactic as often as a
   * strategy).
   */
  strategy: string;
  detail: string;
}

export interface GraphSelection {
  /**
   * Eligible nodes in selection order: lexicographic `(tier, rank)` over each
   * candidate's LIFTED `precedence` — tier desc, then rank desc — then
   * progression ordinal desc, then id asc.
   */
  candidates: GraphCandidate[];
  /** Freeze / cap / gate events observed during the scan. */
  events: SelectionEvent[];
}

// --- Strategy substance fingerprint -------------------------------------------

/**
 * The serving strategy's substance fingerprint (strategy clarification 10):
 * sha256 over the canonical JSON of the substance fields — statement,
 * clarifications, conditions (`attributes.conditions`), serves,
 * success_signal, tooling_goals. State writes (`reading` / `gap` / `rounds` /
 * `office_hours` / attention) never change it.
 *
 * `serves` is order-normalized (sorted) so an edge reorder is not substance;
 * clarifications keep author order (their sequence is meaningful dialectic
 * history). Each clarification's `id` is included in the hashed shape only
 * when non-null: `id: null` is the overwhelming common case (no citation slug
 * assigned yet) and predates the `id` field entirely, so it must hash exactly
 * as `{question, answer}` did before `id` existed — otherwise this
 * schema-widening alone would falsely invalidate every already-stamped
 * fingerprint graph-wide. Assigning a real (non-null) id IS a substantive
 * edit — a citable slug being added/changed/removed — so it stays hashed.
 */
export function strategyFingerprint(strategy: IntentionNode): string {
  const substance = {
    statement: strategy.statement,
    clarifications: strategy.clarifications.map((c) =>
      c.id === null ? { question: c.question, answer: c.answer } : c,
    ),
    conditions: strategy.attributes.conditions ?? null,
    serves: [...strategy.serves].sort(),
    success_signal: strategy.success_signal,
    tooling_goals: strategy.tooling_goals,
  };
  return createHash("sha256").update(JSON.stringify(substance)).digest("hex");
}

/**
 * A tactic's SCOPE fingerprint (chain-of-custody, 2026-07-06): sha256 over the
 * node's `statement` plus its markdown body — the plan content a phase worker
 * executes against — and NOTHING from the frontmatter state fields
 * (`phase`/`execution`/`attempts`/`markers`/`office_hours`/`attention`), so a
 * transition or park write never changes it. Residue sections appended to the
 * body ARE scope and DO change it; the transition writer refreshes the stamp
 * after such an append so machinery appends do not trip the chain-of-custody
 * gate (see `tactic-graph-router-transitions`).
 *
 * Takes `(statement, body)` rather than a node because `readNode` intentionally
 * drops the body (only frontmatter is authoritative on read); the caller reads
 * the body verbatim via `readNodeBody` and passes both, keeping this function
 * pure and store-independent. The pair is hashed as canonical JSON so the field
 * boundary is unambiguous (a body starting with the statement text cannot alias
 * a different statement/body split).
 */
export function tacticScopeFingerprint(statement: string, body: string): string {
  return createHash("sha256").update(JSON.stringify({ statement, body })).digest("hex");
}

// --- Helpers -------------------------------------------------------------------

/** Draft phase: `phase: draft`, or equivalently no phase set (§1.1). */
function isDraft(tactic: IntentionNode): boolean {
  return tactic.phase === null || tactic.phase === "draft";
}

/** Open = in flight: a phase set, and neither draft nor done. (Type predicate:
 * a passing tactic provably carries a non-null phase.) */
function isOpenTactic(tactic: IntentionNode): tactic is IntentionNode & { phase: Phase } {
  return !isDraft(tactic) && tactic.phase !== "done";
}

/**
 * The SIGNAL STRING an open tactic's candidate is emitted at — what the shell
 * layer routes on, which is not always the node's persisted ladder `phase`.
 *
 * `fix`, `conflict`, and `pending-merge` are shell-facing signal strings, NOT
 * `Phase` enum members (`PHASES`, schema.ts): the CI-fix and merge-conflict
 * interrupts are carried ORTHOGONALLY on `execution.fix` / `execution.conflict`
 * while the node's real ladder phase stays put, and `pending-merge` names a
 * state (reviewed, awaiting auto-merge) rather than a rung. That is the same
 * precedent that kept `fix` out of `PHASES` when the CI-fix interrupt landed.
 *
 * Precedence, highest first:
 *  1. an active CI-fix interrupt → `fix` (unchanged; fix outranks everything,
 *     including a simultaneously-set conflict interrupt);
 *  2. else an active merge-conflict interrupt → `conflict`;
 *  3. else a reviewed-awaiting-merge node (`phase: review` carrying
 *     `REVIEWED_MARKER`) → `pending-merge`, emitted ONLY when no interrupt is
 *     active — a node under a conflict interrupt emits `conflict` directly and
 *     never `pending-merge`;
 *  4. else the real ladder phase.
 *
 * A reviewed node is therefore NEVER re-emitted as a plain `review` candidate:
 * the review pass already ran, and re-running it would discard its verdict.
 */
function tacticSignalPhase(t: IntentionNode & { phase: Phase }): string {
  if (t.execution?.fix != null) return "fix";
  if (t.execution?.conflict != null) return "conflict";
  if (t.phase === "review" && t.execution?.markers.includes(REVIEWED_MARKER)) return "pending-merge";
  return t.phase;
}

/**
 * The strategies a tactic belongs to: its own `serves` plus the `serves` of
 * every `parent` ancestor (a subtree's root tactic serves the strategy; its
 * descendants belong through the chain). Cycle-safe.
 */
export function servingStrategyIds(tactic: IntentionNode, byId: Map<string, IntentionNode>): Set<string> {
  const result = new Set<string>();
  const visited = new Set<string>();
  let current: IntentionNode | undefined = tactic;
  while (current !== undefined && !visited.has(current.id)) {
    visited.add(current.id);
    for (const s of current.serves) result.add(s);
    current = current.parent !== null ? byId.get(current.parent) : undefined;
  }
  return result;
}

/**
 * Extract the newest ISO date (YYYY-MM-DD) mentioned anywhere in a free-text
 * reading, or null when the text carries no parseable date. Readings are
 * sensor/interview prose (e.g. "single holder, nothing documented (owner
 * interview, 2026-07-02)"), so the date embedded in the text is the reading's
 * timestamp for the fresh-reading gate.
 */
export function readingDate(reading: string): string | null {
  const matches = reading.match(/\d{4}-\d{2}-\d{2}/g);
  if (matches === null) return null;
  return matches.reduce((a, b) => (a > b ? a : b));
}

/**
 * blocked_by completeness: a blocker is complete when it is ABSENT from the
 * store (prune-on-done makes absence completion) or present with `phase:
 * done` (the transient window between the done transition and its prune).
 * A present, not-done blocker blocks.
 *
 * Exported for the review-stall sweep
 * (`.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall`),
 * which must skip a node already held by an open blocker (e.g. the
 * `provision-conflict` hold it just landed) rather than re-holding it every
 * tick — the same completeness rule the selector applies.
 *
 * PRECONDITION — `byId` must come from a STRICT enumeration
 * (`listNodesStrict`, never the tolerant `listNodes`). Absence is read as
 * completion here, so a blocker file the tolerant reader silently drops (0-byte,
 * truncated, conflict-markered, schema-invalid) would unblock its dependent and
 * let the selector dispatch it — a fail-open gate. Every caller of this function
 * and of `selectGraphTargets` therefore enumerates strictly.
 */
export function blockersComplete(tactic: IntentionNode, byId: Map<string, IntentionNode>): boolean {
  for (const blockerId of tactic.blocked_by) {
    const blocker = byId.get(blockerId);
    if (blocker !== undefined && blocker.phase !== "done") return false;
  }
  return true;
}

/** A lexicographic `(tier, rank)` selection-precedence pair — tier outermost. */
export interface Precedence {
  tier: number;
  rank: number;
}

/**
 * `effectivePrecedence`'s output: the per-node precedence map plus any
 * `precedence-cycle` events observed while walking the blocking relation. The
 * events travel with the map so the caller can forward them to the selection
 * log — a cycle is a store defect worth surfacing, just not one worth halting
 * selection over.
 */
export interface PrecedenceResult {
  precedence: Map<string, Precedence>;
  events: SelectionEvent[];
}

/** Lexicographic max: tier first, rank only when tiers are equal. */
function maxPrecedence(a: Precedence, b: Precedence): Precedence {
  if (a.tier !== b.tier) return a.tier > b.tier ? a : b;
  return a.rank >= b.rank ? a : b;
}

/**
 * Selection precedence per node: the lexicographic `(tier, rank)` pair each
 * node SORTS at, as opposed to the `(tier, rank)` it reports.
 *
 * A node's precedence is the lexicographic max over its own resolved
 * `(tier, value)` and the precedence of every node that lists IT in that node's
 * `blocked_by` — i.e. every node this node blocks. Recursive (a blocker of a
 * blocker lifts too) and MAX-BASED, never additive: blocking two tier-3 nodes
 * lifts a blocker to tier 3, not to "tier 6" or a summed rank. This replaces
 * the retired backward-flow doctrine in the authored attention term: a boost no
 * longer FLOWS into blockers (which made a node's reported rank a function of
 * who happened to wait on it); instead the blocker keeps its own values and
 * merely drains at the urgency of what it holds up.
 *
 * Computed over the FULL node array, not just the eligible/candidate list: a
 * blocked node is itself ineligible to be a candidate, so its urgency reaches
 * the selector ONLY through this lift onto its blocker.
 *
 * Blocking still GATES eligibility (`blockersComplete`) — precedence is a
 * separate, ordering-only concern and never makes an ineligible node eligible.
 *
 * Cycle guard: `validateGraph` rule 15 forbids `blocked_by` cycles, but the
 * selector runs over a store snapshot that was never necessarily validated, so
 * the rule is not relied on here. Re-entering a node still on the recursion
 * stack does NOT throw: the back edge is skipped (the re-entered node
 * contributes only its own `(tier, rank)` pair to that branch) and a
 * `precedence-cycle` `SelectionEvent` naming the cycle is recorded. Never a
 * silent 0 and never an infinite loop, but also never fatal — selection is the
 * READ path for the whole autonomous fleet, and a single malformed node file
 * (two concurrent graph-commits each validated against a base missing the
 * other's edge, or a hand-committed edit that skipped validation) must degrade
 * the ORDERING of the nodes in the cycle, not empty the candidate list and halt
 * every tick. The hard rejection stays where it belongs: `validateGraph` rule 15
 * on the WRITE path. Ordering under a cycle stays deterministic — memoized,
 * max-based, and entered in id order.
 */
export function effectivePrecedence(nodes: IntentionNode[]): PrecedenceResult {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const attention = resolveAttention(nodes);

  // reverseBlockers(id) = every node that lists `id` in its OWN blocked_by —
  // i.e. the nodes `id` blocks. Same construction as `computeSignalPath`'s.
  const reverseBlockers = new Map<string, string[]>();
  for (const n of nodes) {
    for (const blocker of n.blocked_by) {
      const list = reverseBlockers.get(blocker);
      if (list) list.push(n.id);
      else reverseBlockers.set(blocker, [n.id]);
    }
  }

  // The node's OWN pair. An ineligible node (not goal-layer) has no
  // `ResolvedAttention` entry; it can still sit mid-chain, so fall back to its
  // own authored tier and the neutral rank baseline (0) rather than dropping it.
  const ownPair = (id: string): Precedence => {
    const resolved = attention.get(id);
    if (resolved !== undefined) return { tier: resolved.tier, rank: resolved.value };
    const node = byId.get(id);
    return { tier: node !== undefined ? ownTier(node) : 1, rank: 0 };
  };

  const memo = new Map<string, Precedence>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const events: SelectionEvent[] = [];
  // One event per distinct back edge, not one per traversal that crosses it.
  const reportedBackEdges = new Set<string>();

  const resolve = (id: string): Precedence => {
    const cached = memo.get(id);
    if (cached !== undefined) return cached;
    if (onStack.has(id)) {
      // Cycle: skip the back edge rather than throwing. `id` contributes only
      // its own pair to this branch; the frame that is still resolving `id`
      // higher up the stack folds in the rest and memoizes the full value, so
      // every node in the cycle still ends up with the max over the cycle's own
      // pairs — degraded ordering, not a dropped candidate list.
      const edge = `${stack[stack.length - 1] ?? ""} -> ${id}`;
      if (!reportedBackEdges.has(edge)) {
        reportedBackEdges.add(edge);
        events.push({
          event: "precedence-cycle",
          strategy: id,
          detail:
            `blocked_by cycle: ${[...stack, id].join(" -> ")}; back edge skipped, ` +
            "precedence for these nodes degrades to the max of their own (tier, rank) pairs " +
            "(validateGraph rule 15 rejects such a cycle at the write path)",
        });
      }
      return ownPair(id);
    }
    onStack.add(id);
    stack.push(id);

    let best: Precedence = ownPair(id);

    for (const blocked of reverseBlockers.get(id) ?? []) {
      if (!byId.has(blocked)) continue;
      best = maxPrecedence(best, resolve(blocked));
    }

    stack.pop();
    onStack.delete(id);
    memo.set(id, best);
    return best;
  };

  // Deterministic entry order (id ascending): the max-fold result is
  // order-independent for an acyclic store, and pinning the order keeps the
  // degraded cyclic case deterministic too.
  for (const id of nodes.map((n) => n.id).sort()) resolve(id);
  return { precedence: memo, events };
}

/**
 * A candidate's progression ordinal over the full `PHASES` order (schema.ts):
 * the index of its effective phase, so a MORE-progressed candidate carries a
 * HIGHER index. The sort comparator reverses this (descending) to drain
 * closest-to-done first.
 *
 * A strategy carries no persisted phase — its directive rung is `align-tactics`
 * (index 1). A tactic uses its node's persisted `phase`, falling back to
 * `draft` (index 0) when the node lookup somehow fails, matching the draft
 * convention (`phase: null` == draft).
 *
 * Note this reorders `fix` vs `qa` relative to the retired `PHASE_LADDER`: under
 * `PHASES`, `qa` (index 4) is more-progressed than `fix` (index 3), so `qa` now
 * sorts before `fix` — a deliberate behavior change.
 */
function progressionIndex(candidate: GraphCandidate, byId: Map<string, IntentionNode>): number {
  const node = byId.get(candidate.id);
  const p: Phase =
    candidate.kind === "strategy" ? "align-tactics" : node?.phase ?? "draft";
  return PHASES.indexOf(p);
}

// --- Selector ------------------------------------------------------------------

/**
 * Compute the ordered graph-selection candidates over a store snapshot.
 *
 * Tactic eligibility (§3.1): `office_hours` null; `phase` set and neither
 * `draft` nor `done`; `blocked_by` fully complete (absence = completion);
 * subtree not soft-frozen. The phase SENSOR gate (CI verdict present before
 * fix/qa/review, PR merged before main-qa) is environmental and applied by the
 * wrapper, which receives each candidate's `phase` and `pr`.
 *
 * Strategy eligibility (§3.1): `office_hours` null; no non-draft child tactic
 * on the strategy's signal path (drafts are input; off-path tactics linger at
 * derived demoted rank by design); signal unvalidated (`gap` non-null or
 * `reading` null); `rounds.count < 2` (at the cap a `rounds-cap` event is
 * logged and the strategy is skipped — the park write belongs to the transition
 * writer, never to selection, which makes no graph writes); then the
 * fresh-reading gate, keyed off the last align-landing: eligible when
 * `rounds.last_aligned` is null (never aligned) or when `reading` is present and
 * dated strictly newer than `rounds.last_aligned` — a reading with no parseable
 * date, or no reading at all once `last_aligned` is set, fails the gate and logs
 * a `stale-reading` event.
 *
 * Soft-freeze gate (strategy clarification 10): an open tactic stamped with a
 * non-null `execution.strategy_fingerprint` differing from the serving
 * strategy's current substance fingerprint freezes only that stale-stamped
 * child — not its whole sibling subtree — excluding it from its normal phase
 * skill (in-flight phases finish on their own), and a `freeze` event is
 * logged. Per tactic-graph-frozen-tactic-dispatch (clarification 52) the
 * re-evaluation now targets the frozen TACTICS directly: each stale child
 * re-surfaces as a `kind: "tactic", phase: "align-tactics", reevaluation:
 * true` candidate (office_hours null and complete blockers still apply),
 * rather than the strategy id. A fresh-stamped or null-stamped sibling under
 * the same strategy is untouched by another child's staleness and keeps its
 * ordinary phase-skill candidate. Null fingerprints are not stale — stamping
 * starts when the align machinery lands.
 *
 * Frozen-tactic candidates (tactic-graph-frozen-tactic-dispatch): draft/raw
 * tactics (`phase: draft` or null) are also first-class selectable candidates
 * that route to `/align-tactics` (`reevaluation: false`, `pr: null`), gated on
 * office_hours null and complete blockers. Their candidate `phase` is the
 * directive rung `align-tactics`, but the progression ordinal reads the node's
 * REAL phase (draft, index 0) for sorting, so a draft sorts last among ties.
 * A strategy with only draft children still emits its own fresh-round
 * align-tactics candidate; the two compete by rank.
 *
 * Order: lexicographic `(tier, rank)`, tier outermost — both node-keyed and
 * directly from `resolveAttention` (the retired node↔issue rank-map bridge is
 * not revived). A tier-2 node at rank 0 therefore outranks a tier-1 node with
 * any boost; rank orders only WITHIN a tier. The pair actually sorted is each
 * candidate's `precedence`, not its own reported `(tier, rank)`: a node's
 * selection precedence is lifted to the lexicographic max of its own pair and
 * the precedence of every node it blocks (`effectivePrecedence` — recursive,
 * max-based, never additive), so a blocker drains at the urgency of what waits
 * on it while its own reported `tier`/`rank` stay untouched. Blocking still
 * gates and serializes eligibility; it never boosts. Within one precedence pair
 * the progression ordinal (full `PHASES` order) sorts the more-progressed
 * candidate first; id ascending as the deterministic tiebreak.
 */
export function selectGraphTargets(nodes: IntentionNode[]): GraphSelection {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const attention = resolveAttention(nodes);
  // Computed over the FULL node array: a blocked node is never a candidate, so
  // its urgency reaches selection only as a lift onto the blocker. A malformed
  // store with a `blocked_by` cycle degrades ordering and logs a
  // `precedence-cycle` event; it never empties the candidate list.
  const { precedence, events: precedenceEvents } = effectivePrecedence(nodes);
  const onPath = computeSignalPath(nodes);
  const events: SelectionEvent[] = [...precedenceEvents];

  /** The node's OWN reported tier (never lifted). */
  const tierOf = (n: IntentionNode): number => attention.get(n.id)?.tier ?? ownTier(n);
  /** The lifted pair the candidate sorts at. */
  const precedenceOf = (n: IntentionNode): Precedence =>
    precedence.get(n.id) ?? { tier: tierOf(n), rank: attention.get(n.id)?.value ?? 0 };

  const strategies = nodes.filter((n) => n.kind === "strategy");
  const tactics = nodes.filter((n) => n.kind === "tactic");

  // Child tactics per strategy (serves-edge membership, parent-chain inherited).
  const childrenOf = new Map<string, IntentionNode[]>();
  for (const s of strategies) childrenOf.set(s.id, []);
  for (const t of tactics) {
    for (const sid of servingStrategyIds(t, byId)) {
      childrenOf.get(sid)?.push(t);
    }
  }

  // --- Soft-freeze scan ------------------------------------------------------
  const frozenTacticIds = new Set<string>();
  for (const s of strategies) {
    const fp = strategyFingerprint(s);
    const children = childrenOf.get(s.id) ?? [];
    // Per-strategy staleness: a child freezes THIS strategy only if its stamp
    // carries an entry for `s.id` that differs from `s`'s current fingerprint
    // (or a legacy bare-string stamp differing from it). A multi-serves tactic
    // whose map is fresh against `s.id` does not freeze `s`, even if another of
    // its serving strategies has since drifted.
    const stale = children.filter((t) => isOpenTactic(t) && isStrategyStale(t.execution, s.id, fp));
    if (stale.length === 0) continue;
    for (const t of stale) frozenTacticIds.add(t.id);
    events.push({
      event: "freeze",
      strategy: s.id,
      detail: `stale strategy_fingerprint on ${stale.map((t) => t.id).join(", ")}`,
    });
  }

  const candidates: GraphCandidate[] = [];

  // Subtree-parent ids: a tactic named as another tactic's `parent` is a
  // permanent container that completes only when its last child completes.
  // It is always phase-null by design, so it must not re-surface as an
  // undecomposed draft align-tactics candidate below.
  const subtreeParentIds = new Set<string>();
  for (const t of tactics) {
    if (t.parent !== null) subtreeParentIds.add(t.parent);
  }

  // --- Tactic candidates -------------------------------------------------------
  for (const t of tactics) {
    if (t.office_hours !== null) continue;
    if (!isOpenTactic(t)) continue;
    if (frozenTacticIds.has(t.id)) continue;
    if (!blockersComplete(t, byId)) continue;
    // NO reviewed-marker exclusion here (tactic-graph-router-conflict-routing):
    // a reviewed node awaiting its armed auto-merge is SURFACED, as a
    // `pending-merge` candidate, not dropped. That is what lets the shell's
    // sensor gate read the PR's mergeability every tick and, on CONFLICTING,
    // enter the orthogonal `execution.conflict` interrupt — after which the
    // same node re-surfaces as a `conflict` candidate (see
    // `tacticSignalPhase`) and routes to /dispatch-conflict, resolving via
    // apply-conflict-state without ever touching the review verdict. The
    // out-of-band review-stall sweep no longer detects CONFLICTING at all (its
    // conflict arm is retired); a stranded RED node still reaches `fix` through
    // that sweep's surviving CI arm, and `fix` outranks `pending-merge` in
    // `tacticSignalPhase`. A reviewed node is never re-emitted as `review`.
    candidates.push({
      id: t.id,
      kind: "tactic",
      // Signal string, not necessarily the persisted ladder phase: an active
      // interrupt (`execution.fix` / `execution.conflict`) or the
      // reviewed-awaiting-merge state overrides it, while the node's real
      // `phase` stays put and the interrupt is carried orthogonally.
      phase: tacticSignalPhase(t),
      rank: attention.get(t.id)?.value ?? 0,
      tier: tierOf(t),
      precedence: precedenceOf(t),
      pace_exempt: t.pace_exempt,
      pr: t.execution?.pr ?? null,
      fix: t.execution?.fix ?? null,
      reevaluation: false,
    });
  }

  // --- Frozen tactic candidates ------------------------------------------------
  // Draft/raw tactics and soft-frozen tactics are first-class selectable nodes
  // that route to /align-tactics (tactic-graph-frozen-tactic-dispatch). A draft
  // is a decomposition input surfaced for its own align session; a soft-frozen
  // tactic's normal phase skill is suppressed above, but a re-evaluation
  // /align-tactics candidate is emitted here so the stale plan is re-aligned
  // against the drifted strategy. Both gate on office_hours null and complete
  // blockers. A tactic that is neither draft nor soft-frozen is already handled
  // by the executable loop above (or is done / not eligible) and skipped here.
  for (const t of tactics) {
    if (t.office_hours !== null) continue;
    if (!blockersComplete(t, byId)) continue;
    if (isDraft(t)) {
      if (subtreeParentIds.has(t.id)) continue; // permanent container, not an undecomposed draft
      candidates.push({
        id: t.id,
        kind: "tactic",
        phase: "align-tactics", // directive rung, not the node's real (null) phase
        rank: attention.get(t.id)?.value ?? 0,
        tier: tierOf(t),
        precedence: precedenceOf(t),
        pace_exempt: t.pace_exempt,
        pr: null,
        fix: null,
        reevaluation: false,
      });
    } else if (frozenTacticIds.has(t.id) && isOpenTactic(t)) {
      candidates.push({
        id: t.id,
        kind: "tactic",
        phase: "align-tactics",
        rank: attention.get(t.id)?.value ?? 0,
        tier: tierOf(t),
        precedence: precedenceOf(t),
        pace_exempt: t.pace_exempt,
        pr: t.execution?.pr ?? null,
        fix: t.execution?.fix ?? null,
        reevaluation: true,
      });
    }
  }

  // --- Strategy candidates -------------------------------------------------------
  for (const s of strategies) {
    if (s.office_hours !== null) continue;

    const asCandidate = (reevaluation: boolean): GraphCandidate => ({
      id: s.id,
      kind: "strategy",
      phase: "align-tactics",
      rank: attention.get(s.id)?.value ?? 0,
      tier: tierOf(s),
      precedence: precedenceOf(s),
      pace_exempt: s.pace_exempt,
      pr: null,
      fix: null,
      reevaluation,
    });

    // No OPEN (non-draft, non-done) child tactics on the strategy's signal path.
    // Excluding `done` is load-bearing: reconciled tactics PERSIST on disk
    // (reconcile-graph writes `phase: "done"` and no longer prunes), and
    // computeSignalPath does not filter by phase — so a completed child would
    // otherwise sit on the signal path forever and permanently disqualify its
    // serving strategy from every future align round.
    const children = childrenOf.get(s.id) ?? [];
    if (children.some((t) => isOpenTactic(t) && onPath.has(t.id))) continue;

    // Signal unvalidated.
    if (!isSignalUnvalidated(s)) continue;

    // Round cap: at rounds.count >= 2 the router parks the strategy instead of
    // selecting it. Selection makes no graph writes, so here the cap is a
    // logged skip; the park write is the transition writer's.
    const count = s.rounds?.count ?? 0;
    if (count >= 2) {
      events.push({
        event: "rounds-cap",
        strategy: s.id,
        detail: `rounds.count=${count} >= 2; park instead of a new round`,
      });
      continue;
    }

    // Fresh-reading gate: keyed off the last align-landing (`rounds.last_aligned`),
    // not the round counter — born-parked reading children never prune, so
    // `rounds.count` can stay 0 while the strategy has been aligned repeatedly.
    // Never aligned (`last_aligned` null): always fresh. Otherwise require a
    // reading strictly newer than the last align.
    const lastAligned = s.rounds?.last_aligned ?? null;
    if (lastAligned !== null) {
      if (s.reading === null) {
        events.push({
          event: "stale-reading",
          strategy: s.id,
          detail: `rounds.last_aligned set (${lastAligned}) but reading is null`,
        });
        continue;
      }
      const date = readingDate(s.reading);
      if (date === null || date <= lastAligned.slice(0, 10)) {
        events.push({
          event: "stale-reading",
          strategy: s.id,
          detail: `no reading newer than rounds.last_aligned=${lastAligned}`,
        });
        continue;
      }
    }

    candidates.push(asCandidate(false));
  }

  // --- Order -------------------------------------------------------------------
  candidates.sort((a, b) => {
    // Lexicographic (tier, rank) over the LIFTED precedence pair, tier outermost.
    if (a.precedence.tier !== b.precedence.tier) return b.precedence.tier - a.precedence.tier;
    if (a.precedence.rank !== b.precedence.rank) return b.precedence.rank - a.precedence.rank;
    const ap = progressionIndex(a, byId);
    const bp = progressionIndex(b, byId);
    if (ap !== bp) return bp - ap;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  return { candidates, events };
}

/**
 * Would the graph selector emit `strategy` as an `align-tactics` candidate over
 * this store snapshot right now? True iff `strategy` appears among
 * `selectGraphTargets(nodes).candidates` as a `kind: "strategy"` candidate at
 * the derived `align-tactics` rung — covering both a fresh align-arm-eligible
 * strategy and the one queued soft-freeze re-evaluation session.
 *
 * The selector is the single source of truth for align-selectability (single-
 * callsite doctrine): this helper is membership in its output, never a re-
 * implementation of its per-strategy gates (child/signal/rounds/freeze). The
 * worker-start re-validation gate (`check-node-selection.ts`) calls it so a
 * strategy selected at `align-tactics` re-validates against exactly the
 * selector's current verdict, closing the `null !== "align-tactics"` literal-
 * equality regression that exit-12'd every strategy.
 *
 * `office_hours` gating is intentionally in scope (a parked strategy is not
 * emitted), but the gate applies its dedicated not-parked check first, so in
 * practice this is only reached for an unparked node.
 */
export function strategyAlignSelectable(strategy: IntentionNode, nodes: IntentionNode[]): boolean {
  return selectGraphTargets(nodes).candidates.some(
    (c) => c.id === strategy.id && c.kind === "strategy" && c.phase === "align-tactics",
  );
}

/**
 * The strategy's highest-ranked eligible FROZEN descendant, or null
 * (tactic-graph-frozen-tactic-dispatch). A frozen descendant is a tactic that
 * (a) counts `strategy.id` among its `servingStrategyIds` (serves/parent-chain
 * membership) and (b) the selector emits as a `kind: "tactic",
 * phase: "align-tactics"` candidate — i.e. a draft/raw or soft-frozen tactic
 * with office_hours null and complete blockers.
 *
 * The selector is the single source of truth: this walks its ALREADY-SORTED
 * candidate list (precedence tier desc, precedence rank desc, progression
 * ordinal desc, id asc) and returns the
 * node behind the first qualifying candidate, so ranking/tiebreaks match the
 * real selection exactly. Returns null for a zero-tactic strategy or one whose
 * descendants are all non-frozen.
 */
export function resolveFrozenDescendant(
  strategy: IntentionNode,
  nodes: IntentionNode[],
): IntentionNode | null {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const c of selectGraphTargets(nodes).candidates) {
    if (c.kind !== "tactic" || c.phase !== "align-tactics") continue;
    const node = byId.get(c.id);
    if (node === undefined) continue;
    if (!servingStrategyIds(node, byId).has(strategy.id)) continue;
    return node;
  }
  return null;
}

/**
 * Would the graph selector emit `tactic` as an `align-tactics` candidate over
 * this store snapshot right now? True iff `tactic` appears among
 * `selectGraphTargets(nodes).candidates` as a `kind: "tactic"` candidate at the
 * directive `align-tactics` rung — the frozen-tactic (draft/raw or soft-frozen)
 * analog of `strategyAlignSelectable`.
 *
 * The selector is the single source of truth for frozen-tactic selectability
 * (single-callsite doctrine): this is membership in its output, never a
 * re-implementation of its per-tactic gates (draft/soft-freeze/office_hours/
 * blockers). The worker-start re-validation gate calls it so a tactic selected
 * at `align-tactics` re-validates against exactly the selector's current
 * verdict.
 */
export function frozenTacticSelectable(tactic: IntentionNode, nodes: IntentionNode[]): boolean {
  return selectGraphTargets(nodes).candidates.some(
    (c) => c.id === tactic.id && c.kind === "tactic" && c.phase === "align-tactics",
  );
}
