---
id: tactic-graph-native-signal-instrument-arm
kind: tactic
statement: this strategy's success_signal is unreadable -- the recorded sensor
  name no longer matches LIFECYCLE_SENSOR_NAME so the reading is permanently
  null, and the threshold's band and sample history were undeclared -- extend
  the lifecycle sensor with a defect-backlog segment, re-point the constant at
  the recorded string, and derive consecutive samples from intentions/ git
  history
owner: ai
status: raw
parent: null
rationale: "Ratified in the 2026-08-05 /align interview; this is the instrument
  work that clears the strategy's own 2026-08-04 park. THREE ratified decisions
  to implement: (1) ONE sensor, not two -- extend readLifecycleReading with a
  defect-backlog segment and re-point LIFECYCLE_SENSOR_NAME
  (read-sensors.ts:443, used :646) at the amended RECORDED string, because
  success_signal.sensor is a single string so a two-sensor split leaves the
  second unreadable by the same exact-match mechanism (SensorRegistry.resolve,
  sensors.ts:49-59, is exact-match and throws with no fallback). (2) The band is
  a RATIO: open plus born-parked tactics serving this strategy stay at or below
  35% of all tactics serving it (measured at arming 59/197 = 30.0%; 2026-08-04
  baseline 62/178 = 34.8%). (3) Consecutive samples are DERIVED from intentions/
  git history at read time, never stored, following the
  readTacticVelocity/readTokenEconomy precedent. Until this lands the strategy's
  reading stays null and its signal cannot be validated by any number of
  rounds."
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
# this strategy's success_signal is unreadable -- the recorded sensor name no longer matches LIFECYCLE_SENSOR_NAME so the reading is permanently null, and the threshold's band and sample history were undeclared -- extend the lifecycle sensor with a defect-backlog segment, re-point the constant at the recorded string, and derive consecutive samples from intentions/ git history
