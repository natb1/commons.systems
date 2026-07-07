---
id: tactic-attention-critical-path-propagation
kind: tactic
statement: resolveAttention critical-path propagation — authored source-sets
  flow backward along blocked_by to blockers, recursively, so a hot node's
  critical path ranks with it
owner: ai
status: raw
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
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# resolveAttention critical-path propagation — authored source-sets flow backward along blocked_by to blockers, recursively, so a hot node's critical path ranks with it

## Context (retained interview byproduct — /align-tactics refines)

Recorded semantics (strategy-graph-drives-dispatch, 2026-07-07
clarifications): applying attention to a node prioritizes the full
critical path to it — the node's outgoing authored source-set flows
downward to its subtree (parent/serves, existing behavior) AND backward
along blocked_by to its blockers, recursively and interleaved. Undecayed,
undiluted, each authored source counted once per node. Overrides get the
same treatment as boosts: whatever outgoing set a node distributes to its
children also reaches its blockers. Blocking stays the sole
ordering/gating mechanism — a blocked node remains ineligible regardless
of rank; the backward flow only ranks the blockers so the router drains
the path first.

## Implementation sketch

- `packages/intentionsutil/src/attention.ts` — the authored term's
  distributor relation is currently `distributors(c) = {c.parent} ∪
  (eligible) c.serves`. Extend it with the reverse blocked_by relation:
  for every node X with `B ∈ X.blocked_by`, X distributes its outgoing
  source-set to B. The source-set union fixpoint is monotone, so the
  computation stays cycle-safe without special-casing.
- Selector eligibility (`graph-select-target`,
  `tactic-graph-router-selector`) is unchanged — this alters rank only.
- Tests: (1) a boost on a blocked leaf reaches its blocker and the
  blocker's blocker (chain of two); (2) the blocker's own subtree inherits
  the received sources via the normal downward flow; (3) an override's
  value reaches blockers identically; (4) a blocked_by cycle converges;
  (5) each authored source still counted once per node when a blocker is
  reachable via both a serves edge and a backward blocked_by edge.
- Live acceptance case: with strategy-attention-surface's boost 3, a
  hypothetical boost on tactic-attention-surface-velocity-pace must
  elevate tactic-attention-surface-signal-types and
  tactic-attention-surface-graph-read to the same resolved rank.
