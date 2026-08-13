---
id: tactic-invalid-state-cap-noop-accounting
kind: tactic
statement: The invalid-state intervention attempt cap is incremented on SPAWN
  rather than on outcome, so an intervention that classifies valid-state and
  takes no action still consumes a node failure budget
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-08-13 during the /align round that recorded the
  environmental-casualty ruling. dispatch-invalid-state-route increments the
  sidecar and writes it only after a successful spawn, and nothing decrements it
  when the spawned intervention returns a no-act verdict; at the cap the router
  exits 10 without spawning. Clarification 185 ratified the cap as a per-node
  intervention-attempt cap on the fix-attempt-cap precedent -- a FAILURE budget
  -- so counting no-op verdicts against it is a mismatch of meaning, not merely
  of arithmetic. Observed: tactic-attention-namespaced-rank sidecar read 3 of 3
  with the third attempt spawned at 15:16:12Z against what was a valid state.
  Honest limit on the evidence -- only that third attempt is attributable to the
  environmental false positive; the earlier two cannot be reconstructed, because
  dispatch-invalid-state-sweep discards the route diagnostics, which is the
  defect tactic-invalid-state-lane-diagnostics-unobservable already tracks. The
  environmental-suppression tactic removes this particular false-positive source
  but not the accounting mismatch, which survives for every other no-act path."
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
# The invalid-state intervention attempt cap is incremented on SPAWN rather than on outcome, so an intervention that classifies valid-state and takes no action still consumes a node failure budget
