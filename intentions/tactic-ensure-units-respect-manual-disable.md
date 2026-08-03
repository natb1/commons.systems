---
id: tactic-ensure-units-respect-manual-disable
kind: tactic
statement: dispatch-schedule-reseed's ensure_healer_units and
  ensure_watcher_units calls run unconditionally on every reseed cycle and
  silently re-enable a manually-disabled watchdog timer within roughly 15-30
  minutes, with no sentinel or opt-out mechanism to honor an intentional disable
owner: ai
status: codified
parent: null
rationale: "Confirmed 2026-08-01 during a fleet investigation session:
  dispatch-fleet-watch.timer was deliberately disabled (systemctl --user disable
  --now) as a containment step, then journald showed 'systemctl[...]: Created
  symlink .../dispatch-fleet-watch.timer' firing again roughly 27 minutes later
  -- with no human re-enabling it. Traced to
  .claude/skills/dispatch-propagate/scripts/dispatch-schedule-reseed:421-422,
  which calls ensure_healer_units(\"$MAIN_WORKTREE\") and
  ensure_watcher_units(\"$MAIN_WORKTREE\") unconditionally as part of every
  reseed cycle, from inside dispatch-tick's own run. Neither function checks
  whether a human deliberately disabled the timer -- both just systemctl --user
  enable --now it if it is not already enabled. This means any manual disable of
  either watchdog timer is a temporary, not durable, containment measure: the
  fleet's own scheduling infrastructure undoes operator intervention on its own
  schedule."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal:
  observable: a deliberate systemctl --user disable --now of
    dispatch-fleet-watch.timer or dispatch-heal.timer survives a full
    dispatch-schedule-reseed cycle without being silently re-enabled
  sensor: "manual test: disable a timer, wait one full reseed interval (or force a
    reseed cycle), confirm systemctl --user is-active still reports
    inactive/disabled"
  threshold: the timer stays disabled across at least one full reseed cycle when
    the new opt-out sentinel is present; ensure_*_units still self-heals a
    poisoned or failed unit when NO opt-out sentinel is present (the existing
    bug-B/bug-O healing behavior must be unaffected)
  is_proxy: false
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes: {}
---
# dispatch-schedule-reseed's ensure_healer_units and ensure_watcher_units calls run unconditionally on every reseed cycle and silently re-enable a manually-disabled watchdog timer within roughly 15-30 minutes, with no sentinel or opt-out mechanism to honor an intentional disable

## Context

`ensure_healer_units` and `ensure_watcher_units` (both in
`.claude/skills/dispatch-propagate/scripts/lib.sh`) install and *arm* the two
fleet watchdog timers — `dispatch-heal.timer` (the systemd-unit poisoning
healer) and `dispatch-fleet-watch.timer` (the fleet watchdog). Each function
ends with an unconditional `systemctl --user enable --now <timer>`:

- `lib.sh:3194` — `"$SYSTEMCTL_CMD" --user enable --now dispatch-heal.timer`
- `lib.sh:3419` — `"$SYSTEMCTL_CMD" --user enable --now dispatch-fleet-watch.timer`

Both functions are called on every reseed cycle:

- `dispatch-schedule-reseed:421-422`
- `dispatch-schedule-convergence-reseed:211-212`
- `dispatch-heal-units:474-488` (the poisoning healer re-runs all five installers
  whenever it detects a poisoned unit)

The reseed cadence is roughly 15–30 minutes. So an operator who deliberately
runs `systemctl --user disable --now dispatch-fleet-watch.timer` — to silence a
noisy watchdog, to debug the fleet, to stop an alarm loop — has the timer
silently re-enabled within one reseed cycle. There is no sentinel, config field,
or any other opt-out that the installers consult. The disable does not stick,
and nothing tells the operator why.

The intended outcome: an explicit, operator-set marker that both installers
honor, so a deliberate disable survives every reseed cycle until the operator
removes the marker — while a *non*-disabled timer keeps every existing
self-healing behavior exactly as it is today (cold install, path-change
cutover, retry-until-armed after a transient `daemon-reload`/`enable` failure,
and repair after unit poisoning).

### Design: greenfield

The ideal design is a **declarative per-unit disable sentinel read through one
shared tri-state reader**, exactly mirroring the pause sentinel that already
exists in this codebase:

- A sentinel *directory*, `${XDG_DATA_HOME:-$HOME/.local/share}/commons-dispatch/disabled/`,
  containing one empty marker file per timer unit name (e.g.
  `disabled/dispatch-fleet-watch.timer`). Presence of the marker means "do not
  arm this timer". `ls` on the directory is the operator's inventory.
- One reader library, `lib-unit-disable-state.sh`, providing
  `dispatch_unit_disable_state <unit>` → prints `disabled` | `not-disabled` |
  `unknown`, always returns 0. This is the byte-for-byte analogue of
  `lib-pause-state.sh`'s `dispatch_pause_state`, including its
  parent-directory-searchability rule, its XDG-with-env-override path
  expression, its load guard, and its "read stdout, not `$?`" contract.
- One shared consumer helper in `lib.sh`, `unit_manually_disabled <unit>
  <caller-label>`, called from thin per-installer sites — the same
  one-implementation / two-thin-call-sites shape as the existing
  `cleanup_stale_unit_pair` (`lib.sh:2735-2761`) with its
  `cleanup_stale_healer_units` / `cleanup_stale_watcher_units` wrappers
  (`lib.sh:2985-2989`, `lib.sh:3207-3211`). Because the two installers are
  structurally identical, a duplicated inline check is exactly the shape that
  gets fixed in one and missed in the other.
- Ultimately all five installers (`ensure_recover_unit`, `ensure_sweep_timer`,
  `ensure_heartbeat_units`, `ensure_healer_units`, `ensure_watcher_units`)
  consult the same helper, so every dispatch-managed timer has a uniform
  opt-out.

### Design: what this tactic actually builds (scope narrowing, not compromise)

This tactic wires the guard into the **two** installers it names. The other
three call sites in `dispatch-schedule-reseed:408,411,418` almost certainly
share the same defect, but they are out of this tactic's scope; because the
helper is generic and takes the unit name as an argument, extending it to them
later is a three-line change per installer with no redesign. Flag that as a
follow-up, do not widen this PR.

Three design decisions that the implementer must not relitigate:

1. **Sentinel file, not `systemctl --user is-enabled`.** `is-enabled` cannot
   distinguish "the operator deliberately disabled this" from "a prior
   `daemon-reload` or `enable` failed and the unit has never been armed" — both
   read `disabled`. `lib.sh:3175-3188` documents that the current code
   deliberately retries `daemon-reload` + `enable` across cycles precisely to
   recover the second case. Gating on `is-enabled` would silently convert every
   transient install failure into a permanent one. `is-enabled` is used nowhere
   in this repo today; a sentinel is the established precedent (the pause flag).

2. **The sentinel only blocks `enable`; it never runs `disable`.** The marker
   means "do not arm this timer", not "actively stop this timer". The operator's
   own `systemctl --user disable --now` does the stopping; the sentinel makes it
   stick. Giving an unattended reseed the power to tear down the fleet's own
   watchdogs on the strength of a stray file adds a new destructive capability
   that does nothing for the stated outcome. Consequence the operator must know
   (and which the lib header must state): create the sentinel **before** running
   `disable --now`, or a reseed landing in the gap re-arms the timer.

3. **`unknown` proceeds with `enable`, loudly.** `unknown` arises only when the
   state directory exists but is not searchable. The pause *gate* fails closed
   (refusing to schedule does less work, which is safe). Here, "failing closed"
   would mean removing the fleet's own watchdog — and the watchdog is the thing
   that would otherwise report its own absence, so the failure is
   self-concealing. So on `unknown` the installer emits a `WARNING:` naming the
   unreadable sentinel path and proceeds to enable. This divergence from the
   pause gate's default is deliberate and must be written down in the new lib's
   header comment, with this reason.

---

## Unit 1 — `lib-unit-disable-state.sh` + its test suite

### Scope

**Creates** `.claude/skills/dispatch-propagate/scripts/lib-unit-disable-state.sh`.
Model it directly on
`.claude/skills/dispatch-propagate/scripts/lib-pause-state.sh:1-103` — same
header-comment depth, same load-guard shape, same "always returns 0, read
stdout" contract, same parent-directory-searchability reasoning.

Public surface (two functions):

- `dispatch_unit_disable_sentinel_path <timer-unit-name>` — prints the absolute
  sentinel path for a unit. Path expression reuses the exact
  env-override-with-XDG-fallback shape at `dispatch-tick:312` and
  `lib-pause-state.sh:74`:
  `"${DISPATCH_UNIT_DISABLE_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/commons-dispatch/disabled}/<unit>"`.
- `dispatch_unit_disable_state <timer-unit-name>` — prints exactly one of
  `disabled` / `not-disabled` / `unknown` and **always returns 0**:
  - sentinel directory absent entirely → `not-disabled` (dispatch has never
    disabled anything here, so the marker is definitely absent);
  - directory present but not searchable (`! -x`) → `unknown`;
  - directory present and searchable, marker file present → `disabled`;
  - otherwise → `not-disabled`.
  - Argument validation (defensive check at a public API boundary, per
    `.claude/rules/code-style.md`): empty argument, or an argument containing
    `/` or equal to `.`/`..`, → emit a `WARNING:` to stderr naming the bad
    argument and print `unknown`. Never build a path from an unvalidated
    component.

**Critical divergence from `lib-pause-state.sh`:** that file sets
`set -uo pipefail` in the sourcing shell (`lib-pause-state.sh:69`). This new
file must **not** set any shell options, because `lib.sh` will source it and
`lib.sh` is sourced by dozens of scripts that were not written under `set -u`.
Write the functions to be `set -u`-safe on their own (all parameter expansions
use `${VAR:-default}` or are positional parameters guarded with `${1:-}`), and
state the reason in the header comment.

The header comment must also carry the operator procedure, verbatim-runnable:

```
# Disable a timer so reseed stops re-arming it (create the sentinel FIRST —
# a reseed landing between the disable and the sentinel re-arms the timer):
#   mkdir -p ~/.local/share/commons-dispatch/disabled
#   touch    ~/.local/share/commons-dispatch/disabled/dispatch-fleet-watch.timer
#   systemctl --user disable --now dispatch-fleet-watch.timer
#
# Re-enable:
#   rm ~/.local/share/commons-dispatch/disabled/dispatch-fleet-watch.timer
#   systemctl --user enable --now dispatch-fleet-watch.timer   # or wait for the next reseed
```

**Creates** `.claude/skills/dispatch-propagate/scripts/test-lib-unit-disable-state.sh`,
modeled on `test-lib-pause-state.sh:1-83`: `set -euo pipefail`, source
`dispatch-test-fixture.sh` for `SCRIPT_DIR`/`assert_eq`/`report_results`, then
per-case `mktemp -d` sandboxes pointed at by `DISPATCH_UNIT_DISABLE_DIR`.
Cases:

1. marker present → `disabled`; and returns 0.
2. directory present, marker absent → `not-disabled`.
3. directory absent entirely → `not-disabled`.
4. directory present but `chmod 000` → `unknown`. Copy the root-skip guard at
   `test-lib-pause-state.sh:69-72` verbatim (mode bits do not deny root; count
   the skip as a pass) and the `chmod -R u+rwx` before `rm -rf` teardown at
   `test-lib-pause-state.sh:26-29`.
5. a marker for a *different* unit present → target unit reads `not-disabled`
   (proves per-unit granularity).
6. invalid argument (`""`, `"a/b"`, `".."`) → prints `unknown`.
7. `dispatch_unit_disable_sentinel_path dispatch-heal.timer` returns
   `$DISPATCH_UNIT_DISABLE_DIR/dispatch-heal.timer`.

Mark the file executable (`chmod +x`) — `run-unit-tests.sh:190` executes the
`test-*.sh` glob directly. No CI wiring change is needed: the SUT lives inside
`.claude/skills/dispatch-propagate/scripts/`, so `run-unit-tests.sh:88` sets
`RUN_PR_SCRIPTS=true` and the glob at `:190` picks the new suite up
automatically. Do **not** add it to `.github/workflows/unit-tests.yml` — the
list there (`unit-tests.yml:203-209`) is explicitly only for suites whose SUT
lives outside that scripts directory.

**Out of scope for this unit:** any edit to `lib.sh`, to the installers, or to
`test-lib-systemd-units.sh`.

### Recommended model

sonnet

---

## Unit 2 — wire the guard into `ensure_healer_units` and `ensure_watcher_units`

### Scope

Edits `.claude/skills/dispatch-propagate/scripts/lib.sh` only.

**2a. Add the shared consumer helper.** Place it immediately after
`cleanup_stale_unit_pair` (which ends at `lib.sh:2761`), so the two shared
helpers sit together and the comment can cross-reference the pattern:

```bash
# Report whether a dispatch-managed timer has been marked manually-disabled by
# the operator, so an installer can skip its `enable --now` instead of silently
# undoing a deliberate `systemctl --user disable --now` on the next reseed.
#
# One implementation, called from thin per-installer sites — the same shape as
# cleanup_stale_unit_pair above — so the check cannot be fixed for one timer and
# missed for its structurally identical twin.
#
# Args: $1 = timer unit name, $2 = caller name for message prefixes
# Returns 0 when the unit is marked manually-disabled (caller must skip enable),
#         1 otherwise.
# An indeterminate state (unreadable sentinel dir, or an unsourceable reader)
# returns 1 — proceed with enable — after a WARNING naming the cause. Failing
# the other way would tear the fleet's own watchdog down on an unreadable file,
# and the watchdog is what would otherwise report its own absence.
unit_manually_disabled() {
  local unit="$1"
  local caller="$2"

  if ! declare -f dispatch_unit_disable_state >/dev/null 2>&1; then
    # shellcheck source=lib-unit-disable-state.sh
    if ! source "$(dirname "${BASH_SOURCE[0]}")/lib-unit-disable-state.sh" 2>/dev/null; then
      echo "WARNING: $caller: cannot source lib-unit-disable-state.sh; a manual disable of $unit cannot be honored; proceeding to enable" >&2
      return 1
    fi
  fi

  local state
  state=$(dispatch_unit_disable_state "$unit")
  case "$state" in
    disabled)     return 0 ;;
    not-disabled) return 1 ;;
    *)
      echo "WARNING: $caller: unit-disable sentinel state for $unit is unknown ($(dispatch_unit_disable_sentinel_path "$unit") is unreadable); proceeding to enable — a manual disable may not be honored" >&2
      return 1
      ;;
  esac
}
```

The `declare -f … || source` idiom mirrors `dispatch-tick`'s conditional-source
pattern; `$(dirname "${BASH_SOURCE[0]}")` resolves to `lib.sh`'s own directory
and has precedent at `lib.sh:1644`.

**2b. `ensure_healer_units`** (`lib.sh:3012-3198`). Two edits:

- Immediately **before** the hot-path block at `lib.sh:3117-3123` (i.e. after
  `desired_timer` is built at `:3115`), read the state once into a local:

  ```bash
  # Read the manual-disable marker ONCE per call: it is consulted twice below
  # (steady-state short-circuit, and the enable decision) and must not disagree
  # with itself between them.
  local manually_disabled=0
  if unit_manually_disabled dispatch-heal.timer ensure_healer_units; then
    manually_disabled=1
  fi
  ```

- Extend the hot-path condition at `lib.sh:3119-3121` so a manually-disabled
  timer with byte-current unit files is *also* steady state — otherwise
  `is-active` stays false forever while disabled and every reseed cycle pays a
  pointless `daemon-reload`:

  ```bash
  if [ -f "$SERVICE_PATH" ] && [ "$(cat "$SERVICE_PATH")" = "$desired_service" ] \
     && [ -f "$TIMER_PATH" ] && [ "$(cat "$TIMER_PATH")" = "$desired_timer" ] \
     && { [ "$manually_disabled" -eq 1 ] || "$SYSTEMCTL_CMD" --user is-active --quiet dispatch-heal.timer; }; then
    return 0
  fi
  ```

  Order matters: the `manually_disabled` test comes first so a disabled timer
  costs zero `systemctl` invocations in steady state.

- Immediately **before** the `enable --now` block at `lib.sh:3190-3197` — that
  is, **after** the `daemon-reload` at `:3185-3188`, so unit files stay
  converged on disk while disabled and a later re-enable arms a correct unit —
  insert:

  ```bash
  # Honor a deliberate operator disable: the unit files above are kept current,
  # but arming the timer is skipped. NOT a WARNING and NOT an error — this is
  # the requested state, and the caller's `|| true` must not be the only thing
  # separating "we did what you asked" from "something went wrong".
  if [ "$manually_disabled" -eq 1 ]; then
    echo "ensure_healer_units: dispatch-heal.timer is marked manually disabled ($(dispatch_unit_disable_sentinel_path dispatch-heal.timer)); unit files updated, skipping enable --now" >&2
    return 0
  fi
  ```

  It must `return 0`, not a non-zero code: a skipped-by-request enable is not a
  failure.

**2c. `ensure_watcher_units`** (`lib.sh:3235-3423`). Apply the byte-parallel
edits with the watcher's own names: read the state before the hot path at
`lib.sh:3342-3348` (extending the condition at `:3344-3346` the same way),
and insert the skip immediately before the `enable --now` block at
`lib.sh:3415-3422`, after the `daemon-reload` at `:3410-3413`. Unit name
`dispatch-fleet-watch.timer`, caller label `ensure_watcher_units`. **Both
functions must be edited in the same unit** — the named failure mode of this
tactic is fixing one and missing its twin.

**2d. Update the two function header comments** (`lib.sh:2991-3011` for the
healer, `lib.sh:3213-3234` for the watcher) with one sentence each: the
installer honors the per-unit disable sentinel and skips `enable --now` when it
is set; see `lib-unit-disable-state.sh` for the sentinel path and the operator
procedure.

**Explicitly out of scope:**

- `ensure_recover_unit` (`lib.sh:2607`), `ensure_sweep_timer` (`lib.sh:2794`),
  `ensure_heartbeat_units` (`lib.sh:3502`) — same latent defect, separate
  tactic. Do not touch them.
- Any change to `dispatch-schedule-reseed:421-422`,
  `dispatch-schedule-convergence-reseed:211-212`, or
  `dispatch-heal-units:474-488`. The guard lives *inside* the two functions
  precisely so all three call sites inherit it with no wiring change.
- Any code path that runs `systemctl disable` or `stop` from the sentinel.
- `cleanup_stale_healer_units` / `cleanup_stale_watcher_units` and their
  path-change disable behavior (`lib.sh:3128`, `lib.sh:3353`) — unchanged. A
  stale-path cutover still runs its best-effort `disable`; that is orthogonal.

### Recommended model

opus

### Dependencies

Unit 1.

---

## Unit 3 — test coverage for the wired guard, plus fixture isolation

### Scope

**3a. Fixture leak guard** —
`.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh`. Next to
the existing host-unit leak guard and the `export PATH=` at line 148, add:

```bash
# Every suite reads the unit-disable sentinel through lib-unit-disable-state.sh.
# Pin it at a path that is never created, so no suite can be perturbed by a
# timer the developer running the suite has genuinely disabled on this host.
export DISPATCH_UNIT_DISABLE_DIR="$DISPATCH_GUARD_BIN_DIR/no-disabled-units"
```

Without this, the existing `ensure_healer_units` / `ensure_watcher_units` cases
would consult the operator's real
`~/.local/share/commons-dispatch/disabled/` directory and fail on a host where
a timer is legitimately disabled. Add the comment explaining why — it mirrors
the reasoning already recorded for the `systemctl` leak guard at
`dispatch-test-fixture.sh:90-97`.

**3b. Healer case 5** —
`.claude/skills/dispatch-propagate/scripts/test-lib-systemd-units.sh`, appended
after case 4 (which ends at `:793`, just before the watcher section header at
`:797`). Reuse the existing `ehl_*` scaffolding (stub at `:581-593`, unit dir
`ehl_unit_dir` at `:595`, log `ehl_log` at `:598`) — do **not** build a second
stub. **No change to the stub's `case` statement is needed**: the guard is a
filesystem read, not a new `systemctl` subcommand.

Sub-cases, each a subshell exporting `DISPATCH_HEALER_UNIT_DIR`,
`DISPATCH_HEALER_SYSTEMCTL_CMD`, `STUB_LOG`, and a case-local
`DISPATCH_UNIT_DISABLE_DIR`, following the shape at `:602-608`:

- **5a — cold path, marker present.** Fresh `ehl_unit_dir` (remove it first so
  the unit files are absent), `DISPATCH_UNIT_DISABLE_DIR` a scratch dir
  containing `dispatch-heal.timer`, `STUB_IS_ACTIVE_RC=1`. Assert:
  `ensure_healer_units` **returns 0**; both unit files were still written;
  `daemon-reload` **is** in `$ehl_log`; `enable --now dispatch-heal.timer` is
  **absent** from `$ehl_log`; the function's stderr contains
  `skipping enable --now` and does **not** contain `WARNING`.
- **5b — steady state, marker present, unit files already current.** Same
  scratch marker, unit files left as 5a wrote them, `STUB_IS_ACTIVE_RC=1`
  (timer inactive, as a disabled timer is). Assert return 0 and that
  `$ehl_log` is **empty** — no `daemon-reload`, no `enable`, and no `is-active`
  probe. This is the case that proves the hot-path extension in Unit 2b, i.e.
  that a disabled timer does not churn `daemon-reload` every reseed cycle.
- **5c — marker absent → unchanged behavior (regression guard).** Same scratch
  `DISPATCH_UNIT_DISABLE_DIR` with **no** marker file, unit files removed,
  `STUB_IS_ACTIVE_RC=1`. Assert `enable --now dispatch-heal.timer` **is**
  present in `$ehl_log`. This ratchets that the guard does not break the
  cold-install path, and covers the legitimate re-cutover-after-poisoning flow.
- **5d — marker for the other unit only.** `DISPATCH_UNIT_DISABLE_DIR`
  containing only `dispatch-fleet-watch.timer`. Assert `enable --now
  dispatch-heal.timer` **is** present — per-unit granularity, not a global
  kill switch.
- **5e — unknown state.** `DISPATCH_UNIT_DISABLE_DIR` a `chmod 000` directory.
  Assert `enable --now dispatch-heal.timer` **is** present in `$ehl_log` and
  stderr contains `WARNING`. Guard with the same
  root-skips-and-counts-as-pass idiom used at `test-lib-pause-state.sh:69-72`.

**3c. Watcher case 5** — mirror all five sub-cases in the `ensure_watcher_units`
section (starts `:800`), using the `ewa_*` prefix (`ewa_unit_dir` `:818`,
`ewa_svc` `:819`, `ewa_tmr` `:820`, `ewa_log` `:821`), the
`DISPATCH_WATCHER_UNIT_DIR` / `DISPATCH_WATCHER_SYSTEMCTL_CMD` seams, and unit
name `dispatch-fleet-watch.timer`. Insert after watcher case 4 (which ends just
before `rm -rf "$ewa_tmp"` / `report_results` at `:1020`). Both sections must
get the same five sub-cases — a fix tested on only one timer is the exact gap
this tactic exists to close.

Use the file's existing assertion style (`TOTAL`/`PASS`/`FAIL` increments with
`echo "  PASS: …"` / `"  FAIL: …"`, and `assert_eq` for scalar comparisons), not
a new harness.

