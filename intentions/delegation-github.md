---
id: delegation-github
kind: delegation
statement: Code hosting, issue tracking, and CI delegated to GitHub
owner: human
status: codified
parent: null
serves:
  - strategy-owned-orchestration
rationale: >-
  GitHub holds the repository, the issue graph the dispatch chain runs on,
  and CI. It is the hardest of the current infrastructure migrations —
  feasible if not convenient. Git itself is fully portable; the sticky parts
  are the issue/PR relationship data the workflow depends on and the Actions
  wiring.
reading: null
gap: null
clarifications: []
tooling_goals: []
success_signal: null
attributes:
  delegatee: GitHub (Microsoft)
  delegated: repository hosting, issue/PR graph, CI execution
  origin: chosen
  divergence:
    level: low
    imported:
      - terms of service
      - Actions pricing and quotas
      - API rate-limit policy
    contradictions: []
  irreversibility:
    recovery_path: >-
      re-host — git is portable by design; issues/PR relationships export via
      API; Actions workflows would need porting to another runner
    recovery_cost: days of migration work; the issue-graph conventions the dispatch chain reads are the largest piece
    gated: false — all data exportable via API
    last_exercised: null
  classification: platform
  non_delegable_floor: the repo itself — full clones exist on local machines at all times
  review_trigger: terms, pricing, or API changes hostile to individual-scale automation
  last_assessed: 2026-07-02
---
# Code hosting, issue tracking, and CI delegated to GitHub
