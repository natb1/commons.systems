#!/usr/bin/env bash
# Tests for dispatch-schedule-target-reseed -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 12578-12854.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-schedule-target-reseed tests
# ============================================================================
#
# Exercises the target-keyed CI-wait reseed: under-cap reseed bumps the
# dispatch:ci-wait-attempt counter and schedules a transient timer whose
# ExecStart re-runs dispatch-tick <N>; at-cap escalates to
# dispatch:office-hours and schedules no timer; bad <N> / missing PR are misuse.
#
# Each test gets a fresh tmp tree:
#   $TMPDIR_TEST/scripts/      copy of dispatch-schedule-target-reseed + lib.sh
#   $TMPDIR_TEST/bin/          systemd-run stub
#   $TMPDIR_TEST/systemd-log   recorded systemd-run argv (one line per call)
#   $TMPDIR_TEST/gh-edit-log   recorded fake-gh pr-edit / label-create argv
#   $TMPDIR_TEST/oh-log        recorded fake dispatch-apply-office-hours argv
#   $TMPDIR_TEST/main/         a synthetic main worktree path
echo ""
echo "=== dispatch-schedule-target-reseed ==="

tr_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/bin" "$TMPDIR_TEST/main"

  cp "$SCRIPT_DIR/dispatch-schedule-target-reseed" \
    "$TMPDIR_TEST/scripts/dispatch-schedule-target-reseed"
  # The script sources lib.sh via its SCRIPT_DIR — so lib.sh must sit alongside.
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/scripts/lib.sh"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-schedule-target-reseed"

  export DISPATCH_TARGET_RESEED_MAIN_WORKTREE="$TMPDIR_TEST/main"
  export DISPATCH_TARGET_RESEED_NOW=10000
  export DISPATCH_TARGET_RESEED_DELAY=300
  export DISPATCH_TARGET_RESEED_CAP=3

  # systemd-run stub: records its argv (one line per call), exits 0.
  cat > "$TMPDIR_TEST/bin/systemd-run" <<STUB
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/systemd-log"
STUB
  chmod +x "$TMPDIR_TEST/bin/systemd-run"
  export DISPATCH_TARGET_RESEED_SYSTEMD_RUN_CMD="$TMPDIR_TEST/bin/systemd-run"

  # fake gh: `pr view ... --jq ...` echoes the test-controlled current attempt
  # count ($FAKE_CUR_ATTEMPT, default 0 — the script consumes the jq result as
  # the integer counter). `pr edit` / `label create` record their argv to a log
  # and exit 0.
  cat > "$TMPDIR_TEST/bin/fake-gh" <<STUB
#!/usr/bin/env bash
if [[ "\$1" == "pr" && "\$2" == "view" ]]; then
  echo "\${FAKE_CUR_ATTEMPT:-0}"
  exit 0
fi
echo "\$*" >> "$TMPDIR_TEST/gh-edit-log"
exit 0
STUB
  chmod +x "$TMPDIR_TEST/bin/fake-gh"
  export DISPATCH_TARGET_RESEED_GH_CMD="$TMPDIR_TEST/bin/fake-gh"

  # fake dispatch-find-pr: echoes a fixed PR number.
  cat > "$TMPDIR_TEST/bin/fake-find-pr" <<STUB
#!/usr/bin/env bash
# Default 1234 only when FAKE_PR_NUM is unset — a set-but-empty value echoes
# nothing, modelling the no-PR case.
echo "\${FAKE_PR_NUM-1234}"
STUB
  chmod +x "$TMPDIR_TEST/bin/fake-find-pr"
  export DISPATCH_TARGET_RESEED_FIND_PR_CMD="$TMPDIR_TEST/bin/fake-find-pr"

  # fake dispatch-apply-office-hours: records its argv to a log, exits 0.
  cat > "$TMPDIR_TEST/bin/fake-oh" <<STUB
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/oh-log"
STUB
  chmod +x "$TMPDIR_TEST/bin/fake-oh"
  export DISPATCH_TARGET_RESEED_OFFICE_HOURS_CMD="$TMPDIR_TEST/bin/fake-oh"

  # #1570: dispatch-schedule-target-reseed now calls ensure_recover_unit (lib.sh)
  # before scheduling. Point its unit dir into the tmp tree and its systemctl at
  # a no-op stub so the call never writes outside the test sandbox.
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
}

