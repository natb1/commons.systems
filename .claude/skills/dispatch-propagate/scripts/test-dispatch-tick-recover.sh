#!/usr/bin/env bash
# Tests for dispatch-tick-recover -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 14355-14872.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# dispatch-tick-recover now calls ensure_sweep_timer (as well as
# ensure_heartbeat_units), so this suite is a sweep-unit writer: every harness
# here must redirect DISPATCH_SWEEP_TIMER_UNIT_DIR / DISPATCH_HEARTBEAT_UNIT_DIR
# (and their *_SYSTEMCTL_CMD pairs) into the tmp sandbox (see tr_setup). The
# host-unit-dir leak guard that enforces that is armed for EVERY suite by
# dispatch-test-fixture.sh (dispatch_host_systemd_guard_check) — it resolves the
# unit dir the way lib.sh does, watches all five installable units plus the
# timers.target.wants symlink set, and records any call reaching the real
# `systemctl`.

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-tick-recover tests (#1150)
# ============================================================================
echo ""
echo "=== dispatch-tick-recover ==="
#
# dispatch-tick-recover is the OnFailure= handler that guarantees a chain
# continuation after an abnormal tick/reseed exit. It is exercised entirely
# against fakes wired through its env-override contract — no real systemd,
# systemctl, gh, or claude daemon is needed:
#
#   $TMPDIR_TEST/bin/systemd-run   records its argv (one line per call) to
#                                  $TMPDIR_TEST/systemd-log, exits 0.
#   $TMPDIR_TEST/bin/systemctl     `list-units` prints the contents of
#                                  $TMPDIR_TEST/timer-units (empty by default →
#                                  no pending dispatch-reseed* timer).
#   $TMPDIR_TEST/bin/claude        `agents --json` prints the contents of
#                                  $TMPDIR_TEST/agents.json (`[]` by default →
#                                  0 busy workers). Backs CLAUDE_AGENTS_CMD.
#   $TMPDIR_TEST/bin/gh            logs its argv to $TMPDIR_TEST/gh-log; an
#                                  `issue list ... -q '.[0].number'` prints the
#                                  contents of $TMPDIR_TEST/gh-existing (empty by
#                                  default → no open latch issue).
#
# Each test seeds state by writing the JSON state file first (where needed),
# invokes the REAL dispatch-tick-recover with the section env, then asserts on
# the systemd-run log / gh log / resulting state file (count read via jq).
#
# The test shell runs under `set -e`; dispatch-tick-recover always exits 0 on
# these paths, but each invocation is still wrapped to capture the code.
#
# Continuation semantics: a pending dispatch-reseed* timer is the ONLY
# continuation signal — a busy worker is NOT a continuation. A busy worker
# instead drives Step 5's deferred backstop: a flat HEARTBEAT reseed is armed
# at NOW + HEARTBEAT (default 1800) and the count advances normally so the cap
# can be reached and escalation fires even under a persistent phantom-busy stall.

tr_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/bin" "$TMPDIR_TEST/main"

  # systemd-run fake: record argv, exit 0.
  cat > "$TMPDIR_TEST/bin/systemd-run" <<STUB
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/systemd-log"
exit 0
STUB
  chmod +x "$TMPDIR_TEST/bin/systemd-run"

  # systemctl fake: `list-units` prints \$TMPDIR_TEST/timer-units (default empty
  # → no pending dispatch-reseed* timer); `show` (heartbeat_timer_is_armed's
  # SubState query) prints \$TMPDIR_TEST/hb-substate (default empty → not
  # 'waiting' → heartbeat not armed, preserving the genuine-failure path for the
  # pre-#2445 tests). Any other subcommand is a no-op exit 0.
  : > "$TMPDIR_TEST/timer-units"
  : > "$TMPDIR_TEST/hb-substate"
  cat > "$TMPDIR_TEST/bin/systemctl" <<STUB
#!/usr/bin/env bash
for a in "\$@"; do
  if [[ "\$a" == "list-units" ]]; then
    cat "$TMPDIR_TEST/timer-units"
    exit 0
  fi
  if [[ "\$a" == "show" ]]; then
    cat "$TMPDIR_TEST/hb-substate"
    exit 0
  fi
done
exit 0
STUB
  chmod +x "$TMPDIR_TEST/bin/systemctl"

  # claude fake (backs CLAUDE_AGENTS_CMD via lib-claude-agents.sh): `agents --json`
  # prints \$TMPDIR_TEST/agents.json (default `[]` → 0 busy workers).
  echo '[]' > "$TMPDIR_TEST/agents.json"
  cat > "$TMPDIR_TEST/bin/claude" <<STUB
#!/usr/bin/env bash
cat "$TMPDIR_TEST/agents.json"
exit 0
STUB
  chmod +x "$TMPDIR_TEST/bin/claude"

  # gh fake: log argv; an `issue list ... -q '.[0].number'` prints
  # \$TMPDIR_TEST/gh-existing (default empty → no open latch issue). Other
  # subcommands (issue create, label create) just log and exit 0.
  : > "$TMPDIR_TEST/gh-existing"
  cat > "$TMPDIR_TEST/bin/gh" <<STUB
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/gh-log"
if [[ "\$1" == "issue" && "\$2" == "list" ]]; then
  cat "$TMPDIR_TEST/gh-existing"
fi
exit 0
STUB
  chmod +x "$TMPDIR_TEST/bin/gh"

  # ensure_heartbeat_units (called at the top of recover) would otherwise write
  # to the real ~/.config/systemd/user and run the real `systemctl --user`. Wire
  # it to a temp unit dir and its OWN logging stub so it stays hermetic. Note
  # heartbeat_timer_is_armed() (the #2445 benign-mode check) uses the RECOVER
  # systemctl ($DISPATCH_TICK_RECOVER_SYSTEMCTL_CMD, the main fake) instead, so
  # the two heartbeat paths are independent.
  cat > "$TMPDIR_TEST/bin/heartbeat-systemctl" <<STUB
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/heartbeat-systemctl-log"
exit 0
STUB
  chmod +x "$TMPDIR_TEST/bin/heartbeat-systemctl"
  export DISPATCH_HEARTBEAT_UNIT_DIR="$TMPDIR_TEST/heartbeat-systemd-user"
  export DISPATCH_HEARTBEAT_SYSTEMCTL_CMD="$TMPDIR_TEST/bin/heartbeat-systemctl"

  # ensure_sweep_timer (called alongside ensure_heartbeat_units at the top of
  # recover) has the same hazard: unredirected it writes
  # dispatch-sweep-periodic.{service,timer} into the real
  # ~/.config/systemd/user and runs the real `systemctl --user enable --now`,
  # arming a host timer whose ExecStart/WorkingDirectory point at this suite's
  # per-run temp dir (deleted at teardown). Wire it to a temp unit dir and the
  # heartbeat logging stub so it stays hermetic.
  export DISPATCH_SWEEP_TIMER_UNIT_DIR="$TMPDIR_TEST/sweep-systemd-user"
  export DISPATCH_SWEEP_TIMER_SYSTEMCTL_CMD="$TMPDIR_TEST/bin/heartbeat-systemctl"

  export DISPATCH_TICK_RECOVER_SYSTEMD_RUN_CMD="$TMPDIR_TEST/bin/systemd-run"
  export DISPATCH_TICK_RECOVER_SYSTEMCTL_CMD="$TMPDIR_TEST/bin/systemctl"
  export DISPATCH_TICK_RECOVER_GH_CMD="$TMPDIR_TEST/bin/gh"
  export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/bin/claude"
  export DISPATCH_TICK_RECOVER_MAIN_WORKTREE="$TMPDIR_TEST/main"
  export DISPATCH_TICK_RECOVER_STATE_PATH="$TMPDIR_TEST/recover-state.json"
  export DISPATCH_TICK_RECOVER_NOW=1000000
  # Pin every tunable so the backoff/cap/reset arithmetic is deterministic.
  export DISPATCH_TICK_RECOVER_CAP=3
  export DISPATCH_TICK_RECOVER_BASE_BACKOFF=300
  export DISPATCH_TICK_RECOVER_MAX_BACKOFF=3600
  export DISPATCH_TICK_RECOVER_RESET_WINDOW=3600
}

