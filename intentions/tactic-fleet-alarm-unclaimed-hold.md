---
id: tactic-fleet-alarm-unclaimed-hold
kind: tactic
statement: A tracked hold has blocked top-ranked work with no session claiming it
owner: ai
status: raw
parent: null
rationale: Auto-created by dispatch-fleet-alarm from an out-of-band fleet
  instrument reading. See the body for the reading.
reading: null
gap: null
serves:
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
pace_exempt: true
rounds: null
attributes: {}
---
tracked hold(s) have blocked top-ranked work while unclaimed by any session or reservation: tactic-hold-conflict-manual-path-reservation-sweep -> tactic-manual-path-reservation-sweep; tactic-hold-fix-cap-strategy-fingerprint-stamp-coverage -> tactic-strategy-fingerprint-stamp-coverage

Thresholds: DISPATCH_FLEET_WATCH_HOLD_MIN_AGE=86400s,
DISPATCH_FLEET_WATCH_HOLD_TOP_K=10
Pause state: paused (unclaimed holds are evaluated regardless of pause)
