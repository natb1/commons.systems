#!/usr/bin/env bash
# Unit tests for dispatch-ladder-spawn — the transient-unit launcher for the
# ladder driver. Modeled on test-dispatch-spawn-tick.sh, against the same kind
# of fake `systemd-run` / `systemctl` stubs, so no real systemd is needed.
#
# Three properties carry the weight:
#
#   1. --property=KillMode=process must be on the launch. The driver spawns
#      `claude --bg` workers, and systemd's default control-group kill would
#      reap every live worker in the fleet when a ladder halts.
#   2. OnFailure= must NOT be. dispatch-spawn-tick carries
#      OnFailure=dispatch-tick-recover.service; a halted ladder must never fire
#      a dispatch tick, and this is the one deliberate divergence from that
#      precedent — so it gets a negative assertion of its own.
#   3. The fixed unit name is the dedup. A collision is `deduped`, exit 0, and
#      a lingering FAILED unit is reset-failed first so the name cannot wedge
#      forever (#2013).

LADDER_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../../dispatch-propagate/scripts/dispatch-test-fixture.sh
source "$LADDER_DIR/../../dispatch-propagate/scripts/dispatch-test-fixture.sh"

echo "=== dispatch-ladder-spawn ==="

NODE=tactic-fixture-node
UNIT="dispatch-ladder-$NODE"

# ls_setup [systemd-run-stub-body]
#   Build a fresh tmp tree holding a copy of dispatch-ladder-spawn at its real
#   relative depth (so its CHECKOUT_ROOT resolution finds the copied lib.sh),
#   plus fake systemd-run / systemctl binaries. The optional argument is the
#   systemd-run stub body; the default records argv and exits 0.
ls_setup() {
  local stub_body="${1:-}"
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/checkout/.claude/skills/dispatch-ladder/scripts" \
           "$TMPDIR_TEST/checkout/.claude/skills/dispatch-propagate/scripts" \
           "$TMPDIR_TEST/bin" "$TMPDIR_TEST/main"

  SPAWN="$TMPDIR_TEST/checkout/.claude/skills/dispatch-ladder/scripts/dispatch-ladder-spawn"
  cp "$LADDER_DIR/dispatch-ladder-spawn" "$SPAWN"
  chmod +x "$SPAWN"
  # Sourced via CHECKOUT_ROOT, not executed — no chmod +x.
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/checkout/.claude/skills/dispatch-propagate/scripts/lib.sh"

  if [[ -z "$stub_body" ]]; then
    stub_body="echo \"\$*\" >> \"$TMPDIR_TEST/systemd-log\""
  fi
  cat > "$TMPDIR_TEST/bin/systemd-run" <<STUB
#!/usr/bin/env bash
$stub_body
STUB
  chmod +x "$TMPDIR_TEST/bin/systemd-run"

  cat > "$TMPDIR_TEST/bin/systemctl" <<STUB
#!/usr/bin/env bash
sub=""
for a in "\$@"; do
  case "\$a" in --*) ;; *) sub="\$a"; break ;; esac
done
echo "\$*" >> "$TMPDIR_TEST/systemctl-log"
case "\$sub" in
  is-failed)    exit "\${LS_IS_FAILED_RC:-1}" ;;
  reset-failed) exit 0 ;;
  *)            exit 0 ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/systemctl"

  export DISPATCH_LADDER_SPAWN_SYSTEMD_RUN_CMD="$TMPDIR_TEST/bin/systemd-run"
  export DISPATCH_LADDER_SPAWN_SYSTEMCTL_CMD="$TMPDIR_TEST/bin/systemctl"
  export DISPATCH_LADDER_SPAWN_MAIN_WORKTREE="$TMPDIR_TEST/main"
}

ls_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  unset DISPATCH_LADDER_SPAWN_SYSTEMD_RUN_CMD DISPATCH_LADDER_SPAWN_SYSTEMCTL_CMD
  unset DISPATCH_LADDER_SPAWN_MAIN_WORKTREE LS_IS_FAILED_RC
}

# --- Test 1: a plain launch --------------------------------------------------
echo "Test: dispatch-ladder-spawn <id> launches a dispatch-ladder-<id> unit"
ls_setup
rc=0
out=$("$SPAWN" "$NODE" 2>/dev/null) || rc=$?
assert_eq "spawn: exits 0" "0" "$rc"
assert_eq "spawn: stdout is 'spawned'" "spawned" "$out"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"--unit=$UNIT"* \
   && "$log" == *"--collect"* \
   && "$log" == *"--property=KillMode=process"* \
   && "$log" == *"--working-directory=$TMPDIR_TEST/main"* \
   && "$log" == *"--setenv=PATH="* \
   && "$log" == *"$TMPDIR_TEST/main/.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run $NODE"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: spawn: systemd-run argv (unit + collect + KillMode + cwd + setenv + exec)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: spawn: systemd-run argv (unit + collect + KillMode + cwd + setenv + exec)"
  echo "    log: $log"
