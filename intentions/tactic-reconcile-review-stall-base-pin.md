---
id: tactic-reconcile-review-stall-base-pin
kind: tactic
statement: reconcile-graph-review-stall must pin the diagnosis-time base blob on
  its landing graph-commit, so a concurrently landed write is three-way-merged
  rather than clobbered by a stale in-memory node
owner: ai
status: raw
parent: null
rationale: "Sibling call site split out of tactic-reconcile-park-clobber (bug X)
  at that node's own direction: its plan states that
  .claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall:276-290
  builds its GC_ARGS with the same zero---base shape and carries the same latent
  lost-update exposure, but that it is deliberately out of scope there because
  its writes are fix-state writes on a different sweep with different id
  sourcing -- 'A sibling node should carry it; do not widen this PR to cover
  it.' This node is that sibling. The remedy is analogous, not identical: the
  greenfield contract is that every graph-write primitive pins the blob it read
  as --base on its landing graph-commit (park-node, clear-park and
  lib-frozen-session-park.sh all do this today; 4725a16b landed it for the
  frozen-session sweep), and reconcile-graph-review-stall is a primitive that
  never adopted it. Filed 2026-08-05 by the bootstrap monitor pass after a
  find-or-create dedup check over intentions/ found no existing owner: the
  tactic-review-stall-* family covers cache-miss, conflict-lane, duplicate-scan,
  subprocess-spawn and duplicate-fetch concerns, and
  tactic-reconcile-graph-{mainqa-guard-prune,merged-test-harness} cover other
  reconcile concerns -- none pins --base. Bug X's own measured rate on the
  sibling call site (8 park erasures across 5 nodes in one 24h window) is the
  reason this exposure is worth closing rather than leaving latent."
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
# reconcile-graph-review-stall must pin the diagnosis-time base blob on its landing graph-commit, so a concurrently landed write is three-way-merged rather than clobbered by a stale in-memory node
