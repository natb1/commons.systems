---
id: tactic-execution-pr-merge-verification
kind: tactic
statement: Record a completion sha at the done-transition so merge-verification
  gates need not trust execution.pr alone — a closed-unmerged PR can sit on a
  legitimately complete node
owner: ai
status: raw
parent: null
rationale: "tactic-graph-native-dispatch-fold: PR #2925 is closed-unmerged while
  its content reached main via six out-of-band commits. execution.pr therefore
  under-determines completion, weakening the scripted census verify-merged-only
  prune (tactic-census-scripted-tick depends on a trustworthy completion
  signal)."
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
# Record a completion sha at the done-transition so merge-verification gates need not trust execution.pr alone — a closed-unmerged PR can sit on a legitimately complete node

## Interview context (2026-07-23, /align-strategy byproduct — raw, for /align-tactics)

Evidence: tactic-graph-native-dispatch-fold's PR #2925 is CLOSED-UNMERGED while its content reached main via six out-of-band commits — already adjudicated complete. So `execution.pr` under-determines completion in both directions: an open/closed PR on a complete node, and (inversely) a merged PR is today's only mechanical completion signal.

Fix shape: record a completion sha (`merge commit` or `graph-commit` sha) in `execution` at the done-transition, so the scripted census prune (tactic-census-scripted-tick) and any other merge gate can verify against git history instead of PR state.
