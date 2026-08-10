---
id: tactic-review-stall-ci-verdict-cache-miss
kind: tactic
statement: Skip the redundant per-candidate dispatch_ci_verdict_rest REST fetch
  in reconcile-graph-review-stall by reading .mergeable first (CONFLICTING
  short-circuits without a CI call) and by skipping candidates whose head sha is
  unchanged since the last sweep found no regression
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
# Skip the redundant per-candidate dispatch_ci_verdict_rest REST fetch in reconcile-graph-review-stall by reading .mergeable first (CONFLICTING short-circuits without a CI call) and by skipping candidates whose head sha is unchanged since the last sweep found no regression

Deferred cost finding from the `/review-fix` pass on PR #2920
(`tactic-graph-review-exclusion-stall-recovery`).

**Location**: `.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall:214`
(the `dispatch_ci_verdict_rest "$HEAD_SHA"` call inside the per-candidate loop).

**Finding**: `dispatch_ci_verdict_rest "$HEAD_SHA"` is called once per stranded
candidate on every tick, and these shas are structurally guaranteed cache
misses. The tick's shared `DISPATCH_CI_VERDICT_CACHE` is only populated by the
child chain for candidates the selector emits — and review+reviewed nodes are
precisely the ones the selector excludes (that exclusion is this tactic's
whole premise). So each candidate costs a fresh paginated
`repos/{owner}/{repo}/commits/<sha>/check-runs` REST fetch every tick,
indefinitely, for as long as its PR sits waiting for auto-merge, against the
fleet's shared 5000/hr REST budget.

**Recommended fix**: Skip the check-runs fetch entirely when the cheaper
`.mergeable` signal already decides the outcome (CONFLICTING) — read it first
and only call `dispatch_ci_verdict_rest` when it doesn't already resolve the
route. Additionally short-circuit unchanged nodes by persisting the
last-swept `headRefOid` per node and skipping any candidate whose head sha is
unchanged since the previous sweep concluded no regression.

**Adversarial verdict**: not adversarially verified — this is a cost/scaling
advisory finding, not a `Required` security finding, so the adversarial-verify
step was skipped for it (cost findings are always `Deferred`, never
`Required`).

**Source PR**: #2920
