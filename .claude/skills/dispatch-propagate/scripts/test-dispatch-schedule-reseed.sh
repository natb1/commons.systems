#!/usr/bin/env bash
# Tests for dispatch-schedule-reseed -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 11442-12324.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-schedule-reseed tests
# ============================================================================
#
# dispatch-schedule-reseed writes a transient systemd.user timer at the next
# rate-limit cap reset. The test harness stubs `systemd-run` on PATH and
# records each invocation's argv, so a test can assert exactly what was
# scheduled. The script's env-var contract mirrors dispatch-target-workers's
# (per-field telemetry + path overrides) — tests rely on the overrides and
# do not require a real rate_limits.json on the filesystem.
#
# Each test gets a fresh tmp tree:
#   $TMPDIR_TEST/scripts/   copy of dispatch-schedule-reseed + dispatch-config-load
#   $TMPDIR_TEST/config/    synthetic config directory (DISPATCH_CONFIG_DIR)
#   $TMPDIR_TEST/rl/        synthetic rate_limits.json directory
#   $TMPDIR_TEST/bin/       systemd-run stub
#   $TMPDIR_TEST/systemd-log  recorded systemd-run argv (one line per call)
#   $TMPDIR_TEST/main/      a synthetic main worktree path
echo ""
echo "=== dispatch-schedule-reseed ==="

sr_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/config" "$TMPDIR_TEST/rl" \
    "$TMPDIR_TEST/bin" "$TMPDIR_TEST/main"

  cp "$SCRIPT_DIR/dispatch-schedule-reseed" "$TMPDIR_TEST/scripts/dispatch-schedule-reseed"
  cp "$SCRIPT_DIR/dispatch-config-load" "$TMPDIR_TEST/scripts/dispatch-config-load"
  # dispatch-schedule-reseed and dispatch-config-load source lib.sh via their
  # SCRIPT_DIR — so lib.sh must sit alongside them. Sourced, not executed — no
  # chmod +x.
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/scripts/lib.sh"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-schedule-reseed" \
           "$TMPDIR_TEST/scripts/dispatch-config-load"

  # The no-absolute-cap branch consults dispatch-target-workers --reopen-at for
  # the pace-curve crossing. Copy the real budgeter (it needs dispatch-config-load
  # + lib.sh, already copied alongside) and wire the override so the pace tests
  # exercise the real curve computation.
  cp "$SCRIPT_DIR/dispatch-target-workers" "$TMPDIR_TEST/scripts/dispatch-target-workers"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-target-workers"
  export DISPATCH_SCHEDULE_RESEED_TARGET_WORKERS_CMD="$TMPDIR_TEST/scripts/dispatch-target-workers"

  export DISPATCH_CONFIG_DIR="$TMPDIR_TEST/config"
  # Default: point at an absent file so tests without explicit telemetry get
  # the missing-telemetry no-op unless they override env vars.
  export DISPATCH_SCHEDULE_RESEED_RATE_LIMITS_PATH="$TMPDIR_TEST/rl/missing.json"
  # Pin the budgeter's own rate_limits path at the same temp file. The reseed
  # script passes telemetry to the budgeter via per-field env vars, which take
  # precedence over any file read — so the budgeter never reads this path in
  # practice. Exporting it anyway isolates the test from the real
  # ~/.local/share/.../rate_limits.json if the budgeter's read/override order
  # ever changes.
  export DISPATCH_TARGET_WORKERS_RATE_LIMITS_PATH="$TMPDIR_TEST/rl/missing.json"
  export DISPATCH_SCHEDULE_RESEED_MAIN_WORKTREE="$TMPDIR_TEST/main"

  # systemd-run stub: records its argv (one line per call), exits 0.
  cat > "$TMPDIR_TEST/bin/systemd-run" <<STUB
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/systemd-log"
STUB
  chmod +x "$TMPDIR_TEST/bin/systemd-run"
  export DISPATCH_SCHEDULE_RESEED_SYSTEMD_RUN_CMD="$TMPDIR_TEST/bin/systemd-run"

  # dispatch-schedule-reseed now calls ensure_recover_unit (lib.sh), which
  # without isolation would write to the real ~/.config/systemd/user/ and run a
  # real `systemctl --user`. Redirect the unit dir into the tmp tree and point
  # its systemctl at a no-op stub so the function writes nothing outside the
  # test sandbox.
  cat > "$TMPDIR_TEST/bin/systemctl" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
  chmod +x "$TMPDIR_TEST/bin/systemctl"
  export DISPATCH_RECOVER_UNIT_DIR="$TMPDIR_TEST/systemd-user"
  export DISPATCH_RECOVER_SYSTEMCTL_CMD="$TMPDIR_TEST/bin/systemctl"
  export DISPATCH_SWEEP_TIMER_UNIT_DIR="$TMPDIR_TEST/systemd-user"
  export DISPATCH_SWEEP_TIMER_SYSTEMCTL_CMD="$TMPDIR_TEST/bin/systemctl"
  export DISPATCH_HEARTBEAT_UNIT_DIR="$TMPDIR_TEST/systemd-user"
  export DISPATCH_HEARTBEAT_SYSTEMCTL_CMD="$TMPDIR_TEST/bin/systemctl"
  export DISPATCH_HEALER_UNIT_DIR="$TMPDIR_TEST/systemd-user"
  export DISPATCH_HEALER_SYSTEMCTL_CMD="$TMPDIR_TEST/bin/systemctl"
  export DISPATCH_WATCHER_UNIT_DIR="$TMPDIR_TEST/systemd-user"
  export DISPATCH_WATCHER_SYSTEMCTL_CMD="$TMPDIR_TEST/bin/systemctl"
}

