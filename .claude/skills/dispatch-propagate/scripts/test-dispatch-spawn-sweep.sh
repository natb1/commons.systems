#!/usr/bin/env bash
# Tests for dispatch-spawn-sweep -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 13858-14354.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-spawn-sweep tests (#1451)
# ============================================================================
echo ""
echo "=== dispatch-spawn-sweep ==="
#
# dispatch-spawn-sweep launches the dispatch-sweep reaper as a transient
# `systemd-run --user` unit. Exercised against a fake `systemd-run` (stub at the
# path DISPATCH_SPAWN_SWEEP_SYSTEMD_RUN_CMD points to) that records its argv — no
# real systemd. DISPATCH_SPAWN_SWEEP_MAIN_WORKTREE points at a synthetic main
# worktree so no git repo is required. The throttle is driven deterministically
# via DISPATCH_SPAWN_SWEEP_THROTTLE_FILE + DISPATCH_SPAWN_SWEEP_NOW. Unlike
# spawn-tick, the sweep installs no recovery/daemon units, so no systemctl stub
# is needed. The test shell runs under `set -e`; each invocation is wrapped to
# capture the exit code.

sw_setup() {
  local stub_body="${1:-}"
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/bin" "$TMPDIR_TEST/main"

  cp "$SCRIPT_DIR/dispatch-spawn-sweep" "$TMPDIR_TEST/scripts/dispatch-spawn-sweep"
  # dispatch-spawn-sweep sources lib.sh via its SCRIPT_DIR — so lib.sh must sit
  # alongside it. Sourced, not executed — no chmod +x.
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/scripts/lib.sh"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-spawn-sweep"

  if [[ -z "$stub_body" ]]; then
    stub_body="echo \"\$*\" >> \"$TMPDIR_TEST/systemd-log\""
  fi
  cat > "$TMPDIR_TEST/bin/systemd-run" <<STUB
#!/usr/bin/env bash
$stub_body
STUB
  chmod +x "$TMPDIR_TEST/bin/systemd-run"

  export DISPATCH_SPAWN_SWEEP_SYSTEMD_RUN_CMD="$TMPDIR_TEST/bin/systemd-run"
  export DISPATCH_SPAWN_SWEEP_MAIN_WORKTREE="$TMPDIR_TEST/main"
  export DISPATCH_SPAWN_SWEEP_THROTTLE_FILE="$TMPDIR_TEST/throttle"
}

sw_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  unset DISPATCH_SPAWN_SWEEP_SYSTEMD_RUN_CMD DISPATCH_SPAWN_SWEEP_MAIN_WORKTREE \
        DISPATCH_SPAWN_SWEEP_THROTTLE_FILE DISPATCH_SWEEP_THROTTLE_S \
        DISPATCH_SPAWN_SWEEP_NOW
}

# --- Test SW1: clean launch → spawned + correct argv -------------------------
echo "Test: a clean dispatch-spawn-sweep launches the dispatch-sweep unit (spawned)"
sw_setup
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-sweep" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "spawned: dispatch-spawn-sweep exits 0" "0" "$rc"
assert_eq "spawned: stdout is 'spawned'" "spawned" "$out"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"--unit=dispatch-sweep"* \
   && "$log" == *"--collect"* \
   && "$log" == *"--property=KillMode=process"* \
   && "$log" == *"--working-directory=$TMPDIR_TEST/main"* \
   && "$log" == *"--setenv=PATH="* \
   && "$log" == *"$TMPDIR_TEST/main/.claude/skills/dispatch-propagate/scripts/dispatch-sweep"* \
   && "$log" != *"OnFailure"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: spawned systemd-run argv (unit + collect + KillMode + cwd + setenv + exec, no OnFailure)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: spawned systemd-run argv (unit + collect + KillMode + cwd + setenv + exec, no OnFailure)"
  echo "    log: $log"
fi
sw_teardown

# --- Test SW2: already-exists collision → deduped ----------------------------
echo "Test: an already-exists systemd-run collision yields 'deduped' (exit 0)"
sw_setup 'echo "Unit dispatch-sweep.service already exists" >&2; exit 1'
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-sweep" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "deduped: dispatch-spawn-sweep exits 0" "0" "$rc"
assert_eq "deduped: stdout is 'deduped'" "deduped" "$out"
sw_teardown

