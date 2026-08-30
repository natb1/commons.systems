---
id: tactic-mainqa-review-api-cost-lens-merge-machine
kind: tactic
statement: "Post-merge verification of tactic-review-api-cost-lens-merge (PR
  #3031) — machine-verifiable items"
owner: ai
status: codified
parent: null
rationale: null
reading: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: main-qa
execution:
  branch: tactic-review-api-cost-lens-merge
  pr: 3031
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by:
  - tactic-review-api-cost-lens-merge
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Post-merge verification of tactic-review-api-cost-lens-merge (PR #3031) — machine-verifiable items

## Context

Post-merge verification recorded by `/qa-fix` at qa record time for
`tactic-review-api-cost-lens-merge` (PR #3031). Verified against the deployed `main` for that PR,
not against a preview.

## Verification items

- **20 — Realized api-cost fire rate, realized draw, and the downstream cost-finder checklist**
  - Path: `current`
  - Expected outcome: post-merge monitoring shows the `api-cost` lens firing materially more often than the pre-merge baseline of 5 of 18 comparable runs, at an acceptable draw; `tactic-mainqa-review-cost-finder`'s downstream observation checklist passes against the merged lens.
  - Finding: not assertable at merge time — no post-merge run history exists yet for this (re-implemented) lens. The plan's own Verification section explicitly designates this a post-merge observation, not a merge gate (planned deferral).
  - Verifiability: WAIT
  - Check: `grep 'find:api-cost'` over the accumulated run logs once available; compare fire rate against the 5-of-18 pre-merge baseline and report the realized draw. Also confirm no recurring `classify: COST CLAMP` log line (a recurring clamp would mean the section wrapper's Source-assignment wording needs tightening).
