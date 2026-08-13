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

## The terminal-only cache decision, and its accepted residual cost (2026-08-13)

Recorded here rather than as a new node: this is the same cost, re-measured
from a second direction, and it belongs against the node that already owns it.

PR #3073's `/code-review high` rounds re-raised the verdict-cache miss while
adding the orphaned-check-run rule
(`tactic-orphaned-check-run-pins-pending-ci-guard`). That rule forced an
explicit decision about *what* `dispatch_ci_verdict_rest` may memoize, because
a sha classified `pending` while its check suite was still running must be
recomputed once the suite concludes — otherwise the orphan rule is shadowed by
the very cache entry the orphan produced, for as long as the cache directory
lives (`.claude/skills/dispatch-propagate/scripts/lib.sh:829-831`).

**The decision taken: the cache stays terminal-only.** Only a verdict that
cannot change again is memoized. A non-terminal verdict is recomputed on every
read. This is deliberate and is not to be re-litigated as a caching bug — it
is what makes the orphan rule sound.

**The accepted cost**, stated plainly so a later reader does not re-discover
it as a defect: roughly 2–3 redundant `check-runs` refetches per in-flight PR
per tick. That is the price of correctness under the terminal-only rule, and
it was weighed and accepted rather than overlooked.

**What this does and does not do to this node.** It does not close it. The two
fixes this node actually proposes are both still open and both still worth
doing, because neither depends on caching a non-terminal verdict:

1. Read `.mergeable` first, so a `CONFLICTING` candidate short-circuits
   without any CI call at all — a call avoided, not a call memoized.
2. Persist the last-swept `headRefOid` per node and skip candidates whose head
   is unchanged since the previous sweep concluded no regression — a
   *per-node sweep* memo, which is a different thing from memoizing the
   verdict itself and is unaffected by the terminal-only rule.

If anything, the terminal-only decision raises this node's value: it fixes the
residual cost at the caller, which is the only place left that can fix it.
