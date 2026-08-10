---
id: tactic-review-stall-predicate-subprocess-spawn
kind: tactic
statement: Stop spawning a fresh node --import tsx/esm subprocess per candidate
  per tick in reconcile-graph-review-stall solely to evaluate the pure
  two-string reviewStallRoute predicate, by evaluating it inline in bash or
  batching all candidates through one subprocess call
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
# Stop spawning a fresh node --import tsx/esm subprocess per candidate per tick in reconcile-graph-review-stall solely to evaluate the pure two-string reviewStallRoute predicate, by evaluating it inline in bash or batching all candidates through one subprocess call

Deferred cost finding from the `/review-fix` pass on PR #2920
(`tactic-graph-review-exclusion-stall-recovery`).

**Location**: `.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall:220`
(the `node --import tsx/esm -e` one-liner evaluating the route predicate,
per candidate).

**Finding**: A fresh `node --import tsx/esm -e` subprocess is spawned per
candidate per tick solely to evaluate what was originally the two-term
boolean `ci === "failing" || mergeable === "CONFLICTING"` (now the closed-union
`reviewStallRoute(ci, mergeable)` predicate after the Opus fix applied during
this same review pass — the underlying cost concern is unchanged by that
fix). Node startup plus tsx/esm loader registration plus a dynamic import of
`transitions.js` costs roughly 0.5-1s each, and it happens inside
`dispatch-select-tick` while the tick holds `dispatch.lock`, directly
extending the window during which the whole fleet is serialized behind the
tick. This is an N+1 process spawn over a set that grows with the graph,
amplified by every-tick execution, for zero I/O.

**Recommended fix**: Evaluate the predicate without a per-candidate
subprocess — cheapest is a bash `case`/`[[ ]]` mirroring the constant (the
same mirror-with-a-comment pattern used elsewhere in the fleet for constants
like `FIX_ATTEMPT_CAP`). If the TypeScript function must remain the single
source of truth, batch it: feed all candidate `(id, ci, mergeable)` tuples to
one node process and have it emit the decision per id, so subprocess count is
O(1) per tick instead of O(candidates).

**Adversarial verdict**: not adversarially verified — this is a cost/scaling
advisory finding, not a `Required` security finding, so the adversarial-verify
step was skipped for it (cost findings are always `Deferred`, never
`Required`).

**Source PR**: #2920
