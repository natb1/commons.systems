---
id: tactic-playwright-watchdog-orphan-sleep
kind: tactic
statement: Fix playwright_install_with_deps's watchdog to not leak an orphan
  sleep child when the main body cancels it on a fast success or non-stall
  failure, since kill "$watchdog_pid" only signals the subshell and its sleep
  "$timeout_s" grandchild is reparented to init and keeps running for the
  remainder of timeout_s
owner: ai
status: codified
parent: null
rationale: null
reading: null
gap: null
serves:
  - strategy-main-health
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: tactic-playwright-watchdog-orphan-sleep
  pr: 2967
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  completion:
    mergedAt: 2026-07-25T18:22:49Z
    mergeCommitSha: 505754f0cba321baed94b6ff4398508b4b85c57d
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Fix playwright_install_with_deps's watchdog to not leak an orphan sleep child when the main body cancels it on a fast success or non-stall failure, since kill "$watchdog_pid" only signals the subshell and its sleep "$timeout_s" grandchild is reparented to init and keeps running for the remainder of timeout_s

Finalized by `/align-tactics` (round: 2026-07-23). Provenance: `/review-fix`
finding on PR #2958 (`tactic-playwright-install-retry-lock`), code-review
`Deferred` category (out-of-scope for that PR's own fix, not a security
`Required` finding — never routed through adversarial-verify).

## Context