tr_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  unset DISPATCH_TICK_RECOVER_SYSTEMD_RUN_CMD
  unset DISPATCH_TICK_RECOVER_SYSTEMCTL_CMD
  unset DISPATCH_TICK_RECOVER_GH_CMD
  unset CLAUDE_AGENTS_CMD
  unset DISPATCH_TICK_RECOVER_MAIN_WORKTREE
  unset DISPATCH_TICK_RECOVER_STATE_PATH
  unset DISPATCH_TICK_RECOVER_NOW
  unset DISPATCH_TICK_RECOVER_CAP
  unset DISPATCH_TICK_RECOVER_BASE_BACKOFF
  unset DISPATCH_TICK_RECOVER_MAX_BACKOFF
  unset DISPATCH_TICK_RECOVER_RESET_WINDOW
  unset DISPATCH_TICK_RECOVER_HEARTBEAT
  unset DISPATCH_HEARTBEAT_UNIT_DIR DISPATCH_HEARTBEAT_SYSTEMCTL_CMD
  unset DISPATCH_SWEEP_TIMER_UNIT_DIR DISPATCH_SWEEP_TIMER_SYSTEMCTL_CMD
  unset DISPATCH_TICK_RECOVER_BENIGN
}

# tr_seed_state <count> <last_failure> — write the consecutive-failure state.
tr_seed_state() {
  printf '{"count":%s,"last_failure":%s}\n' "$1" "$2" > "$TMPDIR_TEST/recover-state.json"
}

