---
id: tactic-hold-fix-cap-attention-boost-scripts
kind: tactic
statement: "hold: fix-attempt-cap on `tactic-attention-boost-scripts` — a
  tracked hold blocking the source until the mechanical retry state is resolved"
owner: ai
status: codified
parent: null
rationale: null
reading: null
gap: null
serves:
  - strategy-graph-drives-dispatch
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
  hold_for: tactic-attention-boost-scripts
  hold_kind: fix-attempt-cap
---
# hold: fix-attempt-cap on tactic-attention-boost-scripts

## Context

`tactic-attention-boost-scripts` hit a mechanical retry state (`fix-attempt-cap`) on 2026-08-03. A mechanical retry state is not "no autonomous path exists, human required", so the source is NOT parked. Instead this born-parked hold tactic (`tactic-hold-fix-cap-attention-boost-scripts`) carries the park, and `tactic-attention-boost-scripts` gains a `blocked_by` edge naming it. The source's own `office_hours` is never written.

## Reason

/fix-checks retry budget exhausted: 27 attempts concluded with PR #3012 still red (execution.fix.attempt=28, since 2026-08-01) — the 3-attempt cap is exhausted.

## How to resolve

Review the fix-checks accumulator (tmp/fix-checks-summary.md in the node's worktree, also posted in PR comments; folded into this hold's body when present) to diagnose why 3 automated attempts did not resolve CI. Resolve THIS HOLD TACTIC (phase: done, then prune) to unblock tactic-attention-boost-scripts with a fresh retry budget (attempt was reset to 1), or abandon/redesign the tactic if the current approach cannot work.

The `blocked_by` edge on `tactic-attention-boost-scripts` clears only when this node leaves the open set: resolve the hold tactic to `phase: done` (then prune) — clearing `office_hours` alone does not unblock the source.

