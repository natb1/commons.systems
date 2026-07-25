#!/usr/bin/env bash
# Tests for dispatch-schedule-convergence-reseed -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 12325-12577.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-schedule-convergence-reseed tests
# ============================================================================
#
# dispatch-schedule-convergence-reseed re-counts effective-live workers
# (busy workers + reservations) and arms a short-delay transient NO-ARG
# dispatch-tick timer ONLY when the fleet is below target and not gated. The
# harness stubs `systemd-run` (records argv), stubs dispatch-target-workers (so
# the test controls both the count-mode target and the --exhausted token),
# points CLAUDE_AGENTS_CMD at a controllable fake (busy-worker count) and
# DISPATCH_RESERVATION_DIR at a scratch dir (reservation_count = marker count).
#
# Each test gets a fresh tmp tree:
#   $TMPDIR_TEST/scripts/      script under test + lib.sh + lib-claude-agents.sh
#                             + lib-reservation-ledger.sh
#   $TMPDIR_TEST/bin/          systemd-run + systemctl + dispatch-target-workers stubs
#   $TMPDIR_TEST/systemd-log   recorded systemd-run argv (one line per call)
#   $TMPDIR_TEST/resv/         reservation ledger scratch dir
#   $TMPDIR_TEST/main/         a synthetic main worktree path
echo ""
echo "=== dispatch-schedule-convergence-reseed ==="

cr_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/bin" "$TMPDIR_TEST/resv" \
    "$TMPDIR_TEST/main"

  cp "$SCRIPT_DIR/dispatch-schedule-convergence-reseed" \
     "$TMPDIR_TEST/scripts/dispatch-schedule-convergence-reseed"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-schedule-convergence-reseed"
  # The script sources lib.sh + lib-claude-agents.sh + lib-reservation-ledger.sh
  # via its SCRIPT_DIR, so all three must sit alongside it. Sourced, not
  # executed — no chmod +x.
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/scripts/lib.sh"
  cp "$SCRIPT_DIR/lib-claude-agents.sh" "$TMPDIR_TEST/scripts/lib-claude-agents.sh"
  cp "$SCRIPT_DIR/lib-reservation-ledger.sh" "$TMPDIR_TEST/scripts/lib-reservation-ledger.sh"

  # systemd-run stub: records its argv (one line per call), exits 0.
  cat > "$TMPDIR_TEST/bin/systemd-run" <<STUB
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/systemd-log"
STUB
  chmod +x "$TMPDIR_TEST/bin/systemd-run"
  export DISPATCH_CONVERGE_RESEED_SYSTEMD_RUN_CMD="$TMPDIR_TEST/bin/systemd-run"

  # ensure_recover_unit (lib.sh) would otherwise write to the real
  # ~/.config/systemd/user/ and run a real `systemctl --user`. Redirect the unit
  # dir into the tmp tree and point its systemctl at a no-op stub so the function
  # writes nothing outside the test sandbox.
  cat > "$TMPDIR_TEST/bin/systemctl" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
  chmod +x "$TMPDIR_TEST/bin/systemctl"
  export DISPATCH_RECOVER_UNIT_DIR="$TMPDIR_TEST/systemd-user"
  export DISPATCH_RECOVER_SYSTEMCTL_CMD="$TMPDIR_TEST/bin/systemctl"

  export DISPATCH_CONVERGE_RESEED_MAIN_WORKTREE="$TMPDIR_TEST/main"

  # Recount inputs. Default the busy-worker daemon to UNKNOWN (a non-existent
  # binary → claude_agents_count_busy_workers returns non-zero → BUSY=0) and the
  # reservation ledger to the scratch dir (reservation_count = marker count).
  export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/no-such-claude"
  export DISPATCH_RESERVATION_DIR="$TMPDIR_TEST/resv"
}

cr_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  unset DISPATCH_CONVERGE_RESEED_SYSTEMD_RUN_CMD
  unset DISPATCH_CONVERGE_RESEED_MAIN_WORKTREE
  unset DISPATCH_CONVERGE_RESEED_TARGET_WORKERS_CMD
  unset DISPATCH_CONVERGE_RESEED_NOW
  unset DISPATCH_CONVERGE_RESEED_DELAY
  unset DISPATCH_RECOVER_UNIT_DIR DISPATCH_RECOVER_SYSTEMCTL_CMD
  unset CLAUDE_AGENTS_CMD DISPATCH_RESERVATION_DIR
}

