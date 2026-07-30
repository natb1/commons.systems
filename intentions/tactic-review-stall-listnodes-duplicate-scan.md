---
id: tactic-review-stall-listnodes-duplicate-scan
kind: tactic
statement: Eliminate reconcile-graph-review-stall's second full intentions/
  directory scan per tick (reconcile-graph-merged already performs an equivalent
  listNodes pass moments earlier in the same tick) by sharing one materialized
  node enumeration between the two reconcilers
owner: ai
status: raw
parent: null
rationale: null
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
# Eliminate reconcile-graph-review-stall's second full intentions/ directory scan per tick (reconcile-graph-merged already performs an equivalent listNodes pass moments earlier in the same tick) by sharing one materialized node enumeration between the two reconcilers

Deferred cost finding from the `/review-fix` pass on PR #2920
(`tactic-graph-review-exclusion-stall-recovery`).

**Location**: `.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall:146-150`
(the `listNodes` enumeration one-liner).

**Finding**: The sweep's enumeration re-parses the entire `intentions/`
directory via `listNodes` in its own tsx subprocess on every tick, even when
there are zero candidates — the second full scan of the same directory in
the same tick, since `reconcile-graph-merged` performed an identical
`listNodes("./intentions")` pass shortly earlier in the same
`dispatch-select-tick` run. The directory holds hundreds of node files and
grows monotonically with the graph. The call site in
`dispatch-select-tick` is unconditional, so the constant per-tick floor is
paid whether or not any node is actually stranded.

**Recommended fix**: Perform one node enumeration per tick and share it —
have `reconcile-graph-merged` (or a small shared enumerator invoked once by
`dispatch-select-tick`) emit the open-tactic set with the fields both sweeps
need (id, pr, phase, markers, fix), and have the review-stall sweep filter
that already-materialized list rather than re-scanning `intentions/` in a
second process.

**Adversarial verdict**: not adversarially verified — this is a cost/scaling
advisory finding, not a `Required` security finding, so the adversarial-verify
step was skipped for it (cost findings are always `Deferred`, never
`Required`).

**Source PR**: #2920
