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

# Must mirror UNIT_EXPECTED_SCRIPT in dispatch-heal-units (which in turn mirrors
# lib.sh's installers): detection is a POSITIVE assertion that ExecStart= is
# exactly <main-worktree>/.claude/skills/dispatch-propagate/scripts/<script>.
declare -A UNIT_SCRIPT=(
  [dispatch-heartbeat.service]=dispatch-tick
  [dispatch-sweep-periodic.service]=dispatch-spawn-sweep
  [dispatch-heal.service]=dispatch-heal-units
  [dispatch-fleet-watch.service]=dispatch-fleet-watch
)

# --- systemctl stub -----------------------------------------------------------
# usage:
#   systemctl --user is-failed --quiet <unit>   -> exit 0 iff <unit> is listed
#                                                   in $STUB_FAILED_UNITS
#   systemctl --user reset-failed <unit...>     -> prints "reset-failed: <units>",
#                                                   exits $STUB_RESET_FAILED_RC
BIN="$WORK/bin"
mkdir -p "$BIN"

# --- clock stub ---------------------------------------------------------------
# The script has no seam for its own `date -u +%FT%TZ`, and two passes of a test
# normally land in the SAME second — which would make the body-stability case
# pass even if the body still carried a timestamp. Cases that put $BIN first on
# PATH and set $STUB_NOW_UTC get a deterministic, per-pass-different clock; every
# other invocation (and every other `date` format) falls through to the real
# binary, resolved here BEFORE the stub can shadow it.
REAL_DATE="$(command -v date)"
cat > "$BIN/date" <<STUB
#!/usr/bin/env bash
if [[ -n "\${STUB_NOW_UTC:-}" && "\$*" == "-u +%FT%TZ" ]]; then
  printf '%s\n' "\$STUB_NOW_UTC"
  exit 0
