---
id: tactic-review-stall-conflict-lane
kind: tactic
statement: reconcile-graph-review-stall enters the conflict resolution lane on a
  CONFLICTING reviewed node instead of holding it immediately — converging the
  two conflict producers on one policy
owner: ai
status: raw
parent: null
rationale: "Byproduct of the 2026-07-29 /align-strategy dispatch-containment
  interview, implementing the author's clarification that merge conflicts are
  not expected to self-heal and that a conflict always enters the resolution
  lane. Two producers currently diverge: provision exit 11 spawns Lane 3
  immediately (dispatch-graph-execute:274) and is correct;
  reconcile-graph-review-stall:320 calls hold-node --kind provision-conflict
  immediately with no resolution attempt and is now a defect. Adjacent
  tactic-conflict-lane-exit11-retry-bound bounds ineffective lane kicks and is
  not superseded by this — it remains the backstop for a lane that runs and does
  not resolve."
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
# reconcile-graph-review-stall enters the conflict resolution lane on a CONFLICTING reviewed node instead of holding it immediately — converging the two conflict producers on one policy
