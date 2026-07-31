#!/usr/bin/env bash
#
# test-dispatch-heal-units.sh — unit-test harness for dispatch-heal-units.
#
# Dependency-injects systemctl, the unit directory, the main worktree (a
# scratch fixture dir with a fake lib.sh defining fake ensure_recover_unit /
# ensure_sweep_timer / ensure_heartbeat_units — and, in the "unit-5-present"
# variant, fake ensure_healer_units / ensure_watcher_units too), and the alarm
# command, through the DISPATCH_HEAL_* env seams. No real systemd, no real
# dispatch-fleet-alarm graph write, no real 5000-line lib.sh.
#
# House pattern mirrors test-dispatch-daemon-liveness.sh (DISPATCH_LIVENESS_*
# seams, ok/no/assert_eq helpers) and the per-SUT test-*.sh files sharing
# dispatch-test-fixture.sh. Run under bash, never zsh.

set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="$HARNESS_DIR/dispatch-heal-units"
[[ -x "$SCRIPT" ]] || { echo "error: dispatch-heal-units not found/executable at $SCRIPT" >&2; exit 1; }

WORK="$(mktemp -d)" || { echo "error: mktemp -d failed" >&2; exit 1; }
trap 'rm -rf "$WORK"' EXIT

PASS=0; FAIL=0
ok() { echo "PASS: $1"; PASS=$((PASS + 1)); }
no() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }
assert_eq() { # <label> <expected> <actual>
  if [[ "$2" == "$3" ]]; then ok "$1"; else no "$1 (expected '$2', got '$3')"; fi
}
assert_contains() { # <label> <haystack> <needle>
  if [[ "$2" == *"$3"* ]]; then ok "$1"; else no "$1 (did not find '$3')"; fi
}
assert_not_contains() { # <label> <haystack> <needle>
  if [[ "$2" != *"$3"* ]]; then ok "$1"; else no "$1 (unexpectedly found '$3')"; fi
}

UNITS=(dispatch-heartbeat.service dispatch-sweep-periodic.service dispatch-heal.service dispatch-fleet-watch.service)

# --- systemctl stub -----------------------------------------------------------
# usage:
#   systemctl --user is-failed --quiet <unit>   -> exit 0 iff <unit> is listed
#                                                   in $STUB_FAILED_UNITS
#   systemctl --user reset-failed <unit...>     -> prints "reset-failed: <units>",
#                                                   exits $STUB_RESET_FAILED_RC
BIN="$WORK/bin"
mkdir -p "$BIN"
cat > "$BIN/systemctl" <<'STUB'
#!/usr/bin/env bash
cmd=""
positional=()
for a in "$@"; do
  case "$a" in
    --user|--quiet) continue ;;
    is-failed|reset-failed) cmd="$a" ;;
    *) positional+=("$a") ;;
  esac
done
if [[ "$cmd" == "is-failed" ]]; then
  unit="${positional[0]:-}"
  for f in ${STUB_FAILED_UNITS:-}; do
    [[ "$f" == "$unit" ]] && exit 0
  done
  exit 1
elif [[ "$cmd" == "reset-failed" ]]; then
  echo "reset-failed: ${positional[*]}"
  exit "${STUB_RESET_FAILED_RC:-0}"
fi
exit 0
STUB
chmod +x "$BIN/systemctl"

# --- alarm stub ---------------------------------------------------------------
# Records every invocation (args + any --body-file content) to $TEST_ALARM_LOG,
# one block per call, so a test case can grep for --kind/--resolve plus the
# body-file contents (e.g. the poisoned unit's prior ExecStart=).
ALARM_BIN="$BIN/dispatch-fleet-alarm"
cat > "$ALARM_BIN" <<'STUB'
#!/usr/bin/env bash
: "${TEST_ALARM_LOG:?TEST_ALARM_LOG must be set}"
{
  echo "ARGS: $*"
  prev=""
  for a in "$@"; do
    if [[ "$prev" == "--body-file" ]]; then
      echo "BODY_FILE_CONTENT_START"
      cat "$a" 2>/dev/null
      echo "BODY_FILE_CONTENT_END"
    fi
    prev="$a"
  done
  echo "---"
} >> "$TEST_ALARM_LOG"
exit "${STUB_ALARM_RC:-0}"
STUB
chmod +x "$ALARM_BIN"

