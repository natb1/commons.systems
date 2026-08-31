#!/usr/bin/env bash
# Unit tests for dispatch-ladder-status — the session-facing reader over a
# detached ladder run.
#
# The one thing worth testing hard is the reconciliation of the TWO sources it
# reads. state.json alone cannot tell "working" from "killed mid-run", and the
# unit probe alone cannot tell which rung the node reached. Reporting a dead
# driver as `running` would make a `--wait` caller poll forever, so a
# `running` state with no active unit gets its own answer (`orphaned`) and is
# terminal.
#
# `systemctl` is faked through DISPATCH_LADDER_STATUS_SYSTEMCTL_CMD — reaching
# the real one is a leak the shared fixture's guard fails the suite for.

LADDER_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../../dispatch-propagate/scripts/dispatch-test-fixture.sh
source "$LADDER_DIR/../../dispatch-propagate/scripts/dispatch-test-fixture.sh"

echo "=== dispatch-ladder-status ==="

NODE=tactic-fixture-node

TMPDIR_TEST=$(mktemp -d)
CHECKOUT="$TMPDIR_TEST/checkout"
MAIN="$TMPDIR_TEST/main"
mkdir -p "$CHECKOUT/.claude/skills/dispatch-ladder/scripts" \
         "$CHECKOUT/.claude/skills/dispatch-propagate/scripts" \
         "$MAIN/.claude/worktrees"

STATUS="$CHECKOUT/.claude/skills/dispatch-ladder/scripts/dispatch-ladder-status"
cp "$LADDER_DIR/dispatch-ladder-status" "$STATUS"
chmod +x "$STATUS"
cp "$SCRIPT_DIR/lib-graph-worktree.sh" \
   "$CHECKOUT/.claude/skills/dispatch-propagate/scripts/lib-graph-worktree.sh"

STATE_DIR="$MAIN/.claude/worktrees/$NODE.ladder"
STATE_FILE="$STATE_DIR/state.json"
mkdir -p "$STATE_DIR"
export DISPATCH_GRAPH_MAIN_WORKTREE="$MAIN"

# The unit probe. ACTIVE_FLAG's content decides `is-active`'s exit code, so a
# case can make the driver look alive or dead without any real systemd.
ACTIVE_FLAG="$TMPDIR_TEST/unit-active"
echo 0 >"$ACTIVE_FLAG"
cat >"$TMPDIR_TEST/systemctl" <<STUB
#!/usr/bin/env bash
echo "\$*" >>"$TMPDIR_TEST/systemctl-log"
exit "\$(cat "$ACTIVE_FLAG")"
STUB
chmod +x "$TMPDIR_TEST/systemctl"
export DISPATCH_LADDER_STATUS_SYSTEMCTL_CMD="$TMPDIR_TEST/systemctl"

unit_active()   { echo 0 >"$ACTIVE_FLAG"; }
unit_inactive() { echo 3 >"$ACTIVE_FLAG"; }

write_state() { # <status> <step> <phase-or-null> <disposition-or-null> [terminus-or-null]
  jq -n --arg status "$1" --arg step "$2" --arg phase "$3" --arg disposition "$4" --arg terminus "${5:-}" \
    '{node: "tactic-fixture-node", unit: "dispatch-ladder-tactic-fixture-node",
      pid: 123, started_at: "2026-08-12T00:00:00Z", updated_at: "2026-08-12T00:01:00Z",
      status: $status, step: $step,
      phase: (if $phase == "" then null else $phase end),
      disposition: (if $disposition == "" then null else $disposition end),
      terminus: (if $terminus == "" then null else $terminus end),
      detail: null, exit_code: null}' >"$STATE_FILE"
}

RC=0
OUT=""
run_status() { RC=0; OUT=$("$STATUS" "$NODE" "$@" 2>/dev/null) || RC=$?; }