# --- Test SW3: generic failure → stderr surfaced, code passed through --------
echo "Test: a generic systemd-run failure surfaces stderr and passes the code through"
sw_setup 'echo "boom" >&2; exit 1'
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-spawn-sweep" 2>&1 1>/dev/null) || rc=$?
assert_eq "fail: dispatch-spawn-sweep passes the exit code through (1)" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"boom"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: fail: systemd-run stderr is surfaced"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: fail: systemd-run stderr is surfaced"
  echo "    stderr: $err"
fi
# Stamp-AFTER-launch: dispatch-spawn-sweep stamps the throttle file only on the
# spawned/deduped success paths, NOT before systemd-run. A non-dedup launch
# failure (D-Bus down, systemd user instance not running, unit-file permission
# error) must NOT consume the throttle window — stamping before would suppress
# every worker Stop for the next ~300s even though no sweep ran, opening
# multi-minute sweep-coverage gaps on a WSL host with a transiently-unavailable
# systemd user session. Lock that in: after a failed launch the file is ABSENT,
# so the very next worker Stop retries immediately.
TOTAL=$((TOTAL + 1))
if [[ ! -e "$TMPDIR_TEST/throttle" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: fail: throttle file NOT stamped on a failed launch (next Stop retries)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: fail: throttle file NOT stamped on a failed launch (next Stop retries)"
fi
sw_teardown

# --- Test SW4: recent throttle file → throttled, no launch ------------------
echo "Test: a recent throttle file yields 'throttled' and launches nothing"
sw_setup
mkdir -p "$(dirname "$DISPATCH_SPAWN_SWEEP_THROTTLE_FILE")"
: > "$DISPATCH_SPAWN_SWEEP_THROTTLE_FILE"
mtime=$(stat -c %Y "$DISPATCH_SPAWN_SWEEP_THROTTLE_FILE")
export DISPATCH_SPAWN_SWEEP_NOW=$((mtime + 10))
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-sweep" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "throttled: dispatch-spawn-sweep exits 0" "0" "$rc"
assert_eq "throttled: stdout is 'throttled'" "throttled" "$out"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: throttled: no systemd-run invocation recorded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: throttled: no systemd-run invocation recorded"
  echo "    log: $(cat "$TMPDIR_TEST/systemd-log")"
fi
unset DISPATCH_SPAWN_SWEEP_NOW
sw_teardown

# --- Test SW5: stale throttle file → launches (spawned) ----------------------
echo "Test: a stale throttle file (older than the window) launches the sweep (spawned)"
sw_setup
mkdir -p "$(dirname "$DISPATCH_SPAWN_SWEEP_THROTTLE_FILE")"
: > "$DISPATCH_SPAWN_SWEEP_THROTTLE_FILE"
mtime=$(stat -c %Y "$DISPATCH_SPAWN_SWEEP_THROTTLE_FILE")
export DISPATCH_SPAWN_SWEEP_NOW=$((mtime + 600))
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-sweep" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "stale-throttle: dispatch-spawn-sweep exits 0" "0" "$rc"
assert_eq "stale-throttle: stdout is 'spawned'" "spawned" "$out"
TOTAL=$((TOTAL + 1))
if [[ -e "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stale-throttle: systemd-run invocation recorded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stale-throttle: systemd-run invocation recorded"
fi
unset DISPATCH_SPAWN_SWEEP_NOW
sw_teardown

# --- Test SW6: positional argument rejected (exit 2), launches nothing -------
echo "Test: a positional argument exits 2 and launches nothing"
sw_setup
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-spawn-sweep" foo 2>&1 1>/dev/null) || rc=$?
assert_eq "bad-arg: dispatch-spawn-sweep exits 2" "2" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: bad-arg: no systemd-run invocation recorded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: bad-arg: no systemd-run invocation recorded"
  echo "    log: $(cat "$TMPDIR_TEST/systemd-log")"
fi
sw_teardown

# ============================================================================
# ensure_sweep_timer: periodic worktree-sweep timer install (#2023)
# ============================================================================
echo ""
echo "=== ensure_sweep_timer periodic sweep timer ==="
# Issue #2023: the worktree sweep must also run on a durable periodic
# systemd --user timer so idle/drained chains still GC worktrees. These two
# halves cover (a) the install/enable idempotency of ensure_sweep_timer and
# (b) AC#4 — the timer-fired service path reaches dispatch-sweep with no live
# worker. The stubbing idiom is the shared unit-install pattern: a recording
# systemctl stub whose `is-active` exit code is env-driven so the steady-state
# hot path can be exercised.
est_tmp=$(mktemp -d)
mkdir -p "$est_tmp/bin"
cat > "$est_tmp/bin/systemctl" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$STUB_LOG"
for a in "$@"; do
  case "$a" in
    is-active) exit "${STUB_IS_ACTIVE_RC:-0}" ;;
    enable) exit "${STUB_ENABLE_RC:-0}" ;;
    daemon-reload) exit "${STUB_RELOAD_RC:-0}" ;;
  esac
done
exit 0
STUB
chmod +x "$est_tmp/bin/systemctl"
est_unit_dir="$est_tmp/systemd-user"
est_service="$est_unit_dir/dispatch-sweep-periodic.service"
est_timer="$est_unit_dir/dispatch-sweep-periodic.timer"
est_log="$est_tmp/systemctl.log"
# A synthetic main worktree path. ensure_sweep_timer does not require it to
# exist on disk — it only interpolates it into ExecStart=/WorkingDirectory=.
est_main="$est_tmp/main-worktree"

# --- (a) 1. Cold install path -----------------------------------------------
# First call: neither unit exists, so the hot-path short-circuit fails on the
# `-f "$SERVICE_PATH"` test before reaching is-active. Both units are written,
# daemon-reload runs, and enable --now arms the timer.
: > "$est_log"
if (
  export DISPATCH_SWEEP_TIMER_UNIT_DIR="$est_unit_dir"
  export DISPATCH_SWEEP_TIMER_SYSTEMCTL_CMD="$est_tmp/bin/systemctl"
  export STUB_LOG="$est_log"
  export STUB_IS_ACTIVE_RC=0 STUB_ENABLE_RC=0 STUB_RELOAD_RC=0
  source "$SCRIPT_DIR/lib.sh"
  ensure_sweep_timer "$est_main"
); then
  TOTAL=$((TOTAL + 1))
  if [ -f "$est_timer" ] && [ -f "$est_service" ]; then
    PASS=$((PASS + 1)); echo "  PASS: cold path wrote both .timer and .service"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: cold path did not write both unit files"
  fi
  grep -q '^OnUnitActiveSec=' "$est_timer" 2>/dev/null \
    && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: .timer has OnUnitActiveSec="; } \
    || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: .timer missing OnUnitActiveSec="; }
  TOTAL=$((TOTAL + 1))
  if grep -q 'Persistent=' "$est_timer" 2>/dev/null; then
    FAIL=$((FAIL + 1)); echo "  FAIL: .timer contains Persistent= (monotonic timer should not)"
  else
    PASS=$((PASS + 1)); echo "  PASS: .timer has no Persistent="
  fi
  TOTAL=$((TOTAL + 1))
  if grep '^ExecStart=' "$est_service" 2>/dev/null | grep -q 'dispatch-spawn-sweep'; then
    PASS=$((PASS + 1)); echo "  PASS: .service ExecStart points at dispatch-spawn-sweep"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: .service ExecStart does not point at dispatch-spawn-sweep"
  fi
  grep -q 'daemon-reload' "$est_log" \
    && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: cold path ran daemon-reload"; } \
    || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: cold path did not run daemon-reload"; }
  grep -q 'enable --now dispatch-sweep-periodic.timer' "$est_log" \
    && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: cold path ran enable --now dispatch-sweep-periodic.timer"; } \
    || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: cold path did not run enable --now dispatch-sweep-periodic.timer"; }
