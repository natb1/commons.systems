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
  - tactic-graph-router-transitions
  - tactic-dispatch-lifecycle-sensor
  - tactic-phase-skill-node-targets
  - tactic-main-qa-phase
  - tactic-office-hours-graph-entry
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# drain complete: remove the legacy gh router and dispatch:* label conventions

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

Depends on: Unit 1.

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
  legacy-gh surface. At drain completion, prune the nodes that expire with
  it: `tactic-dispatch-gh-api-interim-hardening` (demoted draft whose
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
