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
    - metric: blocked_ledger_writes
      value: 1
      unit: writes
      window: 2026-08-13 re-evaluation of the tactic-attention-namespaced-rank qa
        findings
      sensor: rsi
      measured: 2026-08-13
    - metric: wasted_graph_commit_attempts
      value: 3
      unit: attempts
      window: 2026-08-13 re-evaluation of the tactic-attention-namespaced-rank qa
        findings
      sensor: dispatch-eval-finding
      measured: 2026-08-13
    - metric: evaluator_stashes_on_main_stack
      value: 2
      unit: stashes
      window: main checkout stash stack, 2026-08-13 20:39 EDT
      sensor: rsi
      measured: 2026-08-13
    - metric: ladder_halt_exit_code
      value: 11
      unit: exit_code
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: post_merge_wait_before_halt_s
      value: 639
      unit: seconds
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: recurrence_count
      value: 3
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
  resolved_by: 1092a403e0000e4a4ce8ff106b892bfb32d4cdb7
---
## Second occurrence — the same file, re-armed three minutes before the write

Observed 2026-08-13 while re-evaluating the findings recorded from the `qa` phase
of `tactic-attention-namespaced-rank`. The first `dispatch-eval-finding` call of
the pass failed identically to the occurrence that minted this entry, on the same
file:

```
wrote tactic-eval-finding-eval-finding-list-misses-nonledger → intentions/...md
error: graph-commit: refusing to start — unrelated dirty tracked file(s) outside this call's node set:
 M flake.lock
       stash or commit these first (e.g. 'git stash -u'), then re-run graph-commit
dispatch-eval-finding: graph-commit failed after 3 attempt(s)
dispatch-eval-finding: recording a recurrence of ... failed; the write was rolled back to origin/main
```

`flake.lock` carries a 9-line-pair nix input update. It is unrelated to
`intentions/` by construction: the refusal names it as "outside this call's node
set" and then refuses anyway.

### What is new relative to occurrence 1 — the workaround re-arms the trap

The main checkout's stash stack, read at the moment of the failure:

```
stash@{0}: WIP on main: 039bbe11 ...                      (this pass's own)
stash@{1}: On main: rsi-eval fix-phase: parked stale db9e7f2c node revert
                    + pre-existing flake.lock to unblock ledger writes
```

`stash@{1}` is an **earlier evaluator's** workaround for this same finding: it
stashed `flake.lock` to get its ledger writes through. `flake.lock`'s mtime at
the time of this failure was 20:36:36 EDT — three minutes before the write
attempt — so the file was restored to the tree shortly before this pass ran.
Earlier ledger writes in this same pass, made while the tree was clean, had
landed without incident.

So the failure is not a static condition an operator forgot to clear. It
oscillates: each evaluator that stashes to unblock itself leaves a stash that
someone (or something) later pops, which re-arms the blocker for the next
evaluator. The workaround and the fault are the same action seen from two ends,
and the stack accumulates one entry per evaluator that hits it.

**The retry policy cannot help.** The script retried 3 times against an unchanged
precondition, then rolled back. Retries only pay off against transient
conditions; this one can only be cleared by an actor outside the evaluator.

**The rollback is clean, and that is the trap.** `intentions/` was left exactly at
`origin/main` — `git status --porcelain intentions/` is empty afterwards. An
attended session sees the stderr and can act; the fire-and-forget evaluator this
surface exists for sees nothing, writes nothing, and leaves no trace that a
finding was ever measured. The blast radius is every finding of every phase in
the window, not one write.

### How this pass got past it

`git stash push -- flake.lock`, both writes, then restore — the same move
`stash@{1}` records, and it leaves the same residue for whoever runs next.

### What would have to change

The gate's reason for existing is that `graph-commit` commits the working tree,
so an unrelated dirty file would ride along. A node-scoped commit does not need
the whole tree clean — it needs the paths it commits to be the paths it intends.
`039bbe11` ("graph-commit: add a working-tree-free commit builder, default off")
landed a builder that appears to be exactly that mechanism, still default-off;
whether enabling it dissolves this finding is the thing to check before designing
anything new. Not applied here; this is a record.

## Third occurrence — the victim is the ladder itself, and it halted at exit 11

Observed 2026-08-13T23:38:10Z on `tactic-attention-namespaced-rank`, phase
`review`, while evaluating that phase. This occurrence is materially worse than
the first two: the blocked writer was **not** `dispatch-eval-finding`. It was
`reconcile-graph-merged`, called by `dispatch-ladder-run` itself.

From the unit journal:

```
Aug 13 19:38:10 dispatch-ladder-run[3099586]: error: graph-commit: refusing to start — unrelated dirty tracked file(s) outside this call's node set:
Aug 13 19:38:10 dispatch-ladder-run[3099498]: reconcile-graph-merged: graph-commit failed
Aug 13 19:38:10 dispatch-ladder-run[3099498]: reconcile-graph-merged: rolled the apply run's node writes back to HEAD 6e804ce5
Aug 13 19:38:10 dispatch-ladder-run[2993618]: halt review throw | reconcile-graph-merged hard-errored (rc=1)
Aug 13 19:38:10 dispatch-ladder-run[2993618]: dispatch-ladder-run: halted tactic-attention-namespaced-rank (exit 11)
```

and the matching ledger line:

```json
{"ts":"2026-08-13T23:38:10Z","event":"halt","phase":"review","disposition":"throw",
 "detail":"reconcile-graph-merged hard-errored (rc=1) — a gh sense failure or a failed graph-commit; read its stderr in the journal"}
```

### Why this is a wider blast radius than occurrences 1 and 2

