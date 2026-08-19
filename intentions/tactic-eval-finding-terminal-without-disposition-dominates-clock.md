---
id: tactic-eval-finding-terminal-without-disposition-dominates-clock
kind: tactic
statement: Neither phase of the run declared a node-terminal marker, so each
  finished phase stayed registered until terminal_without_disposition_sweep
  freed it — and because dispatch-ladder-advance refuses to launch against a
  registered session, 4770s of the 9644s run (49.5 percent) elapsed after the
  phase work was already public at origin/main, 4290s of it on align-tactics
  alone, whose model work took only 1850s
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
clarifications:
  - question: This /rsi ledger entry measured the cost but deliberately abstained
      from proposing a remediation, leaving three candidate shapes. Which is
      ratified, and what does this node retain?
    answer: "(Ruled by the author in a 2026-08-19 /office-hours sitting over the PR2
      park cohort.) SHAPE (ii): keep the gate, route the repair to the existing
      per-skill declaration family, and reduce this node to the cross-phase
      measurement it already carries. Consequences, so a later reader does not
      re-litigate them. (1) dispatch-ladder-advance's exit-13 refusal against a
      registered-but-terminal holder STANDS as designed — its guarding comment
      ('auto-releasing another session's claim is a policy act, and this driver
      may sequence, never gate') is ratified, not merely tolerated. Candidate
      (b), relaxing it, is refused. (2) The remediation lives in the per-skill
      node-terminal declaration family under the sibling strategy
      strategy-graph-native-dispatch —
      tactic-align-tactics-mark-terminal-skipped (PR #3047),
      tactic-qa-fix-node-terminal-declaration,
      tactic-qa-main-node-terminal-declaration — and NOT here. Planning it here
      would record the same root-cause defect on a second tactic, which
      strategy-recursive-self-improvement's own success_signal forbids in terms,
      and would place an orchestration repair under a strategy whose statement
      is 'measurement, not a second orchestrator'. (3) Candidate (iii), having
      the ladder driver run terminal_without_disposition_sweep on its own
      cadence after a halt, was considered and not taken in this sitting. (4)
      This node retains its measurement and nothing else: 49.5% of a 9644s run
      elapsed after the work was already public; 3092s of the 4290s
      align-tactics block elapsed with the phase finished and no actor at all;
      the invalid-state lane then spent a further 1196s on a node whose work was
      already at origin/main. The dominant term is the sweep's INVOCATION
      CADENCE once the driver had halted (falling back to the fleet tick's
      ~15-minute heartbeat) plus the invalid-state hop — not the 300s
      DISPATCH_TERMINAL_DISPOSITION_GRACE_S floor, so tuning the grace/cadence
      knobs is not a remediation path. (5) ONE INVESTIGATION REMAINS OWED
      regardless of shape, and is unplanned as of this ruling: establish which
      write path the 2026-08-14 align-tactics round actually took.
      land-align-round --terminal had shipped 2026-08-05 and
      align-tactics/SKILL.md:353-380 already mandated the marker, so this is NOT
      a missing-instruction gap; the live candidates are an exit-12 no-claim
      path, a graph-commit park whose own push failed (documented as writing no
      marker BY DESIGN), a batch/strategy-mode land, or a session that died
      before reaching the land at all."
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
    - metric: phases_declaring_a_node_terminal_marker
      value: 0
      unit: phases
      window: tactic-attention-per-tier-boost-migration ladder run 2026-08-14, both
        phases (align-tactics, implement)
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: run_seconds_after_phase_work_was_already_complete
      value: 4770
      unit: seconds
      window: tactic-attention-per-tier-boost-migration ladder run
        2026-08-14T15:11:58Z-17:52:42Z
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: share_of_total_run_wall_clock_spent_blocked_post_completion
      value: 49.5
      unit: percent
      window: tactic-attention-per-tier-boost-migration ladder run 2026-08-14, 4770s
        of 9644s
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: share_of_align_tactics_phase_spent_blocked_post_completion
      value: 69.9
      unit: percent
      window: tactic-attention-per-tier-boost-migration align-tactics phase
        2026-08-14, 4290s of 6140s
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
---
# Observed across the whole `tactic-attention-per-tier-boost-migration` ladder run, 2026-08-14T15:11:58Z–17:52:42Z

This is a **cross-phase** finding: each phase's own evaluator sees only its own
elapsed-against-window number, which looks like a slow phase. Only the whole run
shows that the same mechanism fired on *every* phase and accounts for half the
ladder's wall clock.

## What was measured

Neither phase of this run declared a `node-terminal` marker — 0 of 2. Both ended
*terminal-without-disposition*, and in both cases the phase's actual work was
already public at `origin/main` before the driver could act on it.

| phase | launched | work public at `origin/main` | driver acted | blocked after completion |
| --- | --- | --- | --- | --- |
| `align-tactics` | 15:12:03Z | 15:42:53Z | 16:54:23Z | **4290s** (69.9% of the phase's 6140s) |
| `implement` | 17:12:06Z | ~17:44:42Z | 17:52:42Z | **480s** (19.7%) |

Whole-run accounting of the 9644s between the first `start` and the final `halt`:

- phase work — 3806s (39.5%)
- blocked after the phase's work was already complete — **4770s (49.5%)**
- attended diagnosis gap between the two driver runs — 1019s (10.6%)
- `ci-wait` — 0s; `grace-wait` — 0s (the reconcile pass was never reached)

## The mechanism

`dispatch-ladder-await` is no longer blind to the completion — the fix behind
`ladder-await-completion-gated-on-session-reap` landed, and the journal shows
the driver *knowing* it is finished and deliberately waiting:

```
dispatch-ladder-await: tactic-attention-per-tier-boost-migration reached
'advanced' at origin/main while its session was still registered (state
'working'). NOT reported yet — the worker still owns the node's worktree until
it exits, and dispatch-ladder-advance refuses to launch the next phase against a
registered session (exit 13). Polling on until the row is reaped
```

So the residual cost is not detection, it is **de-registration**. A worker that
never writes a `node-terminal` marker is held alive by `dispatch-stop.sh`, and
the only thing that frees it is `terminal_without_disposition_sweep`, gated on
`DISPATCH_TERMINAL_DISPOSITION_GRACE_S` (300s) of idle. On `align-tactics` that
floor was not even the dominant term: 3092s elapsed with the phase finished and
no actor at all before the sweep routed the node to the invalid-state lane, and
that lane then ran its own 1196s session on a node whose work was already
landed.

This is why the two entries below are **distinct** from this one and are not
re-recorded here:

- `ladder-await-completion-gated-on-session-reap` (retired) — await never asked
  `origin/main`. Fixed; this run proves detection now works and the wait remains.
- `main-dirt-halts-ladder-as-violation` / `ladder-halt-drops-captured-cause` —
  both already record *this same run's* first halt, landed by the per-phase
  evaluator. Re-recording them would double-count one occurrence.

## Why it is worth an entry

The per-phase evaluator cannot see this. It compares one phase's `elapsed_s`
against `window_s` and reports a phase that overran its window — which reads as
"align-tactics is slow" when in fact `/align-tactics` finished in 1850s, well
inside the 1800s-window's re-poll budget, and the other 4290s was the ladder
waiting on a registry row. The correct reading is only available across phases,
and it says the ladder's dominant cost on this run was not model work.

It also compounds with the halt taxonomy: the 3092s hold is precisely the window
in which the driver's own sweep wrote the invalid-state occurrence append that
was then left uncommitted in the shared main checkout — the dirt that caused
halt 1 (`main-dirt-halts-ladder-as-violation`, terminus `violation`). The
undeclared disposition did not merely cost time; it manufactured the state that
ended the run.

## Not applied

Per the skill, this records a measurement; it proposes no orchestration rule.
The obvious candidates — having each node-lane skill write its own
`node-terminal` marker on the success path, or letting `advance` proceed against
a registered-but-`done` session — are the author's call, not this evaluator's.
