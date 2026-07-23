---
id: tactic-playwright-install-retry-lock
kind: tactic
statement: "Fix playwright_install_with_deps retry: kill a timed-out attempt via
  its process tree before retrying, so attempt 2 does not die on the dpkg lock
  and the retry count is real"
owner: ai
status: codified
parent: null
rationale: "Observed 2026-07-23 on PR #2946 CI: attempt 1 timed out at 300s mid
  apt-get but the process kept running, so attempt 2 immediately failed on E:
  Could not get lock /var/lib/dpkg/lock-frontend — the advertised 2 attempts are
  effectively 1. Resolved that day only by gh run rerun --failed. Finalized
  2026-07-23 /align-tactics: fix reuses this repo's ps-walk kill_tree
  (lib.sh:1912) rather than setsid/process-group kill, since the sandbox blocks
  pgrep IPC."
reading: null
gap: null
serves:
  - strategy-main-health
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 3
  override: null
  rationale: "Author-directed 2026-07-23 /align-strategy round: the top-3 systemic
    gaps (PR custody, scripted census, playwright retry) rank ahead of the
    low-urgency tracked gaps once finalized."
phase: qa
execution:
  branch: tactic-playwright-install-retry-lock
  pr: 2958
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Fix playwright_install_with_deps retry: kill a timed-out attempt via its process tree before retrying, so attempt 2 does not die on the dpkg lock and the retry count is real

## Context

`playwright_install_with_deps` (`.claude/skills/dispatch-propagate/scripts/lib.sh:1654-1676`) wraps `npx playwright install --with-deps chromium` in a per-attempt `timeout` plus a retry loop. On PR #2946 CI (2026-07-23) attempt 1 timed out at 300s mid `apt-get`, but the `apt-get`/`dpkg` grandchildren kept running and held `/var/lib/dpkg/lock-frontend`; attempt 2 immediately failed on `E: Could not get lock`, so the advertised "2 attempts" was effectively 1 (only recovered via `gh run rerun --failed`).

Root cause: `timeout --kill-after=30` only signals its *direct* child (the `npx`/`node` process). When that child dies, the `sudo`/`apt-get`/`dpkg` grandchildren it spawned get reparented to init and survive, holding the dpkg lock into the next attempt.

Intended outcome: on a stall, kill the attempt's **whole process tree** (via this repo's `ps`-walk `kill_tree`, not `setsid`/process-group kill — the sandbox blocks `pgrep`'s IPC, so this repo never uses process-group kill) *while the grandchildren are still descendants of a known PID*, then wait (best-effort) for the dpkg lock to release before retrying, so the retry count is real.

Key design decisions:

1. **Capturing the PID / not regressing the happy path or `set -e`.** The bounded install moves from an inline `if timeout …; then` into a background job (`timeout … & install_pid=$!`), reaped with `wait "$install_pid" || rc=$?` (a `||` list — safe under `set -euo pipefail`; the file is sourced into scripts that set `set -euo pipefail`, e.g. `run-acceptance-tests.sh:2` / `run-smoke-tests.sh:2`). A background watchdog subshell is the primary deadline: it `sleep`s `timeout_s`, then — guarded by a real wall-clock elapsed check (`date +%s`) — `kill_tree`s `install_pid` if it is still alive. The outer `timeout` bound is set deliberately *looser* (`timeout_s + 60`) than the watchdog deadline so our watchdog fires first, while node's `apt-get` child is still a live descendant (before node's death reparents it out of `kill_tree`'s reach); the outer `timeout --kill-after=30` remains only as a last-resort safety net. The `date`-based elapsed guard is load-bearing for tests: when `sleep` is stubbed instant, no real time passes, so the watchdog is inert and the existing 5 tests are unaffected.

