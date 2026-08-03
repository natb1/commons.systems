#!/usr/bin/env bash
# Tests for lib-systemd-units -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 25157-25625.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# ensure_recover_unit: WorkingDirectory= is unquoted and absolute (#1203)
# ============================================================================
echo ""
echo "=== ensure_recover_unit WorkingDirectory= quoting ==="
# Regression: systemd's WorkingDirectory= does not unescape quotes; a quoted
# value makes the path non-absolute and the unit loads as bad-setting, so the
# OnFailure= recovery never fires. Assert the emitted line is bare + absolute.
eru_tmp=$(mktemp -d)
mkdir -p "$eru_tmp/bin"
mkdir -p "$eru_tmp/main-worktree"
cat > "$eru_tmp/bin/systemctl" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
chmod +x "$eru_tmp/bin/systemctl"
if (
  export DISPATCH_RECOVER_UNIT_DIR="$eru_tmp/systemd-user"
  export DISPATCH_RECOVER_SYSTEMCTL_CMD="$eru_tmp/bin/systemctl"
  source "$SCRIPT_DIR/lib.sh"
  ensure_recover_unit "$eru_tmp/main-worktree"
); then
  eru_unit="$eru_tmp/systemd-user/dispatch-tick-recover.service"
  if eru_wd_line=$(grep '^WorkingDirectory=' "$eru_unit" 2>/dev/null); then
    assert_eq "WorkingDirectory= is the bare absolute path (no quotes)" \
      "WorkingDirectory=$eru_tmp/main-worktree" "$eru_wd_line"
    # Guard the specific defect: no leading double-quote after the '='.
    TOTAL=$((TOTAL + 1))
    if [[ "$eru_wd_line" != 'WorkingDirectory="'* ]]; then
      PASS=$((PASS + 1)); echo "  PASS: WorkingDirectory= value is not double-quoted"
    else
      FAIL=$((FAIL + 1)); echo "  FAIL: WorkingDirectory= value is double-quoted: $eru_wd_line"
    fi
  else
    TOTAL=$((TOTAL + 2)); FAIL=$((FAIL + 2))
    echo "  FAIL: unit file missing or lacks WorkingDirectory= line: $eru_unit"
  fi
else
  TOTAL=$((TOTAL + 2)); FAIL=$((FAIL + 2))
  echo "  FAIL: ensure_recover_unit returned non-zero"
fi
rm -rf "$eru_tmp"

# ============================================================================
# ensure_recover_unit: rejects a path containing a space (#1211)
# ============================================================================
echo ""
echo "=== ensure_recover_unit rejects a path with a space ==="
eru2_tmp=$(mktemp -d)
mkdir -p "$eru2_tmp/bin"
cat > "$eru2_tmp/bin/systemctl" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
chmod +x "$eru2_tmp/bin/systemctl"
TOTAL=$((TOTAL + 1))
if (
  export DISPATCH_RECOVER_UNIT_DIR="$eru2_tmp/systemd-user"
  export DISPATCH_RECOVER_SYSTEMCTL_CMD="$eru2_tmp/bin/systemctl"
  source "$SCRIPT_DIR/lib.sh"
  ensure_recover_unit "$eru2_tmp/has a space"
); then
  FAIL=$((FAIL + 1)); echo "  FAIL: ensure_recover_unit should have returned non-zero for a path with a space"
else
  PASS=$((PASS + 1)); echo "  PASS: ensure_recover_unit returned non-zero for a path with a space"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -e "$eru2_tmp/systemd-user/dispatch-tick-recover.service" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: no unit file was written for a path with a space"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: unit file was written despite path containing a space"
fi
rm -rf "$eru2_tmp"

# ============================================================================
# ensure_recover_unit: rejects a path containing a double-quote (#1211)
# ============================================================================
echo ""
echo "=== ensure_recover_unit rejects a path with a double-quote ==="
eru3_tmp=$(mktemp -d)
mkdir -p "$eru3_tmp/bin"
cat > "$eru3_tmp/bin/systemctl" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
chmod +x "$eru3_tmp/bin/systemctl"
TOTAL=$((TOTAL + 1))
if (
  export DISPATCH_RECOVER_UNIT_DIR="$eru3_tmp/systemd-user"
  export DISPATCH_RECOVER_SYSTEMCTL_CMD="$eru3_tmp/bin/systemctl"
  source "$SCRIPT_DIR/lib.sh"
  ensure_recover_unit "$eru3_tmp/has\"a\"quote"
); then
  FAIL=$((FAIL + 1)); echo "  FAIL: ensure_recover_unit should have returned non-zero for a path with a double-quote"
else
  PASS=$((PASS + 1)); echo "  PASS: ensure_recover_unit returned non-zero for a path with a double-quote"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -e "$eru3_tmp/systemd-user/dispatch-tick-recover.service" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: no unit file was written for a path with a double-quote"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: unit file was written despite path containing a double-quote"
fi
rm -rf "$eru3_tmp"

