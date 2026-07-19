---
id: tactic-owner-review-reading-pass-b
kind: tactic
statement: Owner-review reading pass (2 of 2) — write first sensor-run readings
  at office-hours for 13 owner-review strategies, open-weight-readiness through
  user-onboarding
owner: human
status: delegated
parent: null
rationale: "The human half of the first sensor pass, second chunk: these
  strategies name owner-review sensors, so the owner running the review at
  office-hours IS the sensor — their readings are owner knowledge, not
  claude-derivable. Split alphabetically into two chunks of 13 to stay under the
  30-author-minute born-parked cap; the sibling chunk is
  tactic-owner-review-reading-pass-a, which also records the deliberate
  exclusions (strategies with live validates-terminal tactics)."
reading: null
gap: null
serves:
  - strategy-graph-drives-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution:
  branch: tactic-owner-review-reading-pass-b
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint:
    strategy-graph-drives-dispatch:
      hash: 600086b571b997058c8d2f7f952239af11a9bea58d3d3a238c3a9a44db1b744e
      sha: df4d47f23697ae65634357b7766302e6f1677ae9
validates:
  - strategy-graph-drives-dispatch
blocked_by: []
office_hours:
  reason: "Born-parked human tactic: 13 strategies name owner-review sensors — the
    owner running the review at office-hours is the sensor — so their first
    readings are owner knowledge, not claude-decidable. ~20-25 author-minutes
    for the 13-strategy list in the body."
  since: 2026-07-11
  recommendation: "At office-hours: for each strategy listed in this node's body,
    run its named sensor (review the surface success_signal.sensor names) and
    write an honest reading string plus gap via dump-node.ts → edit →
    write-node.ts, landing all edits in one graph-commit. After
    tactic-first-sensor-pass lands, read-sensors' stderr unregistered-sensor
    list enumerates the same set mechanically. If this is the round's last open
    tactic (siblings tactic-intention-store-sensor, tactic-first-sensor-pass,
    tactic-owner-review-reading-pass-a all done), also stamp
    strategy-graph-drives-dispatch rounds {count: 1, last_completed: <date>} in
    the same session."
pace_exempt: false
rounds: null
attributes: {}
---
# Owner-review reading pass (2 of 2) — write first sensor-run readings at office-hours for 13 owner-review strategies, open-weight-readiness through user-onboarding

Born-parked human tactic (align-tactics Step 4 shape): no implement-phase
plan — the work is the author's, at office-hours. Sibling chunk:
tactic-owner-review-reading-pass-a (which also records the round's
exclusions).

## What to do (~20-25 author-minutes)

For each strategy below, run its named sensor — review the surface its
`success_signal.sensor` names — and write an honest `reading` string plus
`gap` (null only if the threshold is genuinely met) via dump-node.ts → edit →
write-node.ts, landing all edits in one graph-commit:

1. strategy-open-weight-readiness — owner review over recorded drill results
2. strategy-owned-orchestration — fork and derivative review
3. strategy-progressive-validation — owner review
4. strategy-promote-progressive-detachment — fork/derivative counts and user-migration checks
5. strategy-recover-author-autonomy — owner review; the dependency delegation records
6. strategy-recover-discovery — owner review
7. strategy-recover-publishing — owner review
8. strategy-reversible-institution — owner review
9. strategy-services-funnel — the nathan@natb1.com inbox
10. strategy-show-not-tell — owner review of each public artifact
11. strategy-structural-absence — repo and workflow review
12. strategy-tabletop-storytelling — owner review; the fellspiral post history
13. strategy-user-onboarding — office-hours review of inbound reports (issues, webmentions, email)

## Why human

These sensors ARE the owner's review — the owner running the review at
office-hours is the sensor run (strategy-graph-drives-dispatch clarification
7), so the readings are owner knowledge, not claude-derivable.
