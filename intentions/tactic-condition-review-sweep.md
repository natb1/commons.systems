---
id: tactic-condition-review-sweep
kind: tactic
statement: Add a standing conditions sweep to the align dialectic's consistency pass
owner: human
status: raw
parent: null
rationale: kind-strategy calls every attributes.conditions entry a standing
  review trigger, but nothing reviews them. Have /align-init's scheduled rung-5
  consistency-tester role (align-consistency) sweep all strategy conditions each
  cycle and record which were checked; sensor spend-shaped conditions through
  the owned budget pipeline where possible.
reading: null
gap: null
serves:
  - strategy-explicit-intent
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by:
  - tactic-align-audit-legacy-review
office_hours:
  reason: "Rehoming undecided: this sweeps recorded home (the scheduled rung-5
    consistency pass) was retired by the 2026-07-09 /align consolidation, and
    the tactic-align-audit-legacy-review sitting (its decision 3) settles where
    the standing-conditions sweep lives. The 2026-07-11 /align-tactics round
    could not finalize this draft without guessing the home the author reserved
    for that sitting. No separate sitting is needed — this node waits on that
    one (blocked_by)."
  since: 2026-07-11
  recommendation: "Resolve at the tactic-align-audit-legacy-review sitting: settle
    the rehoming there, then amend this nodes home and clear the park for a
    fresh /align-tactics finalize — or prune it if the sitting folds the sweep
    into /align-audit directly."
pace_exempt: false
rounds: null
attributes: {}
---
# Add a standing conditions sweep to the align dialectic's consistency pass

## Home — undecided; settled by the tactic-align-audit-legacy-review sitting

An earlier draft of this node named /align-init's scheduled rung-5
consistency-tester role (align-consistency) as the sweep's home. The
2026-07-09 /align consolidation then retired the scheduled rung-5 dialectic
engine entirely; the office-hours sitting recorded at
tactic-align-audit-legacy-review (its decision 3) settles where the
standing-conditions sweep lives — /align-audit inclusion, another home, or
retirement.

The sweep's substance is unchanged: kind-strategy calls every
`attributes.conditions` entry a standing review trigger, and something must
sweep all strategy conditions each cycle and record which were checked;
sensor spend-shaped conditions through the owned budget pipeline where
possible.

Parked 2026-07-11 by /align-tactics pending that author decision (see
`office_hours` and the `blocked_by` edge to the sitting).
