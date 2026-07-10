---
id: tactic-attention-critical-path-propagation
kind: tactic
statement: resolveAttention critical-path propagation — authored source-sets
  flow backward along blocked_by to blockers, recursively, so a hot node's
  critical path ranks with it
owner: ai
status: codified
parent: null
rationale: "Byproduct of the 2026-07-07 /align-strategy interview on
  strategy-graph-drives-dispatch: the authored term in resolveAttention
  (packages/intentionsutil/src/attention.ts) currently distributes only via
  parent/serves, so a boost on a blocked node cannot reach its blockers and the
  router will not fast-track the critical path. Found live: granting attention
  to tactic-attention-surface-velocity-pace would not elevate
  tactic-attention-surface-signal-types or tactic-attention-surface-graph-read."
reading: null
gap: null
serves:
  - strategy-graph-drives-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 5
  override: null
  rationale: "Bootstrap enabler: this tactic is the mechanism that gives
    execution-critical graph-native-dispatch nodes elevated rank; until it
    lands, the router must manually override rank-0 ordering each tick. Raised
    by the router (bootstrap tick 2026-07-10) so it surfaces without manual
    override."
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# resolveAttention critical-path propagation — authored source-sets flow backward along blocked_by to blockers, recursively, so a hot node's critical path ranks with it

## Context

Recorded semantics (`strategy-graph-drives-dispatch`, 2026-07-07
clarifications): applying attention to a node prioritizes the full
critical path to it — the node's outgoing authored source-set flows
downward to its subtree (parent/serves, existing behavior) AND backward
along `blocked_by` to its blockers, recursively and interleaved: a blocker
inherits the hot node's sources, and the blocker's own subtree inherits
them via the normal downward flow. Undecayed, undiluted, each authored
source counted once per node. Overrides get the same treatment as boosts:
whatever outgoing set a node distributes to its children also reaches its
blockers. Blocking stays the sole ordering/gating mechanism — a blocked
node remains ineligible regardless of rank; the backward flow only ranks
the blockers so the router drains a hot node's critical path first.

The defect this fixes, found live 2026-07-07: the authored term in
`resolveAttention` distributes only via parent/serves, so a boost on a
blocked node (e.g. `tactic-attention-surface-velocity-pace`) cannot reach
its blockers (`tactic-attention-surface-signal-types`,
`tactic-attention-surface-graph-read`) and the router would never
fast-track the chain.

## Unit 1 — backward blocked_by distribution via monotone fixpoint

**Recommended model:** opus

Scope:
- `packages/intentionsutil/src/attention.ts:283-292` — `distributors(c)`
  is currently `{c.parent} ∪ (eligible c only) c.serves`. Extend it with
  the reverse `blocked_by` relation: every node X with `c ∈ X.blocked_by`
  also distributes to c. Build a reverse index the way `computeSignalPath`
  builds `reverseBlockers` (`attention.ts:148-156`); restrict to ids that
  resolve; keep the deterministic sort.
- `packages/intentionsutil/src/attention.ts:294-334` — `computeAuthored`
  is a memoized DFS whose cycle guard throws (`attention flow cycle`,
  lines 302-305). Under the widened relation, mixed
  parent/serves/blocked_by cycles become legitimate graph shapes (e.g. a
  node blocked by a tactic inside its own subtree), so convert the
  authored term to an iterative monotone fixpoint: seed every node's
  outgoing set from its own authored field (override → constant
  `{(self, override)}`; boost → `{(self, boost)}`; else empty), then
  repeat — each non-override node's outgoing = union of its distributors'
  outgoing plus its own boost entry — until no set changes. Union only
  grows and override outputs are constant, so convergence is guaranteed;
  iterate nodes in sorted id order for determinism. Drop the cycle throw:
  pure `blocked_by` cycles are still rejected at write time by
  `validateGraph` rule 15, and mixed cycles are now well-defined.
- Update the authored-term doc-comment (`attention.ts:230-270` model
  description and the distribution-edges comment at 281-282) to record
  the backward `blocked_by` flow and its doctrine home (the 2026-07-07
  clarifications on `strategy-graph-drives-dispatch`).
- Out of scope: selector eligibility (`graph-select-target` /
  `tactic-graph-router-selector` — rank only, gating unchanged), the
  signal term (`computeSignalPath` unchanged), the capture term, and
  `kind-*.md` field-spec prose.

## Unit 2 — tests

**Recommended model:** sonnet

**Dependencies:** Unit 1.

Scope — `packages/intentionsutil/test/attention.test.ts`, new cases:
1. A boost on a blocked leaf reaches its blocker and the blocker's own
   blocker (chain of two `blocked_by` hops), undecayed.
2. The blocker's subtree (a child via `parent`) inherits the received
   sources through the normal downward flow.
3. An override's value reaches blockers identically to a boost's.
4. A mixed parent/blocked_by cycle converges to a stable fixpoint instead
   of throwing.
5. Each authored source is still counted once per node when a blocker
   receives the same source via both a serves edge and a backward
   blocked_by edge (no double-count in `authoredValue`).

## Reuse

- `reverseBlockers` construction pattern in `computeSignalPath`
  (`packages/intentionsutil/src/attention.ts:148-156`).
- Existing node-fixture helpers and test conventions in
  `packages/intentionsutil/test/attention.test.ts`.

## Verification

```verify
npx vitest run --project packages/intentionsutil --root .
```

Manual: run `resolveAttention` over the live graph (a small tsx one-liner
loading `intentions/` via `listNodes`) with a hypothetical boost patched
onto `tactic-attention-surface-velocity-pace` — its resolved rank
increase must appear identically on
`tactic-attention-surface-signal-types` and
`tactic-attention-surface-graph-read`; with no patch, all resolved values
must be unchanged from before this change wherever no `blocked_by` edge
points at a ranked node's blocker (backward flow only adds sources, never
removes).

## Implementation notes

Two units, one PR; each unit in a subagent with its Recommended model;
supply this Context and the unit's Scope; constrain to working-tree
edits.
