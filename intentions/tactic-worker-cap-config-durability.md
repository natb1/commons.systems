---
id: tactic-worker-cap-config-durability
kind: tactic
statement: dispatch.config/target-workers.json — the fleet's throughput dial —
  is untracked by git, carries no provenance and no expiry, and no detect
  compares it to a standing value, so a deliberately temporary throttle is
  indistinguishable from the intended setting and silently becomes permanent
owner: ai
status: raw
parent: null
rationale: "Confirmed live 2026-08-03. THE DEFECT: git ls-files reports
  dispatch.config/target-workers.json is untracked, so the file has no history,
  no blame, no diff and no review. Its whole content is a max_concurrent_workers
  integer (the loader's own default is 8). Nothing records WHO set the current
  value, WHEN, WHY, or WHETHER it was meant to be temporary; nothing compares it
  to a standing value; and no health read prints it against an expected one. THE
  OCCURRENCE: on 2026-08-01 the cap was deliberately reduced from 3 to 1 as an
  explicitly temporary measure, with a written restoration condition (restore
  once the blocking PR merges and a clean day passes). The blocking PR merged
  2026-08-03T03:00Z. The cap was still 1 at 2026-08-03T13:00Z and was restored
  only because a human happened to re-read a planning document that recorded the
  intent — the graph and the fleet had no representation of it at all. Every
  select-tick decision across that window logged target_n 1 with max_workers
  null, so even the routing log carried no evidence that 1 was a deviation
  rather than the intended value. COST: the fleet ran at one third of its
  intended capacity for roughly two days. It was not idle — 7 PRs merged and 20
  distinct nodes were selected in the window — so no stall detect fires on this;
  the loss is invisible throughput, which is exactly why it needs an explicit
  representation rather than an alarm. This is the same class as the
  containment-undone and rollback-leaves-dirty-state findings already tracked:
  an operator action that the system has no way to remember, verify, or expire.
  GREENFIELD: make the dial self-describing and self-expiring. Track the file in
  git so every change has provenance. Give it a standing value plus an optional
  deviation record carrying reason and expires_at; dispatch-tick reads the
  effective value and, past expires_at, restores the standing value and logs the
  restoration. A deviation with no expiry is rejected at load — a throttle
  nobody scheduled to end is the failure this node records. Emit the effective
  value AND the standing value into each select-tick routing decision so the log
  shows a deviation as a deviation. MIGRATION: tracking the file and adding the
  standing/deviation shape is backwards compatible if a bare
  max_concurrent_workers integer keeps loading as the standing value with no
  deviation, so the loader change can land before any config is rewritten.
  Related to but distinct from tactic-pace-exempt-ceiling-fanout, which concerns
  a lane that reads no ceiling at all; this node concerns the durability and
  provenance of the ceiling's own value."
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
# dispatch.config/target-workers.json — the fleet's throughput dial — is untracked by git, carries no provenance and no expiry, and no detect compares it to a standing value, so a deliberately temporary throttle is indistinguishable from the intended setting and silently becomes permanent