# ============================================================================
# ensure_recover_unit: PATH backslash is stripped from Environment= (#1212)
# ============================================================================
echo ""
echo "=== ensure_recover_unit strips backslash from Environment= PATH ==="
eru4_tmp=$(mktemp -d)
mkdir -p "$eru4_tmp/bin"
mkdir -p "$eru4_tmp/main-worktree"
cat > "$eru4_tmp/bin/systemctl" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
chmod +x "$eru4_tmp/bin/systemctl"
if (
  export DISPATCH_RECOVER_UNIT_DIR="$eru4_tmp/systemd-user"
  export DISPATCH_RECOVER_SYSTEMCTL_CMD="$eru4_tmp/bin/systemctl"
  export PATH="/usr/bin:/mnt/c/win\\dows:$PATH"
  source "$SCRIPT_DIR/lib.sh"
  ensure_recover_unit "$eru4_tmp/main-worktree"
); then
  eru4_unit="$eru4_tmp/systemd-user/dispatch-tick-recover.service"
  if eru4_env_line=$(grep '^Environment=' "$eru4_unit" 2>/dev/null); then
    TOTAL=$((TOTAL + 1))
    if [[ "$eru4_env_line" != *'\'* ]]; then
      PASS=$((PASS + 1)); echo "  PASS: Environment= PATH has no backslash (stripped)"
    else
      FAIL=$((FAIL + 1)); echo "  FAIL: Environment= PATH still contains a backslash: $eru4_env_line"
    fi
    TOTAL=$((TOTAL + 1))
    if [[ "$eru4_env_line" == 'Environment="PATH='* ]]; then
      PASS=$((PASS + 1)); echo "  PASS: Environment= line is well-formed (PATH= prefix intact)"
    else
      FAIL=$((FAIL + 1)); echo "  FAIL: Environment= line is malformed: $eru4_env_line"
    fi
    TOTAL=$((TOTAL + 1))
    if [[ "$eru4_env_line" == *'/mnt/c/windows'* ]]; then
      PASS=$((PASS + 1)); echo "  PASS: backslash removal merged the path segment to /mnt/c/windows"
    else
      FAIL=$((FAIL + 1)); echo "  FAIL: /mnt/c/windows not found in Environment= line: $eru4_env_line"
    fi
  else
    TOTAL=$((TOTAL + 3)); FAIL=$((FAIL + 3))
    echo "  FAIL: unit file missing or lacks Environment= line: $eru4_unit"
  fi
else
  TOTAL=$((TOTAL + 3)); FAIL=$((FAIL + 3))
  echo "  FAIL: ensure_recover_unit returned non-zero"
fi
rm -rf "$eru4_tmp"

# ============================================================================
# ensure_recover_unit: rejects a path containing a backslash (#1212)
# ============================================================================
echo ""
echo "=== ensure_recover_unit rejects a path with a backslash ==="
eru5_tmp=$(mktemp -d)
mkdir -p "$eru5_tmp/bin"
cat > "$eru5_tmp/bin/systemctl" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
chmod +x "$eru5_tmp/bin/systemctl"
TOTAL=$((TOTAL + 1))
if (
  export DISPATCH_RECOVER_UNIT_DIR="$eru5_tmp/systemd-user"
  export DISPATCH_RECOVER_SYSTEMCTL_CMD="$eru5_tmp/bin/systemctl"
  source "$SCRIPT_DIR/lib.sh"
  ensure_recover_unit "$eru5_tmp/has\\a\\backslash"
); then
  FAIL=$((FAIL + 1)); echo "  FAIL: ensure_recover_unit should have returned non-zero for a path with a backslash"
else
  PASS=$((PASS + 1)); echo "  PASS: ensure_recover_unit returned non-zero for a path with a backslash"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -e "$eru5_tmp/systemd-user/dispatch-tick-recover.service" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: no unit file was written for a path with a backslash"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: unit file was written despite path containing a backslash"
fi
rm -rf "$eru5_tmp"

# ============================================================================
# ensure_heartbeat_units: correct unit content + idempotency (#2022)
# ============================================================================
#
# Uses the shared unit-install recording-stub idiom: a recording
# systemctl stub appends its argv to $ehu_log and returns exit codes driven by
# STUB_IS_ACTIVE_RC / STUB_ENABLE_RC / STUB_RELOAD_RC env flags.  Cold path
# (unit files absent): writes both unit files, runs daemon-reload and enable
# --now.  Hot path (both units byte-identical AND timer active): returns early
# without daemon-reload or enable --now.
echo ""
echo "=== ensure_heartbeat_units: unit content + idempotency (#2022) ==="
ehu_tmp=$(mktemp -d)
mkdir -p "$ehu_tmp/bin" "$ehu_tmp/main-worktree"
cat > "$ehu_tmp/bin/systemctl" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$STUB_LOG"
for a in "$@"; do
  case "$a" in
    show) printf '%s\n' "${STUB_SUBSTATE-dead}"; exit 0 ;;
    is-active) exit "${STUB_IS_ACTIVE_RC:-0}" ;;
    enable)    exit "${STUB_ENABLE_RC:-0}" ;;
    restart)   exit "${STUB_RESTART_RC:-0}" ;;
    daemon-reload) exit "${STUB_RELOAD_RC:-0}" ;;
  esac
done
exit 0
STUB
chmod +x "$ehu_tmp/bin/systemctl"
ehu_unit_dir="$ehu_tmp/systemd-user"
ehu_svc="$ehu_unit_dir/dispatch-heartbeat.service"
ehu_tmr="$ehu_unit_dir/dispatch-heartbeat.timer"
ehu_log="$ehu_tmp/systemctl.log"

# --- 1. Cold path: writes both unit files, runs daemon-reload + enable --now -
: > "$ehu_log"
if (
  export DISPATCH_HEARTBEAT_UNIT_DIR="$ehu_unit_dir"
  export DISPATCH_HEARTBEAT_SYSTEMCTL_CMD="$ehu_tmp/bin/systemctl"
  export STUB_LOG="$ehu_log"
  export STUB_SUBSTATE=dead STUB_ENABLE_RC=0 STUB_RESTART_RC=0 STUB_RELOAD_RC=0
  source "$SCRIPT_DIR/lib.sh"
  ensure_heartbeat_units "$ehu_tmp/main-worktree"
); then
  if [ -f "$ehu_svc" ]; then
    TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: cold path wrote dispatch-heartbeat.service"
    grep -qF '/dispatch-tick' "$ehu_svc" \
      && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: service ExecStart= references dispatch-tick"; } \
      || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: service ExecStart= missing dispatch-tick"; }
    grep -q '^KillMode=process$' "$ehu_svc" \
      && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: service has KillMode=process"; } \
      || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: service missing KillMode=process"; }
    grep -q '^OnFailure=dispatch-tick-recover.service$' "$ehu_svc" \
      && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: service has OnFailure=dispatch-tick-recover.service"; } \
      || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: service missing OnFailure=dispatch-tick-recover.service"; }
  else
    TOTAL=$((TOTAL + 4)); FAIL=$((FAIL + 4))
    echo "  FAIL: cold path did not write dispatch-heartbeat.service"
  fi
  if [ -f "$ehu_tmr" ]; then
    TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: cold path wrote dispatch-heartbeat.timer"
    grep -q '^OnCalendar=\*:0/15$' "$ehu_tmr" \
      && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: timer has OnCalendar=*:0/15"; } \
      || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: timer missing OnCalendar=*:0/15"; }
    grep -q '^OnBootSec=2min$' "$ehu_tmr" \
      && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: timer has OnBootSec=2min"; } \
      || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: timer missing OnBootSec=2min"; }
    grep -q '^Persistent=true$' "$ehu_tmr" \
      && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: timer has Persistent=true"; } \
      || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: timer missing Persistent=true"; }
    grep -q '^RandomizedDelaySec=30$' "$ehu_tmr" \
      && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: timer has RandomizedDelaySec=30"; } \
      || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: timer missing RandomizedDelaySec=30"; }
  else
    TOTAL=$((TOTAL + 5)); FAIL=$((FAIL + 5))
    echo "  FAIL: cold path did not write dispatch-heartbeat.timer"
  fi
  grep -q 'daemon-reload' "$ehu_log" \
    && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: cold path ran daemon-reload"; } \
    || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: cold path did not run daemon-reload"; }
  grep -q 'enable dispatch-heartbeat.timer' "$ehu_log" \
    && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: cold path ran enable dispatch-heartbeat.timer"; } \
    || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: cold path did not run enable dispatch-heartbeat.timer"; }
  grep -q 'restart dispatch-heartbeat.timer' "$ehu_log" \
    && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: cold path ran restart dispatch-heartbeat.timer"; } \
    || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: cold path did not run restart dispatch-heartbeat.timer"; }
