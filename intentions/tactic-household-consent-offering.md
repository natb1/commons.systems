---
id: tactic-household-consent-offering
kind: tactic
statement: Offer the consent practice to the household and ratify the
  shared-attachment marking — the practice is offered, never imposed
owner: human
status: delegated
parent: null
rationale: "Human half of the round: the strategy's statement makes the offering
  itself the constraint — family members are not conscripted into the practice.
  The author reviews the instrument's proposed household-shared markings and the
  household field shape, then has the household conversation: how consent is
  asked and recorded for moves touching shared attachments, and which member
  preferences or objections get recorded. Not claude-decidable by nature —
  markings and the field shape are ratified here before any consent is recorded,
  and preference entries carry only the household's own voice. Born-parked per
  /align-tactics Step 4. Recorded 2026-07-11 /align-tactics round."
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
validates: []
blocked_by:
  - tactic-household-consent-instrument
office_hours:
  reason: "Author + household work (about 30 minutes), runs after
    tactic-household-consent-instrument lands: ratify or amend the proposed
    household-shared markings and the attributes.household field shape, and
    offer the consent-recording practice to the household — never impose it.
    Record any voiced platform preferences or objections on the affected
    delegation records."
  since: 2026-07-11
  recommendation: "One office-hours block: (1) run node --import tsx/esm
    packages/intentionsutil/scripts/household-consent-report.ts and read the
    proposed markings with their basis lines; (2) amend or ratify each record's
    attributes.household.shared via write-node.ts + graph-commit; (3) with the
    household, agree how consent gets asked and recorded for moves touching
    shared attachments, and record voiced preferences/objections in the records'
    household.preferences; (4) clear this park —
    tactic-household-consent-reading becomes selectable."
pace_exempt: false
rounds: null
attributes: {}
---
# Offer the consent practice to the household and ratify the shared-attachment marking — the practice is offered, never imposed

Born-parked owner work, minted 2026-07-11 by the `/align-tactics` round on
`strategy-household-shared-attachments`. The statement is the strategy's own
constraint: the consent practice is offered to the household, never imposed —
so this conversation and the marking ratification are the human half by
nature. Blocked on `tactic-household-consent-instrument` (the proposed
markings and the report this session reviews are that tactic's output).
Ratifying here means the shared/not-shared flags and the
`attributes.household` field shape carry the author's decision before any
consent entry is recorded; preference and objection entries carry only the
household's own voice. No implement-phase plan by design — the office-hours
recommendation carries the step list.