sr_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  unset DISPATCH_CONFIG_DIR
  unset DISPATCH_SCHEDULE_RESEED_RATE_LIMITS_PATH
  unset DISPATCH_TARGET_WORKERS_RATE_LIMITS_PATH
  unset DISPATCH_SCHEDULE_RESEED_NOW
  unset DISPATCH_SCHEDULE_RESEED_USED_WEEKLY
  unset DISPATCH_SCHEDULE_RESEED_RESETS_AT_WEEKLY
  unset DISPATCH_SCHEDULE_RESEED_USED_5H
  unset DISPATCH_SCHEDULE_RESEED_RESETS_AT_5H
  unset DISPATCH_SCHEDULE_RESEED_MAIN_WORKTREE
  unset DISPATCH_SCHEDULE_RESEED_SYSTEMD_RUN_CMD
  unset DISPATCH_SCHEDULE_RESEED_TARGET_WORKERS_CMD
  unset DISPATCH_SCHEDULE_RESEED_SHORT_DELAY
  unset DISPATCH_RECOVER_UNIT_DIR DISPATCH_RECOVER_SYSTEMCTL_CMD DISPATCH_SWEEP_TIMER_UNIT_DIR DISPATCH_SWEEP_TIMER_SYSTEMCTL_CMD DISPATCH_HEARTBEAT_UNIT_DIR DISPATCH_HEARTBEAT_SYSTEMCTL_CMD DISPATCH_HEALER_UNIT_DIR DISPATCH_HEALER_SYSTEMCTL_CMD DISPATCH_WATCHER_UNIT_DIR DISPATCH_WATCHER_SYSTEMCTL_CMD
}

# sr_write_rl <file-name> <used_weekly> <resets_weekly> <used_5h> <resets_5h>
#   Write a rate_limits.json. Set any of the four to "absent" to omit the
#   surrounding block. Mirrors tw_write_rl above.
sr_write_rl() {
  local name="$1" uw="$2" rw="$3" u5="$4" r5="$5"
  local path="$TMPDIR_TEST/rl/$name"
  local seven=""
  local five=""
  if [[ "$uw" != "absent" && "$rw" != "absent" ]]; then
    seven="\"seven_day\":{\"used_percentage\":$uw,\"resets_at\":$rw}"
  fi
  if [[ "$u5" != "absent" && "$r5" != "absent" ]]; then
    five="\"five_hour\":{\"used_percentage\":$u5,\"resets_at\":$r5}"
  fi
  local parts=()
  [[ -n "$five" ]] && parts+=("$five")
  [[ -n "$seven" ]] && parts+=("$seven")
  local joined
  joined=$(IFS=,; printf '%s' "${parts[*]}")
  printf '{%s}\n' "$joined" > "$path"
  export DISPATCH_SCHEDULE_RESEED_RATE_LIMITS_PATH="$path"
  # Keep the budgeter's path pinned to the same file (see sr_setup).
  export DISPATCH_TARGET_WORKERS_RATE_LIMITS_PATH="$path"
}

# --- Test 1: weekly cap hit → schedules at weekly resets_at ------------------

echo "Test: weekly cap-hit schedules at the weekly resets_at"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
# used_weekly=100 >= 100 (weekly_terminal_pct) → weekly cap hit.
# 5h cap clear (10 < 50). Expect schedule at the weekly resets_at.
sr_write_rl "rl.json" 100 20000 10 15000
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr")
assert_eq "weekly cap-hit stdout names the unit" \
  "scheduled dispatch-reseed-20000 at 20000" "$out"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"--unit=dispatch-reseed-20000"* \
   && "$log" == *"--on-calendar=@20000"* \
   && "$log" == *"--collect"* \
   && "$log" == *"--property=OnFailure=dispatch-tick-recover.service"* \
   && "$log" == *"--property=KillMode=process"* \
   && "$log" == *"--working-directory=$TMPDIR_TEST/main"* \
   && "$log" == *"--setenv=PATH="* \
   && "$log" == *"$TMPDIR_TEST/main/.claude/skills/dispatch-propagate/scripts/dispatch-tick"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: weekly cap-hit systemd-run argv (unit + calendar + collect + OnFailure + KillMode + cwd + setenv + exec)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: weekly cap-hit systemd-run argv (unit + calendar + collect + OnFailure + KillMode + cwd + setenv + exec)"
  echo "    log: $log"
fi
sr_teardown

# --- Test 2: 5h cap hit → schedules at 5h resets_at --------------------------