The recorded consequence so far has been "the evaluation is lost silently". Here
the same refusal **stopped the ladder mid-lane and left the node inconsistent**:

- PR #3075 merged cleanly at 23:27:31Z (`merge/merged` in the ledger).
- The reconcile pass that would move the node off `review` then failed.
- `origin/main:intentions/tactic-attention-namespaced-rank.md` still reads
  `phase: review` with `execution.pr: 3075` and `attempts: {}` — a merged PR
  whose node never advanced.
- The unit is no longer active. Nothing will retry; this needs a person.

So the finding's cost is not bounded by "a finding goes unrecorded". Any
graph-committing step of the dispatch chain that happens to run while the main
checkout is dirty inherits the same refusal, and the ladder converts it into a
terminal halt.

### The oscillation is directly observed this time, and it is `flake.lock` again

At 2026-08-14T00:38Z, while evaluating the halt, `git status --porcelain` on the
main checkout was clean of tracked dirt — only untracked detritus
(`dispatch.config/`, `ww.zip`, and a file literally named
`"orktree_occupancy_state() {"`, shell-quoting damage from some earlier
session), which the guard skips at `graph-commit:2973`. Eight minutes later, at
00:46Z, the first `dispatch-eval-finding` call of **this very evaluation** failed
with the identical refusal naming ` M flake.lock`.

So the file was re-armed inside an eight-minute window, with no operator action
in between. The diff is a 9-line-pair nix input bump — `claude-code-nix`
`b1656217` → `1582287f` and `home-manager` `c30c7955` → a newer rev. That is
occurrence 2's "oscillates" hypothesis confirmed by direct observation rather
than inferred from a stash stack, and it makes `flake.lock` the overwhelmingly
likely cause of the 23:38:10Z ladder halt too.

### The remedy occurrence 2 proposed is not reachable

Occurrence 2 nominated `039bbe11`'s working-tree-free commit builder as the
thing to test. It is not testable as written: `GRAPH_COMMIT_WRITER=plumbing`
**hard-dies** rather than doing anything, at `graph-commit:3063-3066`:

```
GRAPH_COMMIT_WRITER=plumbing is not wired into the landing loop yet —
build_commit_plumbing() exists and is covered by test-graph-commit.sh, but
try_land() still reads the commit off HEAD (pull --rebase, the scratch push of
HEAD:, the layer-2 rebase merge). Unset the variable (or set it to 'worktree')
to land; refusing rather than silently using the worktree writer you did not
ask for
```

`build_commit_plumbing()` carries its own note at `:1436` — "NOT CALLED BY
try_land() YET". So the builder is a landed, tested, unreachable half. Wiring
`try_land()` onto it is the actual work, and it is larger than "enable a flag":
three separate places in the landing loop read the commit off `HEAD`.

Until that lands there is **no non-destructive way for an unattended evaluator
to get past this guard.** Stashing is the only known workaround and it is
disqualified: the main checkout's stash stack is shared with every worktree and
with concurrently running sessions, so an evaluator that stashes can pop another
session's work, and occurrence 2 already documents the stash itself re-arming
the trap for the next evaluator.

### What it cost this evaluation, and how it was cleared

All five findings from the 2026-08-13 `review` phase — this recurrence and four
new entries on orchestration overhead — were blocked for the length of the
evaluation. Their bodies and impact records had to be parked in
`/tmp/claude/stea2/*.md` and `*-impact.json` and reported in prose instead. For
that interval the finding demonstrated itself: an evaluator prevented from
recording the finding that it was prevented from recording.

It was cleared only by an **author action**, on request, at
2026-08-14T02:0xZ — the author committed the bump as `958e480c`
(`flake: update claude-code-nix, home-manager, nixpkgs`). The tracked tree went
clean, the guard stopped refusing, and all five entries then landed on the first
attempt. This is the confirmation that the guard is the whole mechanism: nothing
about the findings, the bodies or the impact records changed between the failing
and succeeding calls.

**That an attended human had to be asked is the finding.** An unattended
evaluator has no such route. It cannot commit a file it does not own, it cannot
stash, and `GRAPH_COMMIT_WRITER=plumbing` hard-dies — so for the unattended case
the loss is still total and still silent.

### A second defect the clearing exposed: the post-write check reads the wrong tree

With `flake.lock` committed but not yet pushed, local `main` sat one commit ahead
of `origin/main` with a **non-intentions** change. `graph-commit` handled that
correctly and said so:

```
graph-commit: worktree HEAD is ahead of origin/main with non-intentions changes
  — rebuilding the edit on an intentions/-only base (HEAD restored on exit)
```

It reset to `origin/main`, built the node commit there, pushed it, and restored
local HEAD to the flake commit — so the node landed while the local checkout
stayed on a base that predates it. `dispatch-eval-finding`'s post-write check
then hashed the **local working-tree path** and reported:

```
fatal: could not open '.../intentions/tactic-eval-finding-<slug>.md': No such file or directory
dispatch-eval-finding: could not hash ... for post-write verification
dispatch-eval-finding: minting tactic-eval-finding-<slug> could not be verified on origin/main
```

All five entries produced this, and all five were in fact present at
`origin/main` — checked with `git show origin/main:intentions/<id>.md`. So the
message is a **false negative**, and it is false in the most dangerous
direction: it says "could not be verified on origin/main" while reading a path
that is not `origin/main` at all. A caller that trusted it would retry a
successful mint, or record a landed finding as lost.

The fix is small and matches the check's own wording: verify with
`git show origin/main:intentions/<id>.md` (or hash the pushed sha `graph-commit`
already reports in its verdict line) rather than reading the local checkout,
which `graph-commit` is explicitly entitled to leave on a different base.

Not applied here; this is a record.
