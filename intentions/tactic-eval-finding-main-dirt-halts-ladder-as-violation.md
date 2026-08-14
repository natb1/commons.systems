---
id: tactic-eval-finding-main-dirt-halts-ladder-as-violation
kind: tactic
statement: One unrelated modified intentions file in the main checkout made
  provision-node-worktree refuse its git merge --ff-only, dispatch-graph-execute
  return park-failed, and dispatch-ladder-advance route that through its failed
  catch-all arm to exit 11 — ending a 102-minute run at its first SUCCESSFUL
  phase boundary with terminus violation, the classification reserved for a
  contract breach, on a transient environment state that a restart 17 minutes
  later cleared in 37 seconds
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
  first_seen: 2026-08-14
  measured_impact:
    - metric: dirty_files_blocking_main_checkout
      value: 2
      unit: files
      window: tactic-attention-per-tier-boost-migration/align-tactics
        2026-08-14T16:54:30Z
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: main_checkout_commits_behind_origin
      value: 9
      unit: commits
      window: 2026-08-14T16:54Z main checkout
      sensor: rsi
      measured: 2026-08-14
    - metric: run_wall_clock_seconds_ended_by_halt
      value: 6152
      unit: seconds
      window: tactic-attention-per-tier-boost-migration ladder run 2026-08-14T15:11:58Z
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: phases_completed_before_halt
      value: 1
      unit: phases
      window: tactic-attention-per-tier-boost-migration ladder run 2026-08-14T15:11:58Z
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
---
# Observed on `tactic-attention-per-tier-boost-migration`, `align-tactics` phase boundary, 2026-08-14T16:54:30Z

The `align-tactics` phase **succeeded** — `verify-landed` saw `advanced` at
`origin/main`, the node moved to `phase: implement`, and the plan (four units,
sonnet/opus/sonnet/opus, with Scope / Reuse / Verification sections) is in the
node body. Seven seconds later the run halted:

```
halt align-tactics throw | throw tactic-attention-per-tier-boost-migration execute-failed
dispatch-ladder-run: halted … (exit 11, terminus violation)
```

`terminus: violation` — the classification reserved for a run that broke a
contract — on a run that did nothing wrong.

## The actual cause

Recovered from journald (it is *not* in `events.jsonl`; see
`tactic-eval-finding-ladder-halt-drops-captured-cause`):

```
provision-node-worktree: 'git merge --ff-only origin/main' failed in
/home/n8/natb1/commons.systems (the tree is dirty or diverged) — this checkout
needs a person before anything may be read from or written into it
 M intentions/tactic-invalid-state-rc-0b9860b2.md
dispatch-ladder-advance: dispatch-graph-execute exited 1 with
  'failed tactic-attention-per-tier-boost-migration park-failed'
```

**One modified node file in the main checkout ended a 102-minute ladder run at
its first successful phase boundary.** `dispatch-ladder-advance:452-455` maps
`dispatch-graph-execute`'s `failed` disposition through its catch-all `failed|*)`
arm to `throw … execute-failed`, exit 11, and `dispatch-ladder-run:1539` maps
exit 11 to `halt 11 throw`, terminus `violation`.

## Why this is not the same entry as the two neighbours

- `tactic-eval-finding-eval-write-blocked-by-unrelated-main-dirt` is about
  `graph-commit` refusing, costing the *evaluator* its write. Here the refusing
  guard is `provision-node-worktree`'s `git merge --ff-only`, and the victim is
  the ladder's forward progress.
- `tactic-eval-finding-reconcile-base-revert-blocks-main-graph-writes` is about
  the writer that *creates* the residue.

The shared root cause — the main-checkout cleanliness guard is repo-wide rather
than scoped to the paths the operation touches — argues for one fix; the
distinct scripts, distinct exit paths and distinct blast radius argue for three
entries. Merge them if the author reads it the other way.

## Two things that make the residue worse than a one-off

**The residue was pre-existing and long-lived.** `intentions/tactic-invalid-state-rc-0b9860b2.md`
was already `M` in the main checkout when this run started at 15:11:58Z and was
still `M` at 16:54Z — it blocked the checkout for the run's entire life. The
main checkout was also **9 commits behind `origin/main`** at halt time, so the
`--ff-only` would have had real work to do.

**The residue set churns while the guard is armed.** At the start of this
evaluation the dirty set was `tactic-eval-finding-ledger-has-no-retirement-actor.md`
+ `tactic-invalid-state-rc-0b9860b2.md`; minutes later it was
`tactic-eval-finding-fix-phase-emits-no-outcome-record.md` +
`tactic-invalid-state-rc-0b9860b2.md`. Other graph writers are actively leaving
and clearing residue in the shared checkout, so any ladder run's advance step is
racing a window it cannot see.

## The classification is provably wrong — the run resumed 17 minutes later

While this evaluation was still writing, the driver was restarted:

```json
{"ts":"2026-08-14T17:11:29Z","event":"start","phase":null,"disposition":"running", …}
{"ts":"2026-08-14T17:12:06Z","event":"launched","phase":"implement","disposition":"launched","detail":"kind=tactic skill=/implement"}
```

Nothing about the node changed between the halt and the restart — it was at
`phase: implement` both times. The only thing that changed was the main
checkout's cleanliness. A condition that a plain re-run clears once the tree is
tidy is `idle`, not `violation`; the ladder's most severe terminus was spent on
a transient environment state, and 37 seconds of restart recovered what the
halt had classified as a contract breach.

## What would have to change

Three separable candidates, recorded for the author — this evaluator writes no
orchestration rule:

1. Scope `provision-node-worktree`'s dirty-tree gate to the paths the
   fast-forward actually touches, so unrelated `intentions/*.md` residue does
   not deny service.
2. Give `dispatch-graph-execute`'s `park-failed`/`failed` disposition its own
   arm in `dispatch-ladder-advance` rather than the `failed|*)` catch-all, so a
   recoverable environment condition is not reported as a contract violation.
   A run halted by main-checkout dirt is `idle`-shaped: the node is intact,
   correctly at its next phase, and re-runnable the moment a person clears the
   file.
3. Have something sweep or report stale `intentions/*.md` residue in the main
   checkout, since three separate ledger entries now trace back to it.
