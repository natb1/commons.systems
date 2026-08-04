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
  reason: "Both holds this alarm names are still genuinely unclaimed and blocking,
    but the fix is out of align-tactics' scope.
    tactic-hold-conflict-manual-path-reservation-sweep and
    tactic-hold-fix-cap-strategy-fingerprint-stamp-coverage are each ALREADY
    office_hours-parked (since 2026-08-03) with a full diagnosis and worked-out
    resolution on their own nodes. align-tactics produces tactic decompositions
    and plans; it never runs /dispatch-conflict or /office-hours mechanics and
    cannot itself claim or resolve a hold. There is no PR-sized tactic to
    decompose this alarm into: the alarm has already achieved its purpose
    (surfacing the condition into the graph), and the remaining work is a
    human/office-hours pass on the two named hold tactics directly. This is an
    unverifiable blocker per the autonomy contract -- the blocker (two unclaimed
    holds requiring human/office-hours remediation) cannot be resolved from the
    graph alone by this skill."
  since: 2026-08-04
  recommendation: "Run /office-hours
    tactic-hold-conflict-manual-path-reservation-sweep and /office-hours
    tactic-hold-fix-cap-strategy-fingerprint-stamp-coverage directly -- both
    already carry a full diagnosis and recommended fix in their own
    office_hours.recommendation fields (since 2026-08-03). Once both hold
    tactics resolve to phase: done (then prune) and their blocked_by edges clear
    off tactic-manual-path-reservation-sweep and
    tactic-strategy-fingerprint-stamp-coverage, dispatch-fleet-watch's
    unclaimed-hold predicate goes clear on its next pass and
    dispatch-fleet-alarm --resolve marks this alarm node done automatically --
    no further align-tactics action is needed on this node. Note for whoever
    next reviews this alarm: this exact node has frozen 14 prior /align-tactics
    worker sessions at a permission/classifier denial (see git log on this file)
    -- an unattended dispatch worker apparently cannot get past some gated
    action here, most likely a claim-check needing dangerouslyDisableSandbox
    with no human present to approve it. This park breaks that loop by removing
    the node from the router's draft-tactic candidate pool."
  session_type: other
pace_exempt: true
rounds: null
attributes: {}
---
tracked hold(s) have blocked top-ranked work while unclaimed by any session or reservation: tactic-hold-conflict-manual-path-reservation-sweep -> tactic-manual-path-reservation-sweep; tactic-hold-fix-cap-strategy-fingerprint-stamp-coverage -> tactic-strategy-fingerprint-stamp-coverage

Thresholds: DISPATCH_FLEET_WATCH_HOLD_MIN_AGE=86400s,
DISPATCH_FLEET_WATCH_HOLD_TOP_K=10
Pause state: not-paused (unclaimed holds are evaluated regardless of pause)
