---
id: tactic-select-targets-redundant-attention-resolve
kind: tactic
statement: "selectGraphTargets recomputes resolveAttention twice per tick: hoist
  the pre-resolved attention map into effectivePrecedence instead of letting it
  re-resolve internally"
owner: ai
status: raw
parent: null
rationale: "Filed 2026-08-01 as a review-fix (PR #2997, node
  tactic-attention-tier-ranking) out-of-scope follow-up from the cost/scaling
  finder lens. Not a Firestore finding (the lens's usual target) — reported
  under the same query-x-amplifier shape, in CPU/IO terms, since the finder
  judged it worth surfacing anyway. Advisory disposition (cost findings are
  always Deferred, never Required) — not run through adversarial verification."
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
# selectGraphTargets recomputes resolveAttention twice per tick: hoist the pre-resolved attention map into effectivePrecedence instead of letting it re-resolve internally

Raw tactic awaiting an `/align-tactics` planning pass. Filed 2026-08-01 as an
out-of-scope follow-up from the `/review-fix` pass on `tactic-attention-tier-ranking`
(source PR #2997).

## The finding

**Location:** `packages/intentionsutil/src/router.ts:384` (call site), with the
duplicated work inside `packages/intentionsutil/src/attention.ts:441-457`
(the effective-tier fixpoint) and `attention.ts:325-337` (`distributorIds`).

`selectGraphTargets` already computes `const attention = resolveAttention(nodes)`
at `router.ts:381`, then immediately calls `effectivePrecedence(nodes)` at
`router.ts:384`, which internally calls `resolveAttention(nodes)` a second time
at `router.ts:243`. This PR made `resolveAttention` materially more expensive:
it now runs TWO monotone fixpoints over the full node array per call (the
pre-existing authored-source fixpoint plus the new effective-tier fixpoint), and
`distributorIds` allocates a fresh `Set` and a sorted array per node on every
sweep of both loops. So the selector now performs two full double-fixpoint
passes over the whole graph per invocation instead of one.

The amplifier is the dispatch tick: `selectGraphTargets` runs via
`packages/intentionsutil/scripts/select-targets.ts` on every routing tick, over
`intentions/` which grows without bound (467 nodes / 5.3 MB at filing time).

## Why it is worth fixing

Absolute cost is still small at current graph size — this is a redundant-work /
scaling observation, not a live performance defect. It compounds with the
graph's unbounded growth (the same growth axis `strategy-graph-drives-dispatch`
already tracks for other selector costs).

## Adversarial verdict

Not run through adversarial verification — this is a `cost` lens finding, which
is always-Deferred/advisory per the `/review-fix` disposition table (never
`Required`, never verify-eligible).

## Scope sketch (for the planning pass, not a plan)

- Give `effectivePrecedence` an optional pre-resolved map parameter (e.g.
  `effectivePrecedence(nodes, attention = resolveAttention(nodes))`) and have
  `selectGraphTargets` pass the map it already built at `router.ts:381`.
- Optionally hoist `distributorIds` out of the two fixpoint loops in
  `attention.ts` by precomputing a `Map<string, string[]>` of distributors once
  before the sweeps, so the per-node `Set` allocation and sort happen once per
  run rather than once per node per sweep.