# cr_write_target <count> <exhausted-token>
#   Install a dispatch-target-workers stub: default (count mode) prints <count>,
#   and `--exhausted` prints <exhausted-token>. Wires the override.
cr_write_target() {
  local count="$1" exhausted="$2"
  cat > "$TMPDIR_TEST/bin/dispatch-target-workers" <<STUB
#!/usr/bin/env bash
if [[ "\${1:-}" == "--exhausted" ]]; then echo "$exhausted"; else echo "$count"; fi
STUB
  chmod +x "$TMPDIR_TEST/bin/dispatch-target-workers"
  export DISPATCH_CONVERGE_RESEED_TARGET_WORKERS_CMD="$TMPDIR_TEST/bin/dispatch-target-workers"
}

# cr_write_resv <n>
#   Write <n> reservation marker files into the scratch ledger dir → RESV = <n>.
cr_write_resv() {
  local n="$1" i
  for (( i = 1; i <= n; i++ )); do
    printf 'session=s\nissue=%s\ntimestamp=2026-01-01T00:00:00Z\n' "$i" \
      > "$TMPDIR_TEST/resv/${i}-feature"
  done
}

# cr_busy_fake_claude <name:status> [<name:status> ...]
#   Install a fake `claude` whose `agents --json` returns the given rows, so
#   claude_agents_count_busy_workers yields a real positive count (a row counts
#   iff name matches ^[0-9]+- AND status == busy). Mirrors parked_router_fake_claude.
cr_busy_fake_claude() {
  local payload="[" pair name status first=1
  for pair in "$@"; do
    name="${pair%%:*}"; status="${pair#*:}"
    if (( first )); then first=0; else payload+=","; fi
    payload+="{\"sessionId\":\"s-$name\",\"pid\":1,\"status\":\"$status\",\"name\":\"$name\",\"cwd\":\"\"}"
  done
  payload+="]"
  printf '%s' "$payload" > "$TMPDIR_TEST/claude-payload.json"
  cat > "$TMPDIR_TEST/bin/claude" <<'FAKE'
#!/usr/bin/env bash
cat "$(cd "$(dirname "$0")/.." && pwd)/claude-payload.json"
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/bin/claude"
  export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/bin/claude"
}

# --- Test 1: below target → schedules a no-arg dispatch-tick reseed -----------
#
# BUSY=0 (UNKNOWN daemon) + RESV=3 = LIVE=3 < TARGET=8 → arm at NOW+DELAY.
echo "Test: below target arms a short-delay no-arg dispatch-tick reseed"
cr_setup
export DISPATCH_CONVERGE_RESEED_NOW=10000
export DISPATCH_CONVERGE_RESEED_DELAY=120
cr_write_target 8 ok
cr_write_resv 3
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-convergence-reseed" 2>"$TMPDIR_TEST/stderr")
assert_eq "below target stdout names the convergence unit" \
  "scheduled dispatch-converge-10120 at 10120" "$out"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"--unit=dispatch-converge-10120"* \
   && "$log" == *"--on-calendar=@10120"* \
   && "$log" == *"--collect"* \
   && "$log" == *"--property=OnFailure=dispatch-tick-recover.service"* \
   && "$log" == *"--property=KillMode=process"* \
   && "$log" == *"--working-directory=$TMPDIR_TEST/main"* \
   && "$log" == *"--setenv=PATH="* \
   && "$log" == *"$TMPDIR_TEST/main/.claude/skills/dispatch-propagate/scripts/dispatch-tick" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: below target systemd-run argv (unit + calendar + collect + OnFailure + KillMode + cwd + setenv + no-arg exec)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: below target systemd-run argv (unit + calendar + collect + OnFailure + KillMode + cwd + setenv + no-arg exec)"
  echo "    log: $log"
fi
cr_teardown