# --- Usage -------------------------------------------------------------------
echo "Test: argument validation"
rc=0; "$STATUS" >/dev/null 2>&1 || rc=$?
assert_eq "usage: no arguments exits 2" "2" "$rc"
rc=0; "$STATUS" "Bad Id" >/dev/null 2>&1 || rc=$?
assert_eq "usage: a malformed node id exits 2" "2" "$rc"
rc=0; "$STATUS" "$NODE" --poll-s 0 >/dev/null 2>&1 || rc=$?
assert_eq "usage: --poll-s 0 exits 2" "2" "$rc"
rc=0; "$STATUS" "$NODE" --timeout-s x >/dev/null 2>&1 || rc=$?
assert_eq "usage: a non-integer --timeout-s exits 2" "2" "$rc"
rc=0; "$STATUS" "$NODE" --nope >/dev/null 2>&1 || rc=$?
assert_eq "usage: an unknown flag exits 2" "2" "$rc"

# --- No state ----------------------------------------------------------------
echo "Test: no state file is exit 1, not a fabricated status"
rm -f "$STATE_FILE"
run_status
assert_eq "no-state: exits 1" "1" "$RC"
assert_eq "no-state: nothing is printed on stdout" "" "$OUT"

# --- Terminal states ---------------------------------------------------------
echo "Test: a terminal state.json is exit 0 regardless of the unit probe"
write_state complete await main-qa complete
unit_inactive
run_status
assert_eq "complete: exits 0" "0" "$RC"
assert_eq "complete: the status line" "complete $NODE await main-qa complete -" "$OUT"

write_state halted merge review throw
unit_active     # a terminal state wins even while the unit lingers
run_status
assert_eq "halted: exits 0" "0" "$RC"
assert_eq "halted: the status line" "halted $NODE merge review throw -" "$OUT"

echo "Test: absent fields print as '-'"
write_state halted advance "" ""
unit_inactive
run_status
assert_eq "nulls: exits 0" "0" "$RC"
assert_eq "nulls: null phase, disposition and terminus print as '-'" "halted $NODE advance - - -" "$OUT"

echo "Test: a non-null terminus is surfaced as the sixth field"
write_state halted advance implement violation violation
unit_inactive
run_status
assert_eq "terminus: exits 0" "0" "$RC"
assert_eq "terminus: the status line carries the classification" "halted $NODE advance implement violation violation" "$OUT"

write_state halted usage "" not-a-node not-a-node
unit_inactive
run_status
assert_eq "terminus not-a-node: exits 0" "0" "$RC"
assert_eq "terminus not-a-node: the status line carries the classification" "halted $NODE usage - not-a-node not-a-node" "$OUT"

# --- Running vs orphaned -----------------------------------------------------
echo "Test: a running driver with a live unit is exit 20 ('call again')"
write_state running await implement ""
unit_active
run_status
assert_eq "running: exits 20" "20" "$RC"
assert_eq "running: the status line" "running $NODE await implement - -" "$OUT"

echo "Test: a running state with a dead unit is 'orphaned' and TERMINAL"
# The failure this guards: reporting it as `running` would make a --wait caller
# poll a driver that will never write another byte.
write_state running await implement ""
unit_inactive
run_status
assert_eq "orphaned: exits 0 (terminal)" "0" "$RC"
assert_eq "orphaned: the status line names the orphan" "orphaned $NODE await implement - -" "$OUT"

# --- signalled ---------------------------------------------------------------
# The driver's signal path (dispatch-ladder-run's signal_terminal_write) is a
# SECOND terminal path that deliberately does not route through halt(): it does
# the local writes only, because classify_terminus makes network reads and the
# evaluation spawn is a daemon round trip, neither of which fits inside
# TimeoutStopSec. The status it writes must be recognized here, and recognized
# as its OWN thing.
#
# Two ways this reader could get it wrong, one case each:
#   * not recognizing `signalled` at all — it would fall through to the `*)` arm
#     and be reported as CORRUPTION (exit 1), so an ordinary `systemctl --user
#     stop` would look like a damaged state file.
#   * folding it into `running` — the unit is inactive by then, so it would be
#     relabelled `orphaned`, whose documented meaning is "the driver died
#     WITHOUT writing a terminal state". That is the vocabulary lying about a
#     stop that was clean, deliberate, and did write one.
# The unit is INACTIVE in both cases, which is the realistic shape: systemd has
# already collected the transient unit by the time anyone reads the state.
echo "Test: a 'signalled' state is TERMINAL and keeps its own name (not 'orphaned')"
write_state signalled merge implement signalled ""
unit_inactive
run_status
assert_eq "signalled: exits 0 (terminal)" "0" "$RC"
assert_eq "signalled: the status line keeps the name and does NOT say orphaned" \
  "signalled $NODE merge implement signalled -" "$OUT"