# --- fixture main worktree with a fake lib.sh --------------------------------
# mk_main_worktree <dir> <call_log_path> [with_unit5]
# Writes a fake .claude/skills/dispatch-propagate/scripts/lib.sh defining
# ensure_recover_unit / ensure_sweep_timer / ensure_heartbeat_units, each
# appending "<fn> called with <$1>" to call_log and returning
# ${STUB_<FN>_RC:-0}. When with_unit5=1, also defines
# ensure_healer_units / ensure_watcher_units the same way.
mk_main_worktree() {
  local dir="$1" call_log="$2" with_unit5="${3:-0}"
  local libdir="$dir/.claude/skills/dispatch-propagate/scripts"
  mkdir -p "$libdir"
  {
    echo '#!/usr/bin/env bash'
    echo "CALL_LOG='$call_log'"
    for fn in ensure_recover_unit ensure_sweep_timer ensure_heartbeat_units; do
      upper=$(echo "$fn" | tr '[:lower:]' '[:upper:]')
      cat <<FN
$fn() {
  echo "$fn called with \$1" >> "\$CALL_LOG"
  return "\${STUB_${upper}_RC:-0}"
}
FN
    done
    if [[ "$with_unit5" == "1" ]]; then
      for fn in ensure_healer_units ensure_watcher_units; do
        upper=$(echo "$fn" | tr '[:lower:]' '[:upper:]')
        cat <<FN
$fn() {
  echo "$fn called with \$1" >> "\$CALL_LOG"
  return "\${STUB_${upper}_RC:-0}"
}
FN
      done
    fi
  } > "$libdir/lib.sh"
}

# --- fixture unit dir ----------------------------------------------------------
# mk_unit_dir <dir> [poisoned_unit]
# Writes an ExecStart= line for every managed unit, pointing at a normal path
# — except poisoned_unit (if given), which gets an ExecStart pointing into a
# scratch /tmp/tmp.* dir.
mk_unit_dir() {
  local dir="$1" poisoned_unit="${2:-}"
  mkdir -p "$dir"
  local unit
  for unit in "${UNITS[@]}"; do
    if [[ -n "$poisoned_unit" && "$unit" == "$poisoned_unit" ]]; then
      printf '[Service]\nExecStart="/tmp/tmp.ABC123XYZ/scripts/%s"\n' "$unit" > "$dir/$unit"
    else
      printf '[Service]\nExecStart="/home/tester/main-worktree/.claude/skills/dispatch-propagate/scripts/%s"\n' "$unit" > "$dir/$unit"
    fi
  done
}

# run_pass <unit_dir> <main_wt> <alarm_log> [extra env assignments...]
# Invokes the script with the standard seams; captures RUN_OUT / RUN_RC.
run_pass() {
  local unit_dir="$1" main_wt="$2" alarm_log="$3"; shift 3
  set +e
  RUN_OUT="$(
    DISPATCH_HEAL_UNIT_DIR="$unit_dir" \
    DISPATCH_HEAL_SYSTEMCTL_CMD="$BIN/systemctl" \
    DISPATCH_HEAL_MAIN_WORKTREE="$main_wt" \
    DISPATCH_HEAL_ALARM_CMD="$ALARM_BIN" \
    TEST_ALARM_LOG="$alarm_log" \
    "$@" \
    bash "$SCRIPT" 2>&1
  )"
  RUN_RC=$?
  set -e
}

# ===========================================================================
# Case 1: clean pass — no poisoned ExecStart, nothing is-failed.
# ===========================================================================
echo "=== Case 1: clean pass ==="
C1_UNITS="$WORK/c1-units"; C1_MAIN="$WORK/c1-main"; C1_CALLS="$WORK/c1-calls.log"; C1_ALARM="$WORK/c1-alarm.log"
mk_unit_dir "$C1_UNITS"
mk_main_worktree "$C1_MAIN" "$C1_CALLS"
: > "$C1_CALLS"; : > "$C1_ALARM"
STUB_FAILED_UNITS="" run_pass "$C1_UNITS" "$C1_MAIN" "$C1_ALARM"

assert_eq "clean: exit code" 0 "$RUN_RC"
if [[ -s "$C1_CALLS" ]]; then
  no "clean: no installer should have been invoked (found: $(cat "$C1_CALLS"))"
else
  ok "clean: no installer invoked"
fi
ALARM_CONTENT="$(cat "$C1_ALARM")"
assert_contains "clean: heal-fired resolved" "$ALARM_CONTENT" "--resolve --kind heal-fired"
assert_contains "clean: heal-unknown resolved" "$ALARM_CONTENT" "--resolve --kind heal-unknown"
assert_not_contains "clean: heal-fired NOT fired" "$ALARM_CONTENT" "--kind heal-fired --statement"
assert_contains "clean: rate-signal log line present" "$RUN_OUT" "dispatch-heal-units: result=clean"