fi
# The deliberate divergence from dispatch-spawn-tick: a halted ladder must
# never fire a dispatch tick.
TOTAL=$((TOTAL + 1))
if [[ "$log" != *"OnFailure"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: spawn: NO OnFailure= property (a halted ladder must not fire a tick)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: spawn: NO OnFailure= property (a halted ladder must not fire a tick)"
  echo "    log: $log"
fi
ls_teardown

# --- Test 2: driver flags pass through ---------------------------------------
echo "Test: driver flags are passed through to dispatch-ladder-run"
ls_setup
rc=0
out=$("$SPAWN" "$NODE" --timeout-s 900 --max-run-s 7200 --poll-s 30 2>/dev/null) || rc=$?
assert_eq "flags: exits 0" "0" "$rc"
assert_eq "flags: stdout is 'spawned'" "spawned" "$out"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"dispatch-ladder-run $NODE --timeout-s 900 --max-run-s 7200 --poll-s 30"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: flags: the driver argv carries the node id and every flag, in order"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: flags: the driver argv carries the node id and every flag, in order"
  echo "    log: $log"
fi
ls_teardown

# --- Test 3: the fixed unit name is the dedup --------------------------------
echo "Test: an already-exists collision is 'deduped' (exit 0), and does not reset-failed"
ls_setup "echo \"Unit $UNIT.service already exists\" >&2; exit 1"
rc=0
out=$("$SPAWN" "$NODE" 2>/dev/null) || rc=$?
assert_eq "deduped: exits 0" "0" "$rc"
assert_eq "deduped: stdout is 'deduped'" "deduped" "$out"
sclog=$(cat "$TMPDIR_TEST/systemctl-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$sclog" != *"reset-failed"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: deduped: reset-failed was NOT called (the is-failed gate held)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: deduped: reset-failed was NOT called (the is-failed gate held)"
  echo "    systemctl-log: $sclog"
fi
ls_teardown

echo "Test: an unrelated failure mentioning 'already exists' is NOT read as a dedup"
ls_setup 'echo "some other unit already exists" >&2; exit 1'
rc=0
out=$("$SPAWN" "$NODE" 2>/dev/null) || rc=$?
assert_eq "not-dedup: the exit code passes through (1)" "1" "$rc"
assert_eq "not-dedup: nothing was printed on stdout" "" "$out"
ls_teardown

# --- Test 4: a generic failure passes through --------------------------------
echo "Test: a generic systemd-run failure surfaces stderr and passes the code through"
ls_setup 'echo "boom" >&2; exit 4'
rc=0
err=$("$SPAWN" "$NODE" 2>&1 1>/dev/null) || rc=$?
assert_eq "fail: the exit code passes through (4)" "4" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"boom"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: fail: systemd-run stderr is surfaced"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: fail: systemd-run stderr is surfaced"
  echo "    stderr: $err"
fi
ls_teardown

# --- Test 5: a lingering failed unit is freed first (#2013) ------------------
echo "Test: a pre-existing failed ladder unit is reset-failed, then the ladder spawns"
ls_setup
export LS_IS_FAILED_RC=0
rc=0
out=$("$SPAWN" "$NODE" 2>/dev/null) || rc=$?
unset LS_IS_FAILED_RC
assert_eq "failed-unit: exits 0" "0" "$rc"
assert_eq "failed-unit: stdout is 'spawned' (not deduped)" "spawned" "$out"
sclog=$(cat "$TMPDIR_TEST/systemctl-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$sclog" == *"reset-failed $UNIT.service"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: failed-unit: reset-failed $UNIT.service was called"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: failed-unit: reset-failed $UNIT.service was called"
  echo "    systemctl-log: $sclog"
fi
TOTAL=$((TOTAL + 1))
if [[ -e "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: failed-unit: the launch still happened"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: failed-unit: the launch still happened"
fi
ls_teardown

# --- Test 6: argument validation ---------------------------------------------
echo "Test: a malformed argv is rejected before anything is launched"
for bad in "" "Bad Id" "--timeout-s" ; do
  ls_setup
  rc=0
  if [[ -z "$bad" ]]; then
    "$SPAWN" >/dev/null 2>&1 || rc=$?
    label="no node id"
  else
    "$SPAWN" "$bad" >/dev/null 2>&1 || rc=$?
    label="'$bad' as the node id"
  fi
  assert_eq "reject: $label exits 2" "2" "$rc"
  TOTAL=$((TOTAL + 1))
  if [[ ! -e "$TMPDIR_TEST/systemd-log" ]]; then
    PASS=$((PASS + 1)); echo "  PASS: reject: $label launched nothing"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: reject: $label launched nothing"
  fi
  ls_teardown
done

echo "Test: a malformed driver flag is rejected before anything is launched"
ls_setup
rc=0; "$SPAWN" "$NODE" --timeout-s abc >/dev/null 2>&1 || rc=$?
assert_eq "reject: a non-integer --timeout-s exits 2" "2" "$rc"
rc=0; "$SPAWN" "$NODE" --poll-s >/dev/null 2>&1 || rc=$?
assert_eq "reject: a value-less --poll-s exits 2" "2" "$rc"
rc=0; "$SPAWN" "$NODE" --nope 1 >/dev/null 2>&1 || rc=$?
assert_eq "reject: an unknown driver flag exits 2" "2" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: reject: no systemd-run invocation was recorded for any bad flag"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: reject: no systemd-run invocation was recorded for any bad flag"
  echo "    log: $(cat "$TMPDIR_TEST/systemd-log")"
fi
ls_teardown

report_results
