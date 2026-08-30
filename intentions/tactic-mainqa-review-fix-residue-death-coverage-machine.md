---
id: tactic-mainqa-review-fix-residue-death-coverage-machine
kind: tactic
statement: "Post-merge verification of tactic-review-fix-residue-death-coverage
  (PR #3022) — machine-verifiable items"
owner: ai
status: codified
parent: null
rationale: null
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: main-qa
execution:
  branch: tactic-review-fix-residue-death-coverage
  pr: 3022
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by:
  - tactic-review-fix-residue-death-coverage
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Post-merge verification of tactic-review-fix-residue-death-coverage (PR #3022) — machine-verifiable items

## Context

Post-merge verification recorded by `/qa-fix` at qa record time for
`tactic-review-fix-residue-death-coverage` (PR #3022). Verified against the deployed `main` for that PR,
not against a preview.

## Verification items

- **7 — Production observation — a real dying disposition agent is caught downstream**
  - Path: `current`
  - Expected outcome: A genuine review-fix Lane-A residue-disposition subagent death in production surfaces every untriaged finding as a `Deferred`-bucket PR-comment entry with a filed follow-up, rather than dropping it silently.
  - Finding: Not walked at qa-fix time — the failure mode (the Opus residue-disposition subagent dying after retries inside a live `/review-fix` Workflow run) cannot be reproduced from the working tree. The helper (`undispositionedResidueRecords`) is already covered offline by the shell-test fixtures (`total-death`, `partial-drop` cases), which passed during qa-fix. This is the tactic's own plan-designated "observe in production" verification item.
  - Verifiability: WAIT
  - Check: once that event occurs, check that run's PR comment for a `Deferred`-bucket entry per untriaged finding and a partial-coverage line naming the residue-disposition cause (`Lane-A residue disposition degraded: ... were never triaged`), and confirm the corresponding follow-up issues were filed with the expected `Backlink:` and blocker linkage.