else
  TOTAL=$((TOTAL + 12)); FAIL=$((FAIL + 12))
  echo "  FAIL: ensure_heartbeat_units (cold path) returned non-zero"
fi

# --- 2. Hot path: both units byte-identical + timer armed → no-op -------------
# The hot-path short-circuit checks SubState (STUB_SUBSTATE=waiting → armed); it
# returns early and must not run daemon-reload, enable, or restart.
: > "$ehu_log"
if (
  export DISPATCH_HEARTBEAT_UNIT_DIR="$ehu_unit_dir"
  export DISPATCH_HEARTBEAT_SYSTEMCTL_CMD="$ehu_tmp/bin/systemctl"
  export STUB_LOG="$ehu_log"
  export STUB_SUBSTATE=waiting STUB_ENABLE_RC=0 STUB_RESTART_RC=0 STUB_RELOAD_RC=0
  source "$SCRIPT_DIR/lib.sh"
  ensure_heartbeat_units "$ehu_tmp/main-worktree"
); then
  TOTAL=$((TOTAL + 1))
  if ! grep -q 'daemon-reload' "$ehu_log"; then
    PASS=$((PASS + 1)); echo "  PASS: hot path did not rewrite units (no daemon-reload)"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: hot path ran daemon-reload (spurious rewrite)"
  fi
  TOTAL=$((TOTAL + 1))
  if ! grep -q 'enable' "$ehu_log"; then
    PASS=$((PASS + 1)); echo "  PASS: hot path did not re-run enable"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: hot path re-ran enable"
  fi
  TOTAL=$((TOTAL + 1))
  if ! grep -q 'restart' "$ehu_log"; then
    PASS=$((PASS + 1)); echo "  PASS: hot path did not re-run restart"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: hot path re-ran restart"
  fi
else
  TOTAL=$((TOTAL + 3)); FAIL=$((FAIL + 3))
  echo "  FAIL: ensure_heartbeat_units (hot path) returned non-zero"
fi

# --- 2b. Elapsed strand: units match but SubState=elapsed → repair (#2375) -----
# The #2375 stranded state: units are byte-identical on disk (installed by the
# cold path above, still present), but the timer is active (elapsed) — no future
# fire. is-active would read 0 (healthy), but heartbeat_timer_is_armed requires
# SubState=waiting, so this must fall through to the repair path and re-arm:
# daemon-reload + restart fire.
: > "$ehu_log"
if (
  export DISPATCH_HEARTBEAT_UNIT_DIR="$ehu_unit_dir"
  export DISPATCH_HEARTBEAT_SYSTEMCTL_CMD="$ehu_tmp/bin/systemctl"
  export STUB_LOG="$ehu_log"
  export STUB_SUBSTATE=elapsed STUB_ENABLE_RC=0 STUB_RESTART_RC=0 STUB_RELOAD_RC=0
  source "$SCRIPT_DIR/lib.sh"
  ensure_heartbeat_units "$ehu_tmp/main-worktree"
); then
  TOTAL=$((TOTAL + 1))
  if grep -q 'daemon-reload' "$ehu_log"; then
    PASS=$((PASS + 1)); echo "  PASS: elapsed timer fell through to repair (daemon-reload)"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: elapsed timer short-circuited (no daemon-reload)"
  fi
  TOTAL=$((TOTAL + 1))
  if grep -q 'restart dispatch-heartbeat.timer' "$ehu_log"; then
    PASS=$((PASS + 1)); echo "  PASS: elapsed timer is re-armed (#2375) (restart fired)"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: elapsed timer was not re-armed (no restart)"
  fi
else
  TOTAL=$((TOTAL + 2)); FAIL=$((FAIL + 2))
  echo "  FAIL: ensure_heartbeat_units (elapsed strand) returned non-zero"
fi

# --- 2c. Restart failure → non-zero return + WARNING (RV-002, #2388) ----------
# enable succeeds but `systemctl restart` fails (STUB_RESTART_RC=1). SubState=dead
# forces fall-through past the hot-path early-return so the restart step is reached;
# the install/re-arm path must surface a non-zero return and a WARNING to stderr
# (lib.sh:2868-2870).
: > "$ehu_log"
ehu_restart_stderr="$ehu_tmp/restart-fail.stderr"
ehu_restart_rc=0
(
  export DISPATCH_HEARTBEAT_UNIT_DIR="$ehu_unit_dir"
  export DISPATCH_HEARTBEAT_SYSTEMCTL_CMD="$ehu_tmp/bin/systemctl"
  export STUB_LOG="$ehu_log"
  export STUB_SUBSTATE=dead STUB_ENABLE_RC=0 STUB_RESTART_RC=1 STUB_RELOAD_RC=0
  source "$SCRIPT_DIR/lib.sh"
  ensure_heartbeat_units "$ehu_tmp/main-worktree"
) 2>"$ehu_restart_stderr" || ehu_restart_rc=$?
assert_eq "restart failure → non-zero return" "1" "$ehu_restart_rc"
TOTAL=$((TOTAL + 1))
if grep -q 'WARNING: ensure_heartbeat_units: systemctl --user restart dispatch-heartbeat.timer failed' "$ehu_restart_stderr"; then
  PASS=$((PASS + 1)); echo "  PASS: restart failure emitted WARNING to stderr"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: restart failure did not emit expected WARNING to stderr"
fi

# --- 2d. Elapsed strand + enable fails → repair path returns non-zero, WARNs --
# Parity with the recover unit's cold-path degrade case: on the elapsed/repair
# path, when `systemctl --user enable` fails the
# function must return non-zero AND emit its WARNING to stderr (lib.sh:2864-2867,
# RV-003 from PR #2382). Reuses the units the cold path installed in
# $ehu_unit_dir; redirects stderr to a file so the WARNING can be asserted.
: > "$ehu_log"
ehu_err="$ehu_tmp/enable-fail-stderr"
ehu_rc=0
if (
  export DISPATCH_HEARTBEAT_UNIT_DIR="$ehu_unit_dir"
  export DISPATCH_HEARTBEAT_SYSTEMCTL_CMD="$ehu_tmp/bin/systemctl"
  export STUB_LOG="$ehu_log"
  export STUB_SUBSTATE=elapsed STUB_ENABLE_RC=1 STUB_RESTART_RC=0 STUB_RELOAD_RC=0
  source "$SCRIPT_DIR/lib.sh"
  ensure_heartbeat_units "$ehu_tmp/main-worktree"
) 2>"$ehu_err"; then
  ehu_rc=0
