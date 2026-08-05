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
office_hours:
  reason: "phase session ended without declaring a disposition — `claude agents
    --all` reports the session for this node in a terminal state and it has had
    no transcript activity for `11040`s, while `origin/main` still shows the
    node at a working phase with `office_hours: null`; the node is therefore
    both re-selectable and held, so the dispatch-tick
    terminal-without-disposition sweep parked it"
  since: 2026-08-05
  recommendation: Read the session's transcript or attach the held job (`claude
    agents --all`, `claude attach <job-id>`) to see what it concluded. Decide
    the judgment item it stopped on, then either answer it here and `clear-park
    <node-id>`, or stop the session (`claude stop <job-id>`), let
    `dispatch-sweep` reap the worktree, and `clear-park <node-id>` to return the
    node to the lane. Do NOT simply reap the terminal session and release the
    node — that is what restarts the churn loop.
  session_type: other
pace_exempt: true
rounds: null
attributes: {}
---
tracked hold(s) have blocked top-ranked work while unclaimed by any session or reservation: tactic-hold-fix-cap-strategy-fingerprint-stamp-coverage -> tactic-strategy-fingerprint-stamp-coverage

Thresholds: DISPATCH_FLEET_WATCH_HOLD_MIN_AGE=86400s,
DISPATCH_FLEET_WATCH_HOLD_TOP_K=10
Pause state: not-paused (unclaimed holds are evaluated regardless of pause)