fi
exec "$REAL_DATE" "\$@"
STUB
chmod +x "$BIN/date"
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
# mk_unit_dir <dir> <main_wt> [poisoned_unit] [poison_root]
# Writes the healthy ExecStart= line for every managed unit — exactly
# <main_wt>/.claude/skills/dispatch-propagate/scripts/<script>, matching what
# lib.sh's installers write and what the SUT positively asserts — except
# poisoned_unit (if given), whose ExecStart is rooted at poison_root instead
# (default: a scratch /tmp/tmp.* dir).
mk_unit_dir() {
  local dir="$1" main_wt="$2" poisoned_unit="${3:-}" poison_root="${4:-/tmp/tmp.ABC123XYZ}"
  mkdir -p "$dir"
  local unit root
  for unit in "${UNITS[@]}"; do
    if [[ -n "$poisoned_unit" && "$unit" == "$poisoned_unit" ]]; then
      root="$poison_root"
    else
      root="$main_wt"
    fi
    printf '[Service]\nExecStart="%s/.claude/skills/dispatch-propagate/scripts/%s"\n' \
      "$root" "${UNIT_SCRIPT[$unit]}" > "$dir/$unit"
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
mk_unit_dir "$C1_UNITS" "$C1_MAIN"
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
mk_unit_dir "$C2A_UNITS" "$C2A_MAIN" "dispatch-heartbeat.service"
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
mk_unit_dir "$C2B_UNITS" "$C2B_MAIN" "dispatch-fleet-watch.service"
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
mk_unit_dir "$C3_UNITS" "$C3_MAIN"
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
  mk_unit_dir "$C4B_UNITS" "$C4B_MAIN"
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
mk_unit_dir "$C5_UNITS" "$C5_MAIN" "dispatch-heal.service"
mk_main_worktree "$C5_MAIN" "$C5_CALLS" 0
: > "$C5_CALLS"; : > "$C5_ALARM"
STUB_FAILED_UNITS="" STUB_ENSURE_SWEEP_TIMER_RC=7 run_pass "$C5_UNITS" "$C5_MAIN" "$C5_ALARM"

assert_eq "installer-nonzero: exit code still 1 (healed)" 1 "$RUN_RC"
assert_contains "installer-nonzero: ensure_sweep_timer rc=7 visible in output" "$RUN_OUT" "ensure_sweep_timer rc=7"
assert_contains "installer-nonzero: summary line carries sweep_rc=7" "$RUN_OUT" "sweep_rc=7"

# ===========================================================================
# Case 6: poisoning the OLD literal `/tmp/tmp.` substring test would have
# missed. Detection is now a positive assertion against the expected
# main-worktree script path, so each of these must heal (exit 1) — never take
# the clean branch, and never RESOLVE the heal-fired alarm that correctly
# recorded the poisoning.
# ===========================================================================
echo "=== Case 6: non-/tmp/tmp. poisoning is still detected ==="
c6_case() { # <slug> <poison_root> <label>
  local slug="$1" poison_root="$2" label="$3"
  local u="$WORK/c6-$slug-units" m="$WORK/c6-$slug-main"
  local c="$WORK/c6-$slug-calls.log" a="$WORK/c6-$slug-alarm.log"
  mk_unit_dir "$u" "$m" "dispatch-heal.service" "$poison_root"
  mk_main_worktree "$m" "$c" 1
  : > "$c"; : > "$a"
  STUB_FAILED_UNITS="" run_pass "$u" "$m" "$a"
  local alarm calls
  alarm="$(cat "$a")"; calls="$(cat "$c")"
  assert_eq "$label: exit 1 (healed), not a false clean pass" 1 "$RUN_RC"
  assert_contains "$label: heal-fired alarm fired" "$alarm" "--kind heal-fired --statement"
  assert_not_contains "$label: heal-fired NOT resolved" "$alarm" "--resolve --kind heal-fired"
  assert_contains "$label: installers ran" "$calls" "ensure_heartbeat_units called with $m"
  assert_not_contains "$label: no result=clean line" "$RUN_OUT" "result=clean"
}

# (a) relocated TMPDIR — `mktemp -d` under TMPDIR=/tmp/claude yields a path
#     that does NOT contain the literal `/tmp/tmp.`.
c6_case relocated-tmpdir "/tmp/claude/tmp.QQQQQQ" "relocated-TMPDIR scratch"
# (b) a $CLAUDE_JOB_DIR/tmp scratch dir.
c6_case job-dir "/home/tester/.claude/jobs/job-42/tmp/wt" "job-dir scratch"
# (c) a .claude/worktrees/<branch> checkout — reaped on merge, the most common
#     non-main checkout on this host.
c6_case branch-worktree "$WORK/c6-branch-worktree-main/.claude/worktrees/some-branch" "per-branch worktree checkout"
# (d) a plain wrong root that is not scratch at all.
c6_case wrong-root "/home/tester/elsewhere" "wrong main-worktree root"

# ===========================================================================
# Case 7: DISPATCH_HEAL_MAIN_WORKTREE unset and the script itself running from
# a scratch copy -> the DERIVED main worktree is a throwaway path, so the run
# must UNKNOWN(2) with no installer invoked. Without this guard the heal would
# rewrite all five managed units (including dispatch-heal.service itself) to
# point at the scratch dir: one poisoned unit becomes five, and the whole
# fleet stops firing when the dir is GC'd.
# ===========================================================================
echo "=== Case 7: derived main worktree is a scratch copy ==="
C7_ROOT="$WORK/c7-scratch-main"
C7_SCRIPTS="$C7_ROOT/.claude/skills/dispatch-propagate/scripts"
C7_UNITS="$WORK/c7-units"; C7_CALLS="$WORK/c7-calls.log"; C7_ALARM="$WORK/c7-alarm.log"
mkdir -p "$C7_SCRIPTS"
cp "$SCRIPT" "$C7_SCRIPTS/dispatch-heal-units"
chmod +x "$C7_SCRIPTS/dispatch-heal-units"
mk_unit_dir "$C7_UNITS" "$C7_ROOT"
mk_main_worktree "$C7_ROOT" "$C7_CALLS" 1   # a sourceable lib.sh beside the copy
: > "$C7_CALLS"; : > "$C7_ALARM"

set +e
# GIT_CEILING_DIRECTORIES keeps the derivation deterministic: git discovery
# must not ascend out of $WORK and find some unrelated enclosing repo.
C7_OUT="$(
  DISPATCH_HEAL_UNIT_DIR="$C7_UNITS" \
  DISPATCH_HEAL_SYSTEMCTL_CMD="$BIN/systemctl" \
  DISPATCH_HEAL_MAIN_WORKTREE="" \
  DISPATCH_HEAL_ALARM_CMD="$ALARM_BIN" \
  TEST_ALARM_LOG="$C7_ALARM" \
  STUB_FAILED_UNITS="" \
  GIT_CEILING_DIRECTORIES="$(dirname "$WORK")" \
  bash "$C7_SCRIPTS/dispatch-heal-units" 2>&1
)"
C7_RC=$?
set -e

assert_eq "scratch-derived worktree: exit code is UNKNOWN(2), never 0 or 1" 2 "$C7_RC"
if [[ -s "$C7_CALLS" ]]; then
  no "scratch-derived worktree: no installer should have run (found: $(cat "$C7_CALLS"))"
else
  ok "scratch-derived worktree: no installer ran"
