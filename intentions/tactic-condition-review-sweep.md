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
clarifications:
  - question: Where does the standing-conditions sweep live, now its named home (the
      rung-5 consistency pass) was thought retired?
    answer: "Home settled: /align-audit. Resolved 2026-07-22 at the
      tactic-align-audit-legacy-review sitting (owner-directed Claude
      resolution). The original-home premise was itself partly stale — the
      rung-5 consistency-tester role (align-consistency) is live in /align-init
      (see tactic-align-audit-legacy-review Decision 1) — but /align-audit is
      the better home on altitude and parsimony: the sweep is a mechanical
      whole-graph coverage-and-record requirement (enumerate every
      attributes.conditions entry each cycle, record which were checked), which
      fits /align-audit's digest-first mechanical pass with per-run coverage
      recording, not the evaluative align-consistency pass (charter compliance,
      ratchet risk). The sweep's substance is already partly covered by three
      live mechanisms — /align-strategy's improvement-pass condition-staleness
      check, /align-audit step 5's sampled rationale-vs-condition check, and
      /align-init's align-consistency pass — so a fresh /align-tactics finalize
      should scope this node to the residual: the
      sweep-ALL-conditions-each-cycle-and-record-coverage discipline none of the
      three guarantees. Not pruned (a distinctive residual remains);
      office_hours cleared and the blocked_by edge to the sitting removed; kept
      status:raw pending that finalize. Boldness: medium (parsimony/altitude
      judgment)."
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
# Add a standing conditions sweep to the align dialectic's consistency pass

## Home — /align-audit (settled 2026-07-22)

Settled at the tactic-align-audit-legacy-review sitting (2026-07-22,
owner-directed): the standing-conditions sweep is homed in /align-audit
(tactic-align-audit-skill). An earlier draft named /align-init's scheduled
rung-5 consistency-tester role (align-consistency); the 2026-07-09 /align
consolidation was thought to have retired that engine, but it is in fact
still live in /align-init (carried forward unchanged by tactic-align-init-skill,
#2781) — so the original home never actually disappeared. /align-audit is
nonetheless the better home on altitude and parsimony: the sweep is a
mechanical whole-graph coverage-and-record requirement (enumerate every
`attributes.conditions` entry each cycle, record which were checked), which
fits /align-audit's digest-first mechanical pass with per-run coverage
recording, not the evaluative align-consistency pass (charter compliance,
ratchet risk). A fresh /align-tactics finalize should scope this node to the
residual not already covered by three live mechanisms — /align-strategy's
improvement-pass condition-staleness check, /align-audit step 5's sampled
rationale-vs-condition check, and /align-init's align-consistency pass: the
sweep-ALL-conditions-each-cycle-and-record-coverage discipline none of the
three guarantees. See the 2026-07-22 clarification for the full disposition.

The sweep's substance is unchanged: kind-strategy calls every
`attributes.conditions` entry a standing review trigger, and something must
sweep all strategy conditions each cycle and record which were checked;
sensor spend-shaped conditions through the owned budget pipeline where
possible.

Parked 2026-07-11 by /align-tactics pending that author decision; park
cleared and the `blocked_by` edge to the sitting removed 2026-07-22 when the
sitting settled the home. Kept `status: raw` for a fresh /align-tactics
finalize scoped to the residual above.
