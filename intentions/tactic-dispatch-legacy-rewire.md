---
id: tactic-dispatch-legacy-rewire
kind: tactic
statement: "rewire-then-delete: migrate the live dispatch harness off the legacy
  selector/label surface"
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: "tactic-legacy-router-removal Unit 1 found its deletion targets still
  live-wired into the graph-native tick and general harness (main-broken latch,
  dispatch-phase sensor callers, dispatch:* label readers/writers, dispatch-tick
  run_materialize). The drain gate proved no legacy work flows, not that the
  code is rewired. This tactic owns the rewire so the removal tactic can
  complete as the delete-dead-code unit it was scoped to be. dispatch-spawn-job
  is explicitly keep-forever: it is shared plumbing used by
  dispatch-graph-execute and the tick aux jobs, not legacy."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-dispatch-legacy-rewire
  pr: 2869
  attempts: {}
  markers: []
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# rewire-then-delete: migrate the live dispatch harness off the legacy selector/label surface

## Context

`tactic-legacy-router-removal`'s implement pass (2026-07-12) completed only
the separable portion of its Unit 1 (commit 5c753ba7 on branch
`tactic-legacy-router-removal`: legacy office-hours entry surface and the
`<issue-num>-<slug>` worktree-create.sh lane, both deleted with no remaining
callers). The rest of its deletion list is still live-wired into the
graph-native tick and the general harness — the drain gate (empty gh queue,
issues disabled) proves no legacy *work* flows, not that the *code* is
rewired. This tactic owns the rewire so the removal tactic's remaining scope
becomes a genuine delete-dead-code sweep.

Greenfield target: all dispatch state lives in the intention graph (persisted
`phase`, `execution.pr`, `office_hours`) plus a durable non-label repo-health
record; no consumer derives state from GitHub `dispatch:*` labels; GitHub
carries only PRs and CI.

**Keep-forever carve-out:** `dispatch-spawn-job` is shared job-spawn plumbing
used by `dispatch-graph-execute` (the graph-native per-node runner) and
`dispatch-tick`'s aux jobs (sync-repair, diagnose-main, jit-reminder). It is
NOT legacy and must not be deleted by this tactic or any successor.

All paths below are relative to
`.claude/skills/dispatch-propagate/scripts/` unless prefixed.

## Unit 1 — extract the repo-health latch

**Recommended model:** opus

Scope: move main-broken/sync-broken detection out of the legacy selector into
a standalone graph-native home.

- `dispatch-select-target` owns `--main-broken-sha` (the `dispatch:main-broken`
  recovery latch), called **unconditionally, regardless of lane** by
  `dispatch-select-tick` (~line 405), plus `--priority-only` (pace-exempt
  fallback used only by legacy selection — dies with legacy selection in
  Unit 3).
- Extract the main-broken detection into a new small `repo-health` sensor
  script that persists its latch state durably WITHOUT GitHub labels (a
  `dispatch.config/`-style JSON record or graph attribute — implementer's
  choice, but the reader must not need `gh`). Fold in the
  `dispatch:sync-broken` latch handling from `dispatch-select-tick` the same
  way.
- Rewire `dispatch-select-tick`'s unconditional `--main-broken-sha` call site
  to the new sensor.
- Decide and document (in the script header) whether the latch's announcement
  surface (`dispatch-diagnose-main`'s labeled GH issue) also moves; if it
  stays gh-based for human visibility, the LATCH state itself must still be
  label-free.

Out of scope: deleting `dispatch-select-target` (Unit 3, after its last
caller is gone).

## Unit 2 — label-consumer audit: delete vs. rewire

**Recommended model:** opus

Depends on: Unit 1.

Scope: for each remaining `dispatch:*` label consumer, classify
legacy-lane-only (delete with the lane, in Unit 3) vs. still-needed (rewire
now onto persisted graph phase / job-dir markers), then land the rewires.

Consumers found live by the 2026-07-12 investigation:

- `.claude/statusline.sh` — calls `dispatch-phase` (label-derivation sensor).
  Still needed: rewire onto the node's persisted `phase` (worktree branch name
  = node id → `intentions/<id>.md`), with a sane fallback for non-node
  worktrees.
