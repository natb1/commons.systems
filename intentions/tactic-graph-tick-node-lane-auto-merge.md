---
id: tactic-graph-tick-node-lane-auto-merge
kind: tactic
statement: Tick reconciler owns a single label-free, CI-validated auto-merge of
  a reviewed node-lane PR, keyed off the node reviewed marker (not the gh
  dispatch:reviewed label)
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-07-11 /align-strategy interview recording the
  post-phase dispatch flow (worker marks complete -> tick validates CI -> tick
  auto-merges post-review). transition-node's node-lane arm step calls the
  LABEL-gated dispatch-auto-merge, which skips node-lane PRs (no gh label), so a
  reviewed PR is readied+mergeable but held for human merge (PR #2859, merged by
  hand 2026-07-11); meanwhile the tick-workflow's gh-native `gh pr merge --auto
  --squash` path already merges without a label (clarification 47, tick +3,
  8/9). Unify on one tick-owned, label-free merge keyed off the node's reviewed
  marker."
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
# Tick reconciler owns a single label-free, CI-validated auto-merge of a reviewed node-lane PR, keyed off the node reviewed marker (not the gh dispatch:reviewed label)

## Context

Surfaced in the 2026-07-11 /align-strategy interview that recorded the post-phase
dispatch flow (new clarification on strategy-graph-native-dispatch): a phase
worker marks its phase complete and does not validate CI; the tick reconciler
validates CI each tick (skipping in-progress-CI ticks) and, post-review,
auto-merges the reviewed PR without author intervention.

## The gap (two inconsistent merge paths)

- `transition-node`'s node-lane arm step
  (`.claude/skills/dispatch-propagate/scripts/transition-node`, arm block ~L169-170)
  runs `gh pr ready "$PR"` then `dispatch-auto-merge`. `dispatch-auto-merge`'s
  eligibility is `isDraft==false AND dispatch:reviewed(LABEL) AND CI passing AND
  mergeable==MERGEABLE` — LABEL-gated. The node lane deliberately writes no gh
  label (`reviewed` is a node execution marker), so the reconciler silently skips
  the PR: readied + mergeable, never merged. Observed on PR #2859 (held for human
  merge; merged by hand 2026-07-11).
- The tick-workflow's own arming path (strategy clarification 47, tick +3
  2026-07-10) instead runs `gh pr ready <pr>; gh pr merge --auto --squash <pr>`
  — GitHub-native auto-merge, not label-gated — and merged 8 of 9 review PRs
  autonomously.

Two paths, one of which (the node-lane review-completion path) uses the merge
mechanism that does not fire for node-lane PRs.

## Scope (residual)

Unify on ONE tick-owned, label-free merge of a reviewed node-lane PR:
- The tick reconciler performs the merge, keyed off the node's `reviewed`
  execution marker + green CI + `mergeable==MERGEABLE` — never the gh
  `dispatch:reviewed` label.
- Remove the worker-side arm step from node-lane review completion
  (`transition-node` no longer calls `dispatch-auto-merge`); the worker writes
  only the `reviewed` marker. This realizes the interview's worker/tick split and
  moves arming off the worker (dissolving clarification 47's per-worker-arming
  classifier hazard).
- Arm/merge under the standing auto-merge config grant with a fresh in-turn grant
  at the tick (see memory graph-tick-automerge-grant-must-be-in-turn), using
  clarification 47's phrasing doctrine (state the human authorization as fact,
  name the commands, never argue with the permission layer).
- Ride the tactic-scope-fingerprint re-check (clarification 36) at the tick's arm
  point instead of the transition writer's.

## Dependency / linkage

Revises the "transition writer arms gh auto-merge at clean review completion
(dispatch-auto-merge conventions)" clause of `tactic-graph-router-transitions`
(that arm scope moves to the tick). Editing the parent strategy queues a
soft-freeze re-evaluation of `tactic-graph-router-transitions`, which should
reconcile its own arm clause; this draft covers the node-lane merge residual.

## Out of scope

- The legacy issue lane's label-gated `dispatch-auto-merge` reconciler stays as
  is for the draining gh queue.
- The worker/tick CI-validation split doctrine itself (recorded as the strategy
  clarification; this tactic implements only the post-review merge seam).

Retained by /align-strategy (retain-not-refine); a later /align-tactics round
finalizes, splits, or prunes it.
