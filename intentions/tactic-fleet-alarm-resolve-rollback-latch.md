---
id: tactic-fleet-alarm-resolve-rollback-latch
kind: tactic
statement: dispatch-fleet-alarm --resolve --kind daemon-degraded fails on every
  pass and rolls its write back, latching the alarm open against a healthy
  managed-live reading
owner: ai
status: raw
parent: null
rationale: Observed live 2026-08-13 during the /align round that recorded the
  environmental-casualty ruling. journald shows the resolve failing on each
  fleet-watch pass after the daemon returned -- 11:05:52, 11:11:38 and 11:16:34
  EDT -- each logging "resolve of tactic-fleet-alarm-daemon-degraded failed; the
  write was rolled back to origin/main", while the same passes read daemon
  liveness as managed-live. The alarm node remains status raw with phase null on
  main. An alarm that cannot clear stops being a signal, and this one degrades
  the exact channel the casualty-list clarification of the same date makes
  load-bearing. Distinct from the phase-done sibling
  tactic-fleet-alarm-mint-rollback-corruption, which is the MINT-failure
  rollback leaving a 0-byte node file; this is the RESOLVE path failing and
  rolling back cleanly but never succeeding. Root cause not yet established --
  the rollback message is the only durable evidence, so reproducing the resolve
  write is the first planning step.
reading: null
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
# dispatch-fleet-alarm --resolve --kind daemon-degraded fails on every pass and rolls its write back, latching the alarm open against a healthy managed-live reading
