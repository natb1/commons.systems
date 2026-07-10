---
id: tactic-first-sensor-pass
kind: tactic
statement: "Run the first sensor pass: populate reading and gap on every
  strategy that names a sensor"
owner: human
status: raw
parent: null
rationale: Most readings and gaps in the graph are still null while 50
  strategies carry success_signals (2026-07-10 census; up from the 13 recorded
  when this task was authored). Early sensor work has populated 10 readings, so
  the field is no longer uniformly null, but the sensor loop has not run at
  scale. Start with the mechanically computable is_proxy:false signals —
  strategy-exercise-recovery-paths' threshold is a pure function of the
  delegation records — then the owner-review readings, via
  packages/intentionsutil/scripts/read-sensors.ts and its registry.
reading: null
gap: null
serves:
  - strategy-graph-drives-dispatch
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
# Run the first sensor pass: populate reading and gap on every strategy that names a sensor
