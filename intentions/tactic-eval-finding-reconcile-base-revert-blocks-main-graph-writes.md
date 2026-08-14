---
id: tactic-eval-finding-reconcile-base-revert-blocks-main-graph-writes
kind: tactic
statement: A graph writer that mutates intentions/<id>.md on disk and then fails
  to commit leaves the write in place with nothing to roll it back, and one
  uncommitted node file trips graph-commit dirty-tree guard for every writer in
  that checkout — so an unrelated dirty file becomes self-sustaining, each tick
  failed write leaking another node file on top until a human clears it
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
    - metric: diagnosis_corrections
      value: 1
      unit: corrections
      window: entry corrected 2026-08-14 by the e6421e6c investigation
      sensor: rsi
      measured: 2026-08-14
  resolved_by: 1092a403e0000e4a4ce8ff106b892bfb32d4cdb7
---
## A failed graph write left its node file on disk, and one dirty file bricked the whole checkout

Observed 2026-08-13 while evaluating the `fix` phase of
`tactic-attention-namespaced-rank`. **Corrected 2026-08-14** — the original
diagnosis named the wrong writer and the wrong mechanism, and the correction is
recorded below rather than silently overwritten, because the reasoning error is
itself the reusable lesson.

The occurrence: the evaluator's own ledger write failed.

```
error: graph-commit: refusing to start — unrelated dirty tracked file(s) outside this call's node set:
 M flake.lock
 M intentions/tactic-attention-namespaced-rank.md
dispatch-eval-finding: graph-commit failed after 3 attempt(s)
dispatch-eval-finding: recording a recurrence of ... failed; the write was rolled back to origin/main
```

## What actually happened

`graph-select-target`'s `--clear-fix` arm, inside `_gate_fix_active`, mutated
`intentions/tactic-attention-namespaced-rank.md` on disk, then failed to commit
it. Nothing rolled the write back, and the failing `_graph_commit_fix` swallowed
all output, so the cause never reached the journal. The journal names the event
at the exact second of the file mtime (local time; `18:24:57Z` = `14:24:57-04:00`):

```
14:24:57.631 dispatch-ladder-run[2082464]: graph-select-target: fix-clear-commit-failed
```

That event is emitted at exactly one place, reached only after `_apply_fix
--clear-fix` has already written the file.

The condition was **self-sustaining**. The checkout was already dirty with an
unrelated `M flake.lock` from 13:53 local onward, firing `graph-commit`'s refusal
about every 70 seconds. `flake.lock` bricked every `graph-commit`; every
subsequent tick's fix gate then leaked another dirty node file on top. One leak
per tick, until a human cleared it — the checkout-wide outage this entry measured.

## The refuted claim, and the reasoning error behind it

The original body asserted that a writer holding a **six-hour-stale in-memory
node** re-serialized it into the main checkout, erasing the `reviewed` marker and
the `execution.fix` block that `graph-commit 6e1f5770` had landed five minutes
earlier. That is **refuted**.

The evidence that produced it was a blob-hash identity: the working-tree copy
hashed to `faee3482e5ab04b8f287d7e9fa7a4ca4d4c85646`, byte-identical to
`intentions/tactic-attention-namespaced-rank.md` at `db9e7f2c` — which is also
exactly the `base_sha` recorded in the review-phase worker's own
`dispatch.outcome.v1` object. Two independent-looking facts agreeing on one
stale-write story.

They are one fact. `apply-fix-state.ts --clear-fix` writes `execution.fix = null`
**and** strips the `reviewed` marker — precisely and only the two fields that had
changed since `db9e7f2c`. So a fresh, current `--clear-fix` write reproduces the
old blob byte for byte. The hash coincidence is what pointed the evaluator at a
stale base; the write was current.

The generalizable error: **identical content was read as identical provenance.**
A blob hash proves what a file contains, never who wrote it or when. Where a
writer's mutation is confined to the same fields that a prior transition changed,
content-identity with an old commit is the *expected* result of a current write,
not evidence of a stale one. The corroborating `base_sha` match was not
independent confirmation — it pointed at the same two fields.

Consequences of the correction:

- A `--base` compare-and-swap pin **would not have prevented this**. The write
  was current; the commit refused to start. This occurrence is therefore no
  longer evidence for `tactic-reconcile-review-stall-base-pin`, whose own case
  rests on `tactic-reconcile-park-clobber`'s measured 8 park erasures across 5
  nodes in one 24h window and is unaffected.
- The `stale_base_age_h` metric this entry carried was withdrawn when the
  diagnosis was corrected.

## What survived, and what shipped

The second half of the original finding stands unchanged and is what was fixed: a
writer that mutates a node file and does not commit it leaves a **checkout-wide
denial of service**, because `graph-commit`'s dirty-tree guard refuses to start
for *every* writer in that checkout, whatever node it targets. The blast radius is
not the one node that was clobbered.

Resolved by `1092a403` (#3090), commit `e6421e6c`:

- `.claude/skills/dispatch-propagate/scripts/lib-graph-rollback.sh` (new) holds
  the one correct rollback, `graph_rollback_node_writes` — restore to HEAD, with
  the moved-HEAD classification (ordinary rollback / landed park / unpushed park
  kept / un-landed non-park commit discarded-or-refused). It was taken verbatim
  from `reconcile-graph-merged`'s `restore_node_files`; the drift between
  per-writer copies *was* this finding, so there is now one implementation.
- `graph-select-target` pins HEAD before, and rolls back after, a failed land at
  all five write+land sites: `--set-fix`, `--clear-fix` (the observed leak),
  `--set-conflict`, `--spend-attempt`, `--clear-conflict-guarded`
  (`graph-select-target:564`).
- `reconcile-graph-review-stall` was still restoring a captured `origin/main`
  blob, which leaves the tree dirty when the checkout lags `origin/main`;
  migrated to the shared primitive (`:154`).
- `reconcile-graph-merged`'s `restore_node_files` is now a two-line delegation
  (`:266`).

`test-graph-write-rollback.sh` 17/17. Case 11 drives `graph-select-target`
end-to-end with a real `apply-fix-state.ts --clear-fix` and a failing
`graph-commit`, asserting a clean tree; case 11b re-runs the same fixture with the
rollback neutered and asserts it *does* leak — which caught a vacuous first
version of case 11.

## Neighbours

- `tactic-eval-finding-eval-write-blocked-by-unrelated-main-dirt` — the same
  guard, viewed from the victim: the evaluator's entire write surface fails, and
  because the evaluator is fire-and-forget its transcript is discarded.
- `tactic-eval-finding-main-dirt-halts-ladder-as-violation` — the same residue
  refusing `provision-node-worktree`'s `git merge --ff-only`, halting a ladder run
  as a terminus violation.

This entry is the writer that *creates* the residue; those two are what the
residue then costs. The shared root cause — a main-checkout cleanliness guard
that is repo-wide rather than scoped to the paths the operation touches — argues
for one fix; the distinct scripts and blast radii argued for three entries.
