---
id: tactic-eval-finding-eval-write-blocked-by-unrelated-main-dirt
kind: tactic
statement: Any unrelated modified tracked file in the main checkout (here the
  users own M flake.lock) makes graph-commit refuse, so dispatch-eval-finding —
  the per-phase evaluators ENTIRE write surface — fails for every finding of
  every phase, and because the evaluator is fire-and-forget and its transcript
  is discarded the whole ladders evaluation is lost silently with the driver
  never informed
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
phase: null
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
    - metric: findings_blocked_by_unrelated_dirt
      value: 4
      unit: findings
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: rsi
      measured: 2026-08-13
    - metric: graph_commit_retries_exhausted
      value: 3
      unit: attempts
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: dispatch-eval-finding
      measured: 2026-08-13
    - metric: blocking_dirty_tracked_files
      value: 1
      unit: files
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: git
      measured: 2026-08-13
    - metric: phases_at_risk_per_ladder_run
      value: 7
      unit: phases
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: rsi
      measured: 2026-08-13
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-13
---
# First sighting — tactic-attention-namespaced-rank / review / `--since 1786661088`

## Observed

`dispatch-ladder-run` spawns each per-phase evaluator with `--cwd <main-root>`,
and `/rsi` states plainly: *"Runs in the main checkout."* Its **entire write
surface is `dispatch-eval-finding`**.

The main checkout carried one unrelated modified tracked file — the user's own
in-progress nix input bump, `M flake.lock` (9 insertions, 9 deletions), present
before this ladder run began. Every `dispatch-eval-finding` call failed:

```
wrote tactic-eval-finding-eval-since-bound-excludes-worker → .../intentions/...
error: graph-commit: refusing to start — unrelated dirty tracked file(s)
       outside this call's node set:
 M flake.lock
       stash or commit these first (e.g. 'git stash -u'), then re-run
dispatch-eval-finding: graph-commit failed after 3 attempt(s)
dispatch-eval-finding: recording a recurrence ... failed; the write was rolled back
```

Three graph-commit retries, all refused on the same file. Exit 1, node file
correctly rolled back (not the exit-70 dirty-node case).

## Why this is worse than a failed write

The evaluator is spawned **fire-and-forget**. `/rsi` is explicit that "nothing
this job does can delay, gate, or change the ladder's disposition", and that
"findings that stay in this job's transcript do not exist: the graph is the sole
tracker, and this job's transcript is discarded."

So the failure mode is total and silent:

- every finding of every per-phase evaluator is voided,
- the driver never learns (it does not wait, and would not act if it did),
- the transcript that holds the analysis is then discarded,
- and the cause is a file that has nothing to do with the graph, left by anyone
  who touched the repo — a `nix flake update`, an interrupted edit, a stray
  `npm install` rewriting a lockfile.

A six-hour ladder can therefore run its full evaluation program and record
nothing, for the entire duration that one unrelated file stays dirty. The
per-phase design exists precisely because *"a run that halts used to record
nothing at all, making the most defect-rich runs the ones that produced no
review."* An unrelated dirty file reintroduces exactly that hole, and does it
across every phase at once rather than one.

It also violates the evaluator's own bounds to fix: clearing the blocker means
`git stash` on a shared checkout that a **live** ladder driver is operating in
(`state.json: pid 2993618, status running, step review-stall`) — a tree-updating
write on someone else's working files, which is outside the declared write
surface and races the driver.

## Workaround used this run (report only — not a fix)

`dispatch-eval-finding` resolves `REPO_ROOT` from its **own script location**
(`SCRIPT_DIR/../../../..`, line 179), not from cwd. So the main checkout's copy
always targets the dirty checkout no matter where it is invoked from. Invoking a
*different checkout's* copy by absolute path retargets it:

```
<clean-worktree>/.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding --slug ...
```

All four findings from this phase landed that way, off a fresh worktree, without
touching `flake.lock` or the driver's checkout.

This is a workaround, not the fix. It costs a worktree per evaluator, and it only
works because the evaluator noticed — an evaluator that took the exit-1 at face
value and reported "graph write failed" would have discarded its findings exactly
as designed.

## What would have to change

The author's call. The observation is that graph-commit's whole-checkout dirty
guard is correct for a *writer that might be mid-edit*, but the evaluator writes
exactly one node it just created and stages exactly `intentions/<id>.md`. Making
the recorder immune to unrelated dirt — a scratch checkout it owns, or a guard
scoped to the node set the call already declares (the error message literally
names the concept: *"outside this call's node set"*) — would remove a
silent-total-loss mode from the one component whose entire purpose is not to lose
observations.

## Evidence a later session cannot rediscover

- `git status --porcelain` in `/home/n8/natb1/commons.systems` at 2026-08-13:
  `M flake.lock` plus untracked `.claude/agents`, `dispatch.config/`, `ww.zip`
  (untracked does not trip the guard; the tracked modification does).
- `dispatch-eval-finding` `REPO_ROOT` resolution:
  `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding:177-179`.
- Landing worktree used:
  `.claude/worktrees/rsi-eval-namespaced-rank-review`.
- Retries before giving up: 3 (`DISPATCH_EVAL_FINDING_RETRIES` default).
