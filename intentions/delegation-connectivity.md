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
  serves the address. The record supports two readings, and the resolution
  turns on which one is load-bearing. Reading A, immediate degraded fallback,
  rests on this rationale's 'the substitute path is cellular tethering or fixed
  wireless at degraded capacity' and on the matching `recovery_path`,
  'substitute — cellular tethering or fixed wireless at degraded capacity',
  reinforced by `gated.level: none` and its note that those paths 'run through
  unrelated carriers' — nothing blocks the switch and it can be exercised the
  same day, which on its own would argue for `moderate`. Reading B, no
  alternative wired provider, rests on this rationale's 'no second wired
  provider serves the address' and on `recovery_path`'s 'no second wired
  provider at the address'. Reading B was taken as load-bearing. The axis
  scores the cost of recovering what was delegated — household internet
  connectivity at wired capacity, which this record says every hosted surface,
  sync, and vendor relationship assumes — not the cost of reaching a standby.
  Reading A's substitutes restore reachability but not that capacity, so
  exercising them leaves the delegation un-recovered; the only parity path is a
  change of address, which the household cannot elect at will, and that is what
  `high` names. Reading A was therefore judged insufficient to lower the cost:
  how fast the failover happens says nothing about the parity gap the axis is
  scoring. Nothing in the record contradicts `high`. Revisit if the recorded
  `review_trigger` fires and a second wired provider reaches the address, which
  would collapse Reading B and put `moderate` back in play."
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