else
  TOTAL=$((TOTAL + 6)); FAIL=$((FAIL + 6))
  echo "  FAIL: ensure_sweep_timer (cold path) returned non-zero"
fi

# --- (a) 2. Idempotent steady-state path ------------------------------------
# Second call with byte-for-byte identical content (same PATH → identical
# desired_service/desired_timer, same absolute stub) and is-active reporting
# active. The hot-path short-circuit fires: no rewrite (no daemon-reload) and
# no enable. Truncating the log isolates this call's invocations.
: > "$est_log"
est_service_inode_before=$(stat -c '%i' "$est_service" 2>/dev/null || echo missing)
if (
  export DISPATCH_SWEEP_TIMER_UNIT_DIR="$est_unit_dir"
  export DISPATCH_SWEEP_TIMER_SYSTEMCTL_CMD="$est_tmp/bin/systemctl"
  export STUB_LOG="$est_log"
  export STUB_IS_ACTIVE_RC=0 STUB_ENABLE_RC=0 STUB_RELOAD_RC=0
  source "$SCRIPT_DIR/lib.sh"
  ensure_sweep_timer "$est_main"
); then
  TOTAL=$((TOTAL + 1))
  if ! grep -qF 'enable --now dispatch-sweep-periodic.timer' "$est_log"; then
    PASS=$((PASS + 1)); echo "  PASS: idempotent path did not re-run enable"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: idempotent path re-ran enable (hot-path skip did not fire)"
  fi
  # Positive assertion that the hot-path check was actually exercised: an empty
  # log would silently pass the negative enable assertion above, so confirm the
  # is-active short-circuit probe ran.
  TOTAL=$((TOTAL + 1))
  if grep -q 'is-active' "$est_log"; then
    PASS=$((PASS + 1)); echo "  PASS: idempotent path ran the is-active hot-path probe"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: idempotent path did not run the is-active hot-path probe"
  fi
  TOTAL=$((TOTAL + 1))
  if ! grep -q 'daemon-reload' "$est_log"; then
    PASS=$((PASS + 1)); echo "  PASS: idempotent path did not rewrite the units (no daemon-reload)"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: idempotent path rewrote the units (daemon-reload ran)"
  fi
  TOTAL=$((TOTAL + 1))
  if [ "$(stat -c '%i' "$est_service" 2>/dev/null || echo missing)" = "$est_service_inode_before" ]; then
    PASS=$((PASS + 1)); echo "  PASS: idempotent path did not rewrite the .service (inode stable)"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: idempotent path rewrote the .service (inode changed)"
  fi