else
  ehu_rc=$?
fi
assert_eq "elapsed+enable-fail: ensure_heartbeat_units returns non-zero" "1" "$ehu_rc"
assert_eq "elapsed+enable-fail: WARNING on stderr" "present" \
  "$(grep -q 'WARNING: ensure_heartbeat_units: systemctl --user enable dispatch-heartbeat.timer failed' "$ehu_err" \
     && echo present || echo absent)"

# --- 3. cleanup_stale_heartbeat_units: path-change disable (#2056) ------------
# Called DIRECTLY (not via ensure_heartbeat_units): the "paths match" case would
# otherwise hit the hot-path early-return before reaching the cleanup call.
mkdir -p "$ehu_unit_dir"

# 3a. AC1 — installed WorkingDirectory differs from current → disable fires.
: > "$ehu_log"
printf '%s\n' '[Service]' 'WorkingDirectory=/old/path' > "$ehu_svc"
(
  export STUB_LOG="$ehu_log"
  source "$SCRIPT_DIR/lib.sh"
  cleanup_stale_heartbeat_units "$ehu_svc" "$ehu_tmp/main-worktree" "$ehu_tmp/bin/systemctl"
)
TOTAL=$((TOTAL + 1))
if grep -q 'disable --now dispatch-heartbeat.timer dispatch-heartbeat.service' "$ehu_log"; then
  PASS=$((PASS + 1)); echo "  PASS: cleanup_stale_heartbeat_units disabled stale units on path change"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: cleanup_stale_heartbeat_units did not disable on path change"
fi

# 3b. AC2 — installed WorkingDirectory matches current → no disable.
: > "$ehu_log"
printf '%s\n' '[Service]' "WorkingDirectory=$ehu_tmp/main-worktree" > "$ehu_svc"
(
  export STUB_LOG="$ehu_log"
  source "$SCRIPT_DIR/lib.sh"
  cleanup_stale_heartbeat_units "$ehu_svc" "$ehu_tmp/main-worktree" "$ehu_tmp/bin/systemctl"
)
TOTAL=$((TOTAL + 1))
if ! grep -q 'disable' "$ehu_log"; then
  PASS=$((PASS + 1)); echo "  PASS: cleanup_stale_heartbeat_units did not disable when path matches"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: cleanup_stale_heartbeat_units disabled despite matching path"
fi

# 3c. AC3 — no prior service unit → no-op (returns 0, no disable).
: > "$ehu_log"
ehu_missing_svc="$ehu_unit_dir/does-not-exist.service"
ehu_cleanup_rc=0
(
  export STUB_LOG="$ehu_log"
  source "$SCRIPT_DIR/lib.sh"
  cleanup_stale_heartbeat_units "$ehu_missing_svc" "$ehu_tmp/main-worktree" "$ehu_tmp/bin/systemctl"
) || ehu_cleanup_rc=$?
assert_eq "cleanup_stale_heartbeat_units: missing unit → returns 0" "0" "$ehu_cleanup_rc"
# Counts the inline grep check below; the assert_eq above counts itself.
TOTAL=$((TOTAL + 1))
if ! grep -q 'disable' "$ehu_log"; then
  PASS=$((PASS + 1)); echo "  PASS: cleanup_stale_heartbeat_units no-op when no prior units"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: cleanup_stale_heartbeat_units ran disable with no prior units"
fi

# 3d. AC4 (#2191) — [Service] section present but no WorkingDirectory= line →
# early return at lib.sh:1810 ([ -n "$installed_workdir" ] || return 0): no
# disable, returns 0.
: > "$ehu_log"
printf '%s\n' '[Service]' > "$ehu_svc"
ehu_cleanup_rc=0
(
  export STUB_LOG="$ehu_log"
  source "$SCRIPT_DIR/lib.sh"
  cleanup_stale_heartbeat_units "$ehu_svc" "$ehu_tmp/main-worktree" "$ehu_tmp/bin/systemctl"
) || ehu_cleanup_rc=$?
assert_eq "cleanup_stale_heartbeat_units: no WorkingDirectory= → returns 0" "0" "$ehu_cleanup_rc"
# Counts the inline grep check below; the assert_eq above counts itself.
TOTAL=$((TOTAL + 1))
if ! grep -q 'disable' "$ehu_log"; then
  PASS=$((PASS + 1)); echo "  PASS: cleanup_stale_heartbeat_units no-op when WorkingDirectory= absent"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: cleanup_stale_heartbeat_units ran disable with no WorkingDirectory="
fi

rm -rf "$ehu_tmp"

# <<< END MOVED <<<

# ============================================================================
# cleanup_stale_sweep_units: path-change disable (tactic-sweep-timer-unit-dir-leak)
# ============================================================================
# Mirrors the cleanup_stale_heartbeat_units cases above for the sweep pair.
# Called DIRECTLY (not via ensure_sweep_timer): the "paths match" case would
# otherwise hit the hot-path early-return before reaching the cleanup call.
echo ""
echo "=== cleanup_stale_sweep_units: path-change disable ==="
esu_tmp=$(mktemp -d)
mkdir -p "$esu_tmp/bin" "$esu_tmp/main-worktree" "$esu_tmp/systemd-user"
cat > "$esu_tmp/bin/systemctl" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$STUB_LOG"
exit 0
STUB
chmod +x "$esu_tmp/bin/systemctl"
esu_svc="$esu_tmp/systemd-user/dispatch-sweep-periodic.service"
esu_log="$esu_tmp/systemctl.log"

# 1. Installed WorkingDirectory differs from current → disable fires, naming the
#    SWEEP units (not the heartbeat pair).
: > "$esu_log"
printf '%s\n' '[Service]' 'WorkingDirectory=/old/path' > "$esu_svc"
(
  export STUB_LOG="$esu_log"
  source "$SCRIPT_DIR/lib.sh"
  cleanup_stale_sweep_units "$esu_svc" "$esu_tmp/main-worktree" "$esu_tmp/bin/systemctl"
) 2>/dev/null
TOTAL=$((TOTAL + 1))
if grep -q 'disable --now dispatch-sweep-periodic.timer dispatch-sweep-periodic.service' "$esu_log"; then
  PASS=$((PASS + 1)); echo "  PASS: cleanup_stale_sweep_units disabled stale units on path change"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: cleanup_stale_sweep_units did not disable on path change"
fi

