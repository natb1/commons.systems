---
id: tactic-graph-router-live-worker-visibility
kind: tactic
statement: router live-worker cap counts ALL live workers (daemon-launched and
  manual/emulated ticks) so two concurrent ticks never double-dispatch the same
  node
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-07: a manual emulated router tick and the live
  dispatch-claude-daemon selected and dispatched the SAME nodes simultaneously
  because the router's live-worker cap (8 minus live workers) did not see the
  manually-launched workers. Result: an incoherent node state on origin/main —
  tactic-office-hours-graph-entry left carrying phase:fix (from the manual
  tick's review->fix transition) AND a non-null office_hours park (from the
  daemon session's mechanical-conflict park) at once. The cap must enumerate all
  live sessions under the worktrees root (claude agents --json), not only
  daemon-spawned ones, before computing available slots."
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
# router live-worker cap counts ALL live workers (daemon-launched and manual/emulated ticks) so two concurrent ticks never double-dispatch the same node