fi
ALARM7="$(cat "$C7_ALARM")"
assert_contains "scratch-derived worktree: heal-unknown alarm fired" "$ALARM7" "--kind heal-unknown --statement"
assert_not_contains "scratch-derived worktree: heal-fired NOT fired" "$ALARM7" "--kind heal-fired --statement"
assert_not_contains "scratch-derived worktree: heal-fired NOT resolved" "$ALARM7" "--resolve --kind heal-fired"
assert_contains "scratch-derived worktree: refusal is explained" "$C7_OUT" "refusing to heal"

# ===========================================================================
# Case 8 (BODY-STABILITY RATCHET): two healed passes over the SAME poisoned
# units must emit a byte-identical heal-fired body.
#
# dispatch-fleet-alarm commits a re-detection only when the body differs from
# the one already on origin/main. This healer fires every two minutes, so a body
# opening with `heal-fired at <second-resolution timestamp>` differs on EVERY
# pass: a recurring poisoning would fetch+rebase+push to main every two minutes
# — ~720 pushes a day, each arming the four required CI checks, precisely while
# the fleet is already unwell. The timestamp belongs on the `result=` log line,
# which this case also checks still carries it.
# ===========================================================================
echo "=== Case 8: heal-fired body is stable across passes ==="
extract_alarm_body() { # <alarm-log> -> the first --body-file's contents
  awk '/^BODY_FILE_CONTENT_START$/{f=1;next} /^BODY_FILE_CONTENT_END$/{if(f)exit} f' "$1"
}
C8_UNITS="$WORK/c8-units"; C8_MAIN="$WORK/c8-main"; C8_CALLS="$WORK/c8-calls.log"
C8_ALARM_1="$WORK/c8-alarm-1.log"; C8_ALARM_2="$WORK/c8-alarm-2.log"
mk_unit_dir "$C8_UNITS" "$C8_MAIN" "dispatch-heartbeat.service"
mk_main_worktree "$C8_MAIN" "$C8_CALLS" 1
: > "$C8_CALLS"; : > "$C8_ALARM_1"; : > "$C8_ALARM_2"

# The two passes are pinned to DIFFERENT wall-clock seconds through the $BIN
# date stub, so a body that still embedded the clock could not accidentally
# match by both passes landing in the same second.
STUB_FAILED_UNITS="dispatch-heal.service" PATH="$BIN:$PATH" STUB_NOW_UTC="2026-07-31T00:00:01Z" \
  run_pass "$C8_UNITS" "$C8_MAIN" "$C8_ALARM_1"
assert_eq "body-stability: pass 1 healed" 1 "$RUN_RC"
C8_OUT_1="$RUN_OUT"
# The installers are fakes, so the unit files are NOT repaired — pass 2 finds
# exactly the same poisoning, which is the recurring-condition shape.
STUB_FAILED_UNITS="dispatch-heal.service" PATH="$BIN:$PATH" STUB_NOW_UTC="2026-07-31T11:22:33Z" \
  run_pass "$C8_UNITS" "$C8_MAIN" "$C8_ALARM_2"
assert_eq "body-stability: pass 2 healed" 1 "$RUN_RC"
assert_contains "body-stability: the clock stub really moved the pass-2 clock" "$RUN_OUT" "2026-07-31T11:22:33Z"

C8_BODY_1="$(extract_alarm_body "$C8_ALARM_1")"
C8_BODY_2="$(extract_alarm_body "$C8_ALARM_2")"
if [[ -z "$C8_BODY_1" ]]; then
  no "body-stability: pass 1 emitted no heal-fired body (the ratchet would be vacuous)"
elif [[ "$C8_BODY_1" == "$C8_BODY_2" ]]; then
  ok "body-stability: the two passes emitted an identical heal-fired body"
else
  no "body-stability: the heal-fired body CHURNS across passes: $(diff <(printf '%s\n' "$C8_BODY_1") <(printf '%s\n' "$C8_BODY_2") | tr '\n' ' ')"
fi
# No ISO-8601 wall clock anywhere in the body...
if grep -Eq '[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z' <<<"$C8_BODY_1"; then
  no "body-stability: the heal-fired body still carries a wall-clock timestamp"
else
  ok "body-stability: no wall-clock timestamp in the heal-fired body"
fi
# ...but the body still identifies WHAT is wrong, and the log line still says WHEN.
assert_contains "body-stability: body still names the poisoned unit" "$C8_BODY_1" "dispatch-heartbeat.service"
assert_contains "body-stability: body still names the is-failed unit" "$C8_BODY_1" "dispatch-heal.service"
if grep -Eq 'result=healed .*at [0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z' <<<"$C8_OUT_1"; then
  ok "body-stability: the timestamp is on the result= log line instead"
else
  no "body-stability: the result= log line lost its timestamp"
fi

# ===========================================================================
echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[[ "$FAIL" -eq 0 ]]
