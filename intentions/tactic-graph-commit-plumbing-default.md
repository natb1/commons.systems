---
id: tactic-graph-commit-plumbing-default
kind: tactic
statement: Flip GRAPH_COMMIT_WRITER's default from worktree to plumbing for
  every caller, and delete the then-inert dirty-tree pre-flight guard — so
  unrelated dirt in any checkout cannot block or corrupt a graph write
owner: ai
status: raw
parent: null
rationale: "Surfaced by the 2026-08-14 /align round recording the
  write-independence and read-coherence invariant (strategy clarification 237).
  PR #3090 built and wired the plumbing writer but deliberately left the global
  default at worktree — 'a separate decision and a separate blast radius' — with
  dispatch-eval-finding the only opt-in caller. This is the unit that makes
  write independence hold for every writer, and it does NOT depend on
  tactic-graph-ref-split: assert_clean_outside_ids sits in land(), not
  try_land(), and is already conditional on GRAPH_COMMIT_WRITER == worktree, so
  the flip makes it inert with no cutover and none of ref-split's 37 blockers."
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
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Flip GRAPH_COMMIT_WRITER's default from worktree to plumbing for every caller, and delete the then-inert dirty-tree pre-flight guard — so unrelated dirt in any checkout cannot block or corrupt a graph write

Draft retained from the 2026-08-14 `/align` round. Not a plan — `/align-tactics`
owns decomposition. This body carries only what that session should not have to
rediscover.

## Why this is the load-bearing unit, and why it does not need ref-split

`tactic-graph-ref-split` is the ratified greenfield and does satisfy write
independence, but it is `phase: implement` behind 37 blockers (23 open on
2026-08-14) with a cutover that forbids phase handoff. This unit gets the same
property for every writer today, because the guard is already gated:

```
# packages/intentionsutil/scripts/graph-commit:3502
if [[ "$GRAPH_COMMIT_WRITER" == "worktree" ]]; then
  assert_clean_outside_ids
fi
```

`assert_clean_outside_ids` is defined at `:3300` and called from `land()` — not
from inside `try_land()`. So flipping the default makes it unreachable; it is not
load-bearing for the plumbing arm, and `graph-commit:388-400` already states why
(no rebase runs, the commit's parent is `origin/main` by construction, and
`park_and_exit()` syncs only this invocation's node paths).

## Ground the session should not re-derive

- `build_commit_plumbing()` landed in `039bbe11` (#3086) with tree-SHA
  equivalence asserted against the working-tree writer across single-node edit,
  multi-node, prune, mixed edit+prune, `RESURRECTED_IDS` exclusion, and an
  unrelated-paths-carry-through case.
- `75d76e26` (#3090) wired it into `try_land()` and opted `dispatch-eval-finding`
  in per-invocation (never a process-wide export). Test counts at that commit:
  `test-graph-commit.sh` 107/107, `test-dispatch-eval-finding.sh` 155/155.
- `75d76e26` names one **known behavioral difference, fail-closed**: a `--prune`
  id whose node a peer already deleted reads as a moved blob and parks, where a
  rebase would have seen both sides delete and carried on. The single opt-in
  caller never prunes — **a global flip removes that protection**, so pruning
  callers are the real risk surface and are where this unit's test effort belongs.
- `assert_staged_safe()` has no plumbing analogue and none was added, deliberately:
  it guards against `git add` picking up cross-contamination from a working-tree
  scan, and the plumbing path only ever names paths it computed from `ALL_IDS`.
  `039bbe11`'s own message flags re-checking that reasoning at wiring time.

## Scope boundary

Flipping the default and removing the dead guard only. Deleting the rest of the
working-tree machinery (`pull --rebase`, `rebase_in_progress`, orphan detection,
`replay_snapshot_onto_base`, and the header's ORPHANED LOCAL COMMITS recovery
rule — whose claim that commit→push "CANNOT be made atomic" is true of the
working-tree design and false of this one) is a follow-on, not this unit. The
`.claude/rules/sandbox.md` shrink that becomes possible is also follow-on.

## Verification

Whatever else, the regression that motivated the writer must be covered: a
modified unrelated tracked file (`flake.lock`) present during a land must neither
block the write nor be destroyed by it — including on the park path, where
`park_and_exit()`'s whole-tree `git reset --hard` becomes a path-scoped
`sync_ids_to_rev`. `75d76e26` added exactly that case; a global flip must keep it
green for callers that also prune.
