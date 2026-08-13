---
id: tactic-code-review-detached-node-lock
kind: tactic
statement: Lock the node for the detached /code-review run's own lifetime,
  independently of the launching session — a kernel-released flock held by the
  detached child, honored by every worktree-claim path, so a survivor that
  outlives its session cannot have another worker spawned into the tree it is
  still writing
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-08-13 in the /align round that raised the review
  lane's built-in /code-review from `low` to `high` (strategy-token-economy,
  2026-08-13 clarifications). Raising the effort makes the run outlive its await
  window as a normal outcome rather than a pathological one, and the author
  ruled that the run is never killed and that the node stays locked for the
  run's whole lifetime even if the session that launched it is removed. Nothing
  today provides that. The sibling carrier
  tactic-review-effort-max-detached-resume-poll has a `$CACHE_KEY.lock` mkdir
  mutex, but it guards the RESUME CACHE, not the worktree — grep confirms that
  node carries no occupancy, reservation-sweep or worktree_has_live_session
  content at all. And the ordinary worktree-is-the-claim invariant does not
  cover this case: code-review-invocation.md section 6 measured that the nested
  `claude -p` session does not appear in the registered session view, and a
  supervising session can die for reasons unrelated to the review (a
  frozen-session park, an API error, `claude rm`, a host restart) while its
  child runs on. The failure that follows is a worker spawning into a worktree
  an active `--fix` run is still writing, which corrupts both trees and —
  because dispatch-code-review derives what /code-review actually changed as
  `git diff <before-image>` at completion — makes the run attribute unrelated
  changes to the instrument, breaching condition 6 with a mechanically-derived
  claim that is confidently wrong. Serves both strategies by the artifact-owner
  rule: the effort/review-lane doctrine is strategy-token-economy's, the
  worktree-claim machinery is strategy-graph-native-dispatch's. The effort raise
  must not ship without this — a survivor with no lock is the corruption case."
reading: null
serves:
  - strategy-token-economy
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
# Lock the node for the detached /code-review run's own lifetime, independently of the launching session — a kernel-released flock held by the detached child, honored by every worktree-claim path, so a survivor that outlives its session cannot have another worker spawned into the tree it is still writing