2. **dpkg-lock-wait after killing.** A new best-effort `wait_for_dpkg_lock` polls the frontend lock with a shared, non-blocking probe (`flock -s -n "$lockfile" true`) until free or a bounded deadline (default 30s), degrading to a no-op when `flock` is absent or the lock file is absent, and never failing the caller. **Uncertainty, stated explicitly:** on GitHub `ubuntu-latest` the frontend lock is root-owned (typically `root:root`, `0640`) and `apt-get` runs via passwordless `sudo`, so a non-root `runner` opening the lock for a shared probe may hit `EACCES` rather than reading true lock state. This helper is intentionally *secondary* — the actual fix is `kill_tree`, and the kernel releases a SIGKILLed `apt-get`'s flock on process death, so the retry's lock is free regardless of whether the probe can read it. When the probe can't open the file, the helper conservatively waits out the bounded window and then proceeds (never a hard failure, never a false "free"). Whether the probe reads the lock or hits `EACCES` in real CI cannot be verified locally (no real apt/dpkg contention reproducible here) — flagged as a manual verification step below. If `EACCES` proves noisy in practice, a follow-up can switch to `sudo flock` — not guessed at now.

## Units of work

### Unit 1 — Add `wait_for_dpkg_lock` helper + its unit tests

**Scope.**
- Add a new function `wait_for_dpkg_lock` to `lib.sh`, placed adjacent to `kill_tree` (after `lib.sh:1933`) or immediately before `playwright_install_with_deps` (`lib.sh:1653`). Behavior:
  - `lockfile="${DPKG_LOCK_FILE:-/var/lib/dpkg/lock-frontend}"`, `deadline="${DPKG_LOCK_WAIT_TIMEOUT:-30}"`.
  - `[ -e "$lockfile" ] || return 0` (lock file absent → no-op).
  - `command -v flock >/dev/null 2>&1 || return 0` (degrade when `flock` unavailable, per the `lib-decision-log.sh:87` guard pattern).
  - Loop up to `deadline`: `if flock -s -n "$lockfile" true 2>/dev/null; then return 0; fi; sleep 1; waited=$((waited+1))`.
  - On deadline reached: `echo "wait_for_dpkg_lock: ${lockfile} still held after ${deadline}s; retrying anyway" >&2; return 0`. Always returns 0 (best-effort, never fails the caller).
