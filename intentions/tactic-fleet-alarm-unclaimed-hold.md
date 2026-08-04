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
  reason: "Alarm instance, not engineering work — condition named but not fixable
    by this session. The fleet instrument fired on 2026-08-04 naming two tracked
    holds that blocked top-ranked work while unclaimed:
    tactic-hold-conflict-manual-path-reservation-sweep (blocking
    tactic-manual-path-reservation-sweep) and
    tactic-hold-fix-cap-strategy-fingerprint-stamp-coverage (blocking
    tactic-strategy-fingerprint-stamp-coverage), both parked since 2026-08-03
    and both confirmed still live at this scan. The alerting mechanism itself is
    sound and already landed — tactic-unclaimed-hold-alerting (phase main-qa, PR
    #3036 merged 2026-08-04) shipped the unclaimed-hold KIND in
    dispatch-fleet-alarm and predicate 5 in dispatch-fleet-watch, and its
    recorded scope states the instrument reports, never pauses the fleet, and
    never writes office_hours or blocked_by on another node — so there is no
    code defect for this node to plan against. Both named holds already carry
    fully-diagnosed remediations on their own nodes, and clearing them is
    outside /align-tactics' remit: this skill never runs /dispatch-conflict and
    never resolves another node's office_hours. Durability caveat for whoever
    reads this park: it is not durable while the condition persists —
    dispatch-fleet-alarm's classify() treats an office_hours-set node as
    'closed', and its find-or-create path mints a fresh raw node over a closed
    one, so the next dispatch-fleet-watch pass that still sees both holds
    unclaimed will overwrite this park; the durable escalations are the two hold
    nodes' own parks."
  since: 2026-08-04
  recommendation: "Work the two holds directly at office hours — each already
    carries its own fully-diagnosed recommendation, so this is not a
    re-diagnosis. (1) tactic-hold-conflict-manual-path-reservation-sweep — the
    /dispatch-conflict Lane 3 merge conflict is already resolved and
    independently verified (both files clean, ported suite 189/189 passing), but
    the node's `## Verification` block as it stands on origin/main still names
    the deleted monolith
    `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`, so
    dispatch-run-verification exits 1; fix that stale path on origin/main's copy
    of the node body, then re-run /dispatch-conflict Lane 3 to re-apply the
    already-worked-out resolution. (2)
    tactic-hold-fix-cap-strategy-fingerprint-stamp-coverage — review the
    fix-checks accumulator (tmp/fix-checks-summary.md in the node's worktree,
    also posted in PR #3023 comments) to diagnose why 3 automated attempts left
    CI red, then either resolve that hold tactic (phase: done) to grant
    tactic-strategy-fingerprint-stamp-coverage a fresh retry budget, or
    abandon/redesign the approach. Once both holds clear, this alarm node
    self-resolves to phase: done via `dispatch-fleet-alarm --resolve --kind
    unclaimed-hold` — no plan body is ever needed here, matching the
    tactic-fleet-alarm-busy-stall precedent (create → resolve, twice, with no
    plan authored either time)."
  session_type: other
pace_exempt: true
rounds: null
attributes: {}
---
tracked hold(s) have blocked top-ranked work while unclaimed by any session or reservation: tactic-hold-conflict-manual-path-reservation-sweep -> tactic-manual-path-reservation-sweep; tactic-hold-fix-cap-strategy-fingerprint-stamp-coverage -> tactic-strategy-fingerprint-stamp-coverage

Thresholds: DISPATCH_FLEET_WATCH_HOLD_MIN_AGE=86400s,
DISPATCH_FLEET_WATCH_HOLD_TOP_K=10
Pause state: not-paused (unclaimed holds are evaluated regardless of pause)
