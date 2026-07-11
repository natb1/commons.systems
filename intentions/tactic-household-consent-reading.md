---
id: tactic-household-consent-reading
kind: tactic
statement: "Take the strategy's first reading: review every recovery or
  re-alignment move touching shared attachments against recorded household
  consent"
owner: human
status: delegated
parent: null
rationale: "The round's reading-producing terminal (validates edge): the sensor
  is owner review at office-hours over the delegation records, so the reading is
  owner work by nature. With the instrument landed and the marking ratified, the
  office-hours session runs the consent report, reviews each in-flight or
  planned move touching a shared record (recovers edges; re-alignments), records
  consent state with the household, decides the threshold baseline (whether
  moves executed before this round read retroactively — reserved to the author
  by the 2026-07-11 clarification), and records the strategy's fresh reading,
  gap, and rounds count 1 / last_completed. Born-parked 2026-07-11
  /align-tactics round."
reading: null
gap: null
serves:
  - strategy-household-shared-attachments
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates:
  - strategy-household-shared-attachments
blocked_by:
  - tactic-household-consent-instrument
  - tactic-household-consent-offering
office_hours:
  reason: "Owner reading (about 30 minutes), runs after
    tactic-household-consent-instrument lands and
    tactic-household-consent-offering is completed: review moves touching
    household-shared delegations against recorded consent and produce the
    strategy's first reading. Not claude-decidable — consent state and the
    threshold baseline are household/author decisions."
  since: 2026-07-11
  recommendation: "One office-hours block: (1) run node --import tsx/esm
    packages/intentionsutil/scripts/household-consent-report.ts; (2) for each
    shared record with a move touching it (e.g. strategy-recover-finance into
    delegation-finance-saas, strategy-recover-knowledge into
    delegation-knowledge-notes, any re-alignment strategy-realign-attachments
    has recorded), confirm or record the household consent entry; (3) decide
    whether pre-round moves read retroactively; (4) write the fresh reading and
    remaining gap on strategy-household-shared-attachments plus rounds count 1 /
    last_completed via write-node.ts + graph-commit, and mark this tactic done."
pace_exempt: false
rounds: null
attributes: {}
---
# Take the strategy's first reading: review every recovery or re-alignment move touching shared attachments against recorded household consent

Born-parked owner work, minted 2026-07-11 by the `/align-tactics` round on
`strategy-household-shared-attachments`; the round's reading-producing
terminal (`validates` edge). Blocked on
`tactic-household-consent-instrument` (the consent report is that session's
script) and `tactic-household-consent-offering` (so the review reads
ratified markings and an offered — not imposed — practice). The sensor is
the owner review itself, so the reading is owner work: review each recovery
or re-alignment move touching a household-shared delegation against its
recorded consent, decide the threshold baseline (whether pre-round moves
read retroactively — reserved to the author by the strategy's 2026-07-11
clarification), then record the fresh reading and remaining gap on the
strategy and stamp `rounds` count 1 / `last_completed`. Completing this
tactic completes the round. No implement-phase plan by design — the
office-hours recommendation carries the step list.