**Out of scope:** `test-dispatch-heal-units.sh` — it replaces both installers
with fakes (`test-dispatch-heal-units.sh:150`) and tests
`dispatch-heal-units`' own skip/poisoning logic, which this change does not
touch. Do not add guard cases there.

This unit must land in the same PR as Unit 2; the behavior change must not ship
untested.

### Recommended model

sonnet

### Dependencies

Unit 2.

---

## Reuse

- `.claude/skills/dispatch-propagate/scripts/lib-pause-state.sh:1-103` —
  `dispatch_pause_state`. The template for Unit 1: tri-state contract, always
  returns 0, XDG-with-env-override path expression, parent-directory
  searchability rule, load guard, header-comment depth. Copy its structure; do
  **not** copy its `set -uo pipefail` (see Unit 1).
- `.claude/skills/dispatch-propagate/scripts/test-lib-pause-state.sh:1-83` —
  the test-suite template for Unit 1, including the root-skip guard
  (`:69-72`) and the `chmod -R u+rwx` teardown (`:26-29`).
- `.claude/skills/dispatch-propagate/scripts/lib.sh:2735-2761` —
  `cleanup_stale_unit_pair`, with wrappers at `:2985-2989` and `:3207-3211`.
  The one-shared-helper / thin-per-timer-call-sites pattern Unit 2a follows.
