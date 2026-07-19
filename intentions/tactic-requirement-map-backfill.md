---
id: tactic-requirement-map-backfill
kind: tactic
statement: "Backfill the existing corpus per requirement family: map
  machine-verifiable clauses to their suites, mark the rest
  not-machine-verifiable"
owner: ai
status: raw
parent: null
rationale: Surfaced in the 2026-07-19 strategy-verified-requirements interview.
  Day-one state is roughly fifty strategies plus kind-node rules with no
  verification encoding; the bootstrap is a small number of per-family backfill
  tactics (this one decomposes at /align-tactics), not per-gap auto-creation.
  Each clause either maps to a concrete suite (validateGraph rules to the
  intentionsutil vitest suites, dispatch invariants to script tests, app
  requirements to app suites) or is honestly marked not-machine-verifiable
  (sensor is the author or office-hours review). Depends on the encoding shape
  landing first (tactic-requirement-verification-encoding).
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
# Backfill the existing corpus per requirement family: map machine-verifiable clauses to their suites, mark the rest not-machine-verifiable
