---
id: tactic-main-health-signal-attribution
kind: tactic
statement: main-health must fail closed on an empty check set and ignore
  check-runs attributable to another branch's workflow
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-23 /align-strategy round on the wezterm
  pin. Two verified defects in the same read path: repo-health's
  main_broken_sha() counts FAILING checks, so zero checks reads as green
  (fail-open); and graph-commit fast-forwards a graph/** scratch sha onto main,
  so Graph Fast Path check-runs attach to main's sha and are read as main's
  health (false attribution, in both directions). Diagnosis and live evidence:
  strategy-main-health's 2026-07-23 clarifications. Hard constraint:
  success_signal.threshold is compared for EXACT string equality against
  readMainHealth()'s return value by deriveGap, so the two must change in one
  commit or the node acquires a permanent false red at attention boost 100."
reading: null
gap: null
serves:
  - strategy-main-health
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
# main-health must fail closed on an empty check set and ignore check-runs attributable to another branch's workflow