# 2. Installed WorkingDirectory matches current → no disable.
: > "$esu_log"
printf '%s\n' '[Service]' "WorkingDirectory=$esu_tmp/main-worktree" > "$esu_svc"
(
  export STUB_LOG="$esu_log"
  source "$SCRIPT_DIR/lib.sh"
  cleanup_stale_sweep_units "$esu_svc" "$esu_tmp/main-worktree" "$esu_tmp/bin/systemctl"
) 2>/dev/null
TOTAL=$((TOTAL + 1))
if ! grep -q 'disable' "$esu_log"; then
  PASS=$((PASS + 1)); echo "  PASS: cleanup_stale_sweep_units did not disable when path matches"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: cleanup_stale_sweep_units disabled despite matching path"
fi

# 3. No prior service unit → no-op (returns 0, no disable).
: > "$esu_log"
esu_cleanup_rc=0
(
  export STUB_LOG="$esu_log"
  source "$SCRIPT_DIR/lib.sh"
  cleanup_stale_sweep_units "$esu_tmp/systemd-user/does-not-exist.service" \
    "$esu_tmp/main-worktree" "$esu_tmp/bin/systemctl"
) 2>/dev/null || esu_cleanup_rc=$?
assert_eq "cleanup_stale_sweep_units: missing unit → returns 0" "0" "$esu_cleanup_rc"
# Counts the inline grep check below; the assert_eq above counts itself.
TOTAL=$((TOTAL + 1))
if ! grep -q 'disable' "$esu_log"; then
  PASS=$((PASS + 1)); echo "  PASS: cleanup_stale_sweep_units no-op when no prior units"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: cleanup_stale_sweep_units ran disable with no prior units"
fi

# 4. [Service] section present but no WorkingDirectory= line → early return: no
#    disable, returns 0.
: > "$esu_log"
printf '%s\n' '[Service]' > "$esu_svc"
esu_cleanup_rc=0
(
  export STUB_LOG="$esu_log"
  source "$SCRIPT_DIR/lib.sh"
  cleanup_stale_sweep_units "$esu_svc" "$esu_tmp/main-worktree" "$esu_tmp/bin/systemctl"
) 2>/dev/null || esu_cleanup_rc=$?
assert_eq "cleanup_stale_sweep_units: no WorkingDirectory= → returns 0" "0" "$esu_cleanup_rc"
# Counts the inline grep check below; the assert_eq above counts itself.
TOTAL=$((TOTAL + 1))
if ! grep -q 'disable' "$esu_log"; then
  PASS=$((PASS + 1)); echo "  PASS: cleanup_stale_sweep_units no-op when WorkingDirectory= absent"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: cleanup_stale_sweep_units ran disable with no WorkingDirectory="
fi

rm -rf "$esu_tmp"

# ============================================================================
# ensure_healer_units: correct unit content + idempotency
# ============================================================================
# Mirrors ensure_heartbeat_units' cold/hot-path structure, but the hot-path
# check is `is-active --quiet` (monotonic OnBootSec=/OnUnitActiveSec= timer,
# like ensure_sweep_timer) rather than SubState=waiting.
echo ""
echo "=== ensure_healer_units: unit content + idempotency ==="
ehl_tmp=$(mktemp -d)
mkdir -p "$ehl_tmp/bin" "$ehl_tmp/main-worktree"
cat > "$ehl_tmp/bin/systemctl" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$STUB_LOG"
for a in "$@"; do
  case "$a" in
    is-active) exit "${STUB_IS_ACTIVE_RC:-0}" ;;
    enable)    exit "${STUB_ENABLE_RC:-0}" ;;
    daemon-reload) exit "${STUB_RELOAD_RC:-0}" ;;
    disable)   exit "${STUB_DISABLE_RC:-0}" ;;
  esac
done
exit 0
STUB
chmod +x "$ehl_tmp/bin/systemctl"
ehl_unit_dir="$ehl_tmp/systemd-user"
ehl_svc="$ehl_unit_dir/dispatch-heal.service"
ehl_tmr="$ehl_unit_dir/dispatch-heal.timer"
ehl_log="$ehl_tmp/systemctl.log"

# --- 1. Cold path: writes both unit files, runs daemon-reload + enable --now -
: > "$ehl_log"
if (
  export DISPATCH_HEALER_UNIT_DIR="$ehl_unit_dir"
  export DISPATCH_HEALER_SYSTEMCTL_CMD="$ehl_tmp/bin/systemctl"
  export STUB_LOG="$ehl_log"
  export STUB_IS_ACTIVE_RC=1 STUB_ENABLE_RC=0 STUB_RELOAD_RC=0
  source "$SCRIPT_DIR/lib.sh"
  ensure_healer_units "$ehl_tmp/main-worktree"
); then
  if [ -f "$ehl_svc" ]; then
    TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: cold path wrote dispatch-heal.service"
    grep -qF '/dispatch-heal-units' "$ehl_svc" \
      && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: service ExecStart= references dispatch-heal-units"; } \
      || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: service ExecStart= missing dispatch-heal-units"; }
    grep -q '^SuccessExitStatus=1 2$' "$ehl_svc" \
      && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: service has SuccessExitStatus=1 2"; } \
      || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: service missing SuccessExitStatus=1 2"; }
    grep -q '^SyslogIdentifier=dispatch-heal-units$' "$ehl_svc" \
      && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: service has SyslogIdentifier=dispatch-heal-units"; } \
      || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: service missing SyslogIdentifier=dispatch-heal-units"; }
    ehl_wd_line=$(grep '^WorkingDirectory=' "$ehl_svc" || true)
    TOTAL=$((TOTAL + 1))
    if [[ "$ehl_wd_line" == "WorkingDirectory=$ehl_tmp/main-worktree" ]]; then
      PASS=$((PASS + 1)); echo "  PASS: WorkingDirectory= is the bare absolute path (no quotes)"
    else
      FAIL=$((FAIL + 1)); echo "  FAIL: WorkingDirectory= line is wrong or quoted: $ehl_wd_line"
    fi
  else
    TOTAL=$((TOTAL + 4)); FAIL=$((FAIL + 4))
    echo "  FAIL: cold path did not write dispatch-heal.service"
  fi
  if [ -f "$ehl_tmr" ]; then
    TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: cold path wrote dispatch-heal.timer"
    grep -q '^OnBootSec=1min$' "$ehl_tmr" \
      && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: timer has OnBootSec=1min"; } \
      || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: timer missing OnBootSec=1min"; }
    grep -q '^OnUnitActiveSec=2min$' "$ehl_tmr" \
      && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: timer has OnUnitActiveSec=2min"; } \
      || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: timer missing OnUnitActiveSec=2min"; }
    TOTAL=$((TOTAL + 1))
    if ! grep -q '^Persistent=' "$ehl_tmr"; then
      PASS=$((PASS + 1)); echo "  PASS: timer has no Persistent= (no-op for monotonic triggers)"
    else
      FAIL=$((FAIL + 1)); echo "  FAIL: timer unexpectedly has Persistent="
    fi
    TOTAL=$((TOTAL + 1))
    if ! grep -q '^\[Install\]' "$ehl_svc"; then
      PASS=$((PASS + 1)); echo "  PASS: service has no [Install] section"
    else
      FAIL=$((FAIL + 1)); echo "  FAIL: service unexpectedly has [Install]"
    fi
  else
    TOTAL=$((TOTAL + 4)); FAIL=$((FAIL + 4))
    echo "  FAIL: cold path did not write dispatch-heal.timer"
  fi
  grep -q 'daemon-reload' "$ehl_log" \
    && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: cold path ran daemon-reload"; } \
    || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: cold path did not run daemon-reload"; }
  grep -q 'enable --now dispatch-heal.timer' "$ehl_log" \
    && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: cold path ran enable --now dispatch-heal.timer"; } \
    || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: cold path did not run enable --now dispatch-heal.timer"; }
