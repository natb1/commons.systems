---
id: delegation-connectivity
kind: delegation
statement: Home connectivity delegated to a single wired ISP, cellular as the
  only fallback
owner: human
status: raw
parent: null
rationale: "One wired ISP carries the household's connectivity; no second wired
  provider serves the address, so the substitute path is cellular tethering or
  fixed wireless at degraded capacity (owner interview, 2026-07-02). Recorded
  2026-07-02 by the completeness sweep (strategy-complete-ledger). Connectivity
  sits under the delegations more than under the recovery paths — the
  local-first artifacts keep working offline by design — but every hosted
  surface, sync, and vendor relationship assumes it. Raw per kind-delegation;
  axes below are a first pass, not an assessment. Axis resolution
  (tactic-delegation-classification-derivation, 2026-08-04): recovery_cost
  resolved to `high` — the recorded assessment was immediate but degraded:
  cellular tethering or fixed wireless restores connectivity at once, but
  recovering it at parity would require moving, since no second wired provider
  serves the address."
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
  delegatee: the wired ISP; a cellular carrier as fallback
  delegated: household internet connectivity
  origin: chosen
  divergence:
    level: low
    imported:
      - pricing and bundling
      - traffic management policies
    contradictions: []
  irreversibility:
    recovery_path: substitute — cellular tethering or fixed wireless at degraded
      capacity; no second wired provider at the address
    recovery_cost: high
    gated:
      level: none
      note: no gating stated — the substitute paths (cellular tethering, fixed
        wireless) run through unrelated carriers
    last_exercised: null
  non_delegable_floor: unassessed
  review_trigger: a second wired provider reaching the address, or the ISP's terms
    shifting against the household
  last_assessed: 2026-07-02
  household:
    shared: true
    basis: The rationale states one wired ISP carries the household's connectivity;
      an ISP change affects the whole household's internet access.
    consent: []
    preferences: []
---
# Home connectivity delegated to a single wired ISP, cellular as the only fallback