# tr_busy_worker — make the claude fake report one busy real worker.
tr_busy_worker() {
  echo '[{"sessionId":"a","pid":1,"status":"busy","name":"824-foo"}]' \
    > "$TMPDIR_TEST/agents.json"
}

# tr_state_count — print the count field of the resulting state file (or "none").
tr_state_count() {
  if [[ -r "$TMPDIR_TEST/recover-state.json" ]]; then
    jq -r '.count' "$TMPDIR_TEST/recover-state.json"
  else
    echo none
  fi
}

# tr_heartbeat_armed — make the recover systemctl fake report the heartbeat timer
# as armed (SubState=waiting), so heartbeat_timer_is_armed() returns 0.
tr_heartbeat_armed() {
  echo waiting > "$TMPDIR_TEST/hb-substate"
}

# --- Test 1: first failure, no continuation → arms a reseed ------------------

echo "Test: first failure with no continuation arms a bounded-backoff reseed"
tr_setup
# No state file, empty timer list, 0 busy workers → fresh episode, count 0→1,
# backoff = BASE * 2^0 = 300, reseed_at = NOW + 300 = 1000300.
if "$SCRIPT_DIR/dispatch-tick-recover" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "first-fail: dispatch-tick-recover exits 0" "0" "$rc"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"--on-calendar=@1000300"* \
   && "$log" == *"--unit=dispatch-reseed-1000300"* \
   && "$log" == *"--collect"* \
   && "$log" == *"--property=KillMode=process"* \
   && "$log" == *"$TMPDIR_TEST/main/.claude/skills/dispatch-propagate/scripts/dispatch-tick"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: first-fail systemd-run argv (calendar + unit + collect + killmode + exec)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: first-fail systemd-run argv (calendar + unit + collect + killmode + exec)"
  echo "    log: $log"
fi
assert_eq "first-fail: state count == 1" "1" "$(tr_state_count)"
# Recover re-asserts the sweep timer as well as the heartbeat: the units must
# land in the REDIRECTED sweep unit dir (never the host's), point at this run's
# main worktree, and be enabled through the redirected systemctl seam.
assert_eq "recover: installs dispatch-sweep-periodic.service in the redirected unit dir" \
  "WorkingDirectory=$TMPDIR_TEST/main" \
  "$(grep '^WorkingDirectory=' "$TMPDIR_TEST/sweep-systemd-user/dispatch-sweep-periodic.service" 2>/dev/null || echo missing)"
assert_eq "recover: installs dispatch-sweep-periodic.timer in the redirected unit dir" \
  "present" \
  "$([ -f "$TMPDIR_TEST/sweep-systemd-user/dispatch-sweep-periodic.timer" ] && echo present || echo absent)"
assert_eq "recover: enables the sweep timer via the redirected systemctl" "present" \
  "$(grep -q 'enable --now dispatch-sweep-periodic.timer' "$TMPDIR_TEST/heartbeat-systemctl-log" \
     && echo present || echo absent)"
tr_teardown

