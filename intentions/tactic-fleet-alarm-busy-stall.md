---
id: tactic-fleet-alarm-busy-stall
kind: tactic
statement: No dispatch worker has been busy for a sustained span
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
phase: done
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes: {}
---
zero busy dispatch workers have been observed continuously for longer than the 2700s stall limit

Threshold: DISPATCH_FLEET_WATCH_IDLE_LIMIT=2700s
State file: /home/n8/.local/share/commons-dispatch/fleet-watch-state.json (busy_zero_since — the live value is in this pass's
journald output and in --json)
Pause state: not-paused