echo "Test: 5h cap-hit schedules at the 5h resets_at"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
# used_5h=60 >= target_5h=50 → 5h cap hit. Weekly clear (50 < 100).
sr_write_rl "rl.json" 50 20000 60 15000
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>/dev/null)
assert_eq "5h cap-hit stdout names the 5h reset unit" \
  "scheduled dispatch-reseed-15000 at 15000" "$out"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"--unit=dispatch-reseed-15000"* \
   && "$log" == *"--on-calendar=@15000"* \
   && "$log" == *"--property=KillMode=process"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: 5h cap-hit systemd-run argv (unit + calendar + KillMode)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: 5h cap-hit systemd-run argv (unit + calendar + KillMode)"
  echo "    log: $log"
fi
sr_teardown

# --- Test 3: both caps hit → picks the earlier reset -------------------------

echo "Test: both caps hit → schedules at the earlier resets_at"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
# Both caps hit; 5h reset (15000) is earlier than weekly reset (20000).
sr_write_rl "rl.json" 100 20000 60 15000
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>/dev/null)
assert_eq "both caps hit; picks earlier reset" \
  "scheduled dispatch-reseed-15000 at 15000" "$out"
sr_teardown

# --- Test 4: neither cap hit + pace curve permits → no-op (#1050) ------------
#
# No absolute cap is hit and weekly telemetry is present, so the no-cap branch
# consults dispatch-target-workers --reopen-at. Here used_weekly=50 sits far
# under the pace curve (x≈0.983 near week end → W≈88, 50 << 88), so reopen
# reports `none` and the script no-ops. The no-op contract is: stdout silent,
# exit 0, no systemd-run invocation. The landed script emits an informational
# stderr diagnostic naming the reopen-at result on this path (matched, not
# asserted empty — mirrors Test 5/Test 9's no-op stderr diagnostics).
echo "Test: neither cap hit + pace curve permits → no-op (no systemd-run call)"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
# 50 < 100 weekly, 20 < 50 5h → no absolute cap hit. Weekly present → budgeter
# consulted; used_weekly=50 well under pace → reopen='none' → no-op.
sr_write_rl "rl.json" 50 20000 20 15000
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr")
err=$(cat "$TMPDIR_TEST/stderr")
assert_eq "neither cap hit; stdout silent" "" "$out"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"no absolute cap hit"* && "$err" == *"reopen-at="* && "$err" == *"no-op"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: neither cap hit; stderr names the pace-permits no-op diagnostic"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: neither cap hit; stderr names the pace-permits no-op diagnostic"
  echo "    stderr: $err"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: neither cap hit; no systemd-run invocation"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: neither cap hit; no systemd-run invocation"
  echo "    log: $(cat "$TMPDIR_TEST/systemd-log")"
fi
sr_teardown

# --- Test 5: missing telemetry file → no-op with stderr diagnostic -----------

echo "Test: missing rate_limits.json → no-op with stderr diagnostic"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
# Default RATE_LIMITS_PATH points at a non-existent file.
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr")
err=$(cat "$TMPDIR_TEST/stderr")
assert_eq "missing telemetry; stdout silent" "" "$out"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"dispatch-schedule-reseed"* && "$err" == *"missing or unreadable"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: missing telemetry stderr names the diagnostic"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: missing telemetry stderr names the diagnostic"
  echo "    stderr: $err"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: missing telemetry; no systemd-run invocation"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: missing telemetry; no systemd-run invocation"
fi
sr_teardown

# --- Test 6: seven_day absent + 5h cap hit → schedules at 5h resets_at -------

echo "Test: seven_day absent + 5h cap-hit schedules at the 5h resets_at"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
sr_write_rl "rl.json" absent absent 60 15000
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>/dev/null)
assert_eq "seven_day absent; 5h cap-hit schedules at 15000" \
  "scheduled dispatch-reseed-15000 at 15000" "$out"
sr_teardown

# --- Test 7: five_hour absent + weekly cap hit → schedules at weekly resets_at

echo "Test: five_hour absent + weekly cap-hit schedules at the weekly resets_at"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
sr_write_rl "rl.json" 100 20000 absent absent
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>/dev/null)
assert_eq "five_hour absent; weekly cap-hit schedules at 20000" \
  "scheduled dispatch-reseed-20000 at 20000" "$out"
sr_teardown

# --- Test 8: idempotent re-call (unit already exists) → no-op, exit 0 --------

echo "Test: repeated call with the same resets_at is idempotent (single timer)"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
# used_weekly=100 >= 100 (weekly_terminal_pct) → weekly cap hit.
sr_write_rl "rl.json" 100 20000 10 15000
# Replace the systemd-run stub with one that simulates the second call hitting
# the already-exists collision: first call succeeds; second call exits 1 with
# the "already exists" message on stderr.
cat > "$TMPDIR_TEST/bin/systemd-run" <<STUB
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/systemd-log"
count=\$(wc -l < "$TMPDIR_TEST/systemd-log")
if [[ "\$count" -gt 1 ]]; then
  echo "Unit dispatch-reseed-20000.timer already exists." >&2
  exit 1
fi
STUB
chmod +x "$TMPDIR_TEST/bin/systemd-run"

out1=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr1")
rc1=$?
out2=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr2")
rc2=$?
assert_eq "first call exits 0" "0" "$rc1"
assert_eq "first call stdout names the new unit" \
  "scheduled dispatch-reseed-20000 at 20000" "$out1"
