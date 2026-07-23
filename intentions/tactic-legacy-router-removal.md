---
id: tactic-legacy-router-removal
kind: tactic
statement: "drain complete: remove the legacy gh router and dispatch:* label conventions"
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: "The strategy's threshold: legacy gh dispatch router deleted with the
  /file-issue + /plan-issue coverage matrix fully mapped. Gated on an external
  condition — the gh queue draining to zero — checked at plan step 0; parks
  itself if not yet drained (blocked_by cannot express an external condition)."
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
execution: null
validates:
  - strategy-graph-native-dispatch
blocked_by:
  - tactic-phase-skill-node-targets
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# drain complete: remove the legacy gh router and dispatch:* label conventions

## Status — Unit 1 fully complete (2026-07-22 correction)

The gh queue drained (Step 0 gate discharged), and Unit 1's *non-live-wired*
deletions landed (partial commit on branch `tactic-legacy-router-removal`, merged
`ee12fc1b`): the legacy office-hours entry surface and the legacy
`<issue-num>-<slug>` worktree lane deletion (the `office-hours` shell entry,
`office-hours-select-target`) are gone.

The office_hours park this node carried since 2026-07-12 recorded the
*remaining* Unit 1 work — rewiring `dispatch-select-tick` / `dispatch-phase` /
`dispatch-tick`'s live `dispatch:*`-label and legacy-script dependencies onto
graph-native state, then deleting the drained scripts and labels — as still
outstanding. On 2026-07-22 that 10-day-stale recommendation was actioned
without re-checking current graph/repo state: a follow-up sibling,
`tactic-legacy-dispatch-rewire-delete`, was split out to re-plan it.

That follow-up was a duplicate. In the 10 days between the park being written
(2026-07-12) and the split (2026-07-22), a separately-recorded tactic,
`tactic-dispatch-legacy-rewire`, already planned and landed the exact same
rewire-then-delete scope — repo-health latch extraction (Unit 1), a
`dispatch:*` label-consumer audit/rewire (Unit 2), and the orchestrator
reduction plus dead-script deletion (Unit 3) — merged as PR #2869
(`a8c4898d`) and pruned as done on 2026-07-18 (`a7273245`), four days *before*
the 2026-07-22 split. `/align-tactics`, invoked on the split sibling on
2026-07-22, re-verified current repo state against the 2026-07-12 checklist
and confirmed it is now stale: `dispatch-select-target`, `dispatch-phase`,
`dispatch-materialize-spawn`, `dispatch-launch-worker`, `dispatch-trace-leaf`,
and `dispatch-route` are all deleted from
`.claude/skills/dispatch-propagate/scripts/`; the main-broken/sync-broken
latches now live in a label-free `repo-health` sensor called from
`dispatch-select-tick`; `dispatch-select-tick`'s legacy gh-issue-queue
selection path is gone (its own header cites `tactic-dispatch-legacy-rewire
Unit 3`); `dispatch-tick` has no `run_materialize()` / materialize-spawn call
left. The `dispatch:*` labels still read/written today
(`dispatch:office-hours`, `planned`, `qa-done`, `reviewed`,
`review-followup`, `chain-stalled`, and `sync-broken` as an
announcement-only mirror over the now label-free latch) are not un-rewired
legacy debt — they are current design in active service of the still-live
legacy issue-lane skills (`office-hours`'s dual-lane mode, `plan-issue`,
`qa-fix`, `review-fix`) that **Unit 2** below retires, or a human-visibility
mirror `tactic-dispatch-legacy-rewire` Unit 1 deliberately kept.

The two hook files the 2026-07-12 checklist also flagged —
`.claude/hooks/dispatch-office-hours-strip.sh` (still registered as a
UserPromptSubmit hook, stripping `dispatch:office-hours` on the legacy
`<issue-num>-*` lane) and `.claude/hooks/worktree-create.sh` (still supports
both the legacy `<issue-num>-<slug>` lane and the graph `<node-id>` lane) —
are likewise correctly still live: they retire naturally as part of **Unit
2** (retiring the legacy authoring skills that still produce `<issue-num>-*`
work), not as additional Unit-1-shaped rewire work.

