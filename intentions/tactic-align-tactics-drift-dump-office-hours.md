---
id: tactic-align-tactics-drift-dump-office-hours
kind: tactic
statement: the /align-tactics drift agent is instructed to weigh the strategy's
  own office_hours but is never given the field -- pass office_hours into the
  drift payload at all four dump sites so the instruction and the data agree
owner: ai
status: raw
parent: null
rationale: "Found in the 2026-08-05 /align interview.
  .claude/workflows/align-tactics.js buildDriftPrompt's prompt TEXT tells the
  agent to consider 'the strategy's own office_hours' (line 28) and makes
  'office_hours is null' part of the eligibility check (line 45), but the
  serialized payload (lines 101-107) carries statement, rationale,
  success_signal, conditions and clarifications -- and NOT office_hours. The
  same omission repeats at the other three dump sites (801, 904, 980).
  Consequence: on every round, for every strategy, the agent must either
  hallucinate the field or silently treat it as absent -- including in the
  eligibility gate that decides whether the round proceeds at all.
  strategy-graph-native-dispatch was parked from 2026-08-04, so every drift
  round on it reasoned about a park it could not see. Note: strategy.conditions
  at line 106 reads oddly but is CORRECT by contract -- line 37 documents it as
  caller-flattened from attributes.conditions."
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
# the /align-tactics drift agent is instructed to weigh the strategy's own office_hours but is never given the field -- pass office_hours into the drift payload at all four dump sites so the instruction and the data agree