else
  TOTAL=$((TOTAL + 4)); FAIL=$((FAIL + 4))
  echo "  FAIL: ensure_sweep_timer (idempotent path) returned non-zero"
fi

# --- (a) 3. Inactive self-heal ----------------------------------------------
# Both units on disk match byte-for-byte, but is-active reports inactive (RC=3)
# — the lingering-disabled state after a user-session restart. The hot-path
# short-circuit requires content match AND is-active=0, so it must NOT fire:
# the call proceeds to daemon-reload + enable --now WITHOUT rewriting either
# unit (inode stable). Mirrors the recover unit's inactive self-heal case.
: > "$est_log"
est_service_inode_heal=$(stat -c '%i' "$est_service" 2>/dev/null || echo missing)
est_timer_inode_heal=$(stat -c '%i' "$est_timer" 2>/dev/null || echo missing)
if (
  export DISPATCH_SWEEP_TIMER_UNIT_DIR="$est_unit_dir"
  export DISPATCH_SWEEP_TIMER_SYSTEMCTL_CMD="$est_tmp/bin/systemctl"
  export STUB_LOG="$est_log"
  export STUB_IS_ACTIVE_RC=3 STUB_ENABLE_RC=0 STUB_RELOAD_RC=0
  source "$SCRIPT_DIR/lib.sh"
  ensure_sweep_timer "$est_main"
); then
  TOTAL=$((TOTAL + 1))
  if grep -qF 'enable --now dispatch-sweep-periodic.timer' "$est_log"; then
    PASS=$((PASS + 1)); echo "  PASS: inactive self-heal ran enable --now"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: inactive self-heal did not run enable --now"
  fi
  TOTAL=$((TOTAL + 1))
  if grep -q 'daemon-reload' "$est_log"; then
    PASS=$((PASS + 1)); echo "  PASS: inactive self-heal ran daemon-reload"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: inactive self-heal skipped daemon-reload"
  fi
  TOTAL=$((TOTAL + 1))
  if [ "$(stat -c '%i' "$est_service" 2>/dev/null || echo missing)" = "$est_service_inode_heal" ] \
     && [ "$(stat -c '%i' "$est_timer" 2>/dev/null || echo missing)" = "$est_timer_inode_heal" ]; then
    PASS=$((PASS + 1)); echo "  PASS: inactive self-heal did not rewrite the unchanged units (inodes stable)"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: inactive self-heal rewrote the unchanged units (inode changed)"
  fi
