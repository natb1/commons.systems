---
id: tactic-unit-disable-skip-silent-in-steady-state
kind: tactic
statement: ensure_watcher_units / ensure_healer_units honor a manual-disable
  sentinel but emit NOTHING when they do so in steady state — the informational
  `skipping enable --now` line sits past an early `return 0` that fires whenever
  the installed unit files already match, so an operator cannot confirm from the
  journal that a deliberate disable is being respected, and a honored disable is
  indistinguishable from a caller that never ran the guard at all
owner: ai
status: codified
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
  (lib.sh:3447), then hits a steady-state hot path at lib.sh:3456-3459 — `if [
  -f $SERVICE_PATH ] && [ $(cat $SERVICE_PATH) = $desired_service ] && [ -f
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
  regression tactic-ensure-units-respect-manual-disable was written to fix. WHY
  THIS MATTERS RATHER THAN BEING A COSMETIC NIT: the zero-`systemctl`
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
  `systemctl` invocations, not log lines. Finalized 2026-08-10 via
  /align-tactics: the align-tactics Workflow's drift review found no Side A/B
  blocker (the strategy's sole recorded condition and every clarification remain
  intact) and authored the full plan below, preferring the log-the-skip limb."
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
  rationale: Band 3 of the bootstrap three-band interim scale (50/20/10). It
    stalls nothing and the guard it audits works correctly; its cost is operator
    confidence and one unsatisfiable step in a manual procedure, not a broken
    fleet. Filed as the residual of an otherwise-passing live-host experiment so
    the observation is not lost when tactic-ensure-units-respect-manual-disable
    closes.
  tier: 1
phase: implement
execution:
  branch: tactic-unit-disable-skip-silent-in-steady-state
  pr: 3059
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# A honored manual-disable is invisible in the journal

## Context

`ensure_healer_units` and `ensure_watcher_units`
(`.claude/skills/dispatch-propagate/scripts/lib.sh`) honor a per-unit
manual-disable sentinel — an operator-created marker file that tells reseed
"leave this systemd timer alone" — but in steady state they honor it in total
silence. The operator gets no journal evidence at all that their disable is
being respected.

### What was measured

Running the live-host procedure recorded on
`tactic-ensure-units-respect-manual-disable` (2026-08-09, the dispatch host):

| step | expectation | result |
|---|---|---|
| 1 | sentinel + `disable --now` | done 10:59:43 |
| 2 | survives ≥2 reseed cycles / ≥45 min | **PASS** — 50.6 min, still `inactive`/`disabled` |
| 3 | skip is **visible, not silent**; no `WARNING` | **FAIL on visibility** — no line, and no WARNING either |
| 4 | no collateral alarm / heal loop | **PASS** — `dispatch-heal` `result=clean` ×18 |
| 5 | healer unaffected | **PASS** — `dispatch-heal.timer` active throughout |
| 6 | re-arms after sentinel removal | **PASS** — re-armed 12:01:49, correct `WorkingDirectory` |

Only step 3 deviated. This node owns that deviation.

### The mechanism

`ensure_watcher_units` reads the sentinel once into `manually_disabled`
(`lib.sh:3447`), then takes a steady-state hot path at `lib.sh:3456-3460`:

```bash
if [ -f "$SERVICE_PATH" ] && [ "$(cat "$SERVICE_PATH")" = "$desired_service" ] \
   && [ -f "$TIMER_PATH" ] && [ "$(cat "$TIMER_PATH")" = "$desired_timer" ] \
   && { [ "$manually_disabled" -eq 1 ] || "$SYSTEMCTL_CMD" --user is-active --quiet dispatch-fleet-watch.timer; }; then
  return 0