# ===========================================================================
# Case 2a: poisoned ExecStart, Unit-5 fixture functions ABSENT -> guard skips
# them, all three base installers still run.
# ===========================================================================
echo "=== Case 2a: poisoned ExecStart (no unit-5 fixture) ==="
C2A_UNITS="$WORK/c2a-units"; C2A_MAIN="$WORK/c2a-main"; C2A_CALLS="$WORK/c2a-calls.log"; C2A_ALARM="$WORK/c2a-alarm.log"
mk_unit_dir "$C2A_UNITS" "dispatch-heartbeat.service"
mk_main_worktree "$C2A_MAIN" "$C2A_CALLS" 0
: > "$C2A_CALLS"; : > "$C2A_ALARM"
STUB_FAILED_UNITS="" run_pass "$C2A_UNITS" "$C2A_MAIN" "$C2A_ALARM"

assert_eq "poisoned(no-u5): exit code" 1 "$RUN_RC"
CALLS_CONTENT="$(cat "$C2A_CALLS")"
for fn in ensure_recover_unit ensure_sweep_timer ensure_heartbeat_units; do
  assert_contains "poisoned(no-u5): $fn invoked" "$CALLS_CONTENT" "$fn called with $C2A_MAIN"
done
assert_not_contains "poisoned(no-u5): ensure_healer_units NOT invoked" "$CALLS_CONTENT" "ensure_healer_units"
assert_not_contains "poisoned(no-u5): ensure_watcher_units NOT invoked" "$CALLS_CONTENT" "ensure_watcher_units"
assert_contains "poisoned(no-u5): guard skip logged for healer" "$RUN_OUT" "ensure_healer_units is not defined"
assert_contains "poisoned(no-u5): guard skip logged for watcher" "$RUN_OUT" "ensure_watcher_units is not defined"

ALARM2A="$(cat "$C2A_ALARM")"
assert_contains "poisoned(no-u5): heal-fired alarm fired" "$ALARM2A" "--kind heal-fired --statement"
assert_contains "poisoned(no-u5): body names poisoned unit" "$ALARM2A" "dispatch-heartbeat.service"
assert_contains "poisoned(no-u5): body carries prior ExecStart" "$ALARM2A" "/tmp/tmp.ABC123XYZ"
assert_contains "poisoned(no-u5): rate-signal log line present" "$RUN_OUT" "dispatch-heal-units: result=healed"

# ===========================================================================
# Case 2b: poisoned ExecStart, Unit-5 fixture functions PRESENT -> guard fires
# them too, proving the guard triggers both ways.
# ===========================================================================
echo "=== Case 2b: poisoned ExecStart (with unit-5 fixture) ==="
C2B_UNITS="$WORK/c2b-units"; C2B_MAIN="$WORK/c2b-main"; C2B_CALLS="$WORK/c2b-calls.log"; C2B_ALARM="$WORK/c2b-alarm.log"
mk_unit_dir "$C2B_UNITS" "dispatch-fleet-watch.service"
mk_main_worktree "$C2B_MAIN" "$C2B_CALLS" 1
: > "$C2B_CALLS"; : > "$C2B_ALARM"
STUB_FAILED_UNITS="" run_pass "$C2B_UNITS" "$C2B_MAIN" "$C2B_ALARM"

assert_eq "poisoned(u5): exit code" 1 "$RUN_RC"
CALLS_CONTENT_2B="$(cat "$C2B_CALLS")"
for fn in ensure_recover_unit ensure_sweep_timer ensure_heartbeat_units ensure_healer_units ensure_watcher_units; do
  assert_contains "poisoned(u5): $fn invoked" "$CALLS_CONTENT_2B" "$fn called with $C2B_MAIN"
done

# ===========================================================================
# Case 3: is-failed true, clean ExecStart -> same heal path.
# ===========================================================================
echo "=== Case 3: is-failed true, clean ExecStart ==="
C3_UNITS="$WORK/c3-units"; C3_MAIN="$WORK/c3-main"; C3_CALLS="$WORK/c3-calls.log"; C3_ALARM="$WORK/c3-alarm.log"
mk_unit_dir "$C3_UNITS"
mk_main_worktree "$C3_MAIN" "$C3_CALLS" 0
: > "$C3_CALLS"; : > "$C3_ALARM"
STUB_FAILED_UNITS="dispatch-sweep-periodic.service" run_pass "$C3_UNITS" "$C3_MAIN" "$C3_ALARM"

assert_eq "is-failed: exit code" 1 "$RUN_RC"
CALLS_CONTENT_3="$(cat "$C3_CALLS")"
for fn in ensure_recover_unit ensure_sweep_timer ensure_heartbeat_units; do
  assert_contains "is-failed: $fn invoked" "$CALLS_CONTENT_3" "$fn called with $C3_MAIN"
