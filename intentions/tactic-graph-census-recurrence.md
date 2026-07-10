---
id: tactic-graph-census-recurrence
kind: tactic
statement: "re-armable graph census: recurring reconciliation of owed prunes,
  PR-merge verification, and orphan absorption"
owner: ai
status: raw
parent: null
rationale: "Surfaced by the tick +3 emulated router tick (2026-07-10):
  tactic-graph-self-consistency-sweep is a one-shot node now done, and
  owed-prune debt was observed growing with no open census node to drain it. The
  router tick's reconciliation duty covers only same-tick absorption; the census
  scope (doctrine-home reconciliation plus PR-merge verification) needs a
  recurrence mechanism or the debt accumulates unbounded."
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
# re-armable graph census: recurring reconciliation of owed prunes, PR-merge verification, and orphan absorption

Draft context from the tick +3 emulated router tick (2026-07-10).

Evidence: `tactic-graph-self-consistency-sweep` (the census that reconciles
done-but-present nodes, owed prunes, and doctrine-home drift) is a one-shot
node now `phase: done`, and tick +3's end-of-tick sweep observed owed-prune
debt growing with no open census node to drain it. The router tick's own
reconciliation duty covers only same-tick absorption (out-of-band merges,
freeze checks); the census scope — doctrine-home reconciliation plus
PR-merge verification plus batch owed-prune execution — is deliberately
deferred to a census tactic (owed-prune doctrine), which no longer exists
open.

Design question for finalization: the recurrence mechanism — a census tactic
that re-arms itself (e.g. its done-transition writes a fresh census node or
resets its own phase on a cadence), versus a standing router reconciliation
duty with a debt threshold that births a census node when owed prunes exceed
it. Either way the recurrence state must live in the graph, never in
dispatch.config (parity with the breaker doctrine: review-demanding events
are graph artifacts; config keeps tunables only).