`tactic-legacy-dispatch-rewire-delete` has been pruned (duplicate of
already-completed work; see this commit's message) rather than re-planned.
Unit 1 is therefore **fully complete** — both its non-live-wired half
(`ee12fc1b`) and its live-wired half (`tactic-dispatch-legacy-rewire`, PR
#2869). The dangling `blocked_by` edge to the pruned follow-up has been
dropped from this node's frontmatter; the three remaining `blocked_by`
entries (`tactic-graph-router-transitions`, `tactic-dispatch-lifecycle-sensor`,
`tactic-phase-skill-node-targets`) are all already `phase: done`, so this node
is now unblocked to proceed on **Units 2 and 3** below.

## Context

The strategy's threshold: legacy gh dispatch router deleted with the
`/file-issue` + `/plan-issue` coverage matrix fully mapped. The matrix
(`intentions/tactic-graph-native-dispatch.md` §4) is the removal
checklist — every deleted behavior must map to a matrix row landed by a
sibling tactic.

## Step 0 — drain gate (external condition)

Verify the gh queue is empty: no open dispatch-eligible issues (`help
wanted` without open blockers) and no open dispatch-owned PRs. If
non-empty, this tactic parks itself (`office_hours`, reason: awaiting
drain) — `blocked_by` edges cannot express an external condition, so the
gate is a plan step.

## Unit 1 — remove the selector and phase-derivation surface

> **Complete (2026-07-22 correction).** The non-live-wired half landed
> directly on this branch (`ee12fc1b`); the live-wired half landed via the
> separately-recorded `tactic-dispatch-legacy-rewire` (PR #2869, merged and
> pruned 2026-07-18) — see Status above for the full reconciliation. Do
> **not** re-attempt any of it. The original scope is retained below for
> provenance only.

**Recommended model:** opus

Scope: in `.claude/skills/dispatch-propagate/scripts/` delete or reduce:
`dispatch-select-target`, the legacy path in `dispatch-select-tick`,
`dispatch-phase`'s derivation logic (its read-only sensor side survives in
the transitions layer), the legacy office-hours entry surface — the
`office-hours` shell entry script with its attach/resume/provision verbs,
`office-hours-select-target`, and the `dispatch-office-hours-strip.sh`
UserPromptSubmit hook — superseded by the graph-native always-launch-fresh
entry (strategy clarification 30, `tactic-office-hours-graph-entry`; the
queue view is the `office_hours != null` projection, and the park clears
per clarification 4, not via a strip hook), and every `dispatch:*` label
convention remaining in scripts and skill docs. Also retire the legacy
worktree-layout conventions (strategy clarification 23):
`worktree-create.sh`'s `<issue-num>-<slug>` lane (git-common-dir
anchoring and the gh identity stub) and `dispatch-materialize-spawn`'s
sibling `$PROJECT_ROOT/worktrees/` placement — after removal, no repo
machinery references the `.bare` common dir or the `worktrees/`
container, and Claude Code native worktrees at
`<project-root>/.claude/worktrees/` are the only worktree surface. The
full legacy launch chain (`dispatch-materialize-spawn`,
`dispatch-launch-worker`, `dispatch-spawn-job`) deletes whole — node
targets never extended it: the tick executes graph selections as a
workflow fan-out (strategy clarification 24,
`tactic-graph-router-selector` unit 4). Each
deletion cites its matrix row or its graph-native replacement tactic.

## Unit 2 — retire the legacy authoring skills

**Recommended model:** sonnet

Depends on: nothing further — Unit 1 (both halves) is complete (see Status
above); this node's `blocked_by` set no longer gates on it.

Scope: retire `/file-issue` and `/plan-issue` skill docs with pointers to
their successors. (The gh↔graph mapping layer — `intention-emit`,
`backfill.ts`/`refresh.ts`, `trackers/`, `rank-map.ts` — was already
removed when the parallel-drain migration superseded the mapping strategy;
nothing of it remains to retire here.)

## Unit 3 — prune the drain-expiry graph nodes

**Recommended model:** sonnet

Scope:
- The greenfield-relevance gate (strategy clarification, 2026-07-06) names
  this tactic as the expiry event for interim-live-risk exceptions on the
  legacy-gh surface. The expiry event is the surface being **actually
  removed** — **not** merely the queue draining. That removal already
  happened: `tactic-dispatch-legacy-rewire` (PR #2869, merged and pruned
  2026-07-18) landed the live-wired deletions (see Status above), so the
  expiry event has occurred and Unit 3 is unblocked on that count. Prune the
  nodes that expire with it: `tactic-dispatch-gh-api-interim-hardening` (demoted draft whose
  demotion note says delete here), and sweep
  `tactic-review-lows-automation`'s "legacy dispatch scripts" section —
  drop the items whose subject files this tactic deletes, keep the
  survivors (token-audit, CI wrappers, hooks, lib.sh duplication items
  that outlive the gh lane).
- Land the prunes through `graph-commit --prune`
  (`tactic-graph-commit-prune-support` Unit 1) if it has shipped;
  otherwise the hand-orchestrated `graph/**` fast-path per the prune
  precedent (a54f4ced).

## Dependencies

- `tactic-legacy-dispatch-rewire-delete` — a 2026-07-22 re-scope follow-up
  that turned out to duplicate already-landed work (`tactic-dispatch-legacy-rewire`,
  PR #2869, merged and pruned 2026-07-18 — see Status above); pruned rather
  than re-planned. No longer a dependency; dropped from the frontmatter
  `blocked_by` set.
- `tactic-graph-router-transitions`, `tactic-dispatch-lifecycle-sensor`,
  `tactic-phase-skill-node-targets`, `tactic-main-qa-phase`,
  `tactic-office-hours-graph-entry` — the frontmatter `blocked_by` set:
  the replacement surface must be live end to end (the node-targets
  tactic is what lets the phase skills run on node targets at all; the
  main-qa tactic is what lets the qa-main label machinery be deleted;
  the office-hours entry is what lets the legacy office-hours surface in
  Unit 1's deletion list go). The align-skills pair
  (`tactic-align-strategy-skill`, `tactic-align-tactics-skill`) already
  completed and pruned — both skills are live.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

Manual: repo grep for `dispatch:` label references — zero hits outside git
history; then one tactic completes a full lifecycle graph-natively (the
signal observable) with the legacy scripts gone, and the lifecycle
sensor's next reading reflects it.

## Implementation notes

One subagent per unit, `model` per tag; constrain to working-tree edits.
