#!/usr/bin/env bash
# Tests for dispatch-spawn-tick -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 13637-13857.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# The host-unit-dir leak guard that used to live here is now armed for EVERY
# suite by dispatch-test-fixture.sh (dispatch_host_systemd_guard_check): it
# resolves the unit dir the way lib.sh does, covers all five installable units
# plus the timers.target.wants symlink set, records any call that reaches the
# real `systemctl`, and re-checks from both report_results and an EXIT trap so
# an abort under `set -e` cannot skip it. Each harness below still must wire its
# *_UNIT_DIR / *_SYSTEMCTL_CMD pairs into the tmp sandbox (see st_setup).

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-spawn-tick tests
# ============================================================================
echo "=== dispatch-spawn-tick ==="
#
# dispatch-spawn-tick launches the headless dispatch-tick as a transient
# `systemd-run --user` unit. It is exercised against a fake `systemd-run` — a
# stub DISPATCH_SPAWN_TICK_SYSTEMD_RUN_CMD points at by absolute path that records
# its argv to a log file — so no real systemd is needed. DISPATCH_SPAWN_TICK_MAIN_WORKTREE
# points at a synthetic main worktree so no git repo is required.
#
# The test shell runs under `set -e`; dispatch-spawn-tick can exit non-zero, so
# every invocation is wrapped in an `if`/`|| rc=$?` to capture the code.

# st_setup [systemd-stub-body]
#   Build a fresh tmp tree with a copy of dispatch-spawn-tick + lib.sh and a fake
#   systemd-run. The optional first arg is the body of the systemd-run stub; the
#   default records argv to systemd-log and exits 0 (the "spawned" success path).
st_setup() {
  local stub_body="${1:-}"
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/bin" "$TMPDIR_TEST/main"

  cp "$SCRIPT_DIR/dispatch-spawn-tick" "$TMPDIR_TEST/scripts/dispatch-spawn-tick"
  # dispatch-spawn-tick sources lib.sh via its SCRIPT_DIR — so lib.sh must sit
  # alongside it. Sourced, not executed — no chmod +x.
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/scripts/lib.sh"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-spawn-tick"

  if [[ -z "$stub_body" ]]; then
    stub_body="echo \"\$*\" >> \"$TMPDIR_TEST/systemd-log\""
  fi
  cat > "$TMPDIR_TEST/bin/systemd-run" <<STUB
#!/usr/bin/env bash
$stub_body
STUB
  chmod +x "$TMPDIR_TEST/bin/systemd-run"

  export DISPATCH_SPAWN_TICK_SYSTEMD_RUN_CMD="$TMPDIR_TEST/bin/systemd-run"
  export DISPATCH_SPAWN_TICK_MAIN_WORKTREE="$TMPDIR_TEST/main"

  # dispatch-spawn-tick now calls ensure_recover_unit (lib.sh), which without
  # isolation would write to the real ~/.config/systemd/user/ and run a real
  # `systemctl --user daemon-reload`. Redirect the unit dir into the tmp tree
  # and point its systemctl at a no-op stub so daemon-reload is harmless.
  cat > "$TMPDIR_TEST/bin/systemctl" <<STUB
#!/usr/bin/env bash
# subcommand-aware systemctl stub (#2013). Find the first non-flag arg.
sub=""
for a in "\$@"; do
  case "\$a" in --*) ;; *) sub="\$a"; break ;; esac
