---
id: tactic-review-stall-pr-json-duplicate-fetch
kind: tactic
statement: Eliminate the duplicate gh_pr_view_rest PR-JSON fetch
  reconcile-graph-review-stall makes on every tick for PRs
  reconcile-graph-merged already fetched moments earlier, by memoizing per-PR
  JSON for the tick or folding the review-stall check into
  reconcile-graph-merged's existing per-PR loop
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
# Eliminate the duplicate gh_pr_view_rest PR-JSON fetch reconcile-graph-review-stall makes on every tick for PRs reconcile-graph-merged already fetched moments earlier, by memoizing per-PR JSON for the tick or folding the review-stall check into reconcile-graph-merged's existing per-PR loop

Deferred cost finding from the `/review-fix` pass on PR #2920
(`tactic-graph-review-exclusion-stall-recovery`).

**Location**: `.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall:186`
(the `gh_pr_view_rest "$pr"` call inside the per-candidate loop).

**Finding**: `gh_pr_view_rest "$pr"` re-fetches, per candidate per tick, PR
JSON that `reconcile-graph-merged` already fetched moments earlier in the
same tick. `reconcile-graph-merged` enumerates every open tactic whose phase
is in `{implement,fix,qa,review,main-qa}` with a non-null `execution.pr` — a
strict superset of this sweep's review+reviewed candidates — and calls
`gh_pr_view_rest` on each; the two reconcilers run back-to-back in
`dispatch-select-tick`. Unlike `dispatch_ci_verdict_rest`, `gh_pr_view_rest`
has no memoisation, so every one of these reads is duplicated. The
duplication is N+1-shaped, grows linearly with the number of
review+reviewed tactics, and repeats on every tick.

**Recommended fix**: Either add a tick-scoped PR-JSON memo to
`gh_pr_view_rest` mirroring `DISPATCH_CI_VERDICT_CACHE` (cache key = PR
number, directory owned and torn down by `dispatch-select-tick`), or fold the
review-stall check into `reconcile-graph-merged`'s existing per-PR loop — it
already holds PR_JSON for exactly these nodes and already branches on
`STATE == OPEN`, where the stall check belongs, eliminating the second sweep
and its second full node enumeration.

**Adversarial verdict**: not adversarially verified — this is a cost/scaling
advisory finding, not a `Required` security finding, so the adversarial-verify
step was skipped for it (cost findings are always `Deferred`, never
`Required`).

**Source PR**: #2920
