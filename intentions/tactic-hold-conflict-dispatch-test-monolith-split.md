---
id: tactic-hold-conflict-dispatch-test-monolith-split
kind: tactic
statement: "hold: provision-conflict on `tactic-dispatch-test-monolith-split` —
  a tracked hold blocking the source until the mechanical retry state is
  resolved"
owner: ai
status: codified
parent: null
rationale: null
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  hold_for: tactic-dispatch-test-monolith-split
  hold_kind: provision-conflict
---
# hold: provision-conflict on tactic-dispatch-test-monolith-split

## Context

`tactic-dispatch-test-monolith-split` hit a mechanical retry state (`provision-conflict`) on 2026-07-28. A mechanical retry state is not "no autonomous path exists, human required", so the source is NOT parked. Instead this born-parked hold tactic (`tactic-hold-conflict-dispatch-test-monolith-split`) carries the park, and `tactic-dispatch-test-monolith-split` gains a `blocked_by` edge naming it. The source's own `office_hours` is never written.

## Reason

origin/main has not merged clean into this tactic's branch for 5 consecutive ticks (provision exit 11).

## How to resolve

Resolve the conflict by hand in `.claude/worktrees/tactic-dispatch-test-monolith-split`, push the branch, then resolve THIS HOLD TACTIC to `phase: done` and prune it. Clearing `office_hours` alone does not unblock the source.

The `blocked_by` edge on `tactic-dispatch-test-monolith-split` clears only when this node leaves the open set: resolve the hold tactic to `phase: done` (then prune) — clearing `office_hours` alone does not unblock the source.

