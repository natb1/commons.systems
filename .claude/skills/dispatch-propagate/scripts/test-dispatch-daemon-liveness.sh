#!/usr/bin/env bash
#
# test-dispatch-daemon-liveness.sh — unit-test harness for dispatch-daemon-liveness.
#
# Dependency-injects the systemctl / loginctl / pgrep invocations and the
# /proc/<pid>/cgroup reads through the sensor's DISPATCH_LIVENESS_* command
# overrides (the $systemctl_cmd pattern used around lib.sh:2775). No systemd, no
# real daemon, no network — only bash + jq. Covers all four verdicts, their exit
# codes, the census cgroup classification (managed wins over a co-present
# transient), the linger-unqueryable path, and the --json shape.
#
# House pattern mirrors packages/intentionsutil/scripts/test-graph-commit.sh and
# .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh. Run under
# bash -c, never zsh.

set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="$HARNESS_DIR/dispatch-daemon-liveness"
[[ -x "$SCRIPT" ]] || { echo "error: dispatch-daemon-liveness not found/executable at $SCRIPT" >&2; exit 1; }

WORK="$(mktemp -d)" || { echo "error: mktemp failed" >&2; exit 1; }
trap 'rm -rf "$WORK"' EXIT

PASS=0; FAIL=0
ok() { echo "PASS: $1"; PASS=$((PASS + 1)); }
no() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }
assert_eq() { # <label> <expected> <actual>
  if [[ "$2" == "$3" ]]; then ok "$1"; else no "$1 (expected '$2', got '$3')"; fi
}

# --- stubs ------------------------------------------------------------------
# Written once; behavior is driven per-case by STUB_* env vars read at call time.
BIN="$WORK/bin"
mkdir -p "$BIN"

cat > "$BIN/systemctl" <<'STUB'
#!/usr/bin/env bash
# usage: systemctl --user show <unit> -p ...  — emit KEY=VALUE lines.
unit=""
for a in "$@"; do
  case "$a" in
    dispatch-claude-daemon.service|dispatch-heartbeat.timer) unit="$a" ;;
  esac
done
if [[ "$unit" == "dispatch-claude-daemon.service" ]]; then
  printf 'ActiveState=%s\n' "${STUB_UNIT_ACTIVE:-inactive}"
  printf 'SubState=%s\n' "${STUB_UNIT_SUBSTATE:-dead}"
  printf 'MainPID=%s\n' "${STUB_UNIT_MAINPID:-0}"
  printf 'ActiveEnterTimestamp=%s\n' "${STUB_UNIT_AET:-}"
  printf 'NRestarts=%s\n' "${STUB_UNIT_NRESTARTS:-0}"
elif [[ "$unit" == "dispatch-heartbeat.timer" ]]; then
  printf 'ActiveState=%s\n' "${STUB_HB_ACTIVE:-inactive}"
  printf 'SubState=%s\n' "${STUB_HB_SUBSTATE:-dead}"
  printf 'LastTriggerUSec=%s\n' "${STUB_HB_LAST:-}"
fi
STUB
chmod +x "$BIN/systemctl"

cat > "$BIN/loginctl" <<'STUB'
#!/usr/bin/env bash
# usage: loginctl show-user <user> --property=Linger --value
[[ "${STUB_LINGER_FAIL:-0}" == "1" ]] && exit 1
printf '%s\n' "${STUB_LINGER:-no}"
STUB
chmod +x "$BIN/loginctl"

cat > "$BIN/pgrep" <<'STUB'
#!/usr/bin/env bash
# usage: pgrep -f 'claude daemon' — print one PID per line; exit 1 when none.
[[ -z "${STUB_PIDS:-}" ]] && exit 1
# shellcheck disable=SC2086 — intentional word-split of the space-list.
printf '%s\n' $STUB_PIDS
STUB
chmod +x "$BIN/pgrep"

# mk_proc <procdir> <pid>:<managed|transient> ...
# Build a fake /proc where each pid's cgroup file marks it managed or transient.
mk_proc() {
  local procdir="$1"; shift
  local spec pid cls
  for spec in "$@"; do
    pid="${spec%%:*}"; cls="${spec##*:}"
    mkdir -p "$procdir/$pid"
    if [[ "$cls" == "managed" ]]; then
      printf '0::/user.slice/user-1000.slice/user@1000.service/app.slice/dispatch-claude-daemon.service\n' > "$procdir/$pid/cgroup"
    else
      printf '0::/user.slice/user-1000.slice/session-3.scope\n' > "$procdir/$pid/cgroup"
    fi
  done
}

