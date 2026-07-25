---
id: delegation-github
kind: delegation
statement: Code hosting, issue tracking, and CI delegated to GitHub
owner: human
status: codified
parent: null
rationale: GitHub holds the repository, the issue graph the dispatch chain runs
  on, and CI. It is the hardest of the current infrastructure migrations —
  feasible if not convenient. Git itself is fully portable; the sticky parts are
  the issue/PR relationship data the workflow depends on and the Actions wiring.
reading: null
gap: null
serves:
  - strategy-owned-orchestration
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
    recovery_path: re-host — git is portable by design; issues/PR relationships
      export via API; Actions workflows would need porting to another runner
    recovery_cost: "measured 2026-07-16 drill: hours-to-about-a-day, dominated by CI
      porting (8 workflow files to a new runner) and a rate-limited PR/comment
      re-import (1312 PRs + 6343 comments span multiple GitHub REST 5000/hr
      windows via Gitea's migrator); the issue graph (local intentions/, 0
      GitHub issues remain) and git history (mirrored clones exist) carry
      near-zero recovery cost. See ops/recovery-drills/github-drill-report.md."
    gated: false — all data exportable via API
    last_exercised: 2026-07-16
  classification: platform
  non_delegable_floor: the repo itself — full clones exist on local machines at all times
  review_trigger: terms, pricing, or API changes hostile to individual-scale automation
  last_assessed: 2026-07-02
  household:
    shared: false
    basis: Developer-side code hosting, issue tracking, and CI for the project; no
      household attachment.
    consent: []
    preferences: []
---
# Code hosting, issue tracking, and CI delegated to GitHub