fi
```

That `return 0` (`lib.sh:3459`) precedes the informational logging branch at
`lib.sh:3529-3534`. So the `skipping enable --now` line is reachable **only**
on the path where the unit files needed rewriting. With the installed units
unchanged since 2026-07-31/2026-08-08, every call on this host took the silent
path. `ensure_healer_units` has the identical shape: sentinel read at
`lib.sh:3196`, hot path `lib.sh:3205-3209` (`return 0` at `:3208`),
informational line at `lib.sh:3278-3283`.

### What this is not

Not "the guard never ran". `dispatch-schedule-reseed:422` and
`dispatch-schedule-convergence-reseed:212` both call
`ensure_watcher_units "$MAIN_WORKTREE" || true`. Had the guard not been
consulted, the same path falls through to `enable --now` and the timer returns
within ~15–30 min — the exact regression
`tactic-ensure-units-respect-manual-disable` was written to fix. The timer
stayed down across three tick invocations, so the guard demonstrably ran and
demonstrably worked.

### Why it is worth fixing rather than a cosmetic nit

The zero-`systemctl` steady-state fast path is deliberate — its own comment
(`lib.sh:3200-3204`, `:3451-3455`) says "The manually-disabled test comes first
so a disabled timer costs zero `systemctl` invocations in steady state". So
this is a genuine tension between two design goals, not an oversight. But the
consequence is that the only operator-visible evidence a manual disable is
being honored is the *absence* of re-arming — unobservable in the moment, and
indistinguishable from a dead guard, a mis-set sentinel path, or a caller that
never ran. That is this repo's recurring silent-PASS class, named on
`tactic-self-close-reap-silent-noop`: an instrument whose success is
indistinguishable from its own absence.

It also leaves step 3 of the parent's manual procedure
(`intentions/tactic-ensure-units-respect-manual-disable.md:593-596`)
unsatisfiable as written on any host in steady state, so the next operator to
run it reads a false negative.

### Intended outcome

Log the skip once from the hot path before returning. The cost the fast path
exists to protect is `systemctl` invocations, not log lines: one `echo` to
stderr preserves the zero-invocation property exactly. The message deliberately
keeps the substring `skipping enable --now`, so the parent's recorded step-3
grep becomes satisfiable **verbatim** and no edit to that (done) node is
needed. The alternative limb — weakening step 3's expectation to the
unit-files-changed path — is rejected: it makes the honored disable merely
inferable rather than observable.

---

## Unit 1 — emit the skip notice from the steady-state hot path (both twins)

### Greenfield design

One shared message-emitter next to the existing shared sentinel reader, called
from all four sites (two hot paths, two cold paths). The doctrine already
recorded in this code — "One implementation, called from thin per-installer
sites … so the check cannot be fixed for one timer and missed for its
structurally identical twin" (`lib.sh:2797-2800`), echoed at
`lib.sh:3317-3328` — applies to the *notice* for the same reason it applies to
the *check*: a message duplicated inline at four sites drifts. Collapsing the
existing two inline messages into the helper is part of this unit, not a
follow-up.

### Scope

File: `.claude/skills/dispatch-propagate/scripts/lib.sh`

**1a. Add the helper** immediately after `unit_manually_disabled`, which closes
at `lib.sh:2830` (its body spans `:2808-2830`; the doc comment above it starts
at `:2793`). Insert, with a comment in the surrounding house style:

```bash
# Emit the ONE informational line that makes an honored manual disable visible
# in the journal. NOT a WARNING and NOT an error — this is the requested state,
# and the caller's `|| true` must not be the only thing separating "we did what
# you asked" from "something went wrong". Callers that merely return silently
# leave the operator no in-the-moment evidence at all, which is
# indistinguishable from a dead guard or a caller that never ran.
#
# One implementation for all four call sites (both installers' steady-state and
# unit-files-updated paths), for the same reason unit_manually_disabled above is
# shared: the message cannot drift between structurally identical twins.
#
# The trailing `skipping enable --now` wording is load-bearing — the recorded
# operator procedure greps for exactly that substring — so $detail varies but
# the suffix does not.
#
# Args: $1 = caller name, $2 = timer unit name, $3 = state detail phrase
# Always returns 0.
unit_disable_skip_notice() {
  local caller="$1"
  local unit="$2"
  local detail="$3"
  echo "$caller: $unit is marked manually disabled ($(dispatch_unit_disable_sentinel_path "$unit")); $detail, skipping enable --now" >&2
  return 0
}
```

`dispatch_unit_disable_sentinel_path` is called unguarded, exactly as the two
existing inline sites already call it (`lib.sh:3281`, `:3532`). This is safe
and must NOT be wrapped in a `declare -f` guard: every call site runs only when
`manually_disabled -eq 1`, which is only set after `unit_manually_disabled`
returned 0, which itself can only happen after `lib-unit-disable-state.sh` was
successfully sourced (`lib.sh:2812-2818`). Adding a fallback here would be the
defensive-fallback anti-pattern the repo's code-style rule forbids.

**1b. `ensure_healer_units` hot path** (`lib.sh:3205-3209`). Leave the
condition itself untouched; add the notice inside the `then` block, before the
existing `return 0` at `:3208`:

```bash
     && { [ "$manually_disabled" -eq 1 ] || "$SYSTEMCTL_CMD" --user is-active --quiet dispatch-heal.timer; }; then
    # Report a honored disable even on the zero-`systemctl` path. The
    # short-circuit above means `manually_disabled` is the only leg that can be
    # true without an is-active probe having run, so re-testing it here costs
    # nothing and does NOT re-read the sentinel — the single-read invariant
    # documented at :3193-3195 is preserved.
    if [ "$manually_disabled" -eq 1 ]; then
      unit_disable_skip_notice ensure_healer_units dispatch-heal.timer "unit files already current"
    fi
    return 0
  fi
