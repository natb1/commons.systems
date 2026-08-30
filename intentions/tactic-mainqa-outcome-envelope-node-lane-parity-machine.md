---
id: tactic-mainqa-outcome-envelope-node-lane-parity-machine
kind: tactic
statement: "Post-merge verification of tactic-outcome-envelope-node-lane-parity
  (PR #3030) — machine-verifiable items"
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
  branch: tactic-outcome-envelope-node-lane-parity
  pr: 3030
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by:
  - tactic-outcome-envelope-node-lane-parity
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Post-merge verification of tactic-outcome-envelope-node-lane-parity (PR #3030) — machine-verifiable items

## Context

Post-merge verification recorded by `/qa-fix` at qa record time for
`tactic-outcome-envelope-node-lane-parity` (PR #3030). Verified against the deployed `main` for that PR,
not against a preview.

## Verification items

- **12 — Live node-lane envelope reaches token-audit aggregate**
  - Path: `current`
  - Expected outcome: a real node-lane `/qa-fix` or `/review-fix` session, running after this PR merges, emits an outcome envelope with `"issue": null, "node_id": "<slug>"`, and `aggregate-usage.sh` surfaces it on `.sessions[].outcome.node_id`.
  - Finding: not verifiable from this PR's own working tree by construction — the unit mechanics are already covered by passing QA (`dispatch-emit-outcome` correctly emits `node_id`; `test-aggregate-usage.sh`'s fixture-based regression test already exercises a synthetic node-lane envelope end-to-end through the aggregator and asserts the `.sessions[].outcome.node_id` passthrough), but the live end-to-end effect — a real node-lane session's transcript actually carrying the new envelope shape — can only be observed after merge.
  - Verifiability: WAIT
  - Check: grep that session's transcript for a `<!-- dispatch:outcome:v1 -->` block and confirm `"issue": null` / `"node_id": "<the node's id>"`; then run `aggregate-usage.sh` over the projects root and confirm `.sessions[].outcome.node_id` for that session id matches.
