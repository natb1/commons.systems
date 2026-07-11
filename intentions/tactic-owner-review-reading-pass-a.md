---
id: tactic-owner-review-reading-pass-a
kind: tactic
statement: Owner-review reading pass (1 of 2) — write first sensor-run readings
  at office-hours for 13 owner-review strategies, author-approved-copy through
  open-source-as-gift
owner: human
status: delegated
parent: null
rationale: "The human half of the first sensor pass: these strategies name
  owner-review sensors, so the owner running the review at office-hours IS the
  sensor — their readings are owner knowledge, not claude-derivable. Split
  alphabetically into two chunks of 13 to stay under the 30-author-minute
  born-parked cap; the sibling chunk is tactic-owner-review-reading-pass-b.
  Strategies whose readings are already owned by live validates-terminal tactics
  (attention-surface, complete-ledger, data-structure-first, domain-selection,
  exercise-voice, own-audience, recover-finance, recover-knowledge) are
  deliberately excluded — their in-flight tactics produce those readings."
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
  branch: tactic-owner-review-reading-pass-a
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: d998d5c0754b51cfc489ee784db11b77d9b40eb91777ee0215076b0ad1a6bb69
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
    tactic-owner-review-reading-pass-b all done), also stamp
    strategy-graph-drives-dispatch rounds {count: 1, last_completed: <date>} in
    the same session."
pace_exempt: false
rounds: null
attributes: {}
---
# Owner-review reading pass (1 of 2) — write first sensor-run readings at office-hours for 13 owner-review strategies, author-approved-copy through open-source-as-gift

Born-parked human tactic (align-tactics Step 4 shape): no implement-phase
plan — the work is the author's, at office-hours. Sibling chunk:
tactic-owner-review-reading-pass-b.

## What to do (~20-25 author-minutes)

For each strategy below, run its named sensor — review the surface its
`success_signal.sensor` names — and write an honest `reading` string plus
`gap` (null only if the threshold is genuinely met) via dump-node.ts → edit →
write-node.ts, landing all edits in one graph-commit:

1. strategy-author-approved-copy — owner audit of merged copy changes
2. strategy-autonomous-execution — the office-hours dashboard (backlog runway, capacity band, escalations)
3. strategy-commons-income — the owned budgeting pipeline, revenue view
4. strategy-distribute-workflow — fork and derivative review
5. strategy-explicit-intent — owner review
6. strategy-financial-sustainability — budget app accounts plus the horizon config in natb1/office-hours-nate
7. strategy-graph-integrity — the /align-audit report
8. strategy-graph-mounts — goals page review plus validate-graph
9. strategy-graph-review-curriculum — owner review; the digest/audit coverage table once it exists
10. strategy-graph-self-description — the CI drift guard (transcribe its current status)
11. strategy-household-shared-attachments — owner review over the delegation records
12. strategy-join-existing-practice — owner review
13. strategy-open-source-as-gift — fork reviews and practitioner reports

## Why human

These sensors ARE the owner's review — the owner running the review at
office-hours is the sensor run (strategy-graph-drives-dispatch clarification
7), so the readings are owner knowledge, not claude-derivable.

## Exclusions (already owned elsewhere — do not duplicate)

attention-surface, complete-ledger, data-structure-first, domain-selection,
exercise-voice, own-audience, recover-finance, recover-knowledge each have a
live validates-terminal tactic producing their reading;
exercise-recovery-paths, realign-attachments, token-economy,
graph-native-dispatch, and graph-drives-dispatch itself are covered
mechanically by tactic-first-sensor-pass; nourishment, physical-training, and
sleep-regularity name no signal.