assert_eq "second call exits 0 (idempotent)" "0" "$rc2"
assert_eq "second call stdout silent" "" "$out2"
err2=$(cat "$TMPDIR_TEST/stderr2")
TOTAL=$((TOTAL + 1))
if [[ "$err2" == *"already scheduled"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: second call stderr notes already-scheduled"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: second call stderr notes already-scheduled"
  echo "    stderr2: $err2"
fi
sr_teardown

# --- Test 9: reseed_at already passed → no-op --------------------------------

echo "Test: reseed_at already passed → no-op (no systemd-run call)"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
# used_weekly=100 >= 100 (weekly_terminal_pct) → weekly cap hit; resets_at=5000 < now=10000 → already passed.
sr_write_rl "rl.json" 100 5000 10 15000
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr")
err=$(cat "$TMPDIR_TEST/stderr")
assert_eq "already-passed reseed; stdout silent" "" "$out"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"cap reset already passed"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: already-passed reseed; stderr contains 'cap reset already passed'"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: already-passed reseed; stderr contains 'cap reset already passed'"
  echo "    stderr: $err"
fi
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"no-op"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: already-passed reseed; stderr contains 'no-op'"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: already-passed reseed; stderr contains 'no-op'"
  echo "    stderr: $err"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: already-passed reseed; no systemd-run invocation"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: already-passed reseed; no systemd-run invocation"
fi
sr_teardown

# --- Test 10: unexpected systemd-run failure → exit code passes through ------
#
# systemd-run can fail for reasons unrelated to the already-exists collision —
# e.g. D-Bus down, missing systemd, permission denied. The script's documented
# contract is: "non-zero — systemd-run failed for a reason other than the
# already-exists collision; the exit code is passed through." A naive
# `if cmd; then ...; fi; RC=$?` swallows the real exit code (because `$?`
# after `if` is the exit status of the construct itself, not the condition),
# so the test asserts the real exit code propagates.

echo "Test: unexpected systemd-run failure → exit code passes through"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
# used_weekly=100 >= 100 (weekly_terminal_pct) → weekly cap hit.
sr_write_rl "rl.json" 100 20000 10 15000
# Replace the stub with one that exits 42 with a non-already-exists message.
cat > "$TMPDIR_TEST/bin/systemd-run" <<STUB
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/systemd-log"
echo "D-Bus connection failed: Address not available" >&2
exit 42
STUB
chmod +x "$TMPDIR_TEST/bin/systemd-run"

# Use `if cmd; then rc=0; else rc=$?; fi` so `set -e` doesn't abort the suite
# on the expected non-zero exit, AND `$?` is captured inside the `else` branch
# where it correctly reflects the failed command's exit code.
if out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr"); then
  rc=0
else
  rc=$?
fi
err=$(cat "$TMPDIR_TEST/stderr")
assert_eq "unexpected failure exit code passes through" "42" "$rc"
assert_eq "unexpected failure; stdout silent" "" "$out"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"D-Bus connection failed"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: unexpected failure surfaces systemd-run stderr"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: unexpected failure surfaces systemd-run stderr"
  echo "    stderr: $err"
fi
sr_teardown

# --- Test 11: seven_day present but resets_at null → block treated as absent -

echo "Test: seven_day present but resets_at null → block treated as absent"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
cat > "$TMPDIR_TEST/rl/rl.json" <<'JSON'
{"seven_day":{"used_percentage":95,"resets_at":null},"five_hour":{"used_percentage":10,"resets_at":15000}}
JSON
export DISPATCH_SCHEDULE_RESEED_RATE_LIMITS_PATH="$TMPDIR_TEST/rl/rl.json"
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr")
err=$(cat "$TMPDIR_TEST/stderr")
assert_eq "partial seven_day record; stdout silent" "" "$out"
# Weekly block dropped (resets_at null) and 5h cap clear → no absolute cap. The
# pace path cannot compute a crossing without the weekly anchor, so the landed
# script no-ops with a "weekly anchor missing" stderr diagnostic (#1050). The
# no-op contract — stdout silent, no systemd-run — still holds.
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"no absolute cap hit"* && "$err" == *"weekly anchor missing"* && "$err" == *"no-op"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: partial seven_day record; stderr names the missing-anchor no-op diagnostic"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: partial seven_day record; stderr names the missing-anchor no-op diagnostic"
  echo "    stderr: $err"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: partial seven_day record; no systemd-run invocation"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: partial seven_day record; no systemd-run invocation"
fi
sr_teardown

# --- Test 12: tampered resets_at → treated as missing, no RCE in `(( ))` -----
#
# bash arithmetic context evaluates array-index command substitution, so a
# resets_at value like `a[$(touch /tmp/pwn)]` from a tampered rate_limits.json
# (or a hostile env override) would execute the inner command when it reaches
# `(( CAND_WEEKLY <= CAND_5H ))` or `(( RESEED_AT <= NOW ))`. The sanitizer
# strips any *_RESETS that is not a pure integer; the malformed block is then
# treated as absent telemetry. The RCE canary is a sentinel file: if it
# appears, the injection executed.

echo "Test: tampered weekly resets_at is rejected (no RCE, treated as missing)"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
CANARY="$TMPDIR_TEST/canary-weekly"
# Tampered weekly resets_at carries a bash-arithmetic RCE payload. 5h cap clear
# so the script no-ops cleanly with both blocks dropped.
export DISPATCH_SCHEDULE_RESEED_USED_WEEKLY=95
export DISPATCH_SCHEDULE_RESEED_RESETS_AT_WEEKLY='a[$(touch '"$CANARY"')]'
export DISPATCH_SCHEDULE_RESEED_USED_5H=10
export DISPATCH_SCHEDULE_RESEED_RESETS_AT_5H=15000
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr")
err=$(cat "$TMPDIR_TEST/stderr")
TOTAL=$((TOTAL + 1))
if [[ ! -e "$CANARY" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: tampered weekly resets_at did not trigger RCE"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: tampered weekly resets_at triggered RCE (canary exists)"
fi
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"WEEKLY_RESETS"* && "$err" == *"non-integer"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: tampered weekly resets_at stderr names the sanitizer"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: tampered weekly resets_at stderr names the sanitizer"
  echo "    stderr: $err"
fi
assert_eq "tampered weekly resets_at; no schedule line" "" "$out"
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: tampered weekly resets_at; no systemd-run invocation"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: tampered weekly resets_at; no systemd-run invocation"
fi
sr_teardown

echo "Test: tampered 5h resets_at is rejected (no RCE, treated as missing)"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
CANARY="$TMPDIR_TEST/canary-5h"
export DISPATCH_SCHEDULE_RESEED_USED_WEEKLY=50
export DISPATCH_SCHEDULE_RESEED_RESETS_AT_WEEKLY=20000
export DISPATCH_SCHEDULE_RESEED_USED_5H=60
export DISPATCH_SCHEDULE_RESEED_RESETS_AT_5H='a[$(touch '"$CANARY"')]'
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr")
err=$(cat "$TMPDIR_TEST/stderr")
TOTAL=$((TOTAL + 1))
if [[ ! -e "$CANARY" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: tampered 5h resets_at did not trigger RCE"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: tampered 5h resets_at triggered RCE (canary exists)"
fi
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"FIVEH_RESETS"* && "$err" == *"non-integer"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: tampered 5h resets_at stderr names the sanitizer"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: tampered 5h resets_at stderr names the sanitizer"
  echo "    stderr: $err"
fi
# Weekly is still clear (50 < 100) and 5h block was dropped → silent no-op.
assert_eq "tampered 5h resets_at; no schedule line" "" "$out"
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: tampered 5h resets_at; no systemd-run invocation"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: tampered 5h resets_at; no systemd-run invocation"
fi
sr_teardown

# --- Test 13: non-integer DISPATCH_SCHEDULE_RESEED_NOW → abort exit 2 --------

echo "Test: non-integer NOW override aborts with exit 2"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW='a[$(touch '"$TMPDIR_TEST/canary-now"')]'
sr_write_rl "rl.json" 100 20000 10 15000
if out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr"); then
  rc=0
else
  rc=$?
fi
err=$(cat "$TMPDIR_TEST/stderr")
assert_eq "non-integer NOW; exit 2" "2" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$TMPDIR_TEST/canary-now" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-integer NOW did not trigger RCE"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-integer NOW triggered RCE (canary exists)"
fi
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"NOW must be an integer"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-integer NOW stderr names the validator"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-integer NOW stderr names the validator"
  echo "    stderr: $err"
fi
sr_teardown

# --- Test 14: non-numeric used_percentage → block treated as missing ---------

echo "Test: non-numeric used_percentage is rejected (block treated as missing)"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
# Weekly USED is garbage; weekly block dropped. 5h is clear → silent no-op.
export DISPATCH_SCHEDULE_RESEED_USED_WEEKLY='nope'
export DISPATCH_SCHEDULE_RESEED_RESETS_AT_WEEKLY=20000
export DISPATCH_SCHEDULE_RESEED_USED_5H=10
export DISPATCH_SCHEDULE_RESEED_RESETS_AT_5H=15000
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr")
err=$(cat "$TMPDIR_TEST/stderr")
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"WEEKLY_USED"* && "$err" == *"non-numeric"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-numeric WEEKLY_USED stderr names the sanitizer"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-numeric WEEKLY_USED stderr names the sanitizer"
  echo "    stderr: $err"
fi
assert_eq "non-numeric WEEKLY_USED; no schedule line" "" "$out"
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-numeric WEEKLY_USED; no systemd-run invocation"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-numeric WEEKLY_USED; no systemd-run invocation"
fi
sr_teardown

# --- Test 15: pace-curve pause arms a crossing-time timer (#1050) ------------
#
# When no absolute cap is hit but weekly telemetry is present, the no-cap branch
# consults dispatch-target-workers --reopen-at and arms a reseed timer at the
# pace-curve crossing. A stub budgeter returning a future epoch must produce a
# dispatch-reseed-<epoch> timer at exactly that epoch.

echo "Test: pace-curve pause schedules a crossing-time timer (stub future epoch)"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
# Both caps clear (14 < 100 weekly, 10 < 50 5h) so the absolute-cap path no-ops,
# but weekly telemetry is present → the script consults the budgeter for the
# pace-curve crossing. Stub it to a fixed future epoch.
sr_write_rl "rl.json" 14 99999 10 88888
cat > "$TMPDIR_TEST/tw-stub" <<'STUB'
#!/usr/bin/env bash
echo 12345
STUB
chmod +x "$TMPDIR_TEST/tw-stub"
export DISPATCH_SCHEDULE_RESEED_TARGET_WORKERS_CMD="$TMPDIR_TEST/tw-stub"
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>/dev/null)
assert_eq "pace pause schedules crossing" \
  "scheduled dispatch-reseed-12345 at 12345" "$out"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"--unit=dispatch-reseed-12345"* \
   && "$log" == *"--on-calendar=@12345"* \
   && "$log" == *"--property=KillMode=process"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: pace pause systemd-run argv (unit + calendar + KillMode)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: pace pause systemd-run argv (unit + calendar + KillMode)"
  echo "    log: $log"
fi
sr_teardown

# --- Test 16: reopen reports none → silent no-op -----------------------------

echo "Test: pace path reopen=none → silent no-op (no systemd-run call)"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
sr_write_rl "rl.json" 14 99999 10 88888
cat > "$TMPDIR_TEST/tw-stub" <<'STUB'
#!/usr/bin/env bash
echo none
STUB
chmod +x "$TMPDIR_TEST/tw-stub"
export DISPATCH_SCHEDULE_RESEED_TARGET_WORKERS_CMD="$TMPDIR_TEST/tw-stub"
if out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>/dev/null); then
  rc=0
else
  rc=$?
fi
assert_eq "reopen=none; stdout silent" "" "$out"
assert_eq "reopen=none; exit 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: reopen=none; no systemd-run invocation"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: reopen=none; no systemd-run invocation"
  echo "    log: $(cat "$TMPDIR_TEST/systemd-log")"
fi
sr_teardown

# --- Test 17: crossing in the past → short-delay floor -----------------------
#
# If the budgeter reports a crossing at/before NOW, the script applies a
# short-delay floor: RESEED_AT = NOW + SHORT_DELAY, rather than arming a
# past-dated timer.

echo "Test: pace crossing in the past → short-delay floor (NOW + SHORT_DELAY)"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
export DISPATCH_SCHEDULE_RESEED_SHORT_DELAY=300
sr_write_rl "rl.json" 14 99999 10 88888
cat > "$TMPDIR_TEST/tw-stub" <<'STUB'
#!/usr/bin/env bash
echo 9000
STUB
chmod +x "$TMPDIR_TEST/tw-stub"
export DISPATCH_SCHEDULE_RESEED_TARGET_WORKERS_CMD="$TMPDIR_TEST/tw-stub"
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>/dev/null)
# Crossing 9000 < NOW 10000 → floor to NOW + 300 = 10300.
assert_eq "past crossing → short-delay floor" \
  "scheduled dispatch-reseed-10300 at 10300" "$out"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"--unit=dispatch-reseed-10300"* \
   && "$log" == *"--on-calendar=@10300"* \
   && "$log" == *"--property=KillMode=process"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: past crossing short-delay systemd-run argv (unit + calendar + KillMode)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: past crossing short-delay systemd-run argv (unit + calendar + KillMode)"
  echo "    log: $log"
fi
sr_teardown

# --- Test 17b: crossing exactly at NOW → short-delay floor (boundary) --------
#
# When the budgeter returns a crossing epoch equal to NOW (not strictly in the past),
# the condition RESEED_AT <= NOW is still satisfied (equality), so the short-delay
# floor applies. This covers the boundary between "past crossing" and "future crossing".

echo "Test: pace crossing exactly at NOW → short-delay floor (boundary case)"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
export DISPATCH_SCHEDULE_RESEED_SHORT_DELAY=300
sr_write_rl "rl.json" 14 99999 10 88888
cat > "$TMPDIR_TEST/tw-stub" <<'STUB'
#!/usr/bin/env bash
echo 10000
STUB
chmod +x "$TMPDIR_TEST/tw-stub"
export DISPATCH_SCHEDULE_RESEED_TARGET_WORKERS_CMD="$TMPDIR_TEST/tw-stub"
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>/dev/null)
# Crossing 10000 == NOW 10000 → floor to NOW + 300 = 10300.
assert_eq "crossing==NOW → short-delay floor" \
  "scheduled dispatch-reseed-10300 at 10300" "$out"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"--unit=dispatch-reseed-10300"* \
   && "$log" == *"--on-calendar=@10300"* \
   && "$log" == *"--property=KillMode=process"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: crossing==NOW short-delay systemd-run argv (unit + calendar + KillMode)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: crossing==NOW short-delay systemd-run argv (unit + calendar + KillMode)"
  echo "    log: $log"
fi
sr_teardown

# --- Test 18: end-to-end with the real budgeter ------------------------------
#
# No CMD override — sr_setup already points DISPATCH_SCHEDULE_RESEED_TARGET_WORKERS_CMD
# at the copied real budgeter. A genuine pace pause (used_weekly above the
# smooth curve, below the absolute cap) must arm a timer at the real
# curve-crossing epoch strictly inside the weekly window.

echo "Test: end-to-end pace pause with the real budgeter arms a crossing timer"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=1000000
# Weekly resets at 1302400 → remaining 302400 → x=0.5 → W=65.95. used_weekly=70 >
# 65.95 → real pace pause; 70 < 100 (terminal) so the absolute weekly cap is not
# hit → the pace-crossing path runs, not the at-reset reseed. 5h resets at 1310000.
sr_write_rl "rl.json" 70 1302400 10 1310000
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>/dev/null)
E=$(printf '%s' "$out" | sed -n 's/^scheduled dispatch-reseed-\([0-9]*\) at .*/\1/p')
TOTAL=$((TOTAL + 1))
if [[ "$E" =~ ^[0-9]+$ ]] && (( E > 1000000 )) && (( E < 1302400 )); then
  PASS=$((PASS + 1)); echo "  PASS: real budgeter arms crossing $E strictly in (1000000, 1302400)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: real budgeter expected crossing in (1000000, 1302400), got E='$E' out='$out'"
fi
sr_teardown

# --- Test 18b: reopen reports an unexpected string → silent no-op ------------
#
# The budgeter's --reopen-at contract is numeric-epoch | `none`. If it ever
# emits anything else (a non-numeric, non-`none` token — e.g. a future
# diagnostic leaking to stdout), the reseed script must treat it like a
# budgeter failure: no-op with exit 0 and a stderr diagnostic, never arming a
# timer on a garbage value. This makes the else-branch of the
# numeric/`none`/else triad explicit.

echo "Test: pace path reopen=<unexpected string> → silent no-op (no systemd-run call)"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
sr_write_rl "rl.json" 14 99999 10 88888
cat > "$TMPDIR_TEST/tw-stub" <<'STUB'
#!/usr/bin/env bash
echo garbage
STUB
chmod +x "$TMPDIR_TEST/tw-stub"
export DISPATCH_SCHEDULE_RESEED_TARGET_WORKERS_CMD="$TMPDIR_TEST/tw-stub"
if out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr"); then
  rc=0
else
  rc=$?
fi
assert_eq "reopen=<unexpected>; stdout silent" "" "$out"
assert_eq "reopen=<unexpected>; exit 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: reopen=<unexpected>; no systemd-run invocation"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: reopen=<unexpected>; no systemd-run invocation"
  echo "    log: $(cat "$TMPDIR_TEST/systemd-log")"
fi
TOTAL=$((TOTAL + 1))
if grep -q "unexpected result" "$TMPDIR_TEST/stderr"; then
  PASS=$((PASS + 1)); echo "  PASS: reopen=<unexpected>; stderr diagnostic emitted"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: reopen=<unexpected>; stderr diagnostic emitted"
  echo "    stderr: $(cat "$TMPDIR_TEST/stderr")"
fi
sr_teardown

# --- Test 19: used_weekly=95 no longer hits the absolute weekly cap -----------
#
# Before this remap, TARGET_WEEKLY was 90 and used_weekly=95 would trigger the
# absolute-cap path. After the remap, TARGET_WEEKLY is 100 (weekly_terminal_pct),
# so used_weekly=95 sits between the old 90 and the new 100 — it must NOT hit
# the absolute cap. The pace path consults the budgeter; with a tw-stub echoing
# `none`, the script must no-op: stderr names 'no absolute cap hit' + 'reopen-at=none'
# + 'no-op', stdout is silent, and no systemd-run is invoked.

echo "Test: used_weekly=95 (< 100 weekly_terminal_pct) does not hit absolute cap → no-op"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
# used_weekly=95 < 100 (weekly_terminal_pct) → NO absolute weekly cap hit.
# used_5h=10 < 50 → no 5h cap hit. Pace path consulted; stub returns none → no-op.
sr_write_rl "rl.json" 95 99999 10 88888
cat > "$TMPDIR_TEST/tw-stub" <<'STUB'
#!/usr/bin/env bash
echo none
STUB
chmod +x "$TMPDIR_TEST/tw-stub"
export DISPATCH_SCHEDULE_RESEED_TARGET_WORKERS_CMD="$TMPDIR_TEST/tw-stub"
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr")
err=$(cat "$TMPDIR_TEST/stderr")
assert_eq "used_weekly=95 < 100; stdout silent" "" "$out"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"no absolute cap hit"* && "$err" == *"reopen-at='none'"* && "$err" == *"no-op"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: used_weekly=95 no absolute cap; stderr names no-absolute-cap + reopen-at=none + no-op"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: used_weekly=95 no absolute cap; stderr names no-absolute-cap + reopen-at=none + no-op"
  echo "    stderr: $err"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: used_weekly=95 no absolute cap; no systemd-run invocation"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: used_weekly=95 no absolute cap; no systemd-run invocation"
  echo "    log: $(cat "$TMPDIR_TEST/systemd-log")"
fi
sr_teardown

# --- #1136: rate_limits.json telemetry range bounds -------------------------
#
# Far-future resets_at and used>100 are rejected to missing so the script no-ops
# (the established missing-telemetry fail-safe) instead of arming a reseed timer
# years out. This is the durable-stall fix. See issue #1136.

# weekly cap hit but resets_at is ~31 years out (>8d) → rejected → weekly window
# drops → (5h absent) → missing-telemetry no-op: NO systemd-run call.
echo "Test: #1136 weekly resets far-future (>8d) → no reseed timer armed"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=1700000000
sr_write_rl "rl.json" 95 $((1700000000 + 999999999)) absent absent
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr")
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" ]] && grep -q "WEEKLY_RESETS" "$TMPDIR_TEST/stderr"; then
  PASS=$((PASS + 1)); echo "  PASS: #1136 weekly resets far-future → empty systemd-log + WEEKLY_RESETS diagnostic"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: #1136 weekly resets far-future → expected no timer + diagnostic"
  echo "    systemd-log: $(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null)"
  echo "    stderr: $(cat "$TMPDIR_TEST/stderr")"
fi
sr_teardown

# used_weekly=150 (>100) → rejected → weekly window drops → (5h absent) → no-op,
# no weekly reseed timer.
echo "Test: #1136 used_weekly=150 (>100) → window drops → no reseed timer"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=1700000000
sr_write_rl "rl.json" 150 $((1700000000 + 10000)) absent absent
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr")
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" ]] && grep -q "WEEKLY_USED out of range" "$TMPDIR_TEST/stderr"; then
  PASS=$((PASS + 1)); echo "  PASS: #1136 used_weekly=150 → no timer + WEEKLY_USED diagnostic"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: #1136 used_weekly=150 → expected no timer + diagnostic"
  echo "    systemd-log: $(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null)"
  echo "    stderr: $(cat "$TMPDIR_TEST/stderr")"
fi
sr_teardown

# In-bound control (guards against over-rejection): a realistically-large NOW
# with a weekly reset ~3 days out (well within the 8-day bound) and a weekly cap
# hit still schedules normally.
echo "Test: #1136 in-bound weekly reset (~3d out) still schedules (no over-rejection)"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=1700000000
reset=$((1700000000 + 3 * 86400))
sr_write_rl "rl.json" 100 "$reset" absent absent
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>/dev/null)
assert_eq "#1136 in-bound weekly reset still schedules" \
  "scheduled dispatch-reseed-$reset at $reset" "$out"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"--on-calendar=@$reset"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: #1136 in-bound weekly reset armed --on-calendar=@$reset"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: #1136 in-bound weekly reset should arm timer at $reset"
  echo "    log: $log"
