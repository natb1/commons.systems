---
id: tactic-align-round-self-consistency-walk
kind: tactic
statement: "/align Step 6 gains a self-consistency walk over the round's own
  output: before landing, verify no draft tactic's authored scope depends on a
  node the same round's blocked_by edges order after it"
owner: ai
status: raw
parent: null
rationale: "Recorded in the 2026-08-11 /align interview that codified the
  draft-review gate. A round can author an edge that contradicts a scope the
  same round authors — the inverted blocked_by of 8249f664 is the recorded
  instance — and no gate catches it, because /align's Step 6 walks requirement
  coverage, not the round's own internal consistency. The artifact this touches
  is the /align skill itself, whose charter strategy-discovered-requirements
  owns (re-homed 2026-08-13). Serves narrowed to that strategy alone 2026-08-14:
  the second edge to strategy-graph-native-dispatch existed only because the
  self-consistency condition was recorded there, and the author's ratifying
  round moved the condition here, so the sole remaining reason for the edge
  dissolved. No dispatch artifact is touched by this tactic."
reading: null
serves:
  - strategy-discovered-requirements
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
# /align Step 6 gains a self-consistency walk over the round's own output: before landing, verify no draft tactic's authored scope depends on a node the same round's blocked_by edges order after it