tr_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  unset DISPATCH_TARGET_RESEED_MAIN_WORKTREE
  unset DISPATCH_TARGET_RESEED_NOW
  unset DISPATCH_TARGET_RESEED_DELAY
  unset DISPATCH_TARGET_RESEED_CAP
  unset DISPATCH_TARGET_RESEED_SYSTEMD_RUN_CMD
  unset DISPATCH_TARGET_RESEED_GH_CMD
  unset DISPATCH_TARGET_RESEED_FIND_PR_CMD
  unset DISPATCH_TARGET_RESEED_OFFICE_HOURS_CMD
  unset FAKE_CUR_ATTEMPT
  unset FAKE_PR_NUM
  unset DISPATCH_RECOVER_UNIT_DIR DISPATCH_RECOVER_SYSTEMCTL_CMD DISPATCH_SWEEP_TIMER_UNIT_DIR DISPATCH_SWEEP_TIMER_SYSTEMCTL_CMD DISPATCH_HEARTBEAT_UNIT_DIR DISPATCH_HEARTBEAT_SYSTEMCTL_CMD
}

# --- Test 1: under-cap reseed (CUR=0 → 1) ------------------------------------

echo "Test: under-cap reseed (CUR=0) schedules a timer and applies attempt-1"
tr_setup
export FAKE_CUR_ATTEMPT=0
if out=$("$TMPDIR_TEST/scripts/dispatch-schedule-target-reseed" 979 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "under-cap reseed exits 0" "0" "$rc"
assert_eq "under-cap reseed stdout names the unit + fire" \
  "reseeded dispatch-reseed-target-979-10300 at 10300" "$out"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"--unit=dispatch-reseed-target-979-10300"* \
   && "$log" == *"--on-calendar=@10300"* \
   && "$log" == *"--property=OnFailure=dispatch-tick-recover.service"* \
   && "$log" == *"--working-directory=$TMPDIR_TEST/main"* \
   && "$log" == *"--setenv=PATH="* \
   && "$log" == *"--property=KillMode=process"* \
   && "$log" == *"dispatch-tick 979"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: under-cap systemd-run argv (unit + calendar + OnFailure + KillMode + cwd + setenv + dispatch-tick 979)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: under-cap systemd-run argv (unit + calendar + OnFailure + KillMode + cwd + setenv + dispatch-tick 979)"
  echo "    log: $log"
fi
edits=$(cat "$TMPDIR_TEST/gh-edit-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$edits" == *"--add-label dispatch:ci-wait-attempt-1"* \
   && "$edits" != *"--remove-label"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: under-cap applies attempt-1 with no remove (CUR was 0)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: under-cap applies attempt-1 with no remove (CUR was 0)"
  echo "    edits: $edits"
fi
tr_teardown

# --- Test 2: counter bump (CUR=1 → 2) ----------------------------------------

echo "Test: counter bump (CUR=1) removes attempt-1, applies attempt-2, schedules timer"
tr_setup
export FAKE_CUR_ATTEMPT=1
if out=$("$TMPDIR_TEST/scripts/dispatch-schedule-target-reseed" 979 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "counter-bump exits 0" "0" "$rc"
assert_eq "counter-bump stdout names the unit + fire" \
  "reseeded dispatch-reseed-target-979-10300 at 10300" "$out"
edits=$(cat "$TMPDIR_TEST/gh-edit-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$edits" == *"--remove-label dispatch:ci-wait-attempt-1"* \
   && "$edits" == *"--add-label dispatch:ci-wait-attempt-2"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: counter-bump removes attempt-1 and adds attempt-2"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: counter-bump removes attempt-1 and adds attempt-2"
  echo "    edits: $edits"
fi
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"--unit=dispatch-reseed-target-979-10300"* \
   && "$log" == *"--on-calendar=@10300"* \
   && "$log" == *"--property=OnFailure=dispatch-tick-recover.service"* \
   && "$log" == *"--working-directory=$TMPDIR_TEST/main"* \
   && "$log" == *"--setenv=PATH="* \
   && "$log" == *"--property=KillMode=process"* \
   && "$log" == *"dispatch-tick 979"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: counter-bump systemd-run argv (unit + calendar + OnFailure + cwd + setenv + KillMode + dispatch-tick 979)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: counter-bump systemd-run argv (unit + calendar + OnFailure + cwd + setenv + KillMode + dispatch-tick 979)"
  echo "    log: $log"
fi
tr_teardown

# --- Test 3: at cap (CUR == CAP = 3) → escalate, no timer --------------------

echo "Test: at cap (CUR==CAP) escalates to office-hours and schedules no timer"
tr_setup
export FAKE_CUR_ATTEMPT=3
export DISPATCH_TARGET_RESEED_CAP=3
if out=$("$TMPDIR_TEST/scripts/dispatch-schedule-target-reseed" 979 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "at-cap exits 0" "0" "$rc"
assert_eq "at-cap stdout is 'escalated'" "escalated" "$out"
oh=$(cat "$TMPDIR_TEST/oh-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$oh" == "979 "* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: at-cap office-hours fake records 979 as arg1"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: at-cap office-hours fake records 979 as arg1"
  echo "    oh-log: $oh"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: at-cap schedules no timer"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: at-cap schedules no timer"
  echo "    log: $(cat "$TMPDIR_TEST/systemd-log")"
fi
tr_teardown

# --- Test 4: bad <N> (flag-like) → exit 2, no side effects -------------------

echo "Test: flag-like <N> exits 2 with no timer and no side effects"
tr_setup
if out=$("$TMPDIR_TEST/scripts/dispatch-schedule-target-reseed" --repo 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "flag-like <N> exits 2" "2" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" && ! -s "$TMPDIR_TEST/gh-edit-log" && ! -s "$TMPDIR_TEST/oh-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: flag-like <N>; no timer / no label edit / no escalate"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: flag-like <N>; no timer / no label edit / no escalate"
fi
tr_teardown

# --- Test 5: missing PR → exit 2, no timer -----------------------------------

echo "Test: missing PR (find-pr empty) exits 2 with no timer"
tr_setup
export FAKE_PR_NUM=""
if out=$("$TMPDIR_TEST/scripts/dispatch-schedule-target-reseed" 979 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "missing PR exits 2" "2" "$rc"
err=$(cat "$TMPDIR_TEST/stderr")
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"no PR found for issue #979"* && ! -s "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: missing PR; stderr diagnostic + no timer"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: missing PR; stderr diagnostic + no timer"
  echo "    stderr: $err"
fi
tr_teardown

# --- Test 5b: non-numeric PR from find-pr → exit 2, no timer ------------------
# PR_NUM flows into the same `gh pr view/edit "$PR_NUM"` calls N is guarded
# against; a flag-like find-pr result must fail closed rather than reach gh.

echo "Test: non-numeric PR (find-pr returns a flag) exits 2 with no timer"
tr_setup
export FAKE_PR_NUM="--repo evil/repo"
if out=$("$TMPDIR_TEST/scripts/dispatch-schedule-target-reseed" 979 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "non-numeric PR exits 2" "2" "$rc"
err=$(cat "$TMPDIR_TEST/stderr")
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"non-numeric PR"* && ! -s "$TMPDIR_TEST/systemd-log" && ! -s "$TMPDIR_TEST/gh-edit-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-numeric PR; stderr diagnostic + no timer / no label edit"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-numeric PR; stderr diagnostic + no timer / no label edit"
  echo "    stderr: $err"
fi
tr_teardown

# --- Test 6: already-exists idempotency → exit 0, stdout 'reseeded …' ---------
# A repeated call within the same fire-window produces the same UNIT_NAME; systemd
# refuses to recreate it. The script must still print the 'reseeded' stdout line so
# dispatch-materialize-spawn routes to 'drain ci-reseeded' and not the error fallback.

echo "Test: already-exists collision → exit 0 and stdout 'reseeded ...'"
tr_setup
export FAKE_CUR_ATTEMPT=0
# Replace the systemd-run stub with one that simulates the already-exists collision.
cat > "$TMPDIR_TEST/bin/systemd-run" <<STUB
#!/usr/bin/env bash
echo "Unit dispatch-reseed-target-979-10300.timer already exists." >&2
exit 1
STUB
chmod +x "$TMPDIR_TEST/bin/systemd-run"
if out=$("$TMPDIR_TEST/scripts/dispatch-schedule-target-reseed" 979 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "already-exists: exits 0" "0" "$rc"
assert_eq "already-exists: stdout is reseeded line" \
  "reseeded dispatch-reseed-target-979-10300 at 10300" "$out"
err=$(cat "$TMPDIR_TEST/stderr")
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"already scheduled"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: already-exists: stderr notes already-scheduled"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: already-exists: stderr notes already-scheduled"
  echo "    stderr: $err"
fi
tr_teardown

# <<< END MOVED <<<

report_results
