---
id: tactic-ci-verdict-cache-invalidation
kind: tactic
statement: Give DISPATCH_CI_VERDICT_CACHE a TTL or an explicit invalidation so a
  memoized non-terminal verdict cannot pin a long-lived poller to the first
  `pending` it ever read
owner: ai
status: raw
parent: null
rationale: null
reading: null
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
# Give DISPATCH_CI_VERDICT_CACHE a TTL or an explicit invalidation so a memoized non-terminal verdict cannot pin a long-lived poller to the first `pending` it ever read

Deferred correctness finding from the implementation of
`tactic-dispatch-ladder-skill` (PR #3072).

**Location**: `.claude/skills/dispatch-propagate/scripts/lib.sh:792-826`
(`dispatch_ci_verdict_rest`; the memoisation surface is `:796-824` — the cache
hit at `:796-803`, the cache write at `:822-824`). Verified against `origin/main`
at `c0a66d49844e6ce64eb3224390a64e0d6eade4a3`.

**Finding**: `dispatch_ci_verdict_rest` memoizes its verdict per-SHA at
`$DISPATCH_CI_VERDICT_CACHE/<sha>` with **no TTL and no invalidation**. That is
sound for the tick, whose cache directory lives and dies with one tick, but it
is unsound for any caller that outlives a CI run: a `pending` verdict is not a
final answer, and once stored it is returned forever. A driver that exported a
cache dir and then re-polled would read its first `pending` indefinitely and
never see CI resolve — the poll loop would burn its whole budget on a PR that
went green minutes in.

**Present workaround** (`dispatch-ladder-run`): export no cache directory and
explicitly `unset DISPATCH_CI_VERDICT_CACHE` before every reconciler call
(`.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run:538`, `:564`,
`:598`, documented at `:144-150`). Correct, but it costs one paginated REST call
per poll against the fleet's shared 5000/hr budget, and it is a convention every
future caller must remember rather than a property of the cache.

**Recommended fix**: make non-terminal verdicts self-expiring. Either stamp each
cache entry with a write time and treat an entry older than a short TTL as a
miss, or — cheaper and more precise — only cache **terminal** verdicts
(`passing` / `failing`) and never a `pending`, since a terminal verdict for a
fixed SHA genuinely cannot change while a pending one is by definition
provisional. The second form removes the failure mode outright with no clock.

**Relationship to `tactic-review-stall-ci-verdict-cache-miss`**: adjacent but
not the same node, and they pull in opposite directions. That node is a cost
finding — it wants *fewer* REST calls in `reconcile-graph-review-stall` by
short-circuiting on `.mergeable` and by skipping unchanged head SHAs. This node
is a correctness finding about entries that are cached but should not be. They
interact: caching only terminal verdicts is exactly what makes that node's
unchanged-SHA short-circuit safe, so whichever lands second should read the
other first.

**Source PR**: #3072