`playwright_install_with_deps` (`.claude/skills/dispatch-propagate/scripts/lib.sh:1684-1748`)
backgrounds a watchdog subshell to kill a stalled `npx playwright install`
after `timeout_s` (default 300s). The watchdog runs `sleep "$timeout_s"` as a
plain **non-final** command inside the subshell, so bash forks it as a real
child process rather than exec'ing into it. On a fast success (or fast
non-stall failure) the main body cancels the still-idle watchdog with
`kill "$watchdog_pid"` (lib.sh:1730). That SIGTERM reaches only the subshell
process itself, not its forked `sleep` child — the `sleep` gets reparented to
init and keeps running for up to the remainder of `timeout_s`. Every fast
install run therefore leaks one orphan `sleep`. Impact is benign (holds no
lock, ~0 CPU, self-terminates, doesn't block script exit) but it is
process-hygiene debt.

Fix: make the watchdog subshell background its own `sleep` (giving it a known
PID) and install a TERM trap that relays the kill directly to that PID. The
surrounding logic — including the existing distinction between "watchdog
already fired, mid-`kill_tree` escalation (a real stall — let it finish)" vs.
"watchdog still idle in its sleep (fast path — cancel it)" — is preserved
exactly; only the fast-path cancellation is made to actually reach the sleep.

Intended outcome: no orphan `sleep` survives a fast install; no latency
regression on the happy path (SIGTERM is instant, unlike `kill_tree`'s
mandatory ~2s SIGTERM→SIGKILL grace); the stall-escalation path is unchanged.

Ruled out during planning (do not re-litigate):
- **`kill_tree "$watchdog_pid"` for the fast-path cancel** — `kill_tree`
  (lib.sh:1984-2005) does an unconditional `sleep 2` grace (line ~1998)
  between its SIGTERM and SIGKILL passes; reusing it here would add a 2s
  latency regression to every fast install.
- **pgrep / process-group kills** (`setsid`, `kill -TERM -$pgid`) — this
  repo's sandbox blocks pgrep's IPC (lib.sh:2226-2228 comment); `kill_tree`
  already uses `ps`-based helpers (`_pids_with_parent`, `_pids_matching_arg`,
  lib.sh:2233-2247) instead for exactly this reason. This fix needs no
  process-tree walking at all.
- There is no existing in-repo pattern of a `trap` installed inside a
  backgrounded `( ... ) &` subshell relaying a signal to a child of that
  subshell (checked: every other `trap ... EXIT/INT/TERM` in the scripts
  directory is foreground, whole-script-level) — design it directly per Unit 1.

## Units of work

### Unit 1 — Make the watchdog subshell background its sleep and trap-relay the cancel

**Recommended model:** sonnet (exact verbatim diff below; the concurrency and
`set -e` subtleties are already resolved and explained in this plan).

**Scope:** `.claude/skills/dispatch-propagate/scripts/lib.sh`, the watchdog
subshell at lines **1711-1718**.

Replace exactly this block (lib.sh:1711-1718):

```bash
    (
      sleep "$timeout_s"
      now=$(date +%s)
      if [ "$((now - start_ts))" -ge "$timeout_s" ] && kill -0 "$install_pid" 2>/dev/null; then
        kill_tree "$install_pid"
      fi
    ) &
    local watchdog_pid=$!
```

with:

```bash
    (
      # Background our own sleep (known PID) instead of running it as a plain
      # non-final child: bash forks a non-final `sleep` into a real child that
      # `kill "$watchdog_pid"` (the fast-path cancel below) can't reach — it
      # would orphan to init and idle for the rest of timeout_s. A TERM trap
      # relays that cancel straight to the sleep so it dies immediately.
      sleep "$timeout_s" &
      sleep_pid=$!
      trap 'kill "$sleep_pid" 2>/dev/null || true' TERM
      wait "$sleep_pid"
      now=$(date +%s)
      if [ "$((now - start_ts))" -ge "$timeout_s" ] && kill -0 "$install_pid" 2>/dev/null; then
        kill_tree "$install_pid"
      fi
    ) &
    local watchdog_pid=$!
```

Notes for the implementer (why this differs from the sketch originally
proposed in code review — verified empirically during planning):
- **Plain `sleep_pid=$!`, not `local sleep_pid=$!`.** The existing subshell
  uses a plain assignment for `now` (lib.sh:1713); match that style. (`local`
  does work inside a `( )` within a function in bash, but there is no reason
  to introduce it here.)
- **`|| true` inside the trap.** This file is sourced under
  `set -euo pipefail`, so the subshell inherits `set -e`; a failing `kill` in
  the trap could otherwise trip errexit. `|| true` keeps the trap inert-safe.
- **Robustness under `set -e` (verified):** on the fast path, when the main
  body sends SIGTERM via `kill "$watchdog_pid"`, `wait "$sleep_pid"` returns
  143, the TERM trap fires and kills `sleep_pid`, and then `set -e` aborts the
  subshell before reaching `now=...`. This is correct and intended — the
  orphan-elimination depends only on the trap's `kill` running (it always
  does), **not** on execution resuming past the `wait`. The main body already
  swallows the subshell's resulting non-zero exit via
  `wait "$watchdog_pid" 2>/dev/null || true` (lib.sh:1731).
- **Stall path is behaviorally untouched:** when the install genuinely
  stalls, `sleep "$timeout_s"` completes naturally, `wait "$sleep_pid"`
  returns 0 (no signal, trap never fires), and
  `now=...; if ...; kill_tree` runs exactly as before.

**Explicitly out of scope — do NOT touch:**
- The `local watchdog_pid=$!` line (stays as-is; it is in the function body,
  not the subshell — `local` is correct there).
- `wait "$install_pid" || rc=$?` (lib.sh:1721) and the elapsed-time branch at
  lib.sh:1727-1732, including the `if` (stall/already-fired) branch and the
  `kill "$watchdog_pid"` call itself. `kill "$watchdog_pid"` stays exactly as
  written; the fix works by making the subshell catch that TERM, not by
  changing the caller.
- `kill_tree` (lib.sh:1984-2005) — not reused for the fast-path cancel (see
  Context, above, for why).
- No `setsid` / `pgrep` / process-group kills.

**Dependencies:** none.

### Unit 2 — Add a fast-success regression test (test 7)

