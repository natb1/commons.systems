---
id: tactic-fleet-alarm-daemon-degraded
kind: tactic
statement: The managed dispatch daemon is not healthy
owner: ai
status: raw
parent: null
rationale: Auto-created by dispatch-fleet-alarm from an out-of-band fleet
  instrument reading. See the body for the reading.
reading: null
serves:
  - strategy-autonomous-execution
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes: {}
---
<!-- generated:dispatch-fleet-alarm -->
daemon liveness: down

Liveness exit code: 3
Liveness verdict: down
Degraded reason: <none>
Pause state: paused (daemon liveness is evaluated regardless of pause)

The raw dispatch-daemon-liveness --json reading is in this pass's journald
output, not here: it embeds pids and unit timestamps that change every pass.
<!-- /generated:dispatch-fleet-alarm -->
