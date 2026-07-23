---
id: tactic-requirement-map-integrity-validator
kind: tactic
statement: "Map-integrity validator: every mapped test/suite exists and passes,
  every requirement carrier is mapped or explicitly marked; find-or-create gap
  tactics for post-bootstrap regressions"
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-07-19 strategy-verified-requirements interview.
  The strategy's sensor and actuator tooling goals in one mechanical surface:
  validate the requirement-to-suite map (suite exists, runs, passes, not stale),
  report unmapped carriers, wire into CI and the read-sensors run, derive all
  integrity status on read (never stored), and auto-create deduplicated
  find-or-create gap tactics only for gaps arising after a carrier is first
  mapped — never a bootstrap flood. Gaps touching virtue or strategy substance
  route to the align interviews, never auto-fixed. Prior art: coverage.ts
  (review-curriculum coverage sensor) and the sensors.ts registry."
reading: null
gap: null
serves:
  - strategy-verified-requirements
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
# Map-integrity validator: every mapped test/suite exists and passes, every requirement carrier is mapped or explicitly marked; find-or-create gap tactics for post-bootstrap regressions
