---
id: tactic-unit-disable-skip-silent-in-steady-state
kind: tactic
statement: "ensure_watcher_units / ensure_healer_units honor a manual-disable
  sentinel but emit NOTHING when they do so in steady state — the informational
  `skipping enable --now` line sits past an early `return 0` that fires whenever
  the installed unit files already match, so an operator cannot confirm from the
  journal that a deliberate disable is being respected, and a honored disable is
  indistinguishable from a caller that never ran the guard at all"
owner: ai
status: raw
parent: null
rationale: "Measured 2026-08-09 by running the live-host manual procedure
  recorded on tactic-ensure-units-respect-manual-disable (that node's needs-main
  residue item 12), which had been parked WAIT since 2026-08-03 awaiting an
  operator to start the experiment. THE PROCEDURE'S OWN STEP 3 states: 'Confirm
  the skip is visible, not silent: journalctl --user -t dispatch-schedule-reseed
  --since -1h | grep skipping enable --now shows the informational line, and no
  WARNING: for this unit.' MEASURED RESULT: the guard held perfectly — the timer
  stayed inactive/disabled across 50.6 minutes spanning three tick invocations
  (reseed cycles at 11:00 and 11:30 plus a heartbeat-driven tick at 11:47:55) —
  but NEITHER the informational line NOR any WARNING appeared. Zero journal
  output. THE MECHANISM, read directly from the code rather than inferred:
  lib.sh's ensure_watcher_units reads the sentinel once into `manually_disabled`
  (lib.sh:3447), then hits a steady-state hot path at lib.sh:3456-3459 —
  `if [ -f $SERVICE_PATH ] && [ $(cat $SERVICE_PATH) = $desired_service ] && [ -f
  $TIMER_PATH ] && [ $(cat $TIMER_PATH) = $desired_timer ] && { [
  $manually_disabled -eq 1 ] || is-active ...; }; then return 0; fi` — which
  returns BEFORE the logging branch at lib.sh:3532 that emits `skipping enable
  --now`. That line is therefore reachable only on the path where the unit files
  needed rewriting. On this host the installed units were unchanged since
  2026-07-31/2026-08-08, so every call took the silent path. RULED OUT, because
  it would equally have explained the silence AND undermined the experiment's
  main result: that no caller reached the guard at all. dispatch-schedule-reseed
  invokes `ensure_watcher_units \"$MAIN_WORKTREE\" || true` at line 422 (and
  dispatch-schedule-convergence-reseed at line 212), so the guard WAS reached on
  every cycle; without it the same code path falls through to `enable --now` and
  the timer would have come back within ~15-30 minutes, which is the exact
  regression tactic-ensure-units-respect-manual-disable was written to fix.
  WHY THIS MATTERS RATHER THAN BEING A COSMETIC NIT: the zero-`systemctl`
  steady-state fast path is deliberate (its own comment says 'a disabled timer
  costs zero systemctl invocations in steady state'), so this is a genuine
  tension between two design goals, not an oversight — but the consequence is
  that the ONLY operator-visible evidence a manual disable is being honored is
  the absence of re-arming, which is unobservable in the moment and
  indistinguishable from the guard being dead code, a mis-set sentinel path, or
  a caller that never ran. That is this repo's recurring silent-PASS class,
  named on tactic-self-close-reap-silent-noop: an instrument whose success is
  indistinguishable from its own absence. It also means the procedure's step 3
  is unsatisfiable as written on any host in steady state, so the next operator
  to run it will read a false negative. THE FIX DIRECTION, either limb: log the
  skip once from the hot path before returning (cheap — one `echo` to stderr, no
  `systemctl` call, preserving the zero-invocation property that motivated the
  fast path), or correct step 3's expectation to scope the informational line to
  the unit-files-changed path and give the operator a different positive signal.
  The first limb is preferred: it makes the honored disable observable rather
  than merely inferable, and the cost the fast path was protecting is
  `systemctl` invocations, not log lines."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 10
  override: null
  rationale: "Band 3 of the bootstrap three-band interim scale (50/20/10). It
    stalls nothing and the guard it audits works correctly; its cost is operator
    confidence and one unsatisfiable step in a manual procedure, not a broken
    fleet. Filed as the residual of an otherwise-passing live-host experiment so
    the observation is not lost when
    tactic-ensure-units-respect-manual-disable closes."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# A honored manual-disable is invisible in the journal

## What was measured

Running the live-host procedure on
tactic-ensure-units-respect-manual-disable (2026-08-09, this host):

| step | expectation | result |
|---|---|---|
| 1 | sentinel + `disable --now` | done 10:59:43 |
| 2 | survives ≥2 reseed cycles / ≥45 min | **PASS** — 50.6 min, still `inactive`/`disabled` |
| 3 | skip is **visible, not silent**; no `WARNING` | **FAIL on visibility** — no line, and no WARNING either |
| 4 | no collateral alarm / heal loop | **PASS** — `dispatch-heal` `result=clean` ×18 |
| 5 | healer unaffected | **PASS** — `dispatch-heal.timer` active throughout |
| 6 | re-arms after sentinel removal | **PASS** — re-armed 12:01:49, correct `WorkingDirectory` |

Only step 3 deviated. This node owns that deviation.

## The mechanism

`ensure_watcher_units` reads the sentinel once (`lib.sh:3447`), then takes a
steady-state hot path:

```
if [ -f "$SERVICE_PATH" ] && [ "$(cat "$SERVICE_PATH")" = "$desired_service" ] \
   && [ -f "$TIMER_PATH" ] && [ "$(cat "$TIMER_PATH")" = "$desired_timer" ] \
   && { [ "$manually_disabled" -eq 1 ] || "$SYSTEMCTL_CMD" --user is-active --quiet dispatch-fleet-watch.timer; }; then
  return 0
fi
```

That `return 0` precedes the logging branch at `lib.sh:3532`. So the
`skipping enable --now` line is reachable **only** when the unit files needed
rewriting. With units unchanged since 2026-07-31/2026-08-08, every call on this
host took the silent path.

## What this is not

Not "the guard never ran". `dispatch-schedule-reseed:422` and
`dispatch-schedule-convergence-reseed:212` both call
`ensure_watcher_units "$MAIN_WORKTREE" || true`. Had the guard not been
consulted, the same path falls through to `enable --now` and the timer returns
within ~15–30 min — the regression the parent node fixed. The timer stayed down
across three tick invocations, so the guard demonstrably ran and demonstrably
worked.

## Why it is worth fixing

The fast path's zero-`systemctl` property is deliberate and worth keeping. But
the only evidence an operator has that their disable is respected is the
*absence* of re-arming — unobservable in the moment, and indistinguishable from
a dead guard, a mis-set sentinel path, or a caller that never ran. That is the
silent-PASS class named on tactic-self-close-reap-silent-noop.

It also leaves step 3 of the parent's manual procedure unsatisfiable as written,
so the next operator to run it reads a false negative.

## Fix direction

Preferred: emit the skip line once from the hot path before returning. It costs
one `echo` to stderr and no `systemctl` invocation, so the property the fast
path exists to protect is preserved.

Alternative: scope step 3's expectation to the unit-files-changed path and give
the operator a different positive signal for the steady-state case.

Applies symmetrically to `ensure_healer_units` (`lib.sh:3196`, log at
`lib.sh:3281`), which has the same shape.

## Related nodes

- tactic-ensure-units-respect-manual-disable — the parent whose experiment
  produced this; its other five steps passed.
- tactic-self-close-reap-silent-noop — names the silent-PASS class this belongs
  to.