# --- Test 2: busy worker is no longer a continuation → arms heartbeat reseed ---
# A busy worker used to short-circuit recovery (old "continuation" semantics).
# Under the new behavior it is NOT a continuation: the count advances and a
# flat HEARTBEAT reseed is armed as a deferred backstop. With count 2→3 and
# NOW - last_failure = 1000 < RESET_WINDOW → no aging reset → reseed_at =
# NOW + HEARTBEAT = 1000000 + 1800 = 1001800.

echo "Test: a busy worker is no longer a continuation → arms a heartbeat reseed, count advances"
tr_setup
tr_busy_worker
tr_seed_state 2 999000
if "$SCRIPT_DIR/dispatch-tick-recover" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "busy-worker: dispatch-tick-recover exits 0" "0" "$rc"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"--on-calendar=@1001800"* \
   && "$log" == *"--unit=dispatch-reseed-1001800"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: busy-worker: heartbeat reseed armed at NOW + 1800"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: busy-worker: heartbeat reseed armed at NOW + 1800"
  echo "    log: $log"
fi
assert_eq "busy-worker: state count advances to 3" "3" "$(tr_state_count)"
tr_teardown

# --- Test 3: continuation present (pending dispatch-reseed* timer) → no reseed -

echo "Test: a pending dispatch-reseed* timer is a continuation → no reseed armed"
tr_setup
tr_seed_state 2 999000
# A pending reseed timer row drives the continuation signal; 0 busy workers.
printf 'dispatch-reseed-1234.timer  active  waiting  Dispatch reseed\n' \
  > "$TMPDIR_TEST/timer-units"
if "$SCRIPT_DIR/dispatch-tick-recover" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "pending-timer: dispatch-tick-recover exits 0" "0" "$rc"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
assert_eq "pending-timer: no reseed armed (systemd-run log empty)" "" "$log"
# The timer continuation branch resets a climbed count to 0 (#2445): a pending
# reseed genuinely carries the chain, so this failure is covered — leaving the
# count stale would let the next failure with no pending timer re-escalate off
# it (the #2320→#2445 re-file pattern). Crash loops still escalate because a
# firing reseed is --collect'd before the next OnFailure.
assert_eq "pending-timer: climbed count reset to 0 on continuation (#2445)" "0" "$(tr_state_count)"
tr_teardown

# --- Test 4: cap reached → escalate, not retry -------------------------------

