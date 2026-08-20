---
id: tactic-session-digest-inflight-blindness
kind: tactic
statement: dispatch-session-digest never surfaces a session in-flight workflow
  state, so the invalid-state lane primary instrument cannot separate
  died-mid-pass from still-running for any phase that backgrounds a Workflow
owner: ai
status: raw
parent: null
rationale: Surfaced 2026-08-13 during the /align round that recorded the
  environmental-casualty ruling, and demonstrated by that round own first pass
  reaching a wrong conclusion from a correct digest. On session 40c253c4 the
  digest reported durable_claims empty, transient_death false, and a tail ending
  at 14:51:15Z -- every field accurate, and jointly consistent with BOTH
  died-mid-pass and still-running-fine. It never surfaces inFlight.kinds, the
  workflow run id, or the latest write age under the session subagents workflows
  run directory, which is the signal that actually discriminates. Since the
  digest is the lane Step 2 instrument and Step 4 classification turns on
  exactly this distinction, any Workflow-backgrounding phase can be
  misclassified. Related but distinct from
  tactic-invalid-state-lane-diagnostics-unobservable, which is about route and
  selector diagnostics being DISCARDED by their production callers; this
  instrument never computes the signal at all.
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
# dispatch-session-digest never surfaces a session in-flight workflow state, so the invalid-state lane primary instrument cannot separate died-mid-pass from still-running for any phase that backgrounds a Workflow