done
echo "\$*" >> "$TMPDIR_TEST/systemctl-log"
case "\$sub" in
  is-failed)    exit "\${ST_IS_FAILED_RC:-1}" ;;
  reset-failed) exit 0 ;;
  *)            exit 0 ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/systemctl"
  export DISPATCH_RECOVER_UNIT_DIR="$TMPDIR_TEST/systemd-user"
  export DISPATCH_RECOVER_SYSTEMCTL_CMD="$TMPDIR_TEST/bin/systemctl"
  export DISPATCH_SWEEP_TIMER_UNIT_DIR="$TMPDIR_TEST/systemd-user"
  export DISPATCH_SWEEP_TIMER_SYSTEMCTL_CMD="$TMPDIR_TEST/bin/systemctl"
  export DISPATCH_HEARTBEAT_UNIT_DIR="$TMPDIR_TEST/systemd-user"
  export DISPATCH_HEARTBEAT_SYSTEMCTL_CMD="$TMPDIR_TEST/bin/systemctl"
  export DISPATCH_SPAWN_TICK_SYSTEMCTL_CMD="$TMPDIR_TEST/bin/systemctl"
}

st_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  unset DISPATCH_SPAWN_TICK_SYSTEMD_RUN_CMD
  unset DISPATCH_SPAWN_TICK_MAIN_WORKTREE
  unset DISPATCH_RECOVER_UNIT_DIR DISPATCH_RECOVER_SYSTEMCTL_CMD DISPATCH_SWEEP_TIMER_UNIT_DIR DISPATCH_SWEEP_TIMER_SYSTEMCTL_CMD DISPATCH_HEARTBEAT_UNIT_DIR DISPATCH_HEARTBEAT_SYSTEMCTL_CMD
  unset DISPATCH_SPAWN_TICK_SYSTEMCTL_CMD ST_IS_FAILED_RC
}

# --- Test 1: no-arg launch → spawned, exit 0, correct argv -------------------

echo "Test: a no-arg dispatch-spawn-tick launches the bare dispatch-tick unit"
st_setup
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-tick" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "no-arg: dispatch-spawn-tick exits 0" "0" "$rc"
assert_eq "no-arg: stdout is 'spawned'" "spawned" "$out"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"--unit=dispatch-tick"* \
   && "$log" == *"--collect"* \
   && "$log" == *"--property=OnFailure=dispatch-tick-recover.service"* \
   && "$log" == *"--property=KillMode=process"* \
   && "$log" == *"--working-directory=$TMPDIR_TEST/main"* \
   && "$log" == *"--setenv=PATH="* \
   && "$log" == *"$TMPDIR_TEST/main/.claude/skills/dispatch-propagate/scripts/dispatch-tick"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: no-arg systemd-run argv (unit + collect + OnFailure + KillMode + cwd + setenv + exec)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: no-arg systemd-run argv (unit + collect + OnFailure + KillMode + cwd + setenv + exec)"
  echo "    log: $log"
