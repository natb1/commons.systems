---
id: tactic-validate-graph-ordering-inversion-lint
kind: tactic
statement: "validateGraph gains a warn-level ordering-inversion lint: node X's
  body names node Y while Y.blocked_by contains X — surfaced for session
  disposition, never a hard fail"
owner: ai
status: raw
parent: null
rationale: "Retained (retain-not-refine) from the 2026-08-12 /align interview
  that recorded the self-consistency condition on
  strategy-graph-native-dispatch. serves names strategy-graph-integrity, not the
  strategy under interview, because the artifact is validateGraph and the
  requirement is that all graph CONTENT be internally consistent — that
  strategy's own statement. It is the mechanical backstop for the doctrine limb
  (tactic-align-round-self-consistency-walk): the lint catches an inversion even
  when the authoring session misses it. Warn-level is deliberate — a node body
  naming a sibling is a common and legitimate cross-reference, so the check
  shortlists rather than disposes, matching the align skills' existing
  grep-shortlists-never-disposes convention. Worth running once over the whole
  graph when built (603 nodes at record time): it may surface inversions that
  already exist."
reading: null
serves:
  - strategy-graph-integrity
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
# validateGraph gains a warn-level ordering-inversion lint: node X's body names node Y while Y.blocked_by contains X — surfaced for session disposition, never a hard fail