fi
sr_teardown

# used_5h=150 (>100) → rejected → 5h window drops. Weekly absent → both windows
# missing → missing-telemetry no-op: NO systemd-run call. Without the FIVEH_USED
# >100 bound the rejected value would survive (used_5h=150 >= target_5h=50 →
# CAND_5H armed at the 5h reset), so empty systemd-log discriminates.
echo "Test: #1136 used_5h=150 (>100) → window drops → no reseed timer"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=1700000000
sr_write_rl "rl.json" absent absent 150 $((1700000000 + 3600))
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr")
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" ]] && grep -q "FIVEH_USED out of range" "$TMPDIR_TEST/stderr"; then
  PASS=$((PASS + 1)); echo "  PASS: #1136 used_5h=150 → no timer + FIVEH_USED diagnostic"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: #1136 used_5h=150 → expected no timer + diagnostic"
  echo "    systemd-log: $(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null)"
  echo "    stderr: $(cat "$TMPDIR_TEST/stderr")"
fi
sr_teardown

# 5h cap hit but resets_at is 7h out (>6h horizon) → rejected → 5h window drops.
# Weekly cap hit with an in-bound (5d) reset → timer must arm at the WEEKLY
# reset. The 5h reset (NOW+25200) is earlier than the weekly reset (NOW+432000),
# so without the FIVEH_RESETS horizon bound the rejected 5h value would survive
# (CAND_5H armed) and step 4's earliest-reset pick would arm at the 5h epoch
# instead — the weekly-not-5h assertion discriminates the regression.
echo "Test: #1136 5h resets far-future (>6h) → dropped → timer at weekly reset"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=1700000000
weekly_reset=$((1700000000 + 432000))   # 5 days out, in-bound under 8-day horizon
sr_write_rl "rl.json" 100 "$weekly_reset" 60 $((1700000000 + 25200))  # 5h reset 7h out → rejected
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr")
assert_eq "#1136 5h resets far-future → timer at weekly reset" \
  "scheduled dispatch-reseed-$weekly_reset at $weekly_reset" "$out"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"--on-calendar=@$weekly_reset"* ]] && grep -q "FIVEH_RESETS" "$TMPDIR_TEST/stderr"; then
  PASS=$((PASS + 1)); echo "  PASS: #1136 5h resets far-future → armed at weekly $weekly_reset + FIVEH_RESETS diagnostic"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: #1136 5h resets far-future → expected timer at weekly $weekly_reset + diagnostic"
  echo "    log: $log"
  echo "    stderr: $(cat "$TMPDIR_TEST/stderr")"
fi
sr_teardown

# <<< END MOVED <<<

report_results
