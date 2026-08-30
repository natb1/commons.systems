---
id: tactic-mainqa-decision-log-append-noncompact-corruption-machine
kind: tactic
statement: "Post-merge verification of
  tactic-decision-log-append-noncompact-corruption (PR #3061) —
  machine-verifiable items"
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
  branch: tactic-decision-log-append-noncompact-corruption
  pr: 3061
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by:
  - tactic-decision-log-append-noncompact-corruption
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Post-merge verification of tactic-decision-log-append-noncompact-corruption (PR #3061) — machine-verifiable items

## Context

Post-merge verification recorded by `/qa-fix` at qa record time for
`tactic-decision-log-append-noncompact-corruption` (PR #3061). Verified against the deployed `main` for that PR,
not against a preview.

## Verification items

- **15 — Silent-drop tradeoff is an acceptable operator tradeoff as documented**
  - Path: `current`
  - Expected outcome: A human confirms the silent-drop-on-invalid-input tradeoff in `decision_log_append` is acceptable as shipped and documented, or files it as follow-up residue for a non-fatal observability escape hatch.
  - Finding: QA triage flagged this as a design-acceptance call rather than a defect — `decision_log_append` now silently drops non-JSON input with no stderr diagnostic and no sentinel record, and the header comment (`lib-decision-log.sh`) documents the rationale (must stay safe inside EXIT-trap handlers under `set -euo pipefail`) and the operator remedy (build payloads with `jq -c -n`). The disposition workflow found no code defect to fix and confirmed the documented rationale matches the implementation; what remains is whether the silent-drop behavior proves acceptable in practice once this ships, since a malformed payload at any call site now vanishes from the decision log with no signal at all.
  - Verifiability: WAIT
  - Check: after this has run in production for a while, review `$HOME/.local/share/commons-dispatch/routing-decisions.jsonl` and any `dispatch-fleet-watch` alarms for evidence that a caller's malformed decision-log payload silently vanished and caused operator confusion or a missed audit-trail entry; if none surfaces, the documented tradeoff is confirmed acceptable.
