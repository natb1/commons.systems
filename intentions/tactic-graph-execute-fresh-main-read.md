---
id: tactic-graph-execute-fresh-main-read
kind: tactic
statement: The node-selection gate must perform its own origin/main freshness
  read so every caller inherits it -- today check-node-selection.ts reads the
  main checkout's working-tree intentions/ store whose freshness is maintained
  only by dispatch-select-tick, so any other caller (the sanctioned manual
  `dispatch <node-id>` lane included) evaluates the gate against a stale
  snapshot and can launch a worker onto a node that is parked on origin/main
owner: ai
status: raw
parent: null
rationale: "Found 2026-08-05 by the iteration-N+4 invariant audit, which asks of
  each operating invariant whether the greenfield design addresses it and which
  node owns it. Invariant I17 -- `sync the main checkout before every
  dispatch-graph-execute` -- had NO carrier. THE PRECONDITION IS REAL AND IT IS
  DOCUMENTED AS A COMMENT: provision-node-worktree's header (lines 122-125) says
  the gate is re-checked against `the just-fetched origin/main`, and that the
  main checkout is `kept fast-forwarded to origin/main by dispatch-select-tick,
  so its intentions/ store is the fresh-origin/main snapshot the gate requires`.
  That is a correctness precondition of the primitive satisfied by exactly ONE
  caller, named in prose, enforced nowhere. Mechanism: check-node-selection.ts
  resolves node state with `readNode(dir, nodeId)` against a filesystem
  directory, not against origin/main; dispatch-select-tick performs the `git
  fetch origin main && git merge --ff-only origin/main` (dispatch-select-tick
  ~L359-361) that makes that directory equal origin/main; dispatch-graph-execute
  contains no fetch and no ff-only merge of its own, so when it is invoked
  directly the gate silently reads whatever the checkout happens to hold. WHY IT
  MATTERS RATHER THAN BEING TIDINESS: N+3 established that parked nodes are
  invisible to every launch path precisely BECAUSE check-node-selection check 3
  exit-12s a parked node. That guarantee is only as fresh as the snapshot the
  check reads. A node parked on origin/main but not yet present in a stale local
  checkout reads unparked, the gate passes, and a worker launches onto a held
  node -- the same class of double-booking the 2026-08-05 concurrency ruling
  calls an invalid state, arrived at through staleness instead of through a
  missing claim check. MEASURED, NOT HYPOTHESISED: in the N+4 monitor session
  the operator ran the I17 sync by hand before a manual dispatch and the ff-only
  merge pulled roughly twenty added/changed intention files in one step, so the
  checkout was materially stale at the moment a dispatch was about to be issued;
  without the hand-run sync the gate would have evaluated that dispatch against
  a twenty-node-stale snapshot. The manual lane is not an edge case -- it is
  sanctioned doctrine: Lane 2 of the 2026-07-31 exception-lanes clarification
  makes `dispatch <node-id>` a deliberate human dispatch that bypasses the pace
  curve and the ceiling, and the N+4 plan mandates it for the promoted step-1
  node. So the one lane the design blesses for human use is the one lane the
  freshness invariant does not cover. THE GREENFIELD SHAPE IS ALREADY RECORDED
  ELSEWHERE IN THE GRAPH: the live node tactic-office-hours-select-fresh-main
  states it for the sibling selector -- `office-hours-select.ts performs its own
  local origin/main freshness read so every consumer inherits it, retiring the
  wrapper-only park_live_on_main duplication`. That is verbatim the same defect
  (freshness owned by a wrapper rather than by the primitive) and the same
  remedy (push the read down so every consumer inherits it), applied to a
  different script. This node is the unclaimed half. Dedup: a find-or-create
  pass found no node covering check-node-selection / dispatch-graph-execute
  freshness -- tactic-office-hours-select-fresh-main is scoped to
  office-hours-select.ts by its own statement, and tactic-graph-ref-split
  concerns which ref a worktree merges, not which snapshot the selection gate
  reads. Fix directions to weigh at planning time: (a) push the fetch into
  check-node-selection.ts and resolve node state from origin/main directly
  rather than from a working-tree directory, mirroring the office-hours-select
  remedy; (b) have dispatch-graph-execute perform the ff-only sync itself, which
  keeps the gate unchanged but re-creates the same wrapper-owned-precondition
  shape one level down; (c) make the gate refuse rather than proceed when it can
  detect the checkout is behind origin/main -- the unknown-never-clear posture
  of tactic-probe-unknown-never-clear, applied to staleness."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 20
  override: null
  rationale: "Bootstrap band 2 (50/20/10 interim scale): a launch-path correctness
    defect that can double-book a held node -- same band as the other
    dispatch-containment fixes, and the sibling tactic-probe-unknown-never-clear
    carries the same boost."
  tier: 1
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# The node-selection gate must perform its own origin/main freshness read
