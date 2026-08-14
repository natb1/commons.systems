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
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: "Re-check requested by commit e6421e6c: does the 2026-08-13
      tactic-eval-finding-reconcile-base-revert-blocks-main-graph-writes
      occurrence support this node, and is the code anchor in the rationale
      still valid after PR #3090?"
    answer: "Re-checked 2026-08-14. Three results. (1) EVIDENCE — the occurrence is
      not evidence for this node and was never cited by it. This node was filed
      2026-08-05; the occurrence is 2026-08-13. The occurrence has since been
      re-diagnosed: the leaked node file came from graph-select-target
      --clear-fix in _gate_fix_active, not from a reconciler, and nothing stale
      was involved — apply-fix-state.ts --clear-fix writes execution.fix = null
      and strips the reviewed marker, precisely the two fields that had changed
      since db9e7f2c, so a current write reproduced the old blob byte for byte.
      The write was current; the commit refused to start. A --base pin would not
      have prevented it. This node stands on its original evidence unchanged:
      tactic-reconcile-park-clobber measured 8 park erasures across 5 nodes in
      one 24h window on the sibling call site. (2) GAP — the exposure is still
      open. reconcile-graph-review-stall builds its landing GC_ARGS with no
      --base at lines 323-326 as of 1092a403, and the file contains zero
      occurrences of --base. (3) ANCHOR — the rationale cites
      reconcile-graph-review-stall:276-290 for that GC_ARGS build. That anchor
      drifted when e6421e6c inserted the rollback-arming block; :276-290 now
      holds the HEAD_AT_ARM pin, and the GC_ARGS build is at :323-326. What
      e6421e6c did change here is the rollback idiom, not the pin: the sweep no
      longer restores a captured origin/main blob (which left the tree dirty
      when the checkout lagged origin/main) but calls the shared
      graph_rollback_node_writes at :154. Rollback-on-failure and
      compare-and-swap-on-land are separate remedies; only the first has
      shipped."
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
