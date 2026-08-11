---
id: tactic-graph-compound-edit-and-land
kind: tactic
statement: A compound primitive covering dump → reconcile → validate → commit →
  verify-landed in one invocation, so a routine node edit costs one round trip
  instead of a hand-composed chain
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-08-11 in the same /align round, from the author
  addendum that token cost is reduced by cutting the NUMBER of tool calls and
  round trips, not only the bytes per call. Measured: 8,728 Bash calls produced
  140 intentions/ commits in the window — roughly 62 Bash round-trips per landed
  graph commit. Contributing to that count, 1,049 calls perform post-write `git
  status`/`diff` eyeball verification and 705 calls invoke graph-commit across
  1,113 occurrences (the excess being retry loops). Scope note: the trustworthy
  landing-signal half of this problem is ALREADY owned by
  tactic-graph-commit-landing-signal-unreliable (phase review at drafting time),
  which requires graph-commit and clear-park to emit a landing signal a caller
  can trust without re-parsing origin/main. This draft must not duplicate that
  node — it composes on top of it, and should be planned only against the
  residual round-trip cost that remains once a trustworthy landing signal
  exists."
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
# A compound primitive covering dump → reconcile → validate → commit → verify-landed in one invocation, so a routine node edit costs one round trip instead of a hand-composed chain
