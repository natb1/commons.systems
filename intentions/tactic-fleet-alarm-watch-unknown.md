---
id: tactic-fleet-alarm-watch-unknown
kind: tactic
statement: dispatch-fleet-watch could not read 1 of its inputs this pass
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
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes: {}
---
<!-- generated:dispatch-fleet-alarm -->
One or more fleet-health inputs were unreadable on this watcher pass. An
unreadable input is reported as UNKNOWN, never as clear — a false all-clear is
the failure this watcher exists to prevent.

Unreadable inputs:
- unclaimed-hold: repo root unresolvable (no worktree has main checked out and DISPATCH_GRAPH_MAIN_WORKTREE is unset) — unclaimed holds could not be enumerated

Pause state: paused
Decision log: /home/n8/.local/share/commons-dispatch/routing-decisions.jsonl
State file: /home/n8/.local/share/commons-dispatch/fleet-watch-state.json
<!-- /generated:dispatch-fleet-alarm -->