echo "Test: a 'signalled' state does not burn the --wait window"
# WAITABLE must be 0: the driver is gone and nothing will rewrite this file, so
# polling for the full window would only delay the answer.
write_state signalled merge implement signalled ""
unit_inactive
SECONDS_BEFORE=$SECONDS
run_status --wait --timeout-s 10 --poll-s 5
assert_eq "signalled: --wait returns immediately, exit 0" "0" "$RC"
assert_eq "signalled: --wait did not sleep" "1" \
  "$([ $(( SECONDS - SECONDS_BEFORE )) -lt 5 ] && echo 1 || echo 0)"

# --- Corruption --------------------------------------------------------------
echo "Test: an unreadable or unrecognized state file is an error, not a guess"
printf 'not json at all\n' >"$STATE_FILE"
run_status
assert_eq "corrupt: unparseable JSON exits 1" "1" "$RC"

write_state sideways advance implement ""
unit_active
run_status
assert_eq "corrupt: an unrecognized status exits 1" "1" "$RC"

# A corrupt state must not burn the whole --wait window before reporting.
write_state sideways advance implement ""
START=$SECONDS
run_status --wait --timeout-s 20 --poll-s 1
ELAPSED=$(( SECONDS - START ))
assert_eq "corrupt: --wait exits 1 immediately" "1" "$RC"
TOTAL=$((TOTAL + 1))
if (( ELAPSED < 5 )); then
  PASS=$((PASS + 1)); echo "  PASS: corrupt: --wait returned without burning the window (${ELAPSED}s)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: corrupt: --wait returned without burning the window (${ELAPSED}s)"
fi

# --- --wait ------------------------------------------------------------------
echo "Test: --wait returns as soon as the run reaches a terminus"
write_state running await implement ""
unit_active
( sleep 2; write_state complete await main-qa complete ) &
FLIPPER=$!
run_status --wait --timeout-s 20 --poll-s 1
wait "$FLIPPER" || true
assert_eq "wait: exits 0 once the driver completes" "0" "$RC"
assert_eq "wait: the terminal status line" "complete $NODE await main-qa complete -" "$OUT"

echo "Test: --wait that runs out of window is exit 20, not a failure"
write_state running await implement ""
unit_active
run_status --wait --timeout-s 2 --poll-s 1
assert_eq "wait-timeout: exits 20" "20" "$RC"
assert_eq "wait-timeout: the last line read is still reported" "running $NODE await implement - -" "$OUT"

echo "Test: --wait picks up a state file that appears after the spawn"
rm -f "$STATE_FILE"
unit_active
( sleep 2; write_state running advance "" "" ) &
FLIPPER=$!
run_status --wait --timeout-s 6 --poll-s 1
wait "$FLIPPER" || true
assert_eq "wait-appear: exits 20 once the driver's first state lands" "20" "$RC"
assert_eq "wait-appear: the status line" "running $NODE advance - - -" "$OUT"

echo "Test: --wait with a state file that never appears is exit 1"
rm -f "$STATE_FILE"
run_status --wait --timeout-s 2 --poll-s 1
assert_eq "wait-never: exits 1" "1" "$RC"
assert_eq "wait-never: nothing is printed on stdout" "" "$OUT"

# The whole suite must have gone through the seam, never the real systemctl.
TOTAL=$((TOTAL + 1))
if grep -q -- "--user is-active --quiet dispatch-ladder-$NODE.service" "$TMPDIR_TEST/systemctl-log"; then
  PASS=$((PASS + 1)); echo "  PASS: the unit probe asks about dispatch-ladder-<id>.service"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: the unit probe asks about dispatch-ladder-<id>.service"
  echo "    systemctl-log: $(cat "$TMPDIR_TEST/systemctl-log" 2>/dev/null || true)"
fi

report_results