# --- Test 2: below target with a real busy worker → BUSY+RESV both counted ----
#
# BUSY=2 (two busy `^[0-9]+-` workers) + RESV=1 = LIVE=3 < TARGET=8 → arm. A
# router (dispatch-*) and an idle worker are NOT counted, exercising the helper's
# filter and the BUSY+RESV addition.
echo "Test: below target counts busy workers + reservations together"
cr_setup
export DISPATCH_CONVERGE_RESEED_NOW=10000
export DISPATCH_CONVERGE_RESEED_DELAY=120
cr_write_target 8 ok
cr_write_resv 1
cr_busy_fake_claude "101-a:busy" "102-b:busy" "103-c:input" "dispatch-xyz:busy"
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-convergence-reseed" 2>/dev/null)
assert_eq "BUSY=2 + RESV=1 = 3 < 8 → arms" \
  "scheduled dispatch-converge-10120 at 10120" "$out"
cr_teardown

# --- Test 3: at/above target → converged, no systemd-run call ----------------
#
# BUSY=0 + RESV=8 = LIVE=8 >= TARGET=8 → converged no-op.
echo "Test: at target → converged (no systemd-run call)"
cr_setup
export DISPATCH_CONVERGE_RESEED_NOW=10000
cr_write_target 8 ok
cr_write_resv 8
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-convergence-reseed" 2>/dev/null)
assert_eq "at target stdout is converged" "converged" "$out"
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: at target; no systemd-run invocation"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: at target; no systemd-run invocation"
  echo "    log: $(cat "$TMPDIR_TEST/systemd-log")"
fi
cr_teardown

# --- Test 4: pace gate closed (TARGET=0) → converged, no systemd-run call -----
#
# A pace pause makes dispatch-target-workers return 0; LIVE >= 0 always holds, so
# the script reports converged WITHOUT consulting --exhausted (gate order).
echo "Test: pace gate closed (TARGET=0) → converged (no systemd-run call)"
cr_setup
export DISPATCH_CONVERGE_RESEED_NOW=10000
# Even with some live workers, TARGET=0 means at-or-above target.
cr_write_target 0 ok
cr_write_resv 2
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-convergence-reseed" 2>/dev/null)
assert_eq "pace-gate-closed stdout is converged" "converged" "$out"
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: pace gate closed; no systemd-run invocation"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: pace gate closed; no systemd-run invocation"
  echo "    log: $(cat "$TMPDIR_TEST/systemd-log")"
fi
cr_teardown

# --- Test 5: token-exhaustion → exhausted, no systemd-run call ---------------
#
# Below target (RESV=1 < TARGET=8) but --exhausted returns `exhausted` → no-op.
echo "Test: below target but token-exhausted → exhausted (no systemd-run call)"
cr_setup
export DISPATCH_CONVERGE_RESEED_NOW=10000
cr_write_target 8 exhausted
cr_write_resv 1
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-convergence-reseed" 2>/dev/null)
assert_eq "exhausted stdout is exhausted" "exhausted" "$out"
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: exhausted; no systemd-run invocation"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: exhausted; no systemd-run invocation"
  echo "    log: $(cat "$TMPDIR_TEST/systemd-log")"
fi
cr_teardown

# --- Test 6: idempotent re-arm → already-exists collision is a no-op ----------
#
# systemd-run emits `already exists` on stderr and exits non-zero (the unit for
# this exact FIRE epoch is already armed). The script treats it as a no-op:
# exit 0, stdout still names the unit (so a caller routes it as scheduled).
echo "Test: idempotent re-arm (systemd already-exists) → exit 0 no-op"
cr_setup
export DISPATCH_CONVERGE_RESEED_NOW=10000
export DISPATCH_CONVERGE_RESEED_DELAY=120
cr_write_target 8 ok
cr_write_resv 3
# Override the systemd-run stub to simulate the collision.
cat > "$TMPDIR_TEST/bin/systemd-run" <<'STUB'
#!/usr/bin/env bash
echo "Failed to start transient timer unit: Unit dispatch-converge-10120.timer already exists." >&2
exit 1
STUB
chmod +x "$TMPDIR_TEST/bin/systemd-run"
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-convergence-reseed" 2>"$TMPDIR_TEST/stderr") || rc=$?
assert_eq "idempotent re-arm exit code is 0" "0" "$rc"
assert_eq "idempotent re-arm stdout names the unit" \
  "scheduled dispatch-converge-10120 at 10120" "$out"
cr_teardown

# <<< END MOVED <<<

report_results
