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
  reason: worker session froze at a permission/classifier denial — claude agents
    reports state=blocked and the transcript has had no activity for 3108s; the
    session cannot make progress and cannot park itself (a blocked session never
    reaches the Stop hook), so the dispatch-tick frozen-session sweep parked
    this node
  since: 2026-08-04
  recommendation: Find the holding job with 'claude agents --all' and attach it
    ('claude attach <job-id>'), then answer the pending prompt. If the denied
    command was gratuitous, cancel it and let the worker continue; if it is
    genuinely needed, run it yourself or add a standing permission rule — do NOT
    rewrite the command to route around the classifier. If the session is
    unrecoverable, stop it ('claude rm <job-id>'), let dispatch-sweep reap the
    worktree, then run clear-park <node-id> to return the node to the lane.
    Until that session is gone, office-hours reports this node as 'all-held'
    rather than launching a review session for it, because the frozen session
    still holds the node-id session name.
  session_type: other
pace_exempt: true
rounds: null
attributes: {}
---
tracked hold(s) have blocked top-ranked work while unclaimed by any session or reservation: tactic-hold-conflict-manual-path-reservation-sweep -> tactic-manual-path-reservation-sweep; tactic-hold-fix-cap-strategy-fingerprint-stamp-coverage -> tactic-strategy-fingerprint-stamp-coverage

Thresholds: DISPATCH_FLEET_WATCH_HOLD_MIN_AGE=86400s,
DISPATCH_FLEET_WATCH_HOLD_TOP_K=10
Pause state: not-paused (unclaimed holds are evaluated regardless of pause)