done
ALARM3="$(cat "$C3_ALARM")"
assert_contains "is-failed: heal-fired alarm fired" "$ALARM3" "--kind heal-fired --statement"
assert_contains "is-failed: body names is-failed reason" "$ALARM3" "is-failed"

# ===========================================================================
# Case 4: unreadable unit dir -> UNKNOWN, exit 2, never exit 0.
# ===========================================================================
echo "=== Case 4: unreadable unit dir ==="

# 4a: deterministic on every host (including root, where chmod 000 is a no-op
# for read access) — point DISPATCH_HEAL_UNIT_DIR at a path that does not
# exist. The script's readability probe treats "does not exist" the same as
# "not readable": both must UNKNOWN rather than fall through to a false-clean
# grep-found-nothing pass.
C4A_MISSING="$WORK/c4a-does-not-exist"
C4A_MAIN="$WORK/c4a-main"; C4A_CALLS="$WORK/c4a-calls.log"; C4A_ALARM="$WORK/c4a-alarm.log"
mk_main_worktree "$C4A_MAIN" "$C4A_CALLS" 0
: > "$C4A_CALLS"; : > "$C4A_ALARM"
STUB_FAILED_UNITS="" run_pass "$C4A_MISSING" "$C4A_MAIN" "$C4A_ALARM"

assert_eq "missing unit dir: exit code is UNKNOWN(2), never 0" 2 "$RUN_RC"
if [[ -s "$C4A_CALLS" ]]; then
  no "missing unit dir: no installer should have run (found: $(cat "$C4A_CALLS"))"
else
  ok "missing unit dir: no installer ran"
fi
ALARM4A="$(cat "$C4A_ALARM")"
assert_contains "missing unit dir: heal-unknown alarm fired" "$ALARM4A" "--kind heal-unknown --statement"
assert_not_contains "missing unit dir: heal-fired NOT fired" "$ALARM4A" "--kind heal-fired --statement"

# 4b: chmod-000 variant, skipped (not failed) when running as root — root
# bypasses Unix read permission bits entirely, so this sub-case can't
# distinguish "unreadable" from "readable" under root and would false-fail.
if [[ "$(id -u)" != "0" ]]; then
  C4B_UNITS="$WORK/c4b-units"; C4B_MAIN="$WORK/c4b-main"; C4B_CALLS="$WORK/c4b-calls.log"; C4B_ALARM="$WORK/c4b-alarm.log"
  mk_unit_dir "$C4B_UNITS"
  chmod 000 "$C4B_UNITS"
  mk_main_worktree "$C4B_MAIN" "$C4B_CALLS" 0
  : > "$C4B_CALLS"; : > "$C4B_ALARM"
  STUB_FAILED_UNITS="" run_pass "$C4B_UNITS" "$C4B_MAIN" "$C4B_ALARM"
  chmod 755 "$C4B_UNITS"   # restore so the trap's rm -rf can clean it up

  assert_eq "chmod-000 unit dir: exit code is UNKNOWN(2), never 0" 2 "$RUN_RC"
  ALARM4B="$(cat "$C4B_ALARM")"
  assert_contains "chmod-000 unit dir: heal-unknown alarm fired" "$ALARM4B" "--kind heal-unknown --statement"
else
  echo "SKIP: chmod-000 unit dir case (running as root; permission bits are bypassed)"
fi

# ===========================================================================
# Case 5: an installer stub returns non-zero -> its rc appears in the
# script's own stdout/stderr output (proving output is not suppressed).
# ===========================================================================
echo "=== Case 5: installer returns non-zero ==="
C5_UNITS="$WORK/c5-units"; C5_MAIN="$WORK/c5-main"; C5_CALLS="$WORK/c5-calls.log"; C5_ALARM="$WORK/c5-alarm.log"
mk_unit_dir "$C5_UNITS" "dispatch-heal.service"
mk_main_worktree "$C5_MAIN" "$C5_CALLS" 0
: > "$C5_CALLS"; : > "$C5_ALARM"
STUB_FAILED_UNITS="" STUB_ENSURE_SWEEP_TIMER_RC=7 run_pass "$C5_UNITS" "$C5_MAIN" "$C5_ALARM"

assert_eq "installer-nonzero: exit code still 1 (healed)" 1 "$RUN_RC"
assert_contains "installer-nonzero: ensure_sweep_timer rc=7 visible in output" "$RUN_OUT" "ensure_sweep_timer rc=7"
assert_contains "installer-nonzero: summary line carries sweep_rc=7" "$RUN_OUT" "sweep_rc=7"

# ===========================================================================
echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[[ "$FAIL" -eq 0 ]]
