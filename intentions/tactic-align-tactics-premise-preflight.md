---
id: tactic-align-tactics-premise-preflight
kind: tactic
statement: /align-tactics runs its blocking-premise check before the drift
  review and decomposition, so a node that cannot be planned parks cheaply
  instead of after a full-length session
owner: ai
status: raw
parent: null
rationale: "Retained (retain-not-refine) from the 2026-08-12 /align interview
  that recorded the self-consistency condition on
  strategy-graph-native-dispatch. The artifact is the /align-tactics skill,
  owned by that strategy. Unlike its two sibling mechanisms this one does not
  prevent the defect — it reduces the cost of discovering one: the 2026-08-12
  /dispatch-ladder run spent roughly 13 minutes of Opus before parking
  tactic-attention-namespaced-rank (2184103c) on a premise that was already
  unratified when the session started. UNVERIFIED PREMISE, flagged at record
  time by the recording session: the saving assumes the blocking-premise check
  can legally run before the drift review, which was NOT confirmed against
  /align-tactics' actual step order during the interview. A planning session
  must establish that ordering first; if the drift review is a prerequisite of
  premise detection, this tactic reduces to a smaller saving or to nothing."
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
# /align-tactics runs its blocking-premise check before the drift review and decomposition, so a node that cannot be planned parks cheaply instead of after a full-length session
