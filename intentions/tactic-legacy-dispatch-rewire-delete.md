---
id: tactic-legacy-dispatch-rewire-delete
kind: tactic
statement: rewire the remaining dispatch:* label and legacy-script dependencies
  onto graph-native state, then delete the drained legacy dispatch surface
owner: ai
status: raw
parent: tactic-graph-native-dispatch
rationale: "Split out from tactic-legacy-router-removal Unit 1 (office-hours
  re-scope, 2026-07-22): the remaining Unit 1 work is not 'delete already-dead
  code' but 'rewire-then-delete' across the live dispatch system
  (dispatch-select-tick, dispatch-phase, dispatch-tick and the dispatch:* label
  conventions still read/written on live paths) — a materially larger blast
  radius than the parent tactic assumed. It needs its own planning pass; carried
  here as a draft for /align-tactics to decompose."
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
# rewire the remaining dispatch:* label and legacy-script dependencies onto graph-native state, then delete the drained legacy dispatch surface

## Draft — needs an /align-tactics planning pass

This node carries **retained scope**, not a finalized clean-session plan. It was
split out of `tactic-legacy-router-removal` Unit 1 on 2026-07-22 (office-hours
re-scope, path 1 of that node's park recommendation). `/align-tactics` decomposes
it into PR-sized units and plans each; the checklist below is the input to that
pass, verified against live repo state at planning time.

## Context

`tactic-legacy-router-removal` Unit 1 assumed it was deleting already-dead code.
Its non-live-wired portion landed (partial commit on branch
`tactic-legacy-router-removal`, merged `ee12fc1b`): the legacy office-hours entry
surface and the legacy `<issue-num>-<slug>` worktree lane are gone. But the
remaining coupling points are **still live-wired** into the graph-native tick and
the general harness. The drain gate (empty gh queue) proves no legacy *work*
flows; it does **not** mean these scripts/labels are *rewired*. Each needs its
graph-native target confirmed (or confirmed-not-to-exist-yet) before its
counterpart can be deleted — hence "rewire-then-delete", not "delete".

## Scope — the remaining Unit 1 coupling points

Each item below is a rewire-then-delete unit for the planning pass. `path:line`
anchors are approximate (the parent tactic's recommendation, 2026-07-12) and must
be re-verified against live state when planned.

- **`dispatch-spawn-job` — NOT legacy; keep forever, no rewire.** Used by
  `dispatch-graph-execute` (the graph-native per-node runner) and `dispatch-tick`
  aux jobs (sync-repair, diagnose-main, jit-reminder). Explicitly carve it out of
  every deletion; it is not part of the legacy launch chain.

- **`dispatch-select-target`** — owns `--main-broken-sha` (repo-health latch,
  called unconditionally by `dispatch-select-tick`, not lane-gated) and
  `--priority-only` (pace-exempt fallback). Extract/relocate main-broken
  detection to a graph-native home (or rule that the graph path should own it)
  before deleting.

- **`dispatch-select-tick` legacy-selection path** — behaviorally inert today
  (graph selector runs first, queue empty) but coupled to `dispatch-select-target`
  and embedded in a ~900-line orchestrator that also runs sync, the
  sync-broken/main-broken latches, auto-merge, and reconcile-merged for the graph
  path. Reduce to graph+latch-only, keeping the still-live latches.

- **`dispatch-phase`** — pure read-only sensor; no write/derivation split exists
  to make. Live callers are `statusline.sh`, `dispatch-scan-recoverable-deaths`,
  `dispatch-stop.sh`, `restore-dispatch-skill.sh`. Rewire each sensor caller off
  `dispatch:*`-label derivation, or keep the sensor, before touching it — gutting
  it breaks the status line.

- **`dispatch:*` labels** — woven through live paths:
  `dispatch:main-broken`/`sync-broken` (repo-health latches in
  `dispatch-select-tick`); `dispatch:office-hours` (written by
  `dispatch-input-block.sh`, `dispatch-stop.sh`, `dispatch-scan-recoverable-deaths`;
  read by `dispatch-trace-leaf`, `dispatch-select-target`);
  `dispatch:planned`/`qa-done`/`reviewed` (drive `dispatch-phase`/`dispatch-route`).
  Retire per-label only after its readers/writers move to graph-native state.

- **`dispatch-materialize-spawn` / `dispatch-launch-worker`** — legacy-only, but
  `dispatch-tick`'s `run_materialize()` still calls `dispatch-materialize-spawn`
  on explicit/pr/issue decisions. Reduce `dispatch-tick` (the shared router
  carrying both branches) to graph+aux-only first, then delete these whole.

Minor prose-only loose ends, non-blocking: stale references in
`dispatch-propagate/reference.md`, `dispatch-mark-deviation:31`,
`approve-workflow-commands.sh:64`, and a few `test-dispatch-scripts.sh` comments.

## Relationship to the parent tactic

`tactic-legacy-router-removal` is `blocked_by` this node. Its Units 2 (retire the
`/file-issue` + `/plan-issue` authoring skills) and 3 (prune the drain-expiry
graph nodes) depend on these deletions actually landing — the drain-expiry event
Unit 3 keys off is *this surface being removed*, not merely the queue draining —
so they run only after this node completes.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

Manual: repo grep for `dispatch:` label references — zero hits outside git
history once the labels are retired; then one tactic completes a full lifecycle
graph-natively with the legacy scripts gone, and the lifecycle sensor's next
reading reflects it.
