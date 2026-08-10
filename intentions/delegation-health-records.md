---
id: delegation-health-records
kind: delegation
statement: Health records delegated to provider EHR portals
owner: human
status: raw
parent: null
rationale: >-
  Medical history, results, and provider correspondence live in provider EHR
  portals (MyChart-style). A future-candidate capture, recorded raw per
  kind-delegation and standing as a candidate input to
  strategy-domain-selection. Axes below are a first pass, not an assessment.

  Interim path while unselected: exercise the right of access — periodic export
  of records to owned files bounds the loss if a portal or provider relationship
  ends.

  Axis resolution (tactic-delegation-classification-derivation, 2026-08-04): no
  axis value changed here, but the classification the record used to store —
  platform — now derives from the axes, and it derives as `captured`. The gated
  band is what decides that. The recorded prose was `largely — export is by
  request through the party recovered from`, which maps to `large`, and the rest
  of the record sustains that reading rather than merely inheriting the word: no
  copy of the record is held here, the substitute path is not yet designed, and
  `last_exercised` is null, so every route to my own medical history runs
  through the provider, at the provider's discretion and in the provider's
  format. That is what separates it from the `partial` records —
  delegation-banking's export is exercised and bounds the loss, and
  delegation-identity-root's transfer moves artifacts already held locally.
  divergence stays `low` and recovery_cost stays `unassessed` as recorded, and
  neither contributes (`unassessed` triggers no arm of the rule), so `captured`
  rests on the gated band alone. It is a consequence of the derivation rule in
  kind-delegation, not an independent judgment that this attachment sits with
  delegation-attention-services; the record is still raw and its axes a first
  pass, so the gated band is the thing to challenge at the review trigger — and
  exercising the right of access is the move that would lower it.
reading: null
gap: null
serves: []
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
attributes:
  delegatee: provider EHR portals (MyChart-style patient portals)
  delegated: medical history, test results, appointments, and correspondence with
    providers
  origin: inherited
  divergence:
    level: low
    imported:
      - EHR vendor workflows
      - portal-mediated access to my own record
    contradictions: []
  irreversibility:
    recovery_path: substitute — periodic export to owned files under the right of
      access; not yet designed
    recovery_cost: unassessed
    gated:
      level: large
      note: export is by request through the party recovered from
    last_exercised: null
  non_delegable_floor: unassessed
  review_trigger: selection as a recovery domain (strategy-domain-selection)
  last_assessed: 2026-07-02
  household:
    shared: true
    basis: Family medical history, results, and provider correspondence for
      household members; a portal migration or owned-export recovery changes
      each member's access to their own record.
    consent: []
    preferences: []
---
# Health records delegated to provider EHR portals
