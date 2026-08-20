---
id: tactic-fleet-alarm-daemon-casualty-list
kind: tactic
statement: The daemon-degraded fleet alarm names the daemon fault but not its
  casualties -- carry the in-flight nodes and dispatch-ladder runs the outage
  orphaned, so the author restart policy has a worklist rather than a bare fault
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-08-13 by the /align round that recorded the
  environmental-casualty ruling. Carrier for that ruling author-signal half. On
  the incident the alarm fired correctly within four seconds
  (dispatch-fleet-watch detected the daemon down at 15:04:28Z and landed
  tactic-fleet-alarm-daemon-degraded at 15:05:38Z) and the stall still ran 84
  minutes, because nothing connected the daemon fault to the specific ladder run
  that needed restarting. Cross-cutting by artifact owner: the alarm instrument
  belongs to the dispatch machinery, the daemon operability condition belongs to
  strategy-autonomous-execution, so both are named honestly rather than
  force-fitting one. Open question for planning: whether the casualty set is
  cheaply enumerable at alarm time -- it implies reading the session registry
  for entries with in-flight tasks whose last activity predates the new
  generation, which is the same predicate
  tactic-invalid-state-environmental-suppression needs, so the two should share
  it."
reading: null
serves:
  - strategy-graph-native-dispatch
  - strategy-autonomous-execution
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
# The daemon-degraded fleet alarm names the daemon fault but not its casualties -- carry the in-flight nodes and dispatch-ladder runs the outage orphaned, so the author restart policy has a worklist rather than a bare fault
