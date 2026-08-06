---
id: tactic-implement-phase-open-pr-sweep
kind: tactic
statement: A periodic reconciliation must find nodes stranded at phase implement
  whose execution.pr is an OPEN pull request and triage each one -- complete
  work transitions forward, abandoned work closes its PR and re-plans -- so
  graph state stops claiming work is unimplemented when the PR already exists
owner: ai
status: raw
parent: null
rationale: "Generalizes invariant I8 of the bootstrap plan, which today is a
  manual instruction that only fires after a deliberate fan-out and therefore
  never catches strandings created any other way. A node left at phase implement
  while its PR is open is a live re-selection hazard: the router can select it
  for /implement and rebuild finished work from scratch, which is the
  slot-stranding class the bootstrap diagnosis blames for consuming fleet
  throughput. Measured 2026-08-05T00:45Z, six live instances existed
  simultaneously, all with OPEN draft PRs and five untouched since mid-July:
  tactic-clarification-citation-ids (PR 3041), tactic-mount-schema (PR 2856),
  tactic-participation-log-instrument (PR 2873), tactic-recovery-drill-firebase
  (PR 2877), tactic-recovery-drill-github (PR 2878),
  tactic-tailscale-shell-health-check (PR 2874). They rank 0-1 so re-selection
  is unlikely but not impossible, and the wrong state is itself the defect.
  Explicitly NOT a blind transition: I8's transition-node --set-pr remedy
  assumes the implementation is actually complete, which is unverified for all
  six and implausible for PRs cold for two to three weeks -- the sweep must
  triage on each PR's own evidence (CI state, diff completeness, whether the
  node plan's units are all present) and route to transition, to re-plan, or to
  a park. Filed 2026-08-05 by the bootstrap monitor pass after a find-or-create
  dedup check: the only near-match in intentions/ is tactic-pending-merge-phase,
  which is about eliminating execution.markers via a new pending-merge phase and
  shares no scope with this."
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
# A periodic reconciliation must find nodes stranded at phase implement whose execution.pr is an OPEN pull request and triage each one -- complete work transitions forward, abandoned work closes its PR and re-plans -- so graph state stops claiming work is unimplemented when the PR already exists
