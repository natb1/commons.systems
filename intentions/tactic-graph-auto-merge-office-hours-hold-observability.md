---
id: tactic-graph-auto-merge-office-hours-hold-observability
kind: tactic
statement: graph-auto-merge's office_hours hold is a silent, unbounded merge
  veto -- surface held-for-office-hours counts to the tick's alarm/health signal
  and escalate a node held across many consecutive ticks, so a mass or stuck
  park does not silently drain the node-lane merge queue
owner: ai
status: raw
parent: null
rationale: "Draft filed by /review-fix during the review pass on PR #3033
  (tactic-graph-auto-merge-office-hours-gate). The red-team finder observed that
  the new office_hours gate added in that PR makes office_hours a hard,
  indefinite merge veto with no escalation path and no bound: the sweep only
  prints `held <id> (office-hours)` to a tick log, never demotes, never alerts,
  and never expires the hold. This is newly reachable by automation that
  previously could not block merges -- the terminal-without-disposition sweep,
  fleet-alarm/unclaimed-hold parks, and Stop-hook backstop parks all set
  office_hours autonomously, and false parks are a recurring failure mode in
  this system. A mass false-park event would silently convert the entire
  node-lane merge queue into a no-op, and a plain `held` line is visually
  indistinguishable from the pre-existing freshness holds, so the stall would
  not surface as an anomaly. Classified `Deferred` (advisory, not a required
  security fix) by the review-fix Workflow's classify stage -- it did not go
  through the adversarial verify gate (that gate only runs on `Required`
  findings). Location:
  .claude/skills/dispatch-propagate/scripts/graph-auto-merge:134."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
# graph-auto-merge's office_hours hold is a silent, unbounded merge veto -- surface held-for-office-hours counts to the tick's alarm/health signal and escalate a node held across many consecutive ticks, so a mass or stuck park does not silently drain the node-lane merge queue

## Provenance

- **Source PR:** #3033 (`tactic-graph-auto-merge-office-hours-gate`)
- **Location:** `.claude/skills/dispatch-propagate/scripts/graph-auto-merge:134`
- **Finding source:** `red-team` finder, review-fix pass on PR #3033
- **Bucket:** Deferred (advisory) — not routed through the adversarial verify
  gate, which runs only on `Required` findings

## Failure scenario

The change landed by PR #3033 turns `office_hours` into a hard, indefinite
merge veto with no escalation path and no bound. Any actor or automated sweep
that can write `office_hours` on a node can now permanently stall delivery of
already-reviewed, green, conflict-free work: the sweep only prints
`held <id> (office-hours)` to a tick log, never demotes, never alerts, and
never expires the hold — the only exit is a human office-hours session. This
is newly reachable by automation that previously could not block merges: the
terminal-without-disposition sweep, fleet-alarm/unclaimed-hold parks, and
Stop-hook backstop parks all set `office_hours` autonomously, and false parks
are a recurring failure mode in this system. A mass false-park event (one
sweep parking many nodes in a single pass) silently converts the entire
node-lane merge queue into a no-op, and because a plain `held` line is
visually indistinguishable from the pre-existing freshness holds, the stall
does not surface as an anomaly.

## Recommended fix

Make the hold observable and bounded: emit the office-hours holds to a
counter/sensor the tick already surfaces (fold them into the fleet-alarm or
repo-health signal rather than stdout only), and alarm when a node has been
held for office-hours across more than N consecutive ticks or when the held
count exceeds a threshold, so a mass or stuck park is escalated rather than
silently draining the merge lane.

## Adversarial verdict

Not applicable — this finding was classified `Deferred` (advisory) by the
review-fix Workflow's classify stage, not `Required`, so it was never sent to
the adversarial skeptic verify gate. No skeptic has weighed in on it; treat it
as an unverified observation pending a later `/align-tactics` finalize round.
