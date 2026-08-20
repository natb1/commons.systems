---
id: tactic-invalid-state-environmental-suppression
kind: tactic
statement: Suppress invalid-state classification of daemon-orphaned sessions --
  compare a session last activity against the daemon current-generation
  ExecMainStartTimestamp, so an environmental casualty is never routed as
  terminal-session or frozen-session
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-08-13 by the /align round that recorded the
  environmental-casualty ruling on strategy-graph-native-dispatch (conditions
  and clarifications of that date). Carrier for that ruling. Measured on the
  incident: lib-frozen-session-park.sh, the classifier that routed
  tactic-attention-namespaced-rank at 15:16:12Z as terminal-session, contains
  ZERO references to dispatch-daemon-liveness -- the discriminator exists as an
  owned, offline-testable script that dispatch-fleet-watch already calls, and
  the classifier simply never consults it. The chosen test is generation
  identity, not health: at 15:16:12Z the daemon had been healthy since
  15:13:01Z, so a health gate would have routed anyway. NRestarts is unusable
  (it read 0 right after the incident because the version-roll Stop/Start reset
  it). Both sweeps route through invalid_state_route_gate, so the suppression
  belongs upstream of the gate, not inside the intervention skill."
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
# Suppress invalid-state classification of daemon-orphaned sessions -- compare a session last activity against the daemon current-generation ExecMainStartTimestamp, so an environmental casualty is never routed as terminal-session or frozen-session