else
  TOTAL=$((TOTAL + 3)); FAIL=$((FAIL + 3))
  echo "  FAIL: ensure_sweep_timer (inactive self-heal) returned non-zero"
fi

rm -rf "$est_tmp"

# ============================================================================
# ensure_sweep_timer: input-validation rejection guards (#2023)
# ============================================================================
# Each malformed main_worktree path (newline, space, double-quote, backslash)
# must be rejected: ensure_sweep_timer returns non-zero, emits a WARNING, and
# writes no unit file. Mirrors the ensure_recover_unit double-quote/backslash
# rejection tests. A shared recording systemctl stub stands in so a missing
# guard that fell through to the install path would still be detectable.
est_rej_tmp=$(mktemp -d)
mkdir -p "$est_rej_tmp/bin"
cat > "$est_rej_tmp/bin/systemctl" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
chmod +x "$est_rej_tmp/bin/systemctl"
est_rej_service="$est_rej_tmp/systemd-user/dispatch-sweep-periodic.service"
est_rej_timer="$est_rej_tmp/systemd-user/dispatch-sweep-periodic.timer"

# Each entry: a label and a path fragment carrying the forbidden character.
# The newline case uses an ANSI-C $'...' literal.
est_run_reject() {
  local label="$1" badpath="$2"
  local rc=0 err
  err=$( (
    export DISPATCH_SWEEP_TIMER_UNIT_DIR="$est_rej_tmp/systemd-user"
    export DISPATCH_SWEEP_TIMER_SYSTEMCTL_CMD="$est_rej_tmp/bin/systemctl"
    source "$SCRIPT_DIR/lib.sh"
    ensure_sweep_timer "$badpath"
  ) 2>&1 1>/dev/null ) || rc=$?
  TOTAL=$((TOTAL + 1))
  if [[ "$rc" -ne 0 ]]; then
    PASS=$((PASS + 1)); echo "  PASS: reject-$label: ensure_sweep_timer returned non-zero"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: reject-$label: ensure_sweep_timer returned zero"
  fi
  TOTAL=$((TOTAL + 1))
  if [[ "$err" == *WARNING* ]]; then
    PASS=$((PASS + 1)); echo "  PASS: reject-$label: emitted a WARNING to stderr"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: reject-$label: no WARNING on stderr"
  fi
  TOTAL=$((TOTAL + 1))
  if [[ ! -e "$est_rej_service" && ! -e "$est_rej_timer" ]]; then
    PASS=$((PASS + 1)); echo "  PASS: reject-$label: no unit file was written"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: reject-$label: a unit file was written"
  fi
}
echo ""
echo "=== ensure_sweep_timer rejects malformed main worktree paths ==="
est_run_reject "newline" "$est_rej_tmp/has"$'\n'"newline"
est_run_reject "space" "$est_rej_tmp/has a space"
est_run_reject "double-quote" "$est_rej_tmp/has\"a\"quote"
est_run_reject "backslash" "$est_rej_tmp/has\\a\\slash"
unset -f est_run_reject
rm -rf "$est_rej_tmp"

# ============================================================================
# ensure_sweep_timer: systemctl failure paths warn + return non-zero (#2023)
# ============================================================================
# daemon-reload failure and enable --now failure must each cause a non-zero
# return with a WARNING to stderr (warn + return per the helper's contract —
# never a hard exit). Mirrors the recover unit's degrade tests.
est_fail_tmp=$(mktemp -d)
mkdir -p "$est_fail_tmp/bin"
cat > "$est_fail_tmp/bin/systemctl" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$STUB_LOG"
for a in "$@"; do
  case "$a" in
    is-active) exit "${STUB_IS_ACTIVE_RC:-0}" ;;
    enable) exit "${STUB_ENABLE_RC:-0}" ;;
    daemon-reload) exit "${STUB_RELOAD_RC:-0}" ;;
  esac
done
exit 0
STUB
chmod +x "$est_fail_tmp/bin/systemctl"
est_fail_log="$est_fail_tmp/systemctl.log"
est_fail_main="$est_fail_tmp/main-worktree"