- `.claude/hooks/dispatch-stop.sh` — Branch A applies `dispatch:office-hours`
  to issues; the graph lane already parks via `park-node`. Rewire: keep the
  job-dir marker seam (`office-hours-reason`/`office-hours-recommendation`),
  drop the label-apply path once no issue-lane workers remain.
- `.claude/hooks/dispatch-input-block.sh` — writes `dispatch:office-hours`.
  Same treatment as dispatch-stop.sh.
- `dispatch-scan-recoverable-deaths` — reads/writes labels for the legacy
  issue lane. Classify: if its recoverable-death scan is still wanted for
  graph-lane workers, rewire its state reads to the graph; else mark
  legacy-lane-only for Unit 3 deletion.
- `restore-dispatch-skill.sh` — calls `dispatch-phase`. Classify same way.
- `dispatch-trace-leaf`, `dispatch-route` — legacy-lane selection/routing;
  expected legacy-lane-only (Unit 3 deletes), confirm no graph-lane caller.
- `dispatch-phase` itself — pure read-only label-derivation sensor; after its
  callers above are rewired or classified legacy-only, nothing should need
  it. Confirm zero survivors, else rewire the survivor.

Each classification lands as a one-line note in the affected file's header
(or its deletion in Unit 3's list), so Unit 3 executes mechanically.

## Unit 3 — reduce the orchestrators, delete the dead surface

**Recommended model:** opus

Depends on: Units 1 and 2.

Scope: with no remaining live wiring,

- Reduce `dispatch-tick` to graph+aux-only: drop `run_materialize()`'s
  explicit/pr/issue decision handling (its `dispatch-materialize-spawn`
  call site).
- Reduce `dispatch-select-tick` (~900 lines) to graph+latch-only: drop the
  legacy selection branch and its `dispatch-select-target` calls; keep sync,
  the (now label-free) health latches from Unit 1, auto-merge, and
  reconcile-merged for the graph path.
- Delete whole: `dispatch-select-target`, `dispatch-materialize-spawn`,
  `dispatch-launch-worker`, `dispatch-phase`, `dispatch-trace-leaf`,
  `dispatch-route` (the last two only if Unit 2 confirmed legacy-lane-only),
  plus every consumer Unit 2 classified legacy-lane-only.
- Remove every remaining `dispatch:*` label read/write in scripts and hooks
  (grep the `.claude/` tree; prose/history mentions may stay).
- Do NOT touch `dispatch-spawn-job` (keep-forever carve-out above).
- Sweep `test-dispatch-scripts.sh` sections covering deleted scripts.

## Dependencies

None (frontmatter `blocked_by` empty): the graph-native replacement surface
this rewire targets is already live end to end. This tactic BLOCKS
`tactic-legacy-router-removal` (its remaining Units 2–3 and residual Unit 1
sweep resume when this lands — the edge is on that node's `blocked_by`).

## Verification

```verify
npm test --prefix packages/intentionsutil
```

Manual: `bash -n` every edited script; grep `.claude/` for `dispatch:` label
operations — zero live read/write sites outside git history and prose; the
statusline renders a phase for a node worktree with `gh` unavailable; one
graph-lane tactic completes a full lifecycle with the legacy scripts gone.

## Implementation notes

One subagent per unit, `model` per tag; constrain to working-tree edits.

## needs-main residue

QA (2026-07-15, PR #2869) found one acceptance criterion that cannot be
asserted at merge time — verified downstream, once this tactic reaches
`main-qa`, by observing real production dispatch ticks against the merged
harness.

- id: 12
- title: Live dispatch harness behaves per the greenfield contract over the
  next several real ticks
- url_path: current
- expected_outcome: Production dispatch ticks run clean end-to-end on the
  reduced graph-native surface, with latch recovery, statusline phase, and
  auto-merge/reconcile all behaving as before the rewire.
- finding: end-to-end harness behavior on the live queue is observable only
  across real production ticks after merge, not assertable in the working
  tree at QA time (planned deferral, per the QA triage plan's classification).