**Recommended model:** sonnet (exact verbatim test code below; mirrors test
6's established pattern).

**Scope:** `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`,
in the `playwright_install_with_deps` group (starts at line 5288). Insert a
new test **immediately after test 6** (test 6's `teardown` at line 5597) and
**before** the `wait_for_dpkg_lock` section header (line 5599). Insert exactly
this block between line 5597 and line 5599:

```bash

# 7. Fast success → the watchdog's inner sleep is cancelled, not orphaned.
#    On a fast success the main body cancels the still-idle watchdog with
#    `kill "$watchdog_pid"`. Before the fix that SIGTERM missed the watchdog's
#    forked `sleep`, leaking an orphan that idled for the rest of timeout_s.
#    Selective sleep stub (mirrors test 6): real-sleep AND record the PID only
#    for the 25s watchdog deadline, so a leaked orphan would still be alive at
#    assert time; instant for everything else. timeout is a transparent
#    passthrough so npx exits 0 immediately (well before the 25s deadline).
echo "Test: playwright_install_with_deps fast success → watchdog sleep not orphaned"
setup
REAL_SLEEP="$(command -v sleep)"
cat > "$TMPDIR_TEST/bin/npx" <<'FAKE'
#!/usr/bin/env bash
cf="$NPX_COUNT_FILE"
c=0; [[ -f "$cf" ]] && c=$(cat "$cf"); c=$((c+1)); echo "$c" > "$cf"
exit 0
FAKE
chmod +x "$TMPDIR_TEST/bin/npx"
cat > "$TMPDIR_TEST/bin/timeout" <<'FAKE'
#!/usr/bin/env bash
while [[ "$1" == -* ]]; do shift; done
shift                                  # drop the <timeout_s> duration arg
exec "$@"                              # transparent passthrough → npx exits 0
FAKE
chmod +x "$TMPDIR_TEST/bin/timeout"
cat > "$TMPDIR_TEST/bin/sleep" <<'FAKE'
#!/usr/bin/env bash
# Selective: real-sleep + record PID only for the 25s watchdog deadline (so a
# leaked orphan is observably alive at assert time); instant otherwise. The
# recorded $$ equals the watchdog's captured $! because exec preserves the PID.
if [[ "$1" == "25" ]]; then
  [[ -n "${WATCHDOG_SLEEP_PID:-}" ]] && echo "$$" >> "$WATCHDOG_SLEEP_PID"
  exec "$REAL_SLEEP" 25
fi
exit 0
FAKE
chmod +x "$TMPDIR_TEST/bin/sleep"
NPX_COUNT_FILE="$TMPDIR_TEST/npx-7"
WATCHDOG_SLEEP_PID="$TMPDIR_TEST/watchdog-sleep-7"
: > "$WATCHDOG_SLEEP_PID"
rc=0
(
  source "$TMPDIR_TEST/lib.sh"
  unset PLAYWRIGHT_BROWSERS_PATH
  export PLAYWRIGHT_INSTALL_TIMEOUT=25
  export PLAYWRIGHT_INSTALL_ATTEMPTS=1
  export NPX_COUNT_FILE="$TMPDIR_TEST/npx-7"
  export WATCHDOG_SLEEP_PID="$TMPDIR_TEST/watchdog-sleep-7"
  export REAL_SLEEP
  playwright_install_with_deps 2>/dev/null
) || rc=$?
assert_eq "fast success → rc 0" "0" "$rc"
assert_eq "fast success → 1 npx call" "1" "$(cat "$NPX_COUNT_FILE")"
# Give the trap's SIGTERM a beat to land (REAL_SLEEP: a bare `sleep` here would
# hit the still-on-PATH instant stub), then assert the watchdog's inner sleep is
# gone — the fast-path cancel actually reached it, no orphan leaked to init.
"$REAL_SLEEP" 0.5
sleep_alive=0
recorded=0
while IFS= read -r spid; do
  [[ -z "$spid" ]] && continue
  recorded=$((recorded + 1))
  if kill -0 "$spid" 2>/dev/null; then sleep_alive=$((sleep_alive + 1)); fi
done < "$WATCHDOG_SLEEP_PID"
assert_eq "fast success → watchdog sleep was recorded (side channel worked)" "1" "$recorded"
assert_eq "fast success → watchdog sleep not orphaned (killed)" "0" "$sleep_alive"
teardown
```

Why this proves the fix (and fails on the unfixed code):
- `PLAYWRIGHT_INSTALL_ATTEMPTS=1` + npx `exit 0` → one attempt, fast success,
  `return 0` at lib.sh:1734 (no retry `sleep 5`, no `kill_tree`, no
  `sleep 2`). The **only** `sleep 25` call is the watchdog's, so
  `WATCHDOG_SLEEP_PID` captures exactly that one PID (`recorded == 1`).
- The sleep stub records `$$` then `exec "$REAL_SLEEP" 25`; `exec` preserves
  the PID, so the recorded PID is identical to the watchdog's `sleep_pid=$!`.
  The same stub is behavior-agnostic — it works for both the fixed
  (`sleep 25 &`) and unfixed (`sleep 25`) code; only the outcome differs.
- **Unfixed code:** the forked `sleep 25` orphans past the
  `kill "$watchdog_pid"`; 0.5s later `kill -0` succeeds → `sleep_alive == 1`
  → assertion fails.
- **Fixed code:** the TERM trap relays the kill to the backgrounded sleep;
  0.5s later `kill -0` fails → `sleep_alive == 0` → assertion passes.
- `timeout_s=25` is well above the fast-success wall-clock, so the elapsed
  guard at lib.sh:1727 takes the `else` (cancel) branch, exercising exactly
  the fast-path fix. 25 is unique among sleep args in this function (kill_tree
  uses 2, retry uses 5) so `$1 == "25"` unambiguously identifies the watchdog
  sleep. `--kill-after=30`/`85`-style args are `timeout` args, never seen by
  the sleep stub.

**Dependencies:** Unit 1 (test asserts the fixed behavior). Land Unit 1
first, or land both together.

## Reuse

- `setup` / `teardown` / `assert_eq` test harness helpers —
  test-dispatch-scripts.sh (`assert_eq` near line 21), and the group's
  `$TMPDIR_TEST/bin`-on-PATH convention (test-dispatch-scripts.sh:5290-5292).
- Test 6's selective-real-sleep + PID-side-channel pattern —
  test-dispatch-scripts.sh:5529-5597 (`REAL_SLEEP="$(command -v sleep)"`, the
  `GRANDCHILD_PIDS` file, the transparent `timeout` passthrough stub, the
  post-run `"$REAL_SLEEP" 1` grace + `kill -0` survivor loop). Unit 2 mirrors
  this, adapted to a fast-success scenario instead of a stall scenario.
- `kill_tree` — lib.sh:1984 (reused only in the untouched stall/failure
  paths; not reused for the fast-path cancel).

## Verification

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

Expected: the full suite passes (final `Results: N/N passed, 0 failed`),
including the two new assertions `fast success → watchdog sleep was recorded
(side channel worked)` and `fast success → watchdog sleep not orphaned
(killed)`, plus the unchanged existing playwright tests 1-6 (in particular
test 6, the stall/`kill_tree` escalation test, must still pass unregressed).
Run time stays test-6-scale (a few seconds); the new test adds only a 0.5s
grace, no `timeout_s`-length wait.

Manual sanity (optional, judgment call): to confirm the test actually
distinguishes fixed from buggy, temporarily revert Unit 1's subshell to the
original `sleep "$timeout_s"` (non-backgrounded, no trap) and re-run — test
7's `not orphaned (killed)` assertion should FAIL (`expected: '0', actual:
'1'`), then restore Unit 1.