```

The re-test is required, not redundant: the hot path is also reached on the
`is-active` leg with no sentinel present, and that leg must stay silent.

**1c. `ensure_watcher_units` hot path** (`lib.sh:3456-3460`). Byte-parallel
edit with the watcher's names: caller `ensure_watcher_units`, unit
`dispatch-fleet-watch.timer`, same `"unit files already current"` detail,
before the `return 0` at `:3459`.

**1d. Collapse the two existing inline cold-path messages onto the helper**, so
one emitter owns the wording:

- `lib.sh:3281` becomes
  `unit_disable_skip_notice ensure_healer_units dispatch-heal.timer "unit files updated"`
- `lib.sh:3532` becomes
  `unit_disable_skip_notice ensure_watcher_units dispatch-fleet-watch.timer "unit files updated"`

Keep the surrounding comments (`lib.sh:3276-3279`, `:3527-3530`) and the
`return 0` in each block. The rendered text must be **byte-identical** to
today's cold-path message — verify by eye against `lib.sh:3281` / `:3532`
before and after; existing test 5a greps it.

**1e. Test updates** — `.claude/skills/dispatch-propagate/scripts/test-lib-systemd-units.sh`.
The existing 5b sub-cases currently assert the silence is fine and provide zero
coverage of the visibility gap:

- Healer 5b at `:851-866`. Line `:864` currently reads
  `) >/dev/null 2>&1 || ehl_5b_rc=$?` — discarding stderr. Change it to capture:
  declare `ehl_5b_err="$ehl_tmp/5b-stderr"` alongside `ehl_5b_rc=0` at `:855`,
  then `) >/dev/null 2>"$ehl_5b_err" || ehl_5b_rc=$?`.
- **Keep both existing assertions** at `:865-866` unchanged — especially
  `"5b: stub log empty (no daemon-reload/enable/is-active call)"`, which is the
  ratchet that the notice did not cost a `systemctl` invocation.
- Append four assertions in the exact `TOTAL`/`PASS`/`FAIL` grep shape already
  used by 5a at `:833-847`:
  1. `grep -q 'skipping enable --now' "$ehl_5b_err"` — the substring the
     operator procedure greps for.
  2. `grep -q 'unit files already current' "$ehl_5b_err"` — proves the message
     came from the hot path, not a cold-path fall-through (this is the
     assertion that would have caught the bug).
  3. `grep -qF "$ehl_disable_dir/dispatch-heal.timer" "$ehl_5b_err"` — the
     message names the actual sentinel file the operator created. Use `-F`:
     the path contains no regex metacharacters today but is interpolated.
  4. `! grep -q 'WARNING' "$ehl_5b_err"` — an honored disable is not a warning.
- Watcher 5b at `:1235-1250`: identical edits with the `ewa_` prefix,
  `ewa_5b_err`, unit `dispatch-fleet-watch.timer`, and
  `"$ewa_disable_dir/dispatch-fleet-watch.timer"`.
- Do **not** touch 5a, 5c, or 5d in either suite; 5a's
  `grep -q 'skipping enable --now'` at `:839` / `:1223` is the regression guard
  that 1d preserved the cold-path wording.

### Out of scope

- The hot-path condition itself. Do not move the `manually_disabled` test after
  the `is-active` probe, and do not remove the short-circuit — the
  zero-`systemctl` property at `lib.sh:3200-3204` / `:3451-3455` is the point.
- Rate-limiting or once-per-boot de-duplication of the notice. Each caller is a
  separate short-lived process, so "once per call" already is "once per
  process"; on the current cadence (reseed every ~30 min plus the 15-min
  heartbeat tick) that is a handful of lines per hour, and only while an
  operator disable is actually in place.
- The other installers. `ensure_recover_unit` (`lib.sh:2713`),
  `ensure_sweep_timer` (`lib.sh:2961`) and `ensure_heartbeat_units`
  (`lib.sh:3719`) never consult the sentinel at all — a manual disable of those
  timers is silently re-armed. That is a different defect (a missing guard, not
  a silent one) and belongs to its own tactic; do not add the guard here.
- Any edit to `intentions/tactic-ensure-units-respect-manual-disable.md`. Its
  step-3 grep (`:593-596`) becomes satisfiable verbatim because 1b/1c keep the
  `skipping enable --now` substring. That node is `phase: done`; leave it alone.
- Any graph write of any kind from the implementing session.

### Recommended model

sonnet

---

## Unit 2 — document the operator-visible confirmation in the sentinel lib header

### Scope

File: `.claude/skills/dispatch-propagate/scripts/lib-unit-disable-state.sh`

The header block already carries the operator procedure — "disable a timer so
reseed stops re-arming it" and "Re-enable" — at `:63-77`. It tells the operator
how to set the sentinel but not how to confirm it is being honored, which is
the gap this tactic closes. Add a third short stanza immediately after the
"Re-enable" lines (`:73-75`), in the same comment style:

```
# Confirm a disable is being honored (works in steady state, not only on the
# reseed cycle that rewrites the unit files):
#   journalctl --user -t dispatch-schedule-reseed --since '-1h' | grep 'skipping enable --now'
#   # → "...is marked manually disabled (<sentinel path>); unit files already
#   #    current, skipping enable --now"   — and NO `WARNING:` for this unit.
# Only ensure_healer_units and ensure_watcher_units consult this sentinel; the
# other ensure_*_units installers in lib.sh do not.
```

Comment-only change; no executable line moves. Keep every existing header line
intact — the tri-state rationale (`:16-22`) and the `set -u` divergence note
(`:79-88`) are load-bearing.

### Out of scope

Restating the tri-state contract, or any behavior change in this file.

### Dependencies

Unit 1 (the quoted message text must match what Unit 1 actually emits).

### Recommended model

sonnet

---

## Reuse

- `.claude/skills/dispatch-propagate/scripts/lib.sh:2793-2830` —
  `unit_manually_disabled(unit, caller)`. Already reads the tri-state sentinel
  once per call for both installers; the new helper goes directly after it and
  the new log branches read the existing `manually_disabled` local. No new
  state-reading logic, and the single-read invariant documented at
  `lib.sh:3193-3195` / `:3444-3446` stays intact.
- `.claude/skills/dispatch-propagate/scripts/lib-unit-disable-state.sh:93-101` —
  `dispatch_unit_disable_sentinel_path(unit)`. Prints the absolute sentinel
  path; already interpolated by the two cold-path messages. The helper calls it
  once, so all four messages name the real file.
- `.claude/skills/dispatch-propagate/scripts/lib.sh:3278-3283` and `:3529-3534` —
  the existing cold-path `skipping enable --now` lines and their
  "NOT a WARNING and NOT an error" comments. Source of the message shape and of
  the non-WARNING framing the new steady-state line must keep.
- `.claude/skills/dispatch-propagate/scripts/test-lib-systemd-units.sh:808-847`
  (healer 5a) and `:1192-1231` (watcher 5a) — the stderr-capture idiom
  (`2>"$ehl_5a_err"`) and the `TOTAL`/`PASS`/`FAIL` grep-assertion shape the new
  5b assertions must copy. `assert_eq` and the recording `systemctl` stub come
  from `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh`,
  sourced at the top of the suite.
- `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:183-200` — the
  `--pr-scripts` lane runs every `test-*.sh` under the scripts dir, so no CI
  wiring is needed for the updated suite.

## Verification

Run the touched suite directly (fast, self-contained — it stubs `systemctl` and
pins `DISPATCH_UNIT_DISABLE_DIR` to scratch dirs, so it touches no real user
units):

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-systemd-units.sh
```