- Add standalone unit tests to `test-dispatch-scripts.sh` (a fresh `setup`/`teardown` block, near the playwright group which ends at `test-dispatch-scripts.sh:5515`, using real `sleep`/`flock` — do NOT write the playwright group's instant-`sleep` stub in these tests):
  1. **lock free** — `DPKG_LOCK_FILE=$TMPDIR_TEST/free.lock` (create empty, no holder) → rc 0, returns fast.
  2. **lock absent** — `DPKG_LOCK_FILE=$TMPDIR_TEST/does-not-exist` → rc 0 (the `-e` guard).
  3. **`flock` unavailable** — create the lock file (so `-e` passes), run the call in a subshell with `PATH="$TMPDIR_TEST/bin"` only (no `flock` binary present) → rc 0, no wait.
  4. **lock held → bounded wait then rc 0** — hold an exclusive lock in the background (`flock -x "$f" -c 'sleep 2' &`), set `DPKG_LOCK_WAIT_TIMEOUT=1`, call → probe fails while held, loops ~1s (real), emits the "still held after 1s" warning, returns 0. Assert rc 0 and warning emitted.
- Out of scope: any change to `playwright_install_with_deps` itself (Unit 2); its callers.

**Recommended model:** sonnet — well-specified helper following the established `flock`/degrade patterns; mechanical test additions.

### Unit 2 — Rewrite the install/retry loop with background watchdog + `kill_tree`, and its stall test

**Scope.**
- Replace the inner `while` loop body in `playwright_install_with_deps` (`lib.sh:1661-1673`) with the background-job + watchdog design below. The function header, skip-guard (`lib.sh:1655-1657`), and tunables (`lib.sh:1658-1660`) are unchanged.

  ```bash
  while [ "$attempt" -le "$attempts" ]; do
    if [ "$attempt" -gt 1 ]; then
      echo "playwright_install_with_deps: attempt $attempt/$attempts" >&2
    fi

    # Background the bounded install so we can capture its PID and, on a stall,
    # kill the WHOLE tree — `timeout` alone only signals npx/node, leaving the
    # sudo/apt-get/dpkg grandchildren alive to hold the dpkg lock (PR #2946).
    # The outer `timeout` bound is looser than our own deadline so OUR watchdog
    # fires first, while node's apt-get child is still a live descendant
    # (before node's death reparents it to init, out of kill_tree's reach).
    timeout --kill-after=30 "$((timeout_s + 60))" \
      npx playwright install --with-deps chromium &
    local install_pid=$!
    local start_ts; start_ts=$(date +%s)

    # Watchdog: after timeout_s of REAL wall-clock, if the install is still
    # running it has stalled — kill its whole tree. The elapsed-time guard
    # makes this inert when `sleep` is stubbed instant (unit tests): no real
    # time passed => not a stall.
    (
      sleep "$timeout_s"
      now=$(date +%s)
      if [ "$((now - start_ts))" -ge "$timeout_s" ] && kill -0 "$install_pid" 2>/dev/null; then
        kill_tree "$install_pid"
      fi
    ) &
    local watchdog_pid=$!

    local rc=0
    wait "$install_pid" || rc=$?
    kill "$watchdog_pid" 2>/dev/null || true
    wait "$watchdog_pid" 2>/dev/null || true

    if [ "$rc" -eq 0 ]; then
      return 0
    fi

    echo "playwright_install_with_deps: attempt $attempt/$attempts failed or timed out after ${timeout_s}s" >&2
    kill_tree "$install_pid" 2>/dev/null || true   # sweep survivors on non-stall failures too
    wait_for_dpkg_lock
    attempt=$((attempt + 1))
    if [ "$attempt" -le "$attempts" ]; then
      sleep 5
    fi
  done
  echo "playwright_install_with_deps: failed after $attempts attempts" >&2
  return 1
  ```

  Notes for the implementer: capture `install_pid=$!` **before** backgrounding the watchdog (which overwrites `$!`); do not use `local` inside the `( … )` watchdog subshell (`now` is a plain var, isolated in the subshell); `wait … || rc=$?` and `kill … || true` keep this safe under `set -euo pipefail`.

- Add one new **stall test** to the playwright group in `test-dispatch-scripts.sh` (after the existing 5, which end at `test-dispatch-scripts.sh:5515`), proving the tree is actually killed before attempt 2:
  - `npx` stub: increments `NPX_COUNT_FILE`, then `sleep 30 &`, records the grandchild PID to `$GRANDCHILD_PIDS`, then `wait` (so the tree stays alive until killed).
  - `timeout` stub: transparent passthrough (`while [[ "$1" == -* ]]; do shift; done; shift; exec "$@"`), optionally logging to `TIMEOUT_LOG_FILE`.
  - **Selective `sleep` stub** (the key to keeping the test fast while letting the watchdog fire): real-sleep only the 1s watchdog deadline, instant otherwise — e.g. `if [[ "$1" == "1" ]]; then exec /bin/sleep 1; fi; exit 0`.  This makes the watchdog's `sleep 1` real (fires) while `kill_tree`'s 2s grace and the retry's `sleep 5` are instant.
  - Env: `PLAYWRIGHT_INSTALL_TIMEOUT=1`, `PLAYWRIGHT_INSTALL_ATTEMPTS=2`, `DPKG_LOCK_FILE=$TMPDIR_TEST/no-dpkg-lock` (nonexistent → `wait_for_dpkg_lock` no-ops), `unset PLAYWRIGHT_BROWSERS_PATH`, use the **real** `kill_tree` (do not override it).
  - Assertions: `NPX_COUNT_FILE` == `2` (attempt 2 ran → attempt 1 was killed and treated as failed → the retry is real); rc nonzero; every recorded grandchild PID is dead (`kill -0 "$pid"` fails for each → the tree was actually killed). Expected runtime ~2s.
- Confirm the existing 5 tests (`test-dispatch-scripts.sh:5308-5515`) still pass: their `npx`-call counts, rc values, "timeout invoked" (still nonempty — the command still calls `timeout`, now with bound `timeout_s+60`), and npx-args assertions are all preserved; the watchdog is inert under their instant `sleep` stub via the elapsed guard. Add `export DPKG_LOCK_FILE="$TMPDIR_TEST/no-dpkg-lock"` to the subshells of the two failure-path tests (both-attempts-fail, `test-dispatch-scripts.sh:5399-5408`, and timeout-stall, `test-dispatch-scripts.sh:5498-5506`) so the new `wait_for_dpkg_lock` call on the failure path can't touch the host's real `/var/lib/dpkg/lock-frontend`.
- Out of scope: `run-acceptance-tests.sh` / `run-smoke-tests.sh` (they treat the function as a 0/nonzero black box — `run-acceptance-tests.sh:33,102`, `run-smoke-tests.sh:39` — no change needed there); the skip-guard and tunables.

**Recommended model:** opus — subtle concurrency/correctness: backgrounding + `wait` + `set -e` interaction, the reparenting race that dictates the looser outer-`timeout` bound, the elapsed-time guard that keeps existing tests green, and zombie/`kill -0` edge cases.

**Dependencies:** Unit 1 (the loop calls `wait_for_dpkg_lock`).

## Reuse

- **`kill_tree` — `lib.sh:1912-1933`** (with `_collect_tree_pids` `lib.sh:1898-1907` and `_pids_with_parent` `lib.sh:2172-2175`): the mandated `ps`-walk tree-kill (SIGTERM → 2s grace → SIGKILL). Do **not** introduce `setsid`/`kill -- -$pid` — the sandbox blocks `pgrep` IPC (comment at `lib.sh:2154`), which is why this repo standardized on the `ps` walk.
- **`flock` usage pattern — `claim_fixed_vite_port`, `lib.sh:2367-2382`**: this repo's non-blocking `flock` convention.
- **degrade-if-absent guard — `lib-decision-log.sh:85-98`** (`command -v flock` at line 87, `flock -w 2 9` at line 95): the model for `wait_for_dpkg_lock`'s no-op degrade when `flock` isn't installed.
- **Test conventions — `test-dispatch-scripts.sh:5284-5306`** (`write_playwright_npx_stub`, `write_playwright_hang_stubs`): heredoc stubs written to `$TMPDIR_TEST/bin` (prepended to `PATH` in `setup`, restored in `teardown`); `setup`/`teardown`/`assert_eq` helpers already used throughout the file.

## Verification

Run the full standalone suite (it exits nonzero if any assertion fails, via `report_results` at `test-dispatch-scripts.sh:35`; the group cannot be isolated, so run the whole file and scan for the playwright / dpkg-lock lines):

```verify
bash /home/n8/natb1/commons.systems/.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

Expect exit 0 and `Results: <N>/<N> passed, 0 failed`, including the 5 existing `playwright_install_with_deps` PASS lines, the new stall-test PASS lines (npx-count 2, rc nonzero, grandchild PIDs dead), and the 4 `wait_for_dpkg_lock` PASS lines.

Manual / observe-in-production (cannot be reproduced locally — the bug requires real `apt-get`/`dpkg` mirror contention, and the root-owned-lock probe permission behavior is CI-specific):
- On the next real CI run that exercises `npx playwright install --with-deps` and actually times out, confirm from the job log that attempt 2 starts from a clean dpkg lock (no `E: Could not get lock /var/lib/dpkg/lock-frontend`) and that the retry visibly runs a second `apt-get` rather than dying instantly — i.e. the 2 attempts are now genuinely independent.
- On that same run, confirm whether `wait_for_dpkg_lock`'s `flock -s -n` shared probe reads the root-owned frontend lock or hits `EACCES` as the non-root `runner` user. If `EACCES` makes the helper always wait out its full window (log shows the "still held after 30s" line on every timeout), file a follow-up to switch the probe to `sudo flock -s -n`. The retry should still succeed regardless, because `kill_tree`'s SIGKILL already frees the killed `apt-get`'s lock.

## Implementation instruction

Implement each unit in a subagent launched via the Agent/Task tool with `model` set to that unit's Recommended model above (Unit 1: sonnet, Unit 2: opus). Supply the unit's Scope and this node's Context to the subagent prompt; constrain it to working-tree edits only.

