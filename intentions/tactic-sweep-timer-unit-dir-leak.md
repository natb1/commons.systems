---
id: tactic-sweep-timer-unit-dir-leak
kind: tactic
statement: Stop the dispatch script tests from overwriting the host's systemd
  sweep/heartbeat units with their temp fixture paths, and give the sweep timer
  the same stale-unit self-heal the heartbeat already has
owner: ai
status: codified
parent: null
rationale: Surfaced 2026-07-28 debugging dispatch-sweep-periodic.service failing
  203/EXEC. Five script-level test harnesses in test-dispatch-scripts.sh export
  DISPATCH_RECOVER_UNIT_DIR but not the sweep or heartbeat equivalents, so every
  run of those sections rewrites the real ~/.config/systemd/user units to point
  at the run's mktemp fixture and runs a live systemctl enable --now against
  them. The heartbeat survives this because ensure_heartbeat_units calls
  cleanup_stale_heartbeat_units, which detects a unit whose WorkingDirectory is
  not the current main worktree and rewrites it; the sweep timer has no such
  self-healer and no caller re-asserts it outside dispatch-spawn-tick and the
  four schedule-* scripts. With the fleet paused since 2026-07-21 none of those
  ran, so worktree GC was silently down from 2026-07-26 01:01 EDT until the
  author's manual restore on 2026-07-28 — roughly 2.5 days. The journal shows
  ~100 distinct temp ExecStart paths since 2026-06-19, so the clobber has been
  recurring for weeks and was masked only by real ticks re-asserting the unit.
  Recurred 2026-07-30 during the bootstrap Stage 4 drain and was re-derived
  independently from the same evidence (five script-level harnesses missing the
  sweep/heartbeat unit-dir overrides; no cleanup_stale_sweep_units;
  dispatch-tick-recover re-asserting only the heartbeat), confirming the
  diagnosis in this body still holds on origin/main. The journal for that
  episode names two further fixture paths - /tmp/tmp.x9VoCy8ULR/main and
  /home/n8/.claude/jobs/b1b8e0bc/tmp/tmp.UfmJEjZKax/main - the second showing
  the leak also fires when the suite runs inside a Claude job whose TMPDIR is
  the job directory. Promoted to Wave A by that bootstrap.
reading: null
gap: null
serves:
  - strategy-autonomous-execution
  - strategy-exercise-recovery-paths
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 50
  override: null
  rationale: "Bootstrap re-scale 2026-07-30: Wave A of a three-band interim scale
    (50 / 20 / 10) that puts write-path and pipeline-integrity work above
    ordinary feature work. Promoted into Wave A after the defect recurred live
    during the bootstrap Stage 4 drain: dispatch-sweep-periodic.service was
    found pointing at a deleted mktemp fixture and failing 203/EXEC, healed by
    hand with a direct ensure_sweep_timer call. It belongs in this band because
    it takes the whole fleet down rather than corrupting one node - a poisoned
    sweep unit has no autonomous recovery path at all, so worktree GC stays down
    until a human notices. Interim scaffolding only -
    tactic-attention-tier-ranking replaces the whole numeric scheme with
    lexicographic (tier, rank) and max-lifting, and
    tactic-attention-boost-scripts converts these boosts to tier/bug_fix marks."
phase: review
execution:
  branch: tactic-sweep-timer-unit-dir-leak
  pr: 2999
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  completion: null
validates: []
blocked_by:
  - tactic-dispatch-test-monolith-split
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# stop the test suite from clobbering the host sweep unit, and let it self-heal

## Context

`ensure_sweep_timer` (`.claude/skills/dispatch-propagate/scripts/lib.sh:2713`)
resolves its unit directory as:

```bash
local UNIT_DIR="${DISPATCH_SWEEP_TIMER_UNIT_DIR:-${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user}"
local SYSTEMCTL_CMD="${DISPATCH_SWEEP_TIMER_SYSTEMCTL_CMD:-systemctl}"
```

Five production scripts call it unconditionally at startup — `dispatch-spawn-tick:166`,
`dispatch-schedule-reseed:411`, `dispatch-schedule-convergence-reseed:201`,
`dispatch-schedule-target-reseed:235`, `dispatch-schedule-rate-limit-resume:257`.
`ensure_heartbeat_units` (`lib.sh:2983`) has the same shape with
`DISPATCH_HEARTBEAT_UNIT_DIR` / `DISPATCH_HEARTBEAT_SYSTEMCTL_CMD`.

