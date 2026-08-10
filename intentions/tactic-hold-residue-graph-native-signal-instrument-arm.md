---
id: tactic-hold-residue-graph-native-signal-instrument-arm
kind: tactic
statement: "hold: worktree-residue on
  `tactic-graph-native-signal-instrument-arm` — a tracked hold blocking the
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
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: |-
    provision-node-worktree refused to provision this tactic's worktree: it carries mechanical residue from a dead session (exit 14), not a content conflict. `origin/main` merges clean once the residue is cleared — with one exception the status output below distinguishes: on the `failed-merge-abort` condition a merge git could NOT abort is still in progress (MERGE_HEAD present, `UU` paths), and that merge has to be finished or aborted before anything else.

    `git -C /home/n8/natb1/commons.systems/.claude/worktrees/tactic-graph-native-signal-instrument-arm status --porcelain --untracked-files=no`:
     M packages/intentionsutil/scripts/align-tactics-census.ts
     M packages/intentionsutil/src/index.ts

    `git -C /home/n8/natb1/commons.systems/.claude/worktrees/tactic-graph-native-signal-instrument-arm diff --stat`:
     packages/intentionsutil/scripts/align-tactics-census.ts | 14 +++-----------
     packages/intentionsutil/src/index.ts                    |  2 ++
     2 files changed, 5 insertions(+), 11 deletions(-)
  since: 2026-08-10
  recommendation: "Inspect the diff recorded above in
    `.claude/worktrees/tactic-graph-native-signal-instrument-arm` and decide
    what the uncommitted content IS. If it is unlanded work, land it —
    `graph-commit` for an intentions/ node write, or commit and push the branch
    for code — and never discard it sight-unseen; the uncommitted edit may be
    its only copy. If it is safely discardable (build output, a half-applied
    edit already landed elsewhere), clear it with `git restore` — but NOT while
    a merge is live: if the status above shows `UU` paths or the worktree has a
    MERGE_HEAD, abort or complete THAT merge first, since `git restore` inside
    one discards the wrong side. A detached HEAD with commits on it needs a
    branch before anything is reset, and a worktree sitting on a branch other
    than `tactic-graph-native-signal-instrument-arm` (the `wrong-branch`
    condition) needs that branch's own state settled before it is switched back.
    Once the worktree is clean, the next tick provisions it normally. Then
    resolve THIS HOLD TACTIC to `phase: done` and prune it — clearing
    `office_hours` alone does not unblock the source. `resolve-hold
    tactic-graph-native-signal-instrument-arm --kind worktree-residue` does the
    resolve and the source's `blocked_by` clear in one landed write."
  session_type: other
pace_exempt: false
rounds: null
attributes:
  hold_for: tactic-graph-native-signal-instrument-arm
  hold_kind: worktree-residue
---
# hold: worktree-residue on tactic-graph-native-signal-instrument-arm

## Context

`tactic-graph-native-signal-instrument-arm` hit a mechanical retry state (`worktree-residue`) on 2026-08-10. A mechanical retry state is not "no autonomous path exists, human required", so the source is NOT parked. Instead this born-parked hold tactic (`tactic-hold-residue-graph-native-signal-instrument-arm`) carries the park, and `tactic-graph-native-signal-instrument-arm` gains a `blocked_by` edge naming it. The source's own `office_hours` is never written.

## Reason

provision-node-worktree refused to provision this tactic's worktree: it carries mechanical residue from a dead session (exit 14), not a content conflict. `origin/main` merges clean once the residue is cleared — with one exception the status output below distinguishes: on the `failed-merge-abort` condition a merge git could NOT abort is still in progress (MERGE_HEAD present, `UU` paths), and that merge has to be finished or aborted before anything else.

`git -C /home/n8/natb1/commons.systems/.claude/worktrees/tactic-graph-native-signal-instrument-arm status --porcelain --untracked-files=no`:
 M packages/intentionsutil/scripts/align-tactics-census.ts
 M packages/intentionsutil/src/index.ts

`git -C /home/n8/natb1/commons.systems/.claude/worktrees/tactic-graph-native-signal-instrument-arm diff --stat`:
 packages/intentionsutil/scripts/align-tactics-census.ts | 14 +++-----------
 packages/intentionsutil/src/index.ts                    |  2 ++
 2 files changed, 5 insertions(+), 11 deletions(-)

## How to resolve

Inspect the diff recorded above in `.claude/worktrees/tactic-graph-native-signal-instrument-arm` and decide what the uncommitted content IS. If it is unlanded work, land it — `graph-commit` for an intentions/ node write, or commit and push the branch for code — and never discard it sight-unseen; the uncommitted edit may be its only copy. If it is safely discardable (build output, a half-applied edit already landed elsewhere), clear it with `git restore` — but NOT while a merge is live: if the status above shows `UU` paths or the worktree has a MERGE_HEAD, abort or complete THAT merge first, since `git restore` inside one discards the wrong side. A detached HEAD with commits on it needs a branch before anything is reset, and a worktree sitting on a branch other than `tactic-graph-native-signal-instrument-arm` (the `wrong-branch` condition) needs that branch's own state settled before it is switched back. Once the worktree is clean, the next tick provisions it normally. Then resolve THIS HOLD TACTIC to `phase: done` and prune it — clearing `office_hours` alone does not unblock the source. `resolve-hold tactic-graph-native-signal-instrument-arm --kind worktree-residue` does the resolve and the source's `blocked_by` clear in one landed write.

The `blocked_by` edge on `tactic-graph-native-signal-instrument-arm` clears only when this node leaves the open set: resolve the hold tactic to `phase: done` (then prune) — clearing `office_hours` alone does not unblock the source.