else
  TOTAL=$((TOTAL + 12)); FAIL=$((FAIL + 12))
  echo "  FAIL: ensure_healer_units (cold path) returned non-zero"
fi

# --- 2. Hot path: both units byte-identical + timer active → no-op -----------
: > "$ehl_log"
if (
  export DISPATCH_HEALER_UNIT_DIR="$ehl_unit_dir"
  export DISPATCH_HEALER_SYSTEMCTL_CMD="$ehl_tmp/bin/systemctl"
  export STUB_LOG="$ehl_log"
  export STUB_IS_ACTIVE_RC=0 STUB_ENABLE_RC=0 STUB_RELOAD_RC=0
  source "$SCRIPT_DIR/lib.sh"
  ensure_healer_units "$ehl_tmp/main-worktree"
); then
  TOTAL=$((TOTAL + 1))
  if ! grep -q 'daemon-reload' "$ehl_log"; then
    PASS=$((PASS + 1)); echo "  PASS: hot path did not rewrite units (no daemon-reload)"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: hot path ran daemon-reload (spurious rewrite)"
  fi
  TOTAL=$((TOTAL + 1))
  if ! grep -q 'enable' "$ehl_log"; then
    PASS=$((PASS + 1)); echo "  PASS: hot path did not re-run enable"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: hot path re-ran enable"
  fi
else
  TOTAL=$((TOTAL + 2)); FAIL=$((FAIL + 2))
  echo "  FAIL: ensure_healer_units (hot path) returned non-zero"
fi

# --- 3. Path guards: newline/space/quote/backslash → non-zero, WARNING, no file
for ehl_case in newline space double-quote backslash; do
  ehl_bad_tmp=$(mktemp -d)
  case "$ehl_case" in
    newline)      ehl_bad_path=$'has\na newline' ;;
    space)        ehl_bad_path="has a space" ;;
    double-quote) ehl_bad_path='has"a"quote' ;;
    backslash)    ehl_bad_path='has\a\backslash' ;;
  esac
  ehl_bad_svc="$ehl_bad_tmp/systemd-user/dispatch-heal.service"
  ehl_bad_err="$ehl_bad_tmp/stderr"
  ehl_bad_rc=0
  (
    export DISPATCH_HEALER_UNIT_DIR="$ehl_bad_tmp/systemd-user"
    export DISPATCH_HEALER_SYSTEMCTL_CMD="$ehl_tmp/bin/systemctl"
    export STUB_LOG="$ehl_bad_tmp/log"
    source "$SCRIPT_DIR/lib.sh"
    ensure_healer_units "$ehl_bad_path"
  ) 2>"$ehl_bad_err" || ehl_bad_rc=$?
  assert_eq "ensure_healer_units rejects a $ehl_case path: non-zero return" "1" "$ehl_bad_rc"
  TOTAL=$((TOTAL + 1))
  if grep -q "WARNING: ensure_healer_units: main worktree path contains a $ehl_case" "$ehl_bad_err"; then
    PASS=$((PASS + 1)); echo "  PASS: ensure_healer_units emitted WARNING for $ehl_case path"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: ensure_healer_units did not emit expected WARNING for $ehl_case path"
  fi
  TOTAL=$((TOTAL + 1))
  if [[ ! -e "$ehl_bad_svc" ]]; then
    PASS=$((PASS + 1)); echo "  PASS: no unit file written for $ehl_case path"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: unit file was written despite $ehl_case path"
  fi
  rm -rf "$ehl_bad_tmp"
done

# --- 4. cleanup_stale_healer_units: path-change disable -----------------------
mkdir -p "$ehl_unit_dir"

# 4a. installed WorkingDirectory differs from current → disable fires.
: > "$ehl_log"
printf '%s\n' '[Service]' 'WorkingDirectory=/old/path' > "$ehl_svc"
(
  export STUB_LOG="$ehl_log"
  source "$SCRIPT_DIR/lib.sh"
  cleanup_stale_healer_units "$ehl_svc" "$ehl_tmp/main-worktree" "$ehl_tmp/bin/systemctl"
)
TOTAL=$((TOTAL + 1))
if grep -q 'disable --now dispatch-heal.timer dispatch-heal.service' "$ehl_log"; then
  PASS=$((PASS + 1)); echo "  PASS: cleanup_stale_healer_units disabled stale units on path change"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: cleanup_stale_healer_units did not disable on path change"
fi

# 4b. installed WorkingDirectory matches current → no disable.
: > "$ehl_log"
printf '%s\n' '[Service]' "WorkingDirectory=$ehl_tmp/main-worktree" > "$ehl_svc"
(
  export STUB_LOG="$ehl_log"
  source "$SCRIPT_DIR/lib.sh"
  cleanup_stale_healer_units "$ehl_svc" "$ehl_tmp/main-worktree" "$ehl_tmp/bin/systemctl"
)
TOTAL=$((TOTAL + 1))
if ! grep -q 'disable' "$ehl_log"; then
  PASS=$((PASS + 1)); echo "  PASS: cleanup_stale_healer_units did not disable when path matches"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: cleanup_stale_healer_units disabled despite matching path"
fi

# 4c. no prior service unit → no-op (returns 0, no disable).
: > "$ehl_log"
ehl_cleanup_rc=0
(
  export STUB_LOG="$ehl_log"
  source "$SCRIPT_DIR/lib.sh"
  cleanup_stale_healer_units "$ehl_unit_dir/does-not-exist.service" "$ehl_tmp/main-worktree" "$ehl_tmp/bin/systemctl"
) || ehl_cleanup_rc=$?
assert_eq "cleanup_stale_healer_units: missing unit → returns 0" "0" "$ehl_cleanup_rc"
TOTAL=$((TOTAL + 1))
if ! grep -q 'disable' "$ehl_log"; then
  PASS=$((PASS + 1)); echo "  PASS: cleanup_stale_healer_units no-op when no prior units"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: cleanup_stale_healer_units ran disable with no prior units"