The test harnesses that exercise those five scripts end-to-end each set a
synthetic main worktree at `$(mktemp -d)/main` and export **only** the recover
pair — `test-dispatch-scripts.sh:13496` (`sr_setup`), `:14359`, `:14642`,
`:15823` (`st_setup`), `:29782`. The sweep and heartbeat overrides are never
set, so each run writes the **real** `~/.config/systemd/user/dispatch-sweep-periodic.service`
and `dispatch-heartbeat.service` with `ExecStart`/`WorkingDirectory` pointing at
the run's temp fixture, then executes a live `systemctl --user daemon-reload`
and `enable --now`. (`ensure_sweep_timer`'s own dedicated unit tests at
`:16187`+ *do* set the override correctly — the leak is specific to the
script-level harnesses.)

Reproduced 2026-07-28 by running `dispatch-spawn-tick` under exactly `st_setup`'s
env with `XDG_CONFIG_HOME` redirected to a scratch dir: both
`dispatch-sweep-periodic.{service,timer}` and `dispatch-heartbeat.{service,timer}`
landed in the default unit dir with
`ExecStart="/tmp/claude-1000/tmp.lLIavodqvE/main/.claude/skills/dispatch-propagate/scripts/dispatch-spawn-sweep"`,
while only `dispatch-tick-recover.service` went to the harness's override dir.

The heartbeat recovers from this on its own: `ensure_heartbeat_units` calls
`cleanup_stale_heartbeat_units` (`lib.sh:2897`, invoked at `lib.sh:3060`), which
compares the installed unit's `WorkingDirectory` against the current main
worktree and disables + rewrites on mismatch. Observed live in the journal:

```
dispatch-tick-recover: WARNING: cleanup_stale_heartbeat_units: installed heartbeat unit
points at '/tmp/claude-1000/tmp.f3jUKjdapO/main' but current main worktree is
'/home/n8/natb1/commons.systems'; disabling stale timer/service before rewrite
```

There is no `cleanup_stale_sweep_units` analog, and `dispatch-tick-recover:187`
calls only `ensure_heartbeat_units`. So the recover path heals the heartbeat and
leaves the sweep unit poisoned indefinitely. Because the fleet has been paused
via the `~/.local/share/commons-dispatch/paused` sentinel, no `dispatch-spawn-tick`
or `dispatch-schedule-*` run re-asserted the sweep unit: it failed `203/EXEC`
every 15 minutes from 2026-07-26 01:16 EDT until a manual `ensure_sweep_timer`
restore on 2026-07-28, with worktree GC down for that whole window. The journal
holds ~100 distinct temp `ExecStart` paths going back to 2026-06-19.

Two independent defects, hence two units: the harnesses should not touch host
state at all (Unit 1), and the sweep unit should self-heal like the heartbeat
does when something else corrupts it (Unit 2).

## Units of work

### Unit 1 — stop the script-level harnesses leaking into the host unit dir

**Recommended model:** sonnet — a mechanical, well-located env-export addition
mirroring the `DISPATCH_RECOVER_UNIT_DIR` lines already present in each harness.

**Scope:** `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`.
In each of the five setup helpers that already export the recover pair — at
`:13496` (`sr_setup`, `dispatch-schedule-reseed`), `:14359`
(`dispatch-schedule-convergence-reseed`), `:14642`
(`dispatch-schedule-target-reseed`), `:15823` (`st_setup`,
`dispatch-spawn-tick`), and `:29782` (`dispatch-schedule-rate-limit-resume`) —
add alongside the existing two exports:

```bash
export DISPATCH_SWEEP_TIMER_UNIT_DIR="$TMPDIR_TEST/systemd-user"
export DISPATCH_SWEEP_TIMER_SYSTEMCTL_CMD="$TMPDIR_TEST/bin/systemctl"
export DISPATCH_HEARTBEAT_UNIT_DIR="$TMPDIR_TEST/systemd-user"
export DISPATCH_HEARTBEAT_SYSTEMCTL_CMD="$TMPDIR_TEST/bin/systemctl"
```

and extend each helper's matching teardown `unset` line (`:13515`, `:14379`,
`:14659`, `:15833`, `:29798`) with the same four names. Each of those harnesses
already creates `$TMPDIR_TEST/bin`; confirm a `systemctl` stub exists there (the
recover exports point at `$TMPDIR_TEST/bin/systemctl`) and create one in any
helper that lacks it, matching the stub style already used for `systemd-run`.

