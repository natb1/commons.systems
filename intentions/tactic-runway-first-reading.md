---
id: tactic-runway-first-reading
kind: tactic
statement: "Take strategy-financial-sustainability's first runway reading:
  ratify the available-funds account set, confirm the horizon config in
  natb1/office-hours-nate, and record reading/gap on the strategy"
owner: human
status: delegated
parent: null
rationale: "The round's reading-terminal. The runway number comes from the app
  instrument (tactic-budget-runway-instrument), but the reading itself is the
  author's: the available-funds account set must be ratified against what
  computeNetWorth covers, the time-to-revenue-self-sufficiency horizon lives in
  the private natb1/office-hours-nate repo (invisible to this public repo and to
  autonomous sessions), and the runway-vs-horizon comparison is the signal's
  threshold judgment. One sitting (15-30 minutes) produces the strategy's first
  reading and completes the round. Minted born-parked 2026-07-11 /align-tactics
  round."
reading: null
gap: null
serves:
  - strategy-financial-sustainability
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates:
  - strategy-financial-sustainability
blocked_by: []
office_hours:
  reason: "Human sensor: with the runway readout merged, load the real snapshot in
    the budget app and take the strategy's first reading — read the Projected
    runway months on the Accounts page, ratify (or narrow) the available-funds
    account set behind the number, confirm or author the
    time-to-revenue-self-sufficiency horizon config in the private
    natb1/office-hours-nate repo, and compare runway to horizon. Needs the
    author's real financial data and the private repo — not claude-executable.
    15-30 minutes."
  since: 2026-07-11
  recommendation: "Wait for tactic-budget-runway-instrument to merge. Then at one
    sitting: (1) open the budget app on the current .benc snapshot, Accounts
    page, note the Projected runway figure; (2) confirm the statement-fed
    account set matches 'available funds' — if any account should be excluded,
    file the narrowing as a follow-up tactic rather than blocking the reading;
    (3) open the horizon config in natb1/office-hours-nate (author it if
    missing: months to revenue self-sufficiency); (4) record the dated reading
    and derived gap on strategy-financial-sustainability, stamp rounds {count:
    1, last_completed: <date>} as round completion, and set this tactic phase:
    done — one graph-commit."
pace_exempt: false
rounds: null
attributes: {}
---
# Take strategy-financial-sustainability's first runway reading: ratify the available-funds account set, confirm the horizon config in natb1/office-hours-nate, and record reading/gap on the strategy

Born-parked: the reading is the author's, not delegable — it needs the real
`.benc` snapshot, the private `natb1/office-hours-nate` horizon config
(invisible to this repo and to autonomous sessions), and the judgment of
whether the statement-fed account set honestly means "available funds". One
sitting (15-30 minutes) after `tactic-budget-runway-instrument` merges. The
`office_hours.recommendation` carries the run procedure and the completion
stamps (reading + gap on the strategy, `rounds {count: 1, last_completed}`,
this tactic `phase: done`).