fi

# 4d. [Service] section present but no WorkingDirectory= line → early return.
: > "$ehl_log"
printf '%s\n' '[Service]' > "$ehl_svc"
ehl_cleanup_rc=0
(
  export STUB_LOG="$ehl_log"
  source "$SCRIPT_DIR/lib.sh"
  cleanup_stale_healer_units "$ehl_svc" "$ehl_tmp/main-worktree" "$ehl_tmp/bin/systemctl"
) || ehl_cleanup_rc=$?
assert_eq "cleanup_stale_healer_units: no WorkingDirectory= → returns 0" "0" "$ehl_cleanup_rc"
TOTAL=$((TOTAL + 1))
if ! grep -q 'disable' "$ehl_log"; then
  PASS=$((PASS + 1)); echo "  PASS: cleanup_stale_healer_units no-op when WorkingDirectory= absent"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: cleanup_stale_healer_units ran disable with no WorkingDirectory="
fi

rm -rf "$ehl_tmp"

# ============================================================================
# ensure_watcher_units: correct unit content + idempotency
# ============================================================================
echo ""
echo "=== ensure_watcher_units: unit content + idempotency ==="
ewa_tmp=$(mktemp -d)
mkdir -p "$ewa_tmp/bin" "$ewa_tmp/main-worktree"
cat > "$ewa_tmp/bin/systemctl" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$STUB_LOG"
for a in "$@"; do
  case "$a" in
    is-active) exit "${STUB_IS_ACTIVE_RC:-0}" ;;
    enable)    exit "${STUB_ENABLE_RC:-0}" ;;
    daemon-reload) exit "${STUB_RELOAD_RC:-0}" ;;
    disable)   exit "${STUB_DISABLE_RC:-0}" ;;
  esac
done
exit 0
STUB
chmod +x "$ewa_tmp/bin/systemctl"
ewa_unit_dir="$ewa_tmp/systemd-user"
ewa_svc="$ewa_unit_dir/dispatch-fleet-watch.service"
ewa_tmr="$ewa_unit_dir/dispatch-fleet-watch.timer"
ewa_log="$ewa_tmp/systemctl.log"

# --- 1. Cold path: writes both unit files, runs daemon-reload + enable --now -
: > "$ewa_log"
if (
  export DISPATCH_WATCHER_UNIT_DIR="$ewa_unit_dir"
  export DISPATCH_WATCHER_SYSTEMCTL_CMD="$ewa_tmp/bin/systemctl"
  export STUB_LOG="$ewa_log"
  export STUB_IS_ACTIVE_RC=1 STUB_ENABLE_RC=0 STUB_RELOAD_RC=0
  source "$SCRIPT_DIR/lib.sh"
  ensure_watcher_units "$ewa_tmp/main-worktree"
); then
  if [ -f "$ewa_svc" ]; then
    TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: cold path wrote dispatch-fleet-watch.service"
    grep -qF '/dispatch-fleet-watch' "$ewa_svc" \
      && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: service ExecStart= references dispatch-fleet-watch"; } \
      || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: service ExecStart= missing dispatch-fleet-watch"; }
    grep -q '^SuccessExitStatus=1 2$' "$ewa_svc" \
      && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: service has SuccessExitStatus=1 2"; } \
      || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: service missing SuccessExitStatus=1 2"; }
    grep -q '^SyslogIdentifier=dispatch-fleet-watch$' "$ewa_svc" \
      && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: service has SyslogIdentifier=dispatch-fleet-watch"; } \
      || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: service missing SyslogIdentifier=dispatch-fleet-watch"; }
    ewa_wd_line=$(grep '^WorkingDirectory=' "$ewa_svc" || true)
    TOTAL=$((TOTAL + 1))
    if [[ "$ewa_wd_line" == "WorkingDirectory=$ewa_tmp/main-worktree" ]]; then
      PASS=$((PASS + 1)); echo "  PASS: WorkingDirectory= is the bare absolute path (no quotes)"
    else
      FAIL=$((FAIL + 1)); echo "  FAIL: WorkingDirectory= line is wrong or quoted: $ewa_wd_line"
    fi
  else
    TOTAL=$((TOTAL + 4)); FAIL=$((FAIL + 4))
    echo "  FAIL: cold path did not write dispatch-fleet-watch.service"
  fi
  if [ -f "$ewa_tmr" ]; then
    TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: cold path wrote dispatch-fleet-watch.timer"
    grep -q '^OnBootSec=3min$' "$ewa_tmr" \
      && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: timer has OnBootSec=3min"; } \
      || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: timer missing OnBootSec=3min"; }
    grep -q '^OnUnitActiveSec=5min$' "$ewa_tmr" \
      && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: timer has OnUnitActiveSec=5min"; } \
      || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: timer missing OnUnitActiveSec=5min"; }
    TOTAL=$((TOTAL + 1))
    if ! grep -q '^Persistent=' "$ewa_tmr"; then
      PASS=$((PASS + 1)); echo "  PASS: timer has no Persistent= (no-op for monotonic triggers)"
    else
      FAIL=$((FAIL + 1)); echo "  FAIL: timer unexpectedly has Persistent="
    fi
    TOTAL=$((TOTAL + 1))
    if ! grep -q '^\[Install\]' "$ewa_svc"; then
      PASS=$((PASS + 1)); echo "  PASS: service has no [Install] section"
    else
      FAIL=$((FAIL + 1)); echo "  FAIL: service unexpectedly has [Install]"
    fi
  else
    TOTAL=$((TOTAL + 4)); FAIL=$((FAIL + 4))
    echo "  FAIL: cold path did not write dispatch-fleet-watch.timer"
  fi
  grep -q 'daemon-reload' "$ewa_log" \
    && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: cold path ran daemon-reload"; } \
    || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: cold path did not run daemon-reload"; }
  grep -q 'enable --now dispatch-fleet-watch.timer' "$ewa_log" \
    && { TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1)); echo "  PASS: cold path ran enable --now dispatch-fleet-watch.timer"; } \
    || { TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1)); echo "  FAIL: cold path did not run enable --now dispatch-fleet-watch.timer"; }
else
  TOTAL=$((TOTAL + 12)); FAIL=$((FAIL + 12))
  echo "  FAIL: ensure_watcher_units (cold path) returned non-zero"
fi