Run the sentinel-reader suite, which owns
`dispatch_unit_disable_sentinel_path`'s contract, to confirm the new caller did
not perturb it:

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-unit-disable-state.sh
```

Run the full dispatch-script lane, since `lib.sh` is sourced by every script in
it:

```verify
.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh --pr-scripts
```

Lint the changed shell:

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh --prose
```

**Pre-fix control (manual, do this before writing Unit 1's code).** Apply only
the Unit 1e test edits and run
`.claude/skills/dispatch-propagate/scripts/test-lib-systemd-units.sh`. The four
new 5b assertions must FAIL in both suites. A test suite that passes before the
fix is not testing the fix — this is the silent-PASS class this tactic is about,
and the plan would reproduce it if the control is skipped. Then apply the code
and confirm they pass.

**Post-merge live-host check (needs main; this is the parent procedure's step 3,
re-run).** Requires the dispatch host with a live `systemd --user` session and a
real reseed cycle, so it cannot run in CI or a worktree:

1. `mkdir -p ~/.local/share/commons-dispatch/disabled && touch ~/.local/share/commons-dispatch/disabled/dispatch-fleet-watch.timer && systemctl --user disable --now dispatch-fleet-watch.timer`
2. Wait for at least one reseed cycle or heartbeat tick to land (≤30 min) — the
   unit files will already be current, so this exercises exactly the hot path
   that was silent.
3. `journalctl --user -t dispatch-schedule-reseed --since '-1h' | grep 'skipping enable --now'`
   must now show the line, containing `unit files already current` and the
   sentinel path, with no `WARNING:` for this unit. Also check
   `-t dispatch-tick` for the heartbeat-driven invocation.
4. Confirm the guard still holds: `systemctl --user is-active dispatch-fleet-watch.timer`
   still `inactive`, `is-enabled` still `disabled`.
5. Clean up: `rm ~/.local/share/commons-dispatch/disabled/dispatch-fleet-watch.timer`,
   then confirm the next cycle re-arms the timer (or
   `systemctl --user enable --now dispatch-fleet-watch.timer`). Leaving the
   sentinel in place would keep the fleet watchdog down.

Judgment call for the reviewer: the notice now repeats on every invocation while
a sentinel is present. If the observed volume on the live host reads as noise
rather than evidence, that is a finding to record — not a reason to revert to
silence, which is the defect this node fixes.

## Related nodes

- `tactic-ensure-units-respect-manual-disable` — the parent whose live-host
  experiment produced this; its other five steps passed. `phase: done`; this
  plan deliberately requires no edit to it.
- `tactic-self-close-reap-silent-noop` — names the silent-PASS class this
  belongs to.

## needs-main residue

Filed by `/qa-fix` (PR #3059). All 7 script-verifiable QA items passed
(the shared `unit_disable_skip_notice` helper exists adjacent to
`unit_manually_disabled`; the message carries the load-bearing substring and
no `WARNING`; it fires from both installers' steady-state hot paths before
their existing `return 0`; the cold-path wording is byte-identical to
`origin/main`; `test-lib-systemd-units.sh` is 146/146 with the strengthened
5b assertions and the zero-`systemctl` ratchet intact; the full
`run-unit-tests.sh --pr-scripts` suite passed with zero failures when
re-verified outside the sandbox — the sandboxed run's failures were a known
`tsx` IPC-socket `EPERM` sandbox artifact unrelated to this diff, confirmed by
re-running the affected suites individually unsandboxed; `lib-unit-disable-state.sh`'s
header documents the `journalctl` confirmation with the exact emitted
substring, and all three touched scripts parse cleanly). One item is a planned
deferral that cannot be settled until this PR is on `origin/main`:

- id: 8
- title: Live-host confirmation: the notice actually appears in the
  operator's journal after a real disable
- url_path: current
- expected outcome: The operator sees exactly one informational notice per
  steady-state pass naming the sentinel path, and the disabled unit stays
  disabled — the previously-silent path is now observable from the journal
  alone.
- finding: Requires a live `systemd --user` session on the real dispatch
  host; this is the node's own documented post-merge live-host check
  (below), which cannot run in CI or a worktree.
- Verifiability: MACHINE
- Check: On the dispatch host, after this change is on `origin/main`: set
  the sentinel
  (`mkdir -p ~/.local/share/commons-dispatch/disabled && touch
  ~/.local/share/commons-dispatch/disabled/dispatch-fleet-watch.timer &&
  systemctl --user disable --now dispatch-fleet-watch.timer`), wait for one
  reseed cycle or heartbeat tick (≤30 min), then
  `journalctl --user -t dispatch-schedule-reseed --since '-1h' | grep
  'skipping enable --now'` must show the line containing `unit files already
  current` and the sentinel path, with no `WARNING:` for this unit; also
  check `-t dispatch-tick` for the heartbeat-driven invocation. Confirm
  `systemctl --user is-active dispatch-fleet-watch.timer` stays `inactive`
  and `is-enabled` stays `disabled`. Clean up by removing the sentinel and
  confirming the timer re-arms.