echo "Test: count past the cap escalates (files a chain-stalled latch issue), no reseed"
tr_setup
# Seed count == CAP (3) with a recent last_failure (within RESET_WINDOW so no
# reset) → count 3→4 > cap=3 → escalate. No existing latch issue (gh-existing
# empty) → an issue create fires.
tr_seed_state 3 999500
if "$SCRIPT_DIR/dispatch-tick-recover" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "cap: dispatch-tick-recover exits 0" "0" "$rc"
ghlog=$(cat "$TMPDIR_TEST/gh-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$ghlog" == *"issue create"* \
   && "$ghlog" == *"--label dispatch:chain-stalled"* \
   && "$ghlog" == *"--label dispatch:office-hours"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: cap: issue create with --label dispatch:chain-stalled and --label dispatch:office-hours"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: cap: issue create with --label dispatch:chain-stalled and --label dispatch:office-hours"
  echo "    gh-log: $ghlog"
fi
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
assert_eq "cap: no reseed armed (systemd-run log empty)" "" "$log"

# --- Test 4b: cap reached with an existing latch → no-op create --------------
echo "Test: count past the cap with an open latch issue does NOT create a second"
tr_teardown
tr_setup
tr_seed_state 3 999500
echo "742" > "$TMPDIR_TEST/gh-existing"   # an open latch already exists
if "$SCRIPT_DIR/dispatch-tick-recover" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "cap-latched: dispatch-tick-recover exits 0" "0" "$rc"
ghlog=$(cat "$TMPDIR_TEST/gh-log" 2>/dev/null || true)
assert_eq "cap-latched: no issue create (latch already open)" \
  "0" "$([[ "$ghlog" != *"issue create"* ]] && echo 0 || echo 1)"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
assert_eq "cap-latched: no reseed armed (systemd-run log empty)" "" "$log"
tr_teardown

# --- Test 5: backoff grows with the consecutive-failure count ----------------

echo "Test: backoff doubles with the failure count (count 1→2 → BASE*2 = 600)"
tr_setup
# Seed count == 1 with a recent last_failure → no reset, count 1→2, backoff =
# BASE * 2^(2-1) = 600, reseed_at = NOW + 600 = 1000600.
tr_seed_state 1 999500
if "$SCRIPT_DIR/dispatch-tick-recover" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "backoff: dispatch-tick-recover exits 0" "0" "$rc"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"--on-calendar=@1000600"* \
   && "$log" == *"--unit=dispatch-reseed-1000600"* \
   && "$log" == *"--property=KillMode=process"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: backoff: reseed armed at NOW + 600 (calendar + unit + killmode)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: backoff: reseed armed at NOW + 600 (calendar + unit + killmode)"
  echo "    log: $log"
fi
assert_eq "backoff: state count == 2" "2" "$(tr_state_count)"
tr_teardown

# --- Test 6: reset window — a stale last_failure starts a fresh episode -------

echo "Test: a last_failure older than RESET_WINDOW resets the count to a fresh episode"
tr_setup
# last_failure = NOW - 4000 (= 996000); NOW - last_failure = 4000 > RESET_WINDOW
# (3600) → fresh episode: count reset 2→0, then +1 = 1, backoff = BASE*2^0 = 300,
# reseed_at = NOW + 300 = 1000300.
tr_seed_state 2 996000
if "$SCRIPT_DIR/dispatch-tick-recover" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "reset-window: dispatch-tick-recover exits 0" "0" "$rc"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"--on-calendar=@1000300"* \
   && "$log" == *"--unit=dispatch-reseed-1000300"* \
   && "$log" == *"--property=KillMode=process"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: reset-window: fresh episode armed at NOW + 300 (killmode)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: reset-window: fresh episode armed at NOW + 300 (killmode)"
  echo "    log: $log"
fi
assert_eq "reset-window: state count == 1 (fresh episode)" "1" "$(tr_state_count)"
tr_teardown

# --- Test 7: CAP=0 is rejected (would escalate with zero retries) ------------

echo "Test: CAP=0 is rejected (exit 2, no reseed, no escalation)"
tr_setup
export DISPATCH_TICK_RECOVER_CAP=0
if "$SCRIPT_DIR/dispatch-tick-recover" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "cap-zero: dispatch-tick-recover exits 2" "2" "$rc"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
assert_eq "cap-zero: no reseed armed (systemd-run log empty)" "" "$log"
ghlog=$(cat "$TMPDIR_TEST/gh-log" 2>/dev/null || true)
assert_eq "cap-zero: no escalation issue (gh log empty)" "" "$ghlog"
tr_teardown

# --- Test 8: RESET_WINDOW=0 is rejected (would defeat the cap) ---------------

echo "Test: RESET_WINDOW=0 is rejected (exit 2, no reseed) — it would reset the count every call"
tr_setup
export DISPATCH_TICK_RECOVER_RESET_WINDOW=0
if "$SCRIPT_DIR/dispatch-tick-recover" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "reset-window-zero: dispatch-tick-recover exits 2" "2" "$rc"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
assert_eq "reset-window-zero: no reseed armed (systemd-run log empty)" "" "$log"
tr_teardown

# --- Test 9: a high failure count whose backoff overflows is clamped to MAX ---

echo "Test: an overflowing backoff is clamped to MAX (never a past/immediate epoch)"
tr_setup
# A large CAP lets COUNT climb high before escalation. Seed count=55 (→56):
# BASE * (1 << 55) overflows the 64-bit signed left-shift to a negative value,
# which the bare `> MAX` guard would pass through as a past RESEED_AT (firing
# the timer immediately). The clamp must instead pin BACKOFF to MAX (3600) →
# reseed_at = NOW + 3600 = 1003600.
export DISPATCH_TICK_RECOVER_CAP=100
tr_seed_state 55 999500
if "$SCRIPT_DIR/dispatch-tick-recover" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "overflow-clamp: dispatch-tick-recover exits 0" "0" "$rc"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"--on-calendar=@1003600"* \
   && "$log" == *"--unit=dispatch-reseed-1003600"* \
   && "$log" == *"--property=KillMode=process"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: overflow-clamp: backoff clamped to MAX, reseed at NOW + 3600 (killmode)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: overflow-clamp: backoff clamped to MAX, reseed at NOW + 3600 (killmode)"
  echo "    log: $log"
fi
tr_teardown

# --- Test 10: phantom-busy stall escalates within the cap (criterion 3) -------
# A persistent busy worker that never actually carries the chain (its Stop hook
# never fires → timer-units stays empty). Each generation must advance the count
# (the busy reading no longer short-circuits) so the cap is reached and
# escalation fires — rather than the count resetting to 0 every generation and
# the chain stalling forever.
echo "Test: repeated phantom-busy generations advance the count to escalation"
tr_setup
tr_busy_worker                      # busy>0 every round; timer-units stays empty
for i in 1 2 3 4; do
  export DISPATCH_TICK_RECOVER_NOW=$(( 1000000 + i*600 ))   # delta 600 < RESET_WINDOW
  "$SCRIPT_DIR/dispatch-tick-recover" 2>/dev/null || true
done
unset DISPATCH_TICK_RECOVER_NOW
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
ghlog=$(cat "$TMPDIR_TEST/gh-log" 2>/dev/null || true)
# Rounds 1-3 each arm a heartbeat reseed at NOW_i + 1800: @1002400, @1003000,
# @1003600 (the heartbeat window is flat — it does NOT grow). Round 4 (= CAP+1)
# escalates and arms NO reseed, so systemd-log has exactly 3 lines.
TOTAL=$((TOTAL + 1))
nlines=$(grep -c 'on-calendar' "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
if [[ "$log" == *"--on-calendar=@1002400"* \
   && "$log" == *"--on-calendar=@1003000"* \
   && "$log" == *"--on-calendar=@1003600"* \
   && "$nlines" == "3" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: phantom-busy: exactly 3 heartbeat reseeds (rounds 1-3)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: phantom-busy: exactly 3 heartbeat reseeds (rounds 1-3)"
  echo "    log: $log"
fi
TOTAL=$((TOTAL + 1))
if [[ "$ghlog" == *"issue create"* && "$ghlog" == *"--label dispatch:chain-stalled"* \
   && "$ghlog" == *"--label dispatch:office-hours"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: phantom-busy: round 4 escalates (chain-stalled issue)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: phantom-busy: round 4 escalates (chain-stalled issue)"
  echo "    gh-log: $ghlog"
fi
assert_eq "phantom-busy: state count advances to 4" "4" "$(tr_state_count)"
tr_teardown

# --- Test 11: HEARTBEAT=0 is rejected (non-positive) -------------------------
echo "Test: DISPATCH_TICK_RECOVER_HEARTBEAT=0 is rejected (exit 2, no reseed)"
tr_setup
export DISPATCH_TICK_RECOVER_HEARTBEAT=0
if "$SCRIPT_DIR/dispatch-tick-recover" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "heartbeat-zero: dispatch-tick-recover exits 2" "2" "$rc"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
assert_eq "heartbeat-zero: no reseed armed (systemd-run log empty)" "" "$log"
tr_teardown

# --- Test 12: HEARTBEAT >= RESET_WINDOW is rejected (defeats the cap) ---------
# If the deferred heartbeat window is >= the reset window, the count would age
# back to a fresh episode every generation and the cap would never be reached.
echo "Test: DISPATCH_TICK_RECOVER_HEARTBEAT >= RESET_WINDOW is rejected (exit 2, no reseed)"
tr_setup
export DISPATCH_TICK_RECOVER_HEARTBEAT=3600   # == RESET_WINDOW (3600 from tr_setup)
if "$SCRIPT_DIR/dispatch-tick-recover" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "heartbeat-ge-reset: dispatch-tick-recover exits 2" "2" "$rc"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
assert_eq "heartbeat-ge-reset: no reseed armed (systemd-run log empty)" "" "$log"
tr_teardown

# --- Test 13: BENIGN empty + heartbeat armed → no-op, NOT counted (#2445) -----
# The #2445 false positive: a benign `empty`/`drain` tick was counted as a
# consecutive failure. With the durable heartbeat armed, a benign tick is a
# success signal — recover must no-op and never arm a reseed or count a failure.
echo "Test: BENIGN disposition with heartbeat armed no-ops without counting a failure (#2445)"
tr_setup
tr_heartbeat_armed
export DISPATCH_TICK_RECOVER_BENIGN=empty
# Fresh state, heartbeat armed → no reseed, no escalation, exit 0.
if "$SCRIPT_DIR/dispatch-tick-recover" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "benign-armed: dispatch-tick-recover exits 0" "0" "$rc"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
assert_eq "benign-armed: no reseed armed (systemd-run log empty)" "" "$log"
ghlog=$(cat "$TMPDIR_TEST/gh-log" 2>/dev/null || true)
assert_eq "benign-armed: no escalation (gh log empty)" "" "$ghlog"
tr_teardown

# --- Test 14: BENIGN resets a stale/climbed count → no false escalation -------
# Reproduces the #2445 mechanism directly: a count parked well past the cap
# (116, as observed in production) must be RESET by a benign tick while the
# heartbeat carries the chain — never re-escalated off the stale count.
echo "Test: BENIGN disposition resets a climbed count and does not escalate (#2445 regression)"
tr_setup
tr_heartbeat_armed
tr_seed_state 116 999000
export DISPATCH_TICK_RECOVER_BENIGN=empty
if "$SCRIPT_DIR/dispatch-tick-recover" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "benign-reset: dispatch-tick-recover exits 0" "0" "$rc"
assert_eq "benign-reset: count reset to 0" "0" "$(tr_state_count)"
ghlog=$(cat "$TMPDIR_TEST/gh-log" 2>/dev/null || true)
assert_eq "benign-reset: no chain-stalled latch created (gh log empty)" "" "$ghlog"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
assert_eq "benign-reset: no reseed armed (systemd-run log empty)" "" "$log"
tr_teardown

# --- Test 15: BENIGN + heartbeat DOWN → backstop reseed, count=1, no escalate --
# Degraded-carrier safety net: if the heartbeat is not armed and no reseed is
# pending, a benign tick really would dead-end, so recover arms a single backstop
# reseed. But it is still not a failure: the count lands at 1 (a fresh single
# attempt), well under the cap, so it can never escalate from a benign tick even
# across repeated heartbeat-down cycles.
echo "Test: BENIGN disposition with heartbeat down arms one backstop reseed without escalating (#2445)"
tr_setup
# hb-substate left empty → heartbeat not armed; no reseed timer; seed a climbed
# count to prove benign cannot escalate even from past the cap.
tr_seed_state 116 999000
export DISPATCH_TICK_RECOVER_BENIGN=drain
if "$SCRIPT_DIR/dispatch-tick-recover" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "benign-hb-down: dispatch-tick-recover exits 0" "0" "$rc"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
# Fresh single attempt → BASE * 2^0 = 300, reseed_at = NOW (1000000) + 300.
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"--on-calendar=@1000300"* && "$log" == *"--unit=dispatch-reseed-1000300"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: benign-hb-down: arms a single flat backstop reseed at NOW+BASE"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: benign-hb-down: expected backstop reseed at @1000300, got: $log"
fi
assert_eq "benign-hb-down: count is 1 (fresh single attempt, not escalated)" "1" "$(tr_state_count)"
ghlog=$(cat "$TMPDIR_TEST/gh-log" 2>/dev/null || true)
assert_eq "benign-hb-down: no chain-stalled latch created (gh log empty)" "" "$ghlog"
tr_teardown

# --- Test 16: genuine-crash path (BENIGN unset) still escalates past the cap ---
# Guard that the #2445 fix did NOT blind crash recovery: with BENIGN unset and a
# count already past the cap, recover must still escalate (create the latch), even
# though the heartbeat is armed. continuation_present is deliberately not taught
# the heartbeat.
echo "Test: genuine-crash path past cap still escalates even with heartbeat armed (#2445 guard)"
tr_setup
tr_heartbeat_armed
tr_seed_state 3 999999   # NOW-last_failure (1000000-999999=1) < RESET_WINDOW → count 3→4 > cap 3
if "$SCRIPT_DIR/dispatch-tick-recover" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "crash-past-cap: dispatch-tick-recover exits 0" "0" "$rc"
ghlog=$(cat "$TMPDIR_TEST/gh-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$ghlog" == *"issue create"* && "$ghlog" == *"chain-stalled"* \
   && "$ghlog" == *"--label dispatch:office-hours"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: crash-past-cap: escalated via chain-stalled latch issue"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: crash-past-cap: expected chain-stalled issue create, got: $ghlog"
fi
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
assert_eq "crash-past-cap: no reseed armed on escalation (systemd-run log empty)" "" "$log"
tr_teardown

# <<< END MOVED <<<

# The host-unit-dir leak re-check runs inside report_results (and, on an early
# abort, from the fixture's EXIT trap).
report_results