# run_case captures stdout and exit code into RUN_OUT / RUN_RC. All STUB_*/PROC
# vars are passed inline so each case is isolated.
run_case() {
  local procdir="$1"; shift  # remaining args: extra flags to the script (e.g. --json)
  set +e
  RUN_OUT="$(
    DISPATCH_LIVENESS_SYSTEMCTL_CMD="$BIN/systemctl" \
    DISPATCH_LIVENESS_LOGINCTL_CMD="$BIN/loginctl" \
    DISPATCH_LIVENESS_PGREP_CMD="$BIN/pgrep" \
    DISPATCH_LIVENESS_PROC_DIR="$procdir" \
    DISPATCH_LIVENESS_USER="tester" \
    STUB_UNIT_ACTIVE="${STUB_UNIT_ACTIVE:-}" \
    STUB_UNIT_SUBSTATE="${STUB_UNIT_SUBSTATE:-}" \
    STUB_UNIT_MAINPID="${STUB_UNIT_MAINPID:-}" \
    STUB_UNIT_AET="${STUB_UNIT_AET:-}" \
    STUB_UNIT_NRESTARTS="${STUB_UNIT_NRESTARTS:-}" \
    STUB_HB_ACTIVE="${STUB_HB_ACTIVE:-}" \
    STUB_HB_SUBSTATE="${STUB_HB_SUBSTATE:-}" \
    STUB_HB_LAST="${STUB_HB_LAST:-}" \
    STUB_LINGER="${STUB_LINGER:-}" \
    STUB_LINGER_FAIL="${STUB_LINGER_FAIL:-}" \
    STUB_PIDS="${STUB_PIDS:-}" \
    bash "$SCRIPT" "$@"
  )"
  RUN_RC=$?
  set -e
}

# Reset all per-case STUB_* vars to their inactive/empty defaults.
reset_stubs() {
  unset STUB_UNIT_ACTIVE STUB_UNIT_SUBSTATE STUB_UNIT_MAINPID STUB_UNIT_AET STUB_UNIT_NRESTARTS
  unset STUB_HB_ACTIVE STUB_HB_SUBSTATE STUB_HB_LAST STUB_LINGER STUB_LINGER_FAIL STUB_PIDS
}

# ---------------------------------------------------------------------------
# Case 1: managed-live — managed daemon in unit cgroup, linger on, heartbeat active.
reset_stubs
P="$WORK/proc1"; mk_proc "$P" 1001:managed
STUB_UNIT_ACTIVE=active STUB_UNIT_SUBSTATE=running STUB_UNIT_MAINPID=1001 \
  STUB_UNIT_AET="Tue 2026-07-08 09:00:00 UTC" STUB_UNIT_NRESTARTS=0 \
  STUB_HB_ACTIVE=active STUB_HB_SUBSTATE=waiting STUB_LINGER=yes STUB_PIDS=1001 \
  run_case "$P"
assert_eq "managed-live exit code" 0 "$RUN_RC"
[[ "$RUN_OUT" == *"managed-live"* ]] && ok "managed-live verdict in report" || no "managed-live verdict missing"

# ---------------------------------------------------------------------------
# Case 2: transient-substituting — unit inactive, a transient daemon serving.
reset_stubs
P="$WORK/proc2"; mk_proc "$P" 2002:transient
STUB_UNIT_ACTIVE=inactive STUB_UNIT_SUBSTATE=dead STUB_UNIT_MAINPID=0 \
  STUB_HB_ACTIVE=inactive STUB_LINGER=no STUB_PIDS=2002 \
  run_case "$P"
assert_eq "transient-substituting exit code" 2 "$RUN_RC"
[[ "$RUN_OUT" == *"transient-substituting"* ]] && ok "transient-substituting verdict" || no "transient-substituting verdict missing"

# ---------------------------------------------------------------------------
# Case 3: down — no claude daemon process at all.
reset_stubs
P="$WORK/proc3"; mkdir -p "$P"
STUB_UNIT_ACTIVE=inactive STUB_UNIT_MAINPID=0 STUB_HB_ACTIVE=inactive STUB_LINGER=no STUB_PIDS="" \
  run_case "$P"
assert_eq "down exit code" 3 "$RUN_RC"
[[ "$RUN_OUT" == *"down"* ]] && ok "down verdict" || no "down verdict missing"

# ---------------------------------------------------------------------------
# Case 4a: degraded — managed daemon present but linger OFF.
reset_stubs
P="$WORK/proc4a"; mk_proc "$P" 1001:managed
STUB_UNIT_ACTIVE=active STUB_UNIT_MAINPID=1001 STUB_HB_ACTIVE=active STUB_LINGER=no STUB_PIDS=1001 \
  run_case "$P"
assert_eq "degraded (linger off) exit code" 4 "$RUN_RC"
[[ "$RUN_OUT" == *"degraded"* && "$RUN_OUT" == *"linger"* ]] && ok "degraded linger reason" || no "degraded linger reason missing"

# ---------------------------------------------------------------------------
# Case 4b: degraded — managed daemon present, linger on, but heartbeat INACTIVE.
reset_stubs
P="$WORK/proc4b"; mk_proc "$P" 1001:managed
STUB_UNIT_ACTIVE=active STUB_UNIT_MAINPID=1001 STUB_HB_ACTIVE=inactive STUB_LINGER=yes STUB_PIDS=1001 \
  run_case "$P"
