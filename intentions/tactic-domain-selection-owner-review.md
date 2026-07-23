---
id: tactic-domain-selection-owner-review
kind: tactic
statement: Select or defer each scored candidate domain at office-hours — ratify
  or revise the 2026-07 scoring dossier and record the round's reading on
  strategy-domain-selection
owner: human
status: delegated
parent: null
rationale: "Minted 2026-07-11 by the /align-tactics round on
  strategy-domain-selection as the round's validates-terminal: the strategy's
  sensor is owner review at office-hours, so only the owner can produce the
  reading. Born-parked (owner work — no implement-phase body, phase omitted,
  office_hours set at creation) and blocked_by tactic-domain-selection-scoring
  so it surfaces only once the drafted dossier exists. Completing it fires the
  sensor: each raw candidate is selected (scheduling an /align-strategy
  interview to mint the recovery strategy) or explicitly deferred; the outcome
  lands as a dated clarification on strategy-domain-selection, whose reading is
  set and gap re-derived, and rounds stamps {count: 1, last_completed: <date>} —
  the round-completion write, made by hand in the bootstrap interim."
reading: null
gap: null
serves:
  - strategy-domain-selection
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution:
  branch: tactic-domain-selection-owner-review
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: e8bfd621082c91d5522fdde6bc85a01b86434ba41050391283992af28154c21f
validates:
  - strategy-domain-selection
blocked_by:
  - tactic-domain-selection-scoring
office_hours:
  reason: "Owner selection decision on the 2026-07 domain-selection round: review
    the drafted scoring dossier in tactic-domain-selection-scoring's body and,
    per raw candidate record, select or explicitly defer. Not ai-decidable —
    strategy-domain-selection's sensor is owner review at office-hours, and
    selection mints owner-interview work. If the dossier section is missing from
    that node's body, the scoring tactic (this tactic's blocked_by) has not
    completed yet — wait for it."
  since: 2026-07-11
  recommendation: "Work from the dossier's draft recommendations — ratify or
    revise each rather than re-scoring from scratch (≤30 minutes with the
    dossier prepared). Record the select/defer outcome as a dated clarification
    on strategy-domain-selection; set its reading (e.g. 2026-07 round: all raw
    records scored — <selected ids> selected, rest explicitly deferred),
    re-derive gap against the threshold, and stamp rounds {count: 1,
    last_completed: <date>}. For each selected candidate, run /align-strategy to
    mint the recovery strategy (naming the delegation record in its recovers).
    For each deferral, confirm the record's interim path stays named."
pace_exempt: false
rounds: null
attributes: {}
---
# Select or defer each scored candidate domain at office-hours — ratify or revise the 2026-07 scoring dossier and record the round's reading on strategy-domain-selection
