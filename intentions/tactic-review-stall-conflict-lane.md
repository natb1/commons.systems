---
id: tactic-review-stall-conflict-lane
kind: tactic
statement: reconcile-graph-review-stall enters the conflict resolution lane on a
  CONFLICTING reviewed node instead of holding it immediately — converging the
  two conflict producers on one policy
owner: ai
status: codified
parent: null
rationale: "Byproduct of the 2026-07-29 /align-strategy dispatch-containment
  interview, implementing the author's clarification that merge conflicts are
  not expected to self-heal and that a conflict always enters the resolution
  lane. Two producers diverged at minting: provision exit 11 spawns Lane 3
  immediately (the FIRST RESPONDER arm of dispatch-graph-execute's exit-11
  handling; :300 re-measured 2026-08-30) and is correct; the conflict route arm
  of reconcile-graph-review-stall called hold-node --kind provision-conflict
  immediately with no resolution attempt and was, at minting, the defect this
  node was raised against. It was retired to a bare `continue` by `fa9c4338` (PR
  #3038, merged 2026-08-06) in the opposite direction from the mechanism
  proposed here — see this node's completion record. Adjacent
  tactic-conflict-lane-exit11-retry-bound bounds ineffective lane kicks and is
  not superseded by this — it remains the backstop for a lane that runs and does
  not resolve."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: tactic-graph-router-conflict-routing
  pr: 3038
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-06T02:30:42Z
    mergeCommitSha: fa9c43386d00268005d874fd4f96f896cc7f7cb3
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# reconcile-graph-review-stall enters the conflict resolution lane on a CONFLICTING reviewed node instead of holding it immediately — converging the two conflict producers on one policy
## Completion record — superseded by `tactic-graph-router-conflict-routing`

Closed 2026-08-30 as a completion record under Ruling 1
(`plans/dispatch-rsi-author-rulings.md:132-151`) and Ruling 4's bound
(`:189-218`), not pruned: the scope is dead, so `clear-park` would have made a
`phase: null` node router-eligible and re-dispatched shipped work.

The ratified goal — the review-stall producer no longer holding a `CONFLICTING`
reviewed node immediately — was delivered by `fa9c4338` (PR #3038, merged
2026-08-06, an ancestor of `origin/main`) in the opposite direction from the
mechanism this node proposed: the sweep's `conflict` arm was retired to a bare
`continue`
(`.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall:297-304`,
header doctrine `:23-29`), and CONFLICTING moved to the selector's
`execution.conflict` interrupt. Re-measured at close: that file has **zero**
`hold-node` call sites — its one textual hit, at `:29`, is a comment.
(`:301` mentions a `provision-conflict` **hold**, which is not a `hold-node`
call; it is a comment too.)

**Residual, deliberately not folded in.** Author ruling (2) from the park —
whether `dispatch-graph-execute`'s exit-11 strike/hold ladder should now be
retired in favour of the selector interrupt — is unmade, and no plan document
records it. It stays open; if wanted it is a NEW node, scoped disjoint from
`tactic-conflict-lane-exit11-retry-bound`.