assert_eq "degraded (heartbeat inactive) exit code" 4 "$RUN_RC"
[[ "$RUN_OUT" == *"degraded"* && "$RUN_OUT" == *"heartbeat"* ]] && ok "degraded heartbeat reason" || no "degraded heartbeat reason missing"

# ---------------------------------------------------------------------------
# Case 5: managed wins over a co-present transient daemon.
reset_stubs
P="$WORK/proc5"; mk_proc "$P" 1001:managed 3003:transient
STUB_UNIT_ACTIVE=active STUB_UNIT_MAINPID=1001 STUB_HB_ACTIVE=active STUB_LINGER=yes STUB_PIDS="1001 3003" \
  run_case "$P"
assert_eq "managed-wins exit code" 0 "$RUN_RC"
[[ "$RUN_OUT" == *"managed-live"* ]] && ok "managed wins over transient" || no "managed did not win over transient"

# ---------------------------------------------------------------------------
# Case 6: loginctl failure (linger unqueryable) with a managed daemon -> degraded.
reset_stubs
P="$WORK/proc6"; mk_proc "$P" 1001:managed
STUB_UNIT_ACTIVE=active STUB_UNIT_MAINPID=1001 STUB_HB_ACTIVE=active STUB_LINGER_FAIL=1 STUB_PIDS=1001 \
  run_case "$P"
assert_eq "linger-unqueryable exit code" 4 "$RUN_RC"
[[ "$RUN_OUT" == *"degraded"* ]] && ok "linger-unqueryable -> degraded" || no "linger-unqueryable did not degrade"

# ---------------------------------------------------------------------------
# Case 7: --json shape — verdict, exit_code, census classification, presence flags.
reset_stubs
P="$WORK/proc7"; mk_proc "$P" 1001:managed 3003:transient
STUB_UNIT_ACTIVE=active STUB_UNIT_MAINPID=1001 STUB_UNIT_NRESTARTS=2 \
  STUB_UNIT_AET="Tue 2026-07-08 09:00:00 UTC" \
  STUB_HB_ACTIVE=active STUB_HB_SUBSTATE=waiting STUB_LINGER=yes STUB_PIDS="1001 3003" \
  run_case "$P" --json
assert_eq "json exit code" 0 "$RUN_RC"
# Valid JSON?
if jq -e . >/dev/null 2>&1 <<<"$RUN_OUT"; then ok "json parses"; else no "json does not parse"; fi
assert_eq "json verdict"          "managed-live" "$(jq -r '.verdict' <<<"$RUN_OUT")"
assert_eq "json exit_code field"  "0"            "$(jq -r '.exit_code' <<<"$RUN_OUT")"
assert_eq "json unit active"      "active"       "$(jq -r '.unit.active_state' <<<"$RUN_OUT")"
assert_eq "json unit nrestarts"   "2"            "$(jq -r '.unit.n_restarts' <<<"$RUN_OUT")"
assert_eq "json unit active_enter" "Tue 2026-07-08 09:00:00 UTC" "$(jq -r '.unit.active_enter_timestamp' <<<"$RUN_OUT")"
assert_eq "json linger"           "yes"          "$(jq -r '.linger' <<<"$RUN_OUT")"
assert_eq "json managed_present"  "true"         "$(jq -r '.managed_present' <<<"$RUN_OUT")"
assert_eq "json transient_present" "true"        "$(jq -r '.transient_present' <<<"$RUN_OUT")"
assert_eq "json census length"    "2"            "$(jq -r '.census | length' <<<"$RUN_OUT")"
assert_eq "json managed pid class" "managed"     "$(jq -r '.census[] | select(.pid==1001) | .class' <<<"$RUN_OUT")"
assert_eq "json transient pid class" "transient" "$(jq -r '.census[] | select(.pid==3003) | .class' <<<"$RUN_OUT")"

# ---------------------------------------------------------------------------
# Case 8: --json exit_code tracks a non-zero verdict (down).
reset_stubs
P="$WORK/proc8"; mkdir -p "$P"
STUB_UNIT_ACTIVE=inactive STUB_UNIT_MAINPID=0 STUB_HB_ACTIVE=inactive STUB_LINGER=no STUB_PIDS="" \
  run_case "$P" --json
assert_eq "json down exit code" 3 "$RUN_RC"
assert_eq "json down verdict" "down" "$(jq -r '.verdict' <<<"$RUN_OUT")"
assert_eq "json down exit_code field" "3" "$(jq -r '.exit_code' <<<"$RUN_OUT")"
assert_eq "json down census empty" "0" "$(jq -r '.census | length' <<<"$RUN_OUT")"

# ---------------------------------------------------------------------------
echo ""
echo "================================"
echo "Results: $PASS passed, $FAIL failed"
echo "================================"
[[ "$FAIL" -eq 0 ]]
