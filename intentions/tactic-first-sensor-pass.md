---
id: tactic-first-sensor-pass
kind: tactic
statement: "Run the first sensor pass: populate reading and gap on every
  strategy that names a sensor"
owner: human
status: raw
parent: null
rationale: Every reading and gap in the graph is null while 13 strategies carry
  success_signals. Start with the mechanically computable is_proxy:false signals
  — strategy-exercise-recovery-paths' threshold is a pure function of the
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
attributes: {}
---
# Run the first sensor pass: populate reading and gap on every strategy that names a sensor