Guard against regression: add a check that fails the suite if any harness leaks.
Snapshot the real unit dir's listing at suite start and assert at suite end that
`dispatch-sweep-periodic.service` and `dispatch-heartbeat.service` are unchanged
(compare content hashes, and treat "absent both times" as a pass) — so a future
helper that forgets an override fails loudly instead of silently corrupting the
developer's host.

**Out of scope:** the dedicated `ensure_sweep_timer` / `ensure_heartbeat_units`
unit-test sections (`:16187`+, `:16589`+, `:27656`+) — they already override
correctly. Do not change `lib.sh`'s default-unit-dir resolution: the production
default must stay the real user unit dir.

**Note on ordering with `tactic-dispatch-test-monolith-split`:** that tactic
(`phase: qa`, PR 2971) relocates these very harnesses into per-script test files,
including merging the `ensure_sweep_timer` sections into
`test-dispatch-spawn-sweep.sh`. Land this unit after that split if it has merged,
applying the same exports at the harnesses' new homes; the `blocked_by` edge
records the dependency.

### Unit 2 — give the sweep timer a stale-unit self-healer

**Recommended model:** sonnet — mirrors an existing helper closely; the judgment
is in matching `cleanup_stale_heartbeat_units`' semantics, not in new design.

**Scope:** `.claude/skills/dispatch-propagate/scripts/lib.sh`. Add
`cleanup_stale_sweep_units`, modeled directly on `cleanup_stale_heartbeat_units`
(`lib.sh:2897`): given the installed service path, the current main worktree, and
the systemctl command, parse the installed unit's `WorkingDirectory=`, and when
it differs from the current main worktree, emit the same shape of `WARNING:` to
stderr and `systemctl --user disable --now dispatch-sweep-periodic.timer` before
the rewrite proceeds. Call it from `ensure_sweep_timer` at the point matching
`lib.sh:3060` — after `SERVICE_PATH`/`SYSTEMCTL_CMD` are resolved and **before**
the byte-for-byte hot-path early return, so a stale unit is never skipped by the
content compare.

Also add `ensure_sweep_timer "$MAIN_WORKTREE" || true` to
`.claude/skills/dispatch-propagate/scripts/dispatch-tick-recover`, next to the
existing `ensure_heartbeat_units` call at `:187`. That closes the recovery
asymmetry that turned a transient clobber into a multi-day outage: the recover
path currently re-asserts the heartbeat but never the sweep timer.

**Out of scope:** `dispatch-tick` itself (it must stay a cheap pure-bash
sequencer; unit installation belongs to the spawn/recover/reseed paths).
Changing the timer cadence, the `dispatch-spawn-sweep` throttle, or the pause
sentinel's interaction with the sweep.

**Dependencies:** none on Unit 1 — the two are independent and may land in
either order.

## Reuse

- `cleanup_stale_heartbeat_units` (`lib.sh:2897`) — the template for Unit 2's
  helper, including its warning wording and disable-before-rewrite sequencing.
- `ensure_heartbeat_units` (`lib.sh:2983`) — the call-site placement pattern
  (`lib.sh:3060`) relative to the hot-path content compare.
- The existing `DISPATCH_RECOVER_UNIT_DIR` / `DISPATCH_RECOVER_SYSTEMCTL_CMD`
  export + teardown pairs in each of the five harnesses — Unit 1 extends these
  lines rather than introducing a new mechanism.
- The `systemd-run` / `systemctl` stub-writing pattern already in `st_setup`
  (`test-dispatch-scripts.sh:15786`+) for any harness needing a stub.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

Manual, and the real point of the change — confirm the suite no longer writes
the host unit dir. Before running the suite, record:

```
sha256sum ~/.config/systemd/user/dispatch-sweep-periodic.service \
          ~/.config/systemd/user/dispatch-heartbeat.service
```

Run the full suite, then re-run the same command: both hashes must be identical,
and `systemctl --user status dispatch-sweep-periodic.service` must not show a
`203/EXEC` failure with a `/tmp/...` `ExecStart`. On `main` before this change
the sweep hash changes on every suite run — that difference is the acceptance
signal.

For Unit 2's self-healer, exercise the recovery path rather than trusting it:
hand-write a stale unit pointing at a nonexistent `/tmp/<fixture>/main`, run
`dispatch-tick-recover` (or any caller of `ensure_sweep_timer`), and confirm it
emits the `cleanup_stale_sweep_units` warning, rewrites `ExecStart` to the real
main worktree, and leaves the timer armed (`systemctl --user status
dispatch-sweep-periodic.timer` → `active (waiting)`).
