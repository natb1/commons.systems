---
id: tactic-eval-finding-halt-path-emits-no-timing-fields
kind: tactic
statement: dispatch-ladder-run writes the awaited event carrying elapsed_s,
  await_repolls and window_s on the clean aw_rc=0 branch only, so a phase ending
  in throw, stalled or unknown-graph-read emits launched and halt and nothing
  else — and halt() is exactly the path that spawns the per-phase evaluator,
  handing it the one phase whose numeric inputs were never recorded
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
    - metric: phases_launched
      value: 1
      unit: count
      window: tactic-align-review-skill ladder 2026-08-14
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: awaited_events_written
      value: 0
      unit: count
      window: tactic-align-review-skill ladder 2026-08-14
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: evals_spawned_for_phases_with_no_timing_fields
      value: 1
      unit: count
      window: tactic-align-review-skill ladder 2026-08-14
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: phase_elapsed_s_recoverable_only_from_timestamps
      value: 964
      unit: seconds
      window: tactic-align-review-skill ladder 2026-08-14
      sensor: events.jsonl launched-to-halt delta
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: events.jsonl
      measured: 2026-08-14
---
# A phase that halts emits no timing fields, so the evaluator the halt spawns is measured blind

`dispatch-ladder-run` writes the `awaited` event — the only carrier of the
`elapsed_s`, `await_repolls` and `window_s` numeric fields — on **one** branch
of the await result switch: `aw_rc == 0`
(`.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run:1344-1348`). Every
halting branch below it returns straight to `halt()` with no event of its own:

```
11) halt 11 throw   "$AW_OUT" ;;
12) halt 12 stalled "$AW_OUT — the worker stopped with no graph change; …" ;;
14) halt 14 unknown-graph-read "$AW_OUT" ;;
```

So a run whose phase ends in `throw`, `stalled` or `unknown-graph-read`
produces an `events.jsonl` containing `launched` and `halt` and nothing else.
The observed file for the 2026-08-14 `tactic-align-review-skill` ladder is
exactly that — four lines, `start` / `launched` / `halt` / `eval`, with no
`elapsed_s`, no `window_s` and no `await_repolls` anywhere in it.

## Why that is load-bearing rather than cosmetic

`halt()` deliberately spawns the per-phase evaluation the run still owes
(`spawn_phase_eval "$EVAL_LAUNCH_PHASE" "$EVAL_LAUNCH_EPOCH"`), and the skill's
own argument for that call is that *"the most defect-rich runs are exactly the
ones that halt, and a halted run that recorded nothing was the defect the
two-tier review closed."*

The two halves are inconsistent. The halt path now spawns the evaluator, but
the halt path is also the one path that writes the evaluator's numeric inputs
nowhere. `dispatch-ladder/SKILL.md` states of those three fields: *"These are
the evaluation's inputs, and **nothing else records them**."* The evaluator
spawned for a halted phase is therefore handed precisely the phase whose
figures were never written — and the fire-and-forget spawn means nothing
notices.

An evaluator can still reconstruct elapsed seconds by subtracting the
`launched` timestamp from the `halt` timestamp, but that is the "regex it out
of prose" reconstruction the structured fields were introduced to end
(`log_event`'s own header, :553), it is at whole-second ISO granularity rather
than the epoch arithmetic `elapsed_s` uses, and `await_repolls` and `window_s`
are not recoverable from the file at all — a halted phase's re-poll count and
its await budget are simply lost.

## Scope

Version-independent. The branch is identical in `de347430~1`, the revision
this ladder actually ran (`:1187`), and in HEAD (`:1397`) — `de347430` added
the terminus classification and did not touch the await switch.

Not the same finding as `fix-phase-emits-no-outcome-record`: that one is a
*phase skill* omitting a `dispatch-emit-outcome` call, fixed in `fix-checks`.
This is the *driver's* halt path skipping its own `log_event awaited`, fixed in
`dispatch-ladder-run`. Different site, different mechanism, disjoint fix.

## The shape of a fix

Emit the timing fields on every await outcome, not only the clean one — either
by hoisting the `log_event awaited` above the `case`, or by having `halt()`
carry `timing_fields` on the halt record when `LAUNCH_EPOCH` is set. The second
is the smaller change and puts the figures on the record that already exists.
