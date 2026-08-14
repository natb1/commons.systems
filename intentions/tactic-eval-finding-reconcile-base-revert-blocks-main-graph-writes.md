---
id: tactic-eval-finding-reconcile-base-revert-blocks-main-graph-writes
kind: tactic
statement: A writer serializing a six-hour-stale in-memory node into the main
  checkout without committing it does not merely risk a lost update — the
  uncommitted file trips graph-commit dirty-tree guard and denies service to
  every graph writer in that checkout until a human clears it
owner: ai
status: raw
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
  - strategy-recursive-self-improvement
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
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-13
  measured_impact:
    - metric: stale_base_age_h
      value: 6.1
      unit: hours
      window: tactic-attention-namespaced-rank 2026-08-13 db9e7f2c read 14:19Z,
        written back 18:24:57Z
      sensor: rsi
      measured: 2026-08-13
    - metric: landed_commits_reverted_in_worktree
      value: 2
      unit: commits
      window: tactic-attention-namespaced-rank 2026-08-13T18:24:57Z
      sensor: rsi
      measured: 2026-08-13
    - metric: blocked_graph_commit_attempts
      value: 3
      unit: attempts
      window: rsi-eval fix phase 2026-08-13T18:2xZ
      sensor: dispatch-eval-finding
      measured: 2026-08-13
    - metric: ledger_writes_denied
      value: 4
      unit: findings
      window: rsi-eval fix phase 2026-08-13
      sensor: rsi
      measured: 2026-08-13
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-13
  resolved_by: 1092a403e0000e4a4ce8ff106b892bfb32d4cdb7
---
## Caught in the act, uncommitted, blocking every graph-commit in the main checkout

Observed 2026-08-13 while evaluating the `fix` phase of
`tactic-attention-namespaced-rank`. The evaluator's own ledger write failed:

```
error: graph-commit: refusing to start — unrelated dirty tracked file(s) outside this call's node set:
 M flake.lock
 M intentions/tactic-attention-namespaced-rank.md
dispatch-eval-finding: graph-commit failed after 3 attempt(s)
dispatch-eval-finding: recording a recurrence of ... failed; the write was rolled back to origin/main
```

### What the dirty node file actually was

The working-tree copy hashed to `faee3482e5ab04b8f287d7e9fa7a4ca4d4c85646` —
**byte-identical to `intentions/tactic-attention-namespaced-rank.md` as of commit
`db9e7f2c` ("graph: transition tactic-attention-namespaced-rank to review",
2026-08-13T14:19:41Z)**. That sha is exactly the `base_sha` recorded in the
review-phase worker's own `dispatch.outcome.v1` object
(session `40c253c4-108e-44e3-b0e9-e71afa959dee`, `base_sha: db9e7f2c…`).

Its mtime was `2026-08-13T18:24:57Z`. `HEAD` == `origin/main` == `7ed6ee7a`,
whose copy of the file (`186fb271…`) carries the state the fix phase had landed
five minutes earlier. Relative to `HEAD` the working-tree copy is a pure
reversion:

```
-    - reviewed
-  fix:
-    since: 2026-08-13
-    attempt: 2
-    pushed_sha: 6e1f5770abd44a9cc6b3f967a1c0ab133d089aaa
+  fix: null
```

So a writer holding the review phase's ~6-hour-old in-memory node re-serialized
it into the main checkout at 18:24:57Z, erasing the `reviewed` marker and the
whole `execution.fix` block that `graph-commit 6e1f5770` had made public at
18:19:47Z. The ladder's `state.json` `step` at that moment was `review-stall`.

### Why this is worse than a lost update

It was never committed. It sat uncommitted in the main checkout, where
`graph-commit`'s dirty-tree guard turns one writer's stale serialization into a
**checkout-wide graph-write outage**: every subsequent `graph-commit` in the
main checkout refuses to start, whatever node it targets. The blast radius is
not the one node that was clobbered — it is every graph writer that runs in that
checkout until a human clears the file. The first casualty here was this
evaluator, whose four findings all failed to land on the first attempt.

`tactic-reconcile-review-stall-base-pin` already names the missing `--base` pin
on `reconcile-graph-review-stall` as a lost-update exposure. This occurrence adds
the part that entry does not carry: the stale write does not have to *win* a
race to do damage. Left uncommitted it denies service to everything else.

### Evidence a later session cannot rediscover

Recorded here because the artifact is transient — the next `git stash`,
`checkout`, or reconcile pass erases it:

- working-tree blob `faee3482e5ab04b8f287d7e9fa7a4ca4d4c85646`
- identical to `db9e7f2c:intentions/tactic-attention-namespaced-rank.md`
- HEAD blob `186fb2719944b544d113193b2eb6732848037532` at `7ed6ee7a`
- file mtime `2026-08-13T18:24:57Z`; landed fix commit `6e1f5770` at 18:19:47Z
- ladder `state.json` `step=review-stall`, `status=running`, `updated_at=18:27:17Z`

This evaluator parked both dirty paths in a `git stash` (recoverable) to land its
findings, and restored `flake.lock` — an unrelated pre-existing user edit —
afterwards. The reverted node file was left in the stash rather than re-armed.

### What would have to change

Two separable things, both for the author:

1. The writer must pin the blob it read as `--base` on its landing
   `graph-commit` (the remedy `tactic-reconcile-review-stall-base-pin` already
   scopes), so a six-hour-old node is three-way-merged or refused rather than
   silently re-serialized.
2. Separately: a writer that serializes a node into the main checkout and does
   not commit it leaves a checkout-wide denial of service. Whether that is fixed
   by writing through a temp path, by rolling back on failure, or by narrowing
   `graph-commit`'s dirty-tree guard to the node set it actually touches, is the
   author's call — this entry records the exposure, not the rule.
