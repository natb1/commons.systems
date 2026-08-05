---
id: tactic-hold-fix-cap-graph-router-live-worker-read-robust
kind: tactic
statement: "hold: fix-attempt-cap on
  `tactic-graph-router-live-worker-read-robust` — a tracked hold blocking the
  source until the mechanical retry state is resolved"
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
  hold_for: tactic-graph-router-live-worker-read-robust
  hold_kind: fix-attempt-cap
---
# hold: fix-attempt-cap on tactic-graph-router-live-worker-read-robust

## Context

`tactic-graph-router-live-worker-read-robust` hit a mechanical retry state (`fix-attempt-cap`) on 2026-08-01. A mechanical retry state is not "no autonomous path exists, human required", so the source is NOT parked. Instead this born-parked hold tactic (`tactic-hold-fix-cap-graph-router-live-worker-read-robust`) carries the park, and `tactic-graph-router-live-worker-read-robust` gains a `blocked_by` edge naming it. The source's own `office_hours` is never written.

## Reason

/fix-checks retry budget exhausted: 30 attempts concluded with PR #3010 still red (execution.fix.attempt=31, since 2026-08-01) — the 3-attempt cap is exhausted.

## How to resolve

Review the fix-checks accumulator (tmp/fix-checks-summary.md in the node's worktree, also posted in PR comments; folded into this hold's body when present) to diagnose why 3 automated attempts did not resolve CI. Resolve THIS HOLD TACTIC (phase: done, then prune) to unblock tactic-graph-router-live-worker-read-robust with a fresh retry budget (attempt was reset to 1), or abandon/redesign the tactic if the current approach cannot work.

The `blocked_by` edge on `tactic-graph-router-live-worker-read-robust` clears only when this node leaves the open set: resolve the hold tactic to `phase: done` (then prune) — clearing `office_hours` alone does not unblock the source.

