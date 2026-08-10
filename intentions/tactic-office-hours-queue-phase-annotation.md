---
id: tactic-office-hours-queue-phase-annotation
kind: tactic
statement: Office-hours queue entries annotate the parked node's phase (e.g.
  phase done — underlying work already merged) so decision-state and work-state
  read jointly
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-08-04 /align interview resolving
  tactic-graph-auto-merge-office-hours-gate item 10. Author ruling:
  done-but-parked is a VALID state — phase and office_hours are orthogonal
  dimensions (see the strategy's 2026-08-04 orthogonality clarification). The
  queue must therefore present both dimensions: a parked entry whose node is
  phase done says so, so a reviewer opening the queue is not misled about
  whether code action is still needed. Scope is queue PRESENTATION only — no
  reconciler filter, no merge-gate change (those stay per PR #3033's ratified
  design)."
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
# Office-hours queue entries annotate the parked node's phase (e.g. phase done — underlying work already merged) so decision-state and work-state read jointly
