---
id: tactic-config-unreadable-latch
kind: tactic
statement: Unreadable numeric fleet-config reads write a durable find-or-create
  tactic-config-unreadable-<key> latch node (stand-down-once-open, the
  tactic-main-red-* shape) — one signal path for dispatch-select-tick's three
  sites (:643 TARGET_N, :707 at-cap MAX_WORKERS, :814 --manual) while each site
  keeps its own degradation scope
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-08-04 /align interview resolving
  tactic-pace-exempt-ceiling-fanout item-13. Ruling: the divergence in
  degradation scope is intentional (TARGET_N is load-bearing for the whole tick
  so it halts; MAX_WORKERS bounds one bypass lane so that lane fails closed
  alone), but the divergence in signal durability is not — today the at-cap path
  is log-only, silent and permanent, with nothing reading the skip_reason back.
  The latch is the fleet-level arm of the invalid-state lane: simultaneously
  alarm, work item, and dedup key. Reuse: repo-health --main-broken-sha's
  find-or-create tactic-main-red-* write with stand-down-once-open semantics."
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
# Unreadable numeric fleet-config reads write a durable find-or-create tactic-config-unreadable-<key> latch node (stand-down-once-open, the tactic-main-red-* shape) — one signal path for dispatch-select-tick's three sites (:643 TARGET_N, :707 at-cap MAX_WORKERS, :814 --manual) while each site keeps its own degradation scope