# --- 2. Hot path: both units byte-identical + timer active → no-op -----------
: > "$ewa_log"
if (
  export DISPATCH_WATCHER_UNIT_DIR="$ewa_unit_dir"
  export DISPATCH_WATCHER_SYSTEMCTL_CMD="$ewa_tmp/bin/systemctl"
  export STUB_LOG="$ewa_log"
  export STUB_IS_ACTIVE_RC=0 STUB_ENABLE_RC=0 STUB_RELOAD_RC=0
  source "$SCRIPT_DIR/lib.sh"
  ensure_watcher_units "$ewa_tmp/main-worktree"
); then
  TOTAL=$((TOTAL + 1))
  if ! grep -q 'daemon-reload' "$ewa_log"; then
    PASS=$((PASS + 1)); echo "  PASS: hot path did not rewrite units (no daemon-reload)"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: hot path ran daemon-reload (spurious rewrite)"
  fi
  TOTAL=$((TOTAL + 1))
  if ! grep -q 'enable' "$ewa_log"; then
    PASS=$((PASS + 1)); echo "  PASS: hot path did not re-run enable"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: hot path re-ran enable"
  fi
else
  TOTAL=$((TOTAL + 2)); FAIL=$((FAIL + 2))
  echo "  FAIL: ensure_watcher_units (hot path) returned non-zero"
fi

# --- 3. Path guards: newline/space/quote/backslash → non-zero, WARNING, no file
for ewa_case in newline space double-quote backslash; do
  ewa_bad_tmp=$(mktemp -d)
  case "$ewa_case" in
    newline)      ewa_bad_path=$'has\na newline' ;;
    space)        ewa_bad_path="has a space" ;;
    double-quote) ewa_bad_path='has"a"quote' ;;
    backslash)    ewa_bad_path='has\a\backslash' ;;
  esac
  ewa_bad_svc="$ewa_bad_tmp/systemd-user/dispatch-fleet-watch.service"
  ewa_bad_err="$ewa_bad_tmp/stderr"
  ewa_bad_rc=0
  (
    export DISPATCH_WATCHER_UNIT_DIR="$ewa_bad_tmp/systemd-user"
    export DISPATCH_WATCHER_SYSTEMCTL_CMD="$ewa_tmp/bin/systemctl"
    export STUB_LOG="$ewa_bad_tmp/log"
    source "$SCRIPT_DIR/lib.sh"
    ensure_watcher_units "$ewa_bad_path"
  ) 2>"$ewa_bad_err" || ewa_bad_rc=$?
  assert_eq "ensure_watcher_units rejects a $ewa_case path: non-zero return" "1" "$ewa_bad_rc"
  TOTAL=$((TOTAL + 1))
  if grep -q "WARNING: ensure_watcher_units: main worktree path contains a $ewa_case" "$ewa_bad_err"; then
    PASS=$((PASS + 1)); echo "  PASS: ensure_watcher_units emitted WARNING for $ewa_case path"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: ensure_watcher_units did not emit expected WARNING for $ewa_case path"
  fi
  TOTAL=$((TOTAL + 1))
  if [[ ! -e "$ewa_bad_svc" ]]; then
    PASS=$((PASS + 1)); echo "  PASS: no unit file written for $ewa_case path"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: unit file was written despite $ewa_case path"
  fi
  rm -rf "$ewa_bad_tmp"
done

# --- 4. cleanup_stale_watcher_units: path-change disable ----------------------
mkdir -p "$ewa_unit_dir"

# 4a. installed WorkingDirectory differs from current → disable fires.
: > "$ewa_log"
printf '%s\n' '[Service]' 'WorkingDirectory=/old/path' > "$ewa_svc"
(
  export STUB_LOG="$ewa_log"
  source "$SCRIPT_DIR/lib.sh"
  cleanup_stale_watcher_units "$ewa_svc" "$ewa_tmp/main-worktree" "$ewa_tmp/bin/systemctl"
)
TOTAL=$((TOTAL + 1))
if grep -q 'disable --now dispatch-fleet-watch.timer dispatch-fleet-watch.service' "$ewa_log"; then
  PASS=$((PASS + 1)); echo "  PASS: cleanup_stale_watcher_units disabled stale units on path change"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: cleanup_stale_watcher_units did not disable on path change"
fi

# 4b. installed WorkingDirectory matches current → no disable.
: > "$ewa_log"
printf '%s\n' '[Service]' "WorkingDirectory=$ewa_tmp/main-worktree" > "$ewa_svc"
(
  export STUB_LOG="$ewa_log"
  source "$SCRIPT_DIR/lib.sh"
  cleanup_stale_watcher_units "$ewa_svc" "$ewa_tmp/main-worktree" "$ewa_tmp/bin/systemctl"
)
TOTAL=$((TOTAL + 1))
if ! grep -q 'disable' "$ewa_log"; then
  PASS=$((PASS + 1)); echo "  PASS: cleanup_stale_watcher_units did not disable when path matches"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: cleanup_stale_watcher_units disabled despite matching path"
fi

# 4c. no prior service unit → no-op (returns 0, no disable).
: > "$ewa_log"
ewa_cleanup_rc=0
(
  export STUB_LOG="$ewa_log"
  source "$SCRIPT_DIR/lib.sh"
  cleanup_stale_watcher_units "$ewa_unit_dir/does-not-exist.service" "$ewa_tmp/main-worktree" "$ewa_tmp/bin/systemctl"
) || ewa_cleanup_rc=$?
assert_eq "cleanup_stale_watcher_units: missing unit → returns 0" "0" "$ewa_cleanup_rc"
TOTAL=$((TOTAL + 1))
if ! grep -q 'disable' "$ewa_log"; then
  PASS=$((PASS + 1)); echo "  PASS: cleanup_stale_watcher_units no-op when no prior units"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: cleanup_stale_watcher_units ran disable with no prior units"
fi

# 4d. [Service] section present but no WorkingDirectory= line → early return.
: > "$ewa_log"
printf '%s\n' '[Service]' > "$ewa_svc"
ewa_cleanup_rc=0
(
  export STUB_LOG="$ewa_log"
  source "$SCRIPT_DIR/lib.sh"
  cleanup_stale_watcher_units "$ewa_svc" "$ewa_tmp/main-worktree" "$ewa_tmp/bin/systemctl"
) || ewa_cleanup_rc=$?
assert_eq "cleanup_stale_watcher_units: no WorkingDirectory= → returns 0" "0" "$ewa_cleanup_rc"
TOTAL=$((TOTAL + 1))
if ! grep -q 'disable' "$ewa_log"; then
  PASS=$((PASS + 1)); echo "  PASS: cleanup_stale_watcher_units no-op when WorkingDirectory= absent"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: cleanup_stale_watcher_units ran disable with no WorkingDirectory="
fi

rm -rf "$ewa_tmp"

report_results
