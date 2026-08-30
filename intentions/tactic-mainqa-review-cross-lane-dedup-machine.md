---
id: tactic-mainqa-review-cross-lane-dedup-machine
kind: tactic
statement: "Post-merge verification of tactic-review-cross-lane-dedup (PR #3028)
  — machine-verifiable items"
owner: ai
status: codified
parent: null
rationale: null
reading: null
serves:
  - strategy-token-economy
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: main-qa
execution:
  branch: tactic-review-cross-lane-dedup
  pr: 3028
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by:
  - tactic-review-cross-lane-dedup
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Post-merge verification of tactic-review-cross-lane-dedup (PR #3028) — machine-verifiable items

## Context

Post-merge verification recorded by `/qa-fix` at qa record time for
`tactic-review-cross-lane-dedup` (PR #3028). Verified against the deployed `main` for that PR,
not against a preview.

## Verification items

- **10 — Observe the first live `/review-fix` run after merge**
  - Path: `current`
  - Expected outcome: End-to-end absorption observed once on real data: `xlane-dedup:`-labelled agents appear (or zero contested locations, also valid), the absorption summary log line is present, residue count drops by exactly the absorbed count, and the posted PR comment shows the absorbed root once under the Lane-B source with both lanes in `sources`.
  - Finding: this is the PR's own unchecked test-plan box ("Observe in production on the first real review run after merge"). The absorption code path only executes inside the `/review-fix` Workflow tool's real two-lane gather/dedup/verify/fix/residue pipeline against genuine findings from both lanes at the same `path:line` — no standalone `node` invocation, fixture, or pre-merge check can exercise it end-to-end. The probe fixtures (`test-review-fix-xlane-dedup.sh`) already cover the pure functions in isolation; this is the remaining live-integration observation, structurally unreachable before merge.
  - Verifiability: WAIT
  - Check: read the `/review-fix` Workflow transcript / PR comment of that next run for an `xlane-dedup:<loc>`-labelled partition agent and the `xlane-dedup: <n> contested location(s), <n> Lane-A item(s) absorbed, ...` summary log line; confirm the PR's `<!-- dispatch:qa-summary -->` (or review-fix's own disposition comment) shows the absorbed root once under the Lane-B source with both lanes listed in `sources`.