- `.claude/skills/dispatch-propagate/scripts/dispatch-tick:312` — the
  `${VAR:-${XDG_DATA_HOME:-$HOME/.local/share}/commons-dispatch/<leaf>}` path
  expression, reused verbatim in Unit 1 with a different leaf.
- `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch:261-266` —
  the conditional-`source`-a-`lib-*.sh`-then-call idiom that Unit 2a's
  `declare -f … || source` block adapts for a library context (where `exit` is
  not available).
- `.claude/skills/dispatch-propagate/scripts/lib.sh:1644` — the
  `"$(dirname "${BASH_SOURCE[0]}")/<sibling-script>"` resolution precedent used
  by Unit 2a.
- `.claude/skills/dispatch-propagate/scripts/test-lib-systemd-units.sh:581-593`
  — the recording `systemctl` stub (`STUB_LOG`, `STUB_IS_ACTIVE_RC`,
  `STUB_ENABLE_RC`, `STUB_RELOAD_RC`, `STUB_DISABLE_RC`). Reuse as-is; Unit 3
  adds no new stub subcommand.
- `.claude/skills/dispatch-propagate/scripts/test-lib-systemd-units.sh:600-692`
  and `:823-916` — the cold-path / hot-path subshell shapes Unit 3's sub-cases
  copy for the healer and watcher respectively.
- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh:97-148` —
  the host-unit leak guard and the global `export PATH` site; Unit 3a adds the
  sentinel-dir pin alongside, with the same rationale shape.
- `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:88,187-195` —
  the `test-*.sh` glob that auto-discovers the new suite; no CI wiring change.

## Verification

Run the new reader's suite:

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-unit-disable-state.sh
```

Run the installer suite (covers the wired guard plus every pre-existing
cold-path / hot-path / path-guard / stale-cleanup case for both timers — all
must stay green):

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-systemd-units.sh
```

Regression: the two suites whose SUTs call the installers, confirming the
fixture pin in Unit 3a did not disturb them and that
`dispatch-heal-units`' installer fan-out is unaffected:

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-heal-units.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-schedule-reseed.sh
```

Lint the changed shell (enforces `.claude/rules/shell-json.md` and the other
prose rules on net-new added lines in committed `.sh` files):

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Assert the new library was not accidentally given shell-option side effects —
sourcing it must not turn on `-u`/`-e`/`pipefail` in the caller, which would
change behavior for every script that sources `lib.sh`:

```verify
bash -c 'before=$-; source .claude/skills/dispatch-propagate/scripts/lib-unit-disable-state.sh; after=$-; [ "$before" = "$after" ] || { echo "FAIL: sourcing lib-unit-disable-state.sh changed shell options: $before -> $after" >&2; exit 1; }; echo "PASS: no shell-option side effects"'
```

