---
id: tactic-graph-auto-merge-main-health-gate
kind: tactic
statement: Move the main-known-good gate into graph-auto-merge's own admission
  decision and give it and reconcile-graph-merged an optional node-id filter, so
  one fully-gated script serves both the tick and a single-node caller
owner: ai
status: raw
parent: null
rationale: null
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
blocked_by:
  - tactic-pause-disables-merge-lane
  - tactic-graph-auto-merge-up-to-date-gate
  - tactic-graph-auto-merge-office-hours-gate
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Move the main-known-good gate into graph-auto-merge's own admission decision and give it and reconcile-graph-merged an optional node-id filter, so one fully-gated script serves both the tick and a single-node caller

## Draft context (2026-08-12 /align interview)

Author-directed. `graph-auto-merge` already owns nearly every admission gate
itself — office-hours park, PR `OPEN`, `MERGEABLE`, no in-flight
`execution.conflict`, CI green, scope-fingerprint freshness, and the auto-merge
kill-switch — and its own header calls it "the ONLY code that merges a node-lane
PR". One gate is missing from it: the main-known-good check. `OPEN_MAIN_RED` is
computed and applied in `dispatch-select-tick` *around* the call site, whose own
comment calls it "a load-bearing safety gate" suppressed both while main is red
and while main health is UNKNOWN.

That placement is why a single-node caller cannot reuse the script: calling
`graph-auto-merge` directly bypasses the gate entirely.

Two changes:

1. **Move the main-health predicate into `graph-auto-merge`'s own admission
   decision**, and delete the call-site copies. Note there are now **two** call
   sites to clean up, not one — `tactic-pause-disables-merge-lane` (PR #3068)
   adds a second on `dispatch-tick`'s paused branch, computing `OPEN_MAIN_RED`
   via `dispatch-graph-main-red-sync`. This node is `blocked_by` that one so the
   plan is written against post-#3068 code rather than going stale.
2. **Add an optional node-id filter** to `graph-auto-merge` and to
   `reconcile-graph-merged`, so a caller can merge and absorb one node instead
   of sweeping the whole ready queue. Absent the filter, behavior is unchanged.

This extends, rather than contradicts, the standing one-gate invariant ruled
2026-08-05 on `strategy-graph-native-dispatch`: the admission decision is ONE
decision over mergeability AND `office_hours` AND `blocked_by`, and main health
is a fourth predicate of the same decision. That ruling's named defect is
uncoordinated tactics racing the same gate surface, which is why this node is
sequenced behind `tactic-graph-auto-merge-up-to-date-gate` and
`tactic-graph-auto-merge-office-hours-gate` rather than opening a third racer.

Consumer: `tactic-dispatch-emulate-owns-merge`, which needs the node filter and
the moved gate before an emulated run can merge safely.

Not yet planned — this is retained interview context, not a clean-session plan.
