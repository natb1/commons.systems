---
id: tactic-park-cause-sensor-instrument
kind: tactic
statement: Implement and register the park-cause sensor named in
  strategy-graph-native-dispatch's success_signal, so read-sensors can produce a
  reading for it instead of leaving it in the unregistered pool
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-08-12 /align interview that recorded the
  self-consistency condition on strategy-graph-native-dispatch. That round
  appended a park-cause sensor to this strategy's success_signal.sensor prose,
  on the author's decision to register a sensor rather than defer its design.
  MEASURED THAT ROUND: the align-strategy-census sensor counter read 19/53
  sensor-naming strategies with 45 unregistered both BEFORE and AFTER the append
  — proving the append de-registered nothing (the recorded hazard it was checked
  against), but equally proving it registered nothing: this strategy's sensor
  prose was already one of the 45 unregistered, because read-sensors matches the
  ENTIRE success_signal.sensor string against a set of registered Sensor names
  (packages/intentionsutil/scripts/read-sensors.ts:1226, exact full-string
  match), and no Sensor is registered under this strategy's long prose string.
  So the observable and threshold are recorded but no reading will ever be
  produced for them until a Sensor is implemented and registered under that
  exact name. This tactic is that work. It was filed by the recording session
  itself rather than deferred, because leaving a recorded sensor with no
  instrument would reproduce precisely the defect the same round's new condition
  forbids — a round leaving output a downstream session cannot act on. Scope
  note for the planning session: decide deliberately whether to register under
  the existing long prose string or to shorten success_signal.sensor to a stable
  short name, which is a rewording of registered-sensor prose and therefore
  carries the de-registration hazard in its own right."
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
# Implement and register the park-cause sensor named in strategy-graph-native-dispatch's success_signal, so read-sensors can produce a reading for it instead of leaving it in the unregistered pool