fi
# No trailing numeric arg in the no-arg case: the exec path must be the LAST
# token (allowing for systemd-run's `$*` space-joined trailing whitespace).
TOTAL=$((TOTAL + 1))
last_tok=$(printf '%s\n' "$log" | tail -n1 | awk '{print $NF}')
if [[ "$last_tok" == "$TMPDIR_TEST/main/.claude/skills/dispatch-propagate/scripts/dispatch-tick" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: no-arg: exec path is the last argv token (no trailing <N>)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: no-arg: exec path is the last argv token (no trailing <N>)"
  echo "    last token: $last_tok"
fi
st_teardown

# --- Test 2: target-keyed launch → dispatch-tick-<N> unit + trailing <N> ------

echo "Test: a target-keyed dispatch-spawn-tick 979 launches the dispatch-tick-979 unit"
st_setup
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-tick" 979 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "target: dispatch-spawn-tick exits 0" "0" "$rc"
assert_eq "target: stdout is 'spawned'" "spawned" "$out"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"--unit=dispatch-tick-979"* \
   && "$log" == *"--property=OnFailure=dispatch-tick-recover.service"* \
   && "$log" == *"--property=KillMode=process"* \
   && "$log" == *"$TMPDIR_TEST/main/.claude/skills/dispatch-propagate/scripts/dispatch-tick 979"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: target systemd-run argv (unit=dispatch-tick-979 + OnFailure + KillMode + exec path 979)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: target systemd-run argv (unit=dispatch-tick-979 + OnFailure + KillMode + exec path 979)"
  echo "    log: $log"
fi
st_teardown

# --- Test 3: idempotency — already-exists collision → deduped ----------------

echo "Test: an already-exists systemd-run collision yields 'deduped' (exit 0)"
st_setup 'echo "Unit dispatch-tick.service already exists" >&2; exit 1'
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-tick" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "deduped: dispatch-spawn-tick exits 0" "0" "$rc"
assert_eq "deduped: stdout is 'deduped'" "deduped" "$out"
# Negative assertion: is-failed returns non-zero (ST_IS_FAILED_RC unset → default
# exit 1), so the gate must not invoke reset-failed on a running tick (#2013).
sclog=$(cat "$TMPDIR_TEST/systemctl-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$sclog" != *"reset-failed"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: deduped: reset-failed was NOT called (is-failed gate held)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: deduped: reset-failed was NOT called (is-failed gate held)"
  echo "    systemctl-log: $sclog"
fi
st_teardown

# --- Test 4: a generic systemd-run failure passes the exit code through -------

echo "Test: a generic systemd-run failure surfaces stderr and passes the code through"
st_setup 'echo "boom" >&2; exit 1'
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-spawn-tick" 2>&1 1>/dev/null) || rc=$?
assert_eq "fail: dispatch-spawn-tick passes the exit code through (1)" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"boom"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: fail: systemd-run stderr is surfaced"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: fail: systemd-run stderr is surfaced"
  echo "    stderr: $err"
fi
st_teardown

# --- Test 5: a flag-like target argument is rejected (exit 2) ----------------

echo "Test: a flag-like target argument exits 2 and launches nothing"
st_setup
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-spawn-tick" --repo 2>&1 1>/dev/null) || rc=$?
assert_eq "bad-target-flag: dispatch-spawn-tick exits 2" "2" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: bad-target-flag: no systemd-run invocation recorded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: bad-target-flag: no systemd-run invocation recorded"
  echo "    log: $(cat "$TMPDIR_TEST/systemd-log")"
fi
st_teardown

# --- Test 6: a non-numeric target argument is rejected (exit 2) --------------

echo "Test: a non-numeric target argument exits 2 and launches nothing"
st_setup
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-spawn-tick" abc 2>&1 1>/dev/null) || rc=$?
assert_eq "bad-target-nonnum: dispatch-spawn-tick exits 2" "2" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: bad-target-nonnum: no systemd-run invocation recorded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: bad-target-nonnum: no systemd-run invocation recorded"
  echo "    log: $(cat "$TMPDIR_TEST/systemd-log")"
fi
st_teardown

# --- Test 7: a stale failed unit is reset-failed, then the tick spawns --------

echo "Test: a pre-existing failed dispatch-tick unit yields a spawned tick (not a silent deduped), and reset-failed was called (#2013)"
st_setup
export ST_IS_FAILED_RC=0
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-tick" 2>/dev/null); then rc=0; else rc=$?; fi
unset ST_IS_FAILED_RC
assert_eq "failed-unit: dispatch-spawn-tick exits 0" "0" "$rc"
assert_eq "failed-unit: stdout is 'spawned' (not deduped)" "spawned" "$out"
sclog=$(cat "$TMPDIR_TEST/systemctl-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$sclog" == *"reset-failed dispatch-tick.service"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: failed-unit: reset-failed dispatch-tick.service was called"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: failed-unit: reset-failed dispatch-tick.service was called"
  echo "    systemctl-log: $sclog"
fi
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ -e "$TMPDIR_TEST/systemd-log" && "$log" == *"--unit=dispatch-tick"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: failed-unit: the launch happened (--unit=dispatch-tick recorded)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: failed-unit: the launch happened (--unit=dispatch-tick recorded)"
  echo "    log: $log"
fi
st_teardown

# <<< END MOVED <<<

# The host-unit-dir leak re-check runs inside report_results (and, on an early
# abort, from the fixture's EXIT trap).
report_results
