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
    - metric: recurrence_count
      value: 2
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
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