echo ""
echo "=== ensure_sweep_timer degrades on systemctl failures ==="
# --- daemon-reload failure ---------------------------------------------------
: > "$est_fail_log"
est_reload_rc=0
est_reload_err=$( (
  export DISPATCH_SWEEP_TIMER_UNIT_DIR="$est_fail_tmp/reload-fail"
  export DISPATCH_SWEEP_TIMER_SYSTEMCTL_CMD="$est_fail_tmp/bin/systemctl"
  export STUB_LOG="$est_fail_log"
  export STUB_IS_ACTIVE_RC=0 STUB_ENABLE_RC=0 STUB_RELOAD_RC=1
  source "$SCRIPT_DIR/lib.sh"
  ensure_sweep_timer "$est_fail_main"
) 2>&1 1>/dev/null ) || est_reload_rc=$?
TOTAL=$((TOTAL + 1))
if [[ "$est_reload_rc" -ne 0 ]]; then
  PASS=$((PASS + 1)); echo "  PASS: daemon-reload failure → non-zero return"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: daemon-reload failure returned zero"
fi
TOTAL=$((TOTAL + 1))
if [[ "$est_reload_err" == *WARNING* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: daemon-reload failure emitted a WARNING"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: daemon-reload failure did not emit a WARNING"
fi
TOTAL=$((TOTAL + 1))
if ! grep -q 'enable' "$est_fail_log"; then
  PASS=$((PASS + 1)); echo "  PASS: daemon-reload failure did not reach enable"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: daemon-reload failure reached enable despite reload failure"
fi

# --- enable --now failure ----------------------------------------------------
: > "$est_fail_log"
est_enable_rc=0
est_enable_err=$( (
  export DISPATCH_SWEEP_TIMER_UNIT_DIR="$est_fail_tmp/enable-fail"
  export DISPATCH_SWEEP_TIMER_SYSTEMCTL_CMD="$est_fail_tmp/bin/systemctl"
  export STUB_LOG="$est_fail_log"
  export STUB_IS_ACTIVE_RC=0 STUB_ENABLE_RC=1 STUB_RELOAD_RC=0
  source "$SCRIPT_DIR/lib.sh"
  ensure_sweep_timer "$est_fail_main"
) 2>&1 1>/dev/null ) || est_enable_rc=$?
TOTAL=$((TOTAL + 1))
if [[ "$est_enable_rc" -ne 0 ]]; then
  PASS=$((PASS + 1)); echo "  PASS: enable --now failure → non-zero return"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: enable --now failure returned zero"
fi
TOTAL=$((TOTAL + 1))
if [[ "$est_enable_err" == *WARNING* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: enable --now failure emitted a WARNING"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: enable --now failure did not emit a WARNING"
fi
echo "  (test shell survived the degrade paths)"
rm -rf "$est_fail_tmp"

# --- (b) AC#4: the timer path invokes the sweep with no live worker ----------
# Model the timer firing by running the .service's ExecStart command directly
# (dispatch-spawn-sweep) under the sw_setup harness, in the default no-live-
# worker environment. dispatch-spawn-sweep itself does not consult
# `claude agents --json` — "no live worker" here is the ambient default with no
# Stop hook driving the launch — so reaching the recorded `--unit=dispatch-sweep`
# systemd-run argv proves the timer path reaches the sweep unconditionally,
# exactly as the periodic timer fires it. Clones the SW1 argv assertion.
echo "Test: AC#4 #2023 — the timer-fired service path launches dispatch-sweep with no live worker"
sw_setup
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-sweep" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "ac4-timer: dispatch-spawn-sweep exits 0" "0" "$rc"
assert_eq "ac4-timer: stdout is 'spawned'" "spawned" "$out"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"--unit=dispatch-sweep"* \
   && "$log" == *"--working-directory=$TMPDIR_TEST/main"* \
   && "$log" == *"$TMPDIR_TEST/main/.claude/skills/dispatch-propagate/scripts/dispatch-sweep"* \
   && "$log" != *"OnFailure"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: ac4-timer: timer path reached dispatch-sweep (unit + cwd + exec, no OnFailure)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: ac4-timer: timer path reached dispatch-sweep (unit + cwd + exec, no OnFailure)"
  echo "    log: $log"
fi
sw_teardown

# <<< END MOVED <<<

report_results
