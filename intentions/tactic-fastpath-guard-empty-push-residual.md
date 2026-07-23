---
id: tactic-fastpath-guard-empty-push-residual
kind: tactic
statement: "Graph fast-path guard: treat empty PUSHED_COMMITS from a concurrent
  already-landed push as a benign skip instead of a fail-closed refusal"
owner: ai
status: raw
parent: null
rationale: "Post-#2898 residual, observed twice on 2026-07-23 blocking
  clear-park landings: a scratch graph branch pushed at a SHA already landed on
  main produces an empty push payload, and check-graph-fast-path.sh refuses
  fail-closed (PUSHED_COMMITS is empty). tactic-graph-fastpath-guard-diff-base
  (phase qa) predicted this sub-case but its landed scope excludes it — dedup
  against that node at finalization."
reading: null
gap: null
serves:
  - strategy-main-health
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
# Graph fast-path guard: treat empty PUSHED_COMMITS from a concurrent already-landed push as a benign skip instead of a fail-closed refusal

## Interview context (2026-07-23, /align-strategy byproduct — raw, for /align-tactics)

Failure signature: `##[error]PUSHED_COMMITS is empty — no pushed commits to verify. Refusing to fast-path (fail-closed).` Fires when a `graph/**` scratch branch is pushed at a SHA already landed on main (concurrent fleet sessions), producing an empty push payload. Observed twice on 2026-07-23 blocking clear-park landings; recovered by `git reset --hard origin/main` so the next attempt produced a genuinely new commit.

Post-#2898 residual: that PR's own subagent predicted this sub-case; its landed scope (empty origin/main...HEAD diff) does not cover it. Dedup against tactic-graph-fastpath-guard-diff-base (phase qa) at finalization — extend its guard or land separately.
