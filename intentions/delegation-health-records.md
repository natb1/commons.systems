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
