---
id: strategy-realign-attachments
kind: strategy
statement: Re-align what is not yet recovered — swap engagement-funded
  delegatees for fee-aligned ones on portable terms
owner: human
status: refining
parent: strategy-recover-author-autonomy
rationale: >-
  Every strategy serving virtue-alignment-of-attachments currently serves it by
  building an owned replacement — a detachment-axis move whose cost keeps the
  recovery queue long. The virtue itself names a cheaper move this strategy
  makes first-class: for domains awaiting selection, swap the engagement-funded
  delegatee for one whose alignment can be managed — a vendor whose business is
  the fee, on portable terms (owned domain, open formats, standard protocols).
  Canonical first move: email on an owned domain at a paid provider — the domain
  preserves full mobility, so a later provider swap is a DNS change. Likewise
  DRM-free purchases over streaming rental.

  Re-alignment is not recovery — this node carries no recovers edge — but it
  lowers portfolio divergence immediately at days-not-months cost, and it stages
  recovery: a delegation moved to portable terms is far cheaper to unwind later.
  This is the graph's first strategy whose primary axis is divergence rather
  than irreversibility.
reading: null
gap: null
serves:
  - virtue-alignment-of-attachments
recovers: []
clarifications:
  - question: What counts as a 'recorded re-alignment' for the success-signal threshold?
    answer: "An executed swap recorded on the delegation record itself: a dated
      attributes.realignment entry naming what moved, from which
      engagement-funded delegatee to which fee-aligned one, and the portable
      terms. Intent, a plan, or an interim-path prose mention does not count —
      the rationale's claim is that re-alignment lowers portfolio divergence
      immediately, which only an executed swap does. Convention home:
      kind-delegation attributes.fields; mechanical predicate: the
      delegation-records sensor's coverage rule
      (tactic-realignment-coverage-sensor lands both —
      tactic-first-sensor-pass's plan explicitly deferred the re-alignment arm
      until a recording convention lands). Recorded 2026-07-11 /align-tactics
      round."
tooling_goals: []
success_signal:
  observable: high-divergence delegation records that have neither a recovery
    strategy nor a recorded re-alignment
  sensor: the delegation records themselves
  threshold: every high-divergence record is covered by a recovers edge or a
    recorded re-alignment
  is_proxy: false
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds:
  count: 0
  last_completed: null
attributes:
  conditions:
    - fee-aligned vendors exist on portable terms (owned domains, open formats,
      standard protocols) in the affected domains
---
# Re-align what is not yet recovered — swap engagement-funded delegatees for fee-aligned ones on portable terms
