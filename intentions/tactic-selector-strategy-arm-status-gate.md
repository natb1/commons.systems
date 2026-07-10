---
id: tactic-selector-strategy-arm-status-gate
kind: tactic
statement: selector strategy-arm checks decomposition readiness (status) before
  emitting align-tactics candidates
owner: ai
status: raw
parent: null
rationale: "Surfaced by the tick +3 emulated router tick (2026-07-10): all 37
  align-tactics strategy candidates the selector emitted were skipped at
  provision with exit 12 (stale-selection) because provision-node-worktree's
  worker-start gate checks the strategy's status while the selector's
  strategy-arm eligibility does not. Self-correcting but wasteful — 37 dead
  selections per tick recur every tick until strategies leave refining."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
attributes: {}
---
# selector strategy-arm checks decomposition readiness (status) before emitting align-tactics candidates

Draft context from the tick +3 emulated router tick (2026-07-10).

Evidence: the selector (`packages/intentionsutil/scripts/select-targets.ts`,
strategy-arm) emitted 37 align-tactics candidates; every one was skipped at
`provision-node-worktree` with exit 12 (stale-selection: "selected
align-tactics but node is now draft/null") because the provision worker-start
gate checks the strategy's `status` while the selector's align-eligibility
(office_hours null, no non-draft children, signal unvalidated, rounds < 2)
does not. A `status: refining` strategy is not decomposition-ready, so
provision correctly refuses it.

Fix shape for finalization: the selector's strategy-arm requires
decomposition-ready status before emitting an align-tactics candidate; the
provision gate stays as the backstop (defense in depth is correct here — the
gate also catches status changes landing between selection and start). Cost
of the gap: 37 dead selections and worker-slot churn per tick, recurring
every tick until strategies leave refining.