Assert both installers were edited (guards against the one-of-two failure mode
this tactic exists to close):

```verify
bash -c 'set -e; f=.claude/skills/dispatch-propagate/scripts/lib.sh; grep -q "unit_manually_disabled dispatch-heal.timer" "$f" || { echo "FAIL: ensure_healer_units missing the manual-disable guard" >&2; exit 1; }; grep -q "unit_manually_disabled dispatch-fleet-watch.timer" "$f" || { echo "FAIL: ensure_watcher_units missing the manual-disable guard" >&2; exit 1; }; echo "PASS: both installers consult the shared guard"'
```

Manual / observe-on-the-operator-host checks (not auto-runnable — they need a
live `systemd --user` session and a real reseed cycle):

1. On the dispatch host, create the sentinel and disable the watcher:
   `mkdir -p ~/.local/share/commons-dispatch/disabled && touch
   ~/.local/share/commons-dispatch/disabled/dispatch-fleet-watch.timer && systemctl
   --user disable --now dispatch-fleet-watch.timer`.
2. Wait out at least two reseed cycles (≥45 min), then confirm
   `systemctl --user is-active dispatch-fleet-watch.timer` still reports
   inactive and `systemctl --user is-enabled` still reports disabled. Before
   this change the timer would be back within ~15–30 min.
3. Confirm the skip is visible, not silent:
   `journalctl --user -t dispatch-schedule-reseed --since '-1h' | grep
   'skipping enable --now'` shows the informational line, and no `WARNING:` for
   this unit.
4. Confirm no collateral alarm: `dispatch-fleet-watch`'s predicates do not test
   timer armed-ness and `dispatch-heal-units`' poisoning conditions are
   ExecStart mismatch and `is-failed` — a disabled-but-present timer is neither
   — so the deliberate disable must not raise a standing fleet alarm or drive a
   heal loop. Check `dispatch-heal-units`' log line for `result=clean` over the
   window.
5. Confirm the healer is unaffected while the *watcher* is disabled:
   `dispatch-heal.timer` should still be active and firing.
6. Remove the sentinel (`rm
   ~/.local/share/commons-dispatch/disabled/dispatch-fleet-watch.timer`) and
   confirm the next reseed cycle re-arms the timer with a correct unit file
   (`systemctl --user is-active dispatch-fleet-watch.timer` → active, and
   `WorkingDirectory=` in the installed unit names the current main worktree).
   This closes the loop: the guard suppresses re-arming only while the operator
   asks for it.
