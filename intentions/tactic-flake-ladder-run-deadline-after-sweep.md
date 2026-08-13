---
id: tactic-flake-ladder-run-deadline-after-sweep
kind: tactic
statement: Fix the flaky deadline-after-sweep row in
  test-dispatch-ladder-run.sh, which raced a whole-second START_EPOCH against a
  1s --max-run-s
owner: ai
status: codified
parent: null
rationale: "Surfaced while implementing
  tactic-review-delta-base-and-blast-radius: the ladder suite went red on a row
  unrelated to that work. Root cause is a truncated-second race, not a logic
  defect, and the same shape can recur anywhere --max-run-s is small — which is
  why it is recorded rather than just fixed. Fixed and merged in the same PR
  (#3087) as the two review tactics."
reading: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: tactic-review-delta-base-and-blast-radius
  pr: 3087
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Fix the flaky deadline-after-sweep row in test-dispatch-ladder-run.sh, which raced a whole-second START_EPOCH against a 1s --max-run-s

Fingerprint: hook-tests / unit-tests —
`.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh:1111-1123`
("the deadline is re-checked after both sweeps, before the advance").

Reproduce command: `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh`
(intermittent — the race is lost only when process startup crosses a
wall-clock second boundary).

## Root cause — a truncated second, not a logic defect

`dispatch-ladder-run:468-469` captures `START_EPOCH` as a **whole second** and
sets `DEADLINE_EPOCH = START_EPOCH + MAX_RUN_S`. `check_deadline` (`:646-648`)
halts when `now_epoch() >= DEADLINE_EPOCH`. The row ran with `--max-run-s 1`, so
the top-of-loop check at `:1053` passed **only if it landed in the same
wall-clock second as `:469`**. Because `START_EPOCH` is truncated, the usable
margin was whatever fraction of a second remained when the script started —
anywhere from ~1 s down to ~0. When startup crossed the boundary the run halted
*before* the sweeps, and the two sweep-count rows (`sweeps == 1`,
`terminal_sweeps == 1`) went red.

This is worth recording beyond the diff because the shape is general: **any**
ladder test using a small `--max-run-s` inherits it, and the failure presents as
an unrelated assertion rather than as a timeout.

## Fix — widen the margin, do not touch the assertions

`--max-run-s` 1 → 3 (comfortably past process-startup jitter) and the sweep
stub's sleep 2 → 5 so it still exhausts the budget. Every `assert_eq` line is
byte-identical; the row still proves exactly what it proved — the top-of-loop
check passes, a sweep eats the budget, and the **second** `check_deadline`
catches it before an advance starts. Net cost ≈ +3 s per suite run (the stub
sleeps in the terminal sweep only).

**Deliberately not fixed** by making `now_epoch` / `START_EPOCH` sub-second. That
is real precision, but production runs default to `MAX_RUN_S=21600`, where
truncation is irrelevant — it would be a production change made solely for a
test.

## Proved still a pin

A widened test that no longer fails when the guard is removed has been weakened,
whatever its assertions say. With the post-sweep `check_deadline`
(`dispatch-ladder-run:1070`) temporarily deleted, the suite went **red** at
"deadline-after-sweep: no advance was started past the deadline" (219/220); with
it restored, **220/220**, and `dispatch-ladder-run` was byte-identical to its
pre-experiment state. Per `.claude/rules/test-integrity.md`: no row was weakened,
skipped or deleted, and no row's meaning changed.

Confirmed green on a real GitHub runner — a different timing environment from the
development host — in PR #3087's `hook-tests` job: all five
`deadline-after-sweep` rows PASS, suite 220/220.

Merged in PR #3087 (e612e50c).
