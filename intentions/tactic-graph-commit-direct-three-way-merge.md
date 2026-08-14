---
id: tactic-graph-commit-direct-three-way-merge
kind: tactic
statement: Replace graph-commit's rebase-driven conflict production with a
  direct three-way merge through merge-node.ts, which already takes
  --base/--ours/--theirs as plain paths and is git-independent
owner: ai
status: raw
parent: null
rationale: "Retained from PR #3086's own 'Still to come' list, re-surfaced by
  the 2026-08-14 /align round (strategy clarification 237). The rebase exists
  only to PRODUCE a conflict that layer 2 then unwinds in order to call
  merge-node.ts — the merger it ends at is already git-independent.
  Writer-internal cleanup rather than something the write-independence invariant
  requires, so it is not on that invariant's critical path; it is the remaining
  structural simplification once the plumbing default lands
  (tactic-graph-commit-plumbing-default)."
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
# Replace graph-commit's rebase-driven conflict production with a direct three-way merge through merge-node.ts, which already takes --base/--ours/--theirs as plain paths and is git-independent

Draft retained from the 2026-08-14 `/align` round. Not a plan.

## The observation, in #3086's own words

> Replace rebase-driven conflict handling with a direct three-way merge.
> `merge-node.ts` already takes `--base --ours --theirs --out` as plain paths and
> runs the pure field-level merge — it is already git-independent. The rebase exists
> only to *produce* a conflict that layer 2 then unwinds to call that merger.

So the rebase is scaffolding for a merger that does not need it. Layer 2 currently
reconstructs, from rebase conflict output, inputs that the caller already has.

## What the plumbing writer already changed here

`75d76e26` (#3090) did not leave this untouched. Under `GRAPH_COMMIT_WRITER=plumbing`
a same-node concurrent edit is no longer a rebase conflict at all, so it is detected
explicitly: `reconcile_plumbing_base(old, new)` compares each id's blob at the previous
base against its blob at the new base and, on a difference, three-ways through the
existing `run_merge_node` — `base` = blob at the previous base, `ours` = the on-disk
file, `theirs` = blob at the new base — guarded by the same list-removal check
`replay_snapshot_onto_base` uses. Unresolved returns 1 → 10 → `land()` maps to 12 →
`park_and_exit`, today's behavior preserved.

**That is already the direct three-way merge, on the plumbing arm.** What remains is
the worktree arm's rebase path, which is why this unit is largely subsumed by
`tactic-graph-commit-plumbing-default`: flip the default and the rebase path stops
executing; delete the working-tree machinery and it stops existing. A session picking
this up should first check whether anything is left to do beyond that deletion.

## Ordering and scope

Not on the critical path for the write-independence invariant (strategy
clarification 237) — it is writer-internal simplification. Sequence it after
`tactic-graph-commit-plumbing-default`, and expect it to shrink to "delete the
rebase path" rather than "write a merger".

The `--prune` divergence is the one place the two arms are genuinely not equivalent:
under plumbing, a `--prune` id whose node a peer already deleted reads as a moved blob
and parks, where a rebase saw both sides delete and carried on. Any consolidation must
decide that case deliberately rather than inherit it.
