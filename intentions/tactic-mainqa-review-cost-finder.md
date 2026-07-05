---
id: tactic-mainqa-review-cost-finder
kind: tactic
statement: Observe the review-phase runtime-cost finder fire on a live review of
  a diff containing an unbounded Firestore scan and route the finding to a
  non-blocking deferral
owner: human
status: delegated
parent: null
rationale: "Migrated 2026-07-05 from the legacy gh main-qa office-hours queue
  (target-state review): issue 2707. The review fan-out (including the cost
  finder) carries over unchanged into the graph-native review phase; in target
  state the deferral lands as a draft tactic instead of a gh follow-up issue.
  Observable on any live review run whose diff contains an unbounded scan."
reading: null
gap: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours:
  reason: passive observation of a future live review run whose diff happens to
    contain an unbounded Firestore scan
  since: 2026-07-05
pace_exempt: false
rounds: null
attributes: {}
---
# Observe the review-phase runtime-cost finder fire on a live review of a diff containing an unbounded Firestore scan and route the finding to a non-blocking deferral

## Context

Migrated 2026-07-05 from the legacy gh main-qa office-hours queue during the
target-state review. Source issue (closed, content preserved here): 2707 —
needs-main residue from the runtime-cost finder (issue 2690, PR 2706). The
review fan-out, including this finder, carries over unchanged into the
graph-native review phase (`tactic-graph-native-dispatch` §2.4). One
target-state translation: the non-blocking outcome lands as a draft tactic
batched per component (strategy clarification 19), not a gh follow-up issue —
verify the disposition class, not the legacy artifact.

## Verification checklist

1. On a live review run whose diff contains an unbounded Firestore scan (a
   query on a growing collection with no `.limit()`), the cost finder fires
   and produces findings (was 2707, PR 2706).
2. The findings route to the non-blocking deferred disposition — not Fixed,
   not Required — i.e. a per-component deferral (draft tactic on the
   graph-native lane; `Deferred` in the review summary on the legacy lane
   while it drains).

## Completion

Pass → `phase: done` (prune). Broken → author an implement tactic with the
finding and prune this one. Clear the park by committing the outcome to this
node.
