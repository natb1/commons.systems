---
id: tactic-mainqa-pace-exempt-ceiling-fanout-machine
kind: tactic
statement: "Post-merge verification of tactic-pace-exempt-ceiling-fanout (PR
  #3034) — machine-verifiable items"
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
  branch: tactic-pace-exempt-ceiling-fanout
  pr: 3034
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by:
  - tactic-pace-exempt-ceiling-fanout
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Post-merge verification of tactic-pace-exempt-ceiling-fanout (PR #3034) — machine-verifiable items

## Context

Post-merge verification recorded by `/qa-fix` at qa record time for
`tactic-pace-exempt-ceiling-fanout` (PR #3034). Verified against the deployed `main` for that PR,
not against a preview.

## Verification items

- **item-15-endstate-observation — End-state observation: the live fleet fills to but never exceeds the ceiling**
  - Path: `current`
  - Expected outcome: No tick admits a worker beyond `max_concurrent_workers`; pace-exempt bursts fill available headroom in a single decision rather than trickling one per tick; `at-cap-ceiling-full` appears in the log when the fleet is genuinely saturated; `at-cap-ceiling-unreadable` never fires in normal operation.
  - Finding: the cross-tick compounding behavior this tactic fixes (the old code re-evaluated the gate every tick with no memory of a prior bypass, so the unbounded half could compound across many ticks) is only observable over multiple real dispatch ticks against a live fleet, not assertable at merge time. This is a planned deferral, not a QA gap — the unit tests (`test-dispatch-select-tick.sh`) are the merge-time gate; this is the downstream confirmation.
  - Verifiability: WAIT
  - Check: read `${DISPATCH_DECISION_LOG_DIR:-$HOME/.local/share/commons-dispatch}/routing-decisions.jsonl` for `site == "select-tick"` records across several days; confirm no `pace-exempt-bypass-at-cap` record's granted width exceeds `max_concurrent_workers - effective_live` at decision time, and that `at-cap-ceiling-unreadable` does not appear (see the "End-state observation" and "The discriminator is the routing decision log" bullets above for the full read recipe).
