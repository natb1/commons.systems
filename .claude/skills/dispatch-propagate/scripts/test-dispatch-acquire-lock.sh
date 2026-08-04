#!/usr/bin/env bash
# Tests for dispatch-acquire-lock -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 6947-7892.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-acquire-lock tests
# ============================================================================
#
# Each test gets a fresh tmp tree:
#   $TMPDIR_TEST/stub/         lock file + per-test output capture files
#   $TMPDIR_TEST/scripts/      a copy of dispatch-acquire-lock
#   $TMPDIR_TEST/fake/         fake `claude` script for the liveness check
#
# DISPATCH_LOCK_FILE is exported so the script never touches the real shared
# lock. Every test sets CLAUDE_CODE_SESSION_ID directly to identify the caller,
# and uses lock_fake_claude_sessions to stub `claude agents --json` for the
# foreign-holder liveness check via CLAUDE_AGENTS_CMD.


# Helper: install a fake `claude` whose `agents --json` invocation prints a
# JSON array of session objects carrying the given sessionIds (and exits 0).
# Points CLAUDE_AGENTS_CMD at the fake. Call with zero args to simulate an
# empty registry (`[]`). Safe to re-invoke mid-test: regenerates the fake.
#
# Each argument is either a bare sessionId or a `sid=cwd` entry. A bare sid
# emits `"cwd":""`; a `sid=/path` entry emits `"cwd":"/path"`. The cwd field
# feeds the marker-based reclaim path in dispatch-acquire-lock — tests that
# do not care about cwd can keep passing bare sessionIds unchanged.
lock_fake_claude_sessions() {
  local fake="$TMPDIR_TEST/fake/claude"
  local payload="[" entry sid cwd first=1
  for entry in "$@"; do
    if [[ "$entry" == *=* ]]; then
      sid="${entry%%=*}"
      cwd="${entry#*=}"
    else
      sid="$entry"
      cwd=""
    fi
    if (( first )); then first=0; else payload+=","; fi
    # Test paths under $TMPDIR_TEST never contain quotes or backslashes, so
    # raw interpolation is sufficient (no JSON-escaping needed).
    payload+="{\"sessionId\":\"$sid\",\"pid\":1,\"status\":\"busy\",\"name\":\"x\",\"cwd\":\"$cwd\"}"
  done
  payload+="]"
  printf '%s' "$payload" > "$TMPDIR_TEST/fake/payload.json"
  cat > "$fake" <<FAKE
#!/usr/bin/env bash
cat "$TMPDIR_TEST/fake/payload.json"
exit 0
FAKE
  chmod +x "$fake"
  export CLAUDE_AGENTS_CMD="$fake"
}

# Helper: install a fake `claude` whose `agents --json` invocation exits with
# the given non-zero code (and prints nothing). Used to exercise the
# fail-safe "treat foreign holder as live when the daemon cannot be queried"
# contract.
lock_fake_claude_failure() {
  local exit_code="${1:-1}"
  local fake="$TMPDIR_TEST/fake/claude"
  cat > "$fake" <<FAKE
#!/usr/bin/env bash
exit $exit_code
FAKE
  chmod +x "$fake"
  export CLAUDE_AGENTS_CMD="$fake"
}

# Helper: install a fake `claude` that exits 0 with the given literal stdout
# payload. Used to exercise is_live_session's fail-safe branches for output
# that is not a parseable JSON array of sessions (whitespace-only, non-array
# JSON like `{}`/`null`, malformed JSON).
lock_fake_claude_payload() {
  local payload="$1"
  local fake="$TMPDIR_TEST/fake/claude"
  printf '%s' "$payload" > "$TMPDIR_TEST/fake/payload.txt"
  cat > "$fake" <<FAKE
#!/usr/bin/env bash
cat "$TMPDIR_TEST/fake/payload.txt"
exit 0
FAKE
  chmod +x "$fake"
  export CLAUDE_AGENTS_CMD="$fake"
}

# --- Test 1: first acquisition with an absent lock file ----------------------

echo "Test: first acquisition writes the sessionId and prints acquired"
lock_setup
export CLAUDE_CODE_SESSION_ID="sess-100"
lock_fake_claude_sessions "sess-100"
# The lock file does not exist yet.
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "first-acquisition exits 0" "0" "$rc"
assert_eq "first-acquisition prints acquired" "acquired" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "lock file records the sessionId" "sess-100" "$lock_contents"
lock_teardown

# --- Test 2: two parallel invocations, distinct sessions ---------------------

echo "Test: two parallel invocations yield exactly one acquired, one busy"
lock_setup
# Both sessionIds are present in the registry — both are live.
lock_fake_claude_sessions "sess-200a" "sess-200b"
# Launch both in the background, each with its own sessionId, sharing the
# one lock file. The blocking flock serializes them.
( export CLAUDE_CODE_SESSION_ID="sess-200a"
  "$TMPDIR_TEST/scripts/dispatch-acquire-lock" ) >"$STUB_DIR/out-a" 2>&1 &
( export CLAUDE_CODE_SESSION_ID="sess-200b"
  "$TMPDIR_TEST/scripts/dispatch-acquire-lock" ) >"$STUB_DIR/out-b" 2>&1 &
wait
out_a=$(cat "$STUB_DIR/out-a" 2>/dev/null || true)
out_b=$(cat "$STUB_DIR/out-b" 2>/dev/null || true)
sorted=$(printf '%s\n%s\n' "$out_a" "$out_b" | sort)
assert_eq "parallel invocations: exactly one acquired, one busy" \
  "$(printf 'acquired\nbusy')" "$sorted"
lock_teardown

# --- Test 3: stale lock — recorded sessionId not in the registry -------------

echo "Test: stale lock with a recorded sessionId absent from the registry is reclaimed"
lock_setup
# Pre-write a recorded sessionId that no longer appears in the registry.
printf '%s\n' "sess-300-gone" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-300-new"
lock_fake_claude_sessions "sess-300-new"   # registry knows only our session
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "stale-absent-sid exits 0" "0" "$rc"
assert_eq "stale-absent-sid prints acquired" "acquired" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "stale-absent-sid lock file rewritten to new sessionId" \
  "sess-300-new" "$lock_contents"
lock_teardown

# --- Test 4: stale lock — registry empty (no live sessions at all) -----------

echo "Test: stale lock with an empty registry is reclaimed"
lock_setup
printf '%s\n' "sess-400-gone" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-400-new"
lock_fake_claude_sessions   # zero args → empty registry `[]`
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "empty-registry exits 0" "0" "$rc"
assert_eq "empty-registry prints acquired" "acquired" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "empty-registry lock file rewritten to new sessionId" \
  "sess-400-new" "$lock_contents"
lock_teardown

# --- Test 5: same-session re-entry -------------------------------------------

echo "Test: same-session re-entry proceeds (not busy)"
lock_setup
# The recorded sessionId is our own session and is in the registry.
printf '%s\n' "sess-500" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-500"
lock_fake_claude_sessions "sess-500"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "re-entry exits 0" "0" "$rc"
assert_eq "re-entry prints acquired" "acquired" "$out"
lock_teardown

# --- Test 5b: wedged daemon — probe times out → fail-safe LIVE → busy (#1315) -
# A foreign holder is recorded; resolving its liveness queries the daemon. A
# wedged daemon that hangs (and IGNORES SIGTERM) must not deadlock the acquirer:
# the probe is `timeout -k 5 "$PROBE_TIMEOUT"`, so the SIGKILL backstop guarantees
# return, the failed probe folds to fail-safe LIVE, and we stay busy. The fake
# `trap '' TERM; sleep 30` proves the `-k` backstop (plain `timeout` would itself
# block on a SIGTERM-ignoring child). The EXTERNAL `timeout` turns a regression
# (no bound, or a missing `-k`) into a visible rc-124 failure instead of a hang.

echo "Test: wedged daemon — probe times out, acquirer stays busy without deadlock"
lock_setup
printf '%s\n' "sess-wedged-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-wedged-mine"
# Slow fake `claude` that ignores SIGTERM and sleeps far past the probe timeout.
cat > "$TMPDIR_TEST/fake/claude" <<'FAKE'
#!/usr/bin/env bash
trap '' TERM
sleep 30
FAKE
chmod +x "$TMPDIR_TEST/fake/claude"
export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/fake/claude"
export DISPATCH_LOCK_PROBE_TIMEOUT=1
# External bound: the probe's own SIGKILL fires at PROBE_TIMEOUT+5≈6s, so 12s
# leaves ample margin on a healthy fix while still catching a real hang.
out=$(timeout 12 "$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "wedged-daemon: returns within external budget (not rc 124)" "0" "$rc"
assert_eq "wedged-daemon: prints busy" "busy" "$out"
assert_eq "wedged-daemon: foreign holder untouched" "sess-wedged-foreign" \
  "$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)"
lock_teardown

# --- Test 5c: in-section flock wait times out → busy, lock NOT clobbered (#1315)
# When the in-section `flock -w "$FLOCK_TIMEOUT"` cannot be acquired in time, the
# acquirer must report contended (busy) WITHOUT running the read-check-write —
# falling through unlocked would race and could clobber a live holder. Setup is
# discriminating: a held flock plus a STALE recorded holder (absent from the
# registry). Correct (guarded) code → busy, lock unchanged. The fall-through bug
# would instead reclaim the stale holder and WRITE our sid (acquired + clobbered),
# which these assertions catch.

echo "Test: in-section flock wait timeout → busy, lock file not clobbered"
lock_setup
printf '%s\n' "sess-flock-stale" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-flock-mine"
# Registry knows only our session → the recorded holder is stale (would be
# reclaimed if the buggy fall-through ever ran the unlocked read-check-write).
lock_fake_claude_sessions "sess-flock-mine"
# FLOCK must strictly exceed PROBE (the startup guard enforces this), so set
# PROBE=1 and FLOCK=2 — the smallest valid pair that still makes `flock -w 2`
# time out against the 3s holder below. (The probe never runs here: the flock
# wait times out before the read-check-write.)
export DISPATCH_LOCK_PROBE_TIMEOUT=1 DISPATCH_LOCK_FLOCK_TIMEOUT=2
# Hold the advisory lock on the same file for longer than FLOCK_TIMEOUT so the
# acquirer's `flock -w 2` genuinely times out.
( exec 9>>"$DISPATCH_LOCK_FILE"; flock 9; sleep 3 ) &
flock_holder=$!
sleep 0.5   # let the holder grab the flock before the acquirer contends
out=$(timeout 12 "$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
wait "$flock_holder" 2>/dev/null || true
assert_eq "flock-timeout: returns within external budget" "0" "$rc"
assert_eq "flock-timeout: prints busy" "busy" "$out"
assert_eq "flock-timeout: lock file NOT clobbered" "sess-flock-stale" \
  "$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)"
lock_teardown

# --- Test 5d: timeout-knob validation — misconfig → exit 2 (#1315) -----------
# DISPATCH_LOCK_FLOCK_TIMEOUT must strictly exceed DISPATCH_LOCK_PROBE_TIMEOUT
# (else a waiter abandons a holder that is legitimately mid-probe), and
# PROBE_TIMEOUT must be a POSITIVE integer (GNU `timeout 0` DISABLES the bound
# and silently re-opens the unbounded-probe hang). The acquire/wait path
# validates both at startup and exits 2 with a clear error rather than letting a
# misconfigured knob degrade to an always-busy or unbounded probe.

echo "Test: FLOCK_TIMEOUT <= PROBE_TIMEOUT → exit 2 with clear error"
lock_setup
export CLAUDE_CODE_SESSION_ID="sess-5d-mine"
lock_fake_claude_sessions "sess-5d-mine"
export DISPATCH_LOCK_PROBE_TIMEOUT=10 DISPATCH_LOCK_FLOCK_TIMEOUT=10
err=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>&1 1>/dev/null && echo "EXIT=0" || echo "EXIT=$?")
case "$err" in
  *"DISPATCH_LOCK_FLOCK_TIMEOUT"*"must exceed"*"EXIT=2") status="ok" ;;
  *) status="bad: $err" ;;
esac
assert_eq "FLOCK<=PROBE → error + exit 2" "ok" "$status"
lock_teardown

echo "Test: PROBE_TIMEOUT=0 → exit 2 (timeout 0 would disable the bound)"
lock_setup
export CLAUDE_CODE_SESSION_ID="sess-5d2-mine"
lock_fake_claude_sessions "sess-5d2-mine"
export DISPATCH_LOCK_PROBE_TIMEOUT=0
err=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>&1 1>/dev/null && echo "EXIT=0" || echo "EXIT=$?")
case "$err" in
  *"DISPATCH_LOCK_PROBE_TIMEOUT"*"positive integer"*"EXIT=2") status="ok" ;;
  *) status="bad: $err" ;;
esac
assert_eq "PROBE=0 → error + exit 2" "ok" "$status"
lock_teardown

# --- Test 5e: shipped defaults (probe 10, flock 15) PASS the guard (#1315) ----
# Regression guard for the threshold decision: the constraint is `FLOCK > PROBE`
# (strict), NOT `FLOCK > PROBE + 5` — a guard that rejected its own shipped
# defaults (15 vs 10+5=15) would be broken. Setting the defaults explicitly must
# acquire cleanly, not exit 2.

echo "Test: shipped default timeouts (10/15) pass the guard and acquire"
lock_setup
export CLAUDE_CODE_SESSION_ID="sess-5e-mine"
lock_fake_claude_sessions "sess-5e-mine"
export DISPATCH_LOCK_PROBE_TIMEOUT=10 DISPATCH_LOCK_FLOCK_TIMEOUT=15
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "default timeouts: guard not tripped (exit 0)" "0" "$rc"
assert_eq "default timeouts: prints acquired" "acquired" "$out"
lock_teardown

# --- Test 5f: --release is NOT subject to the timeout-knob guard (#1315) ------
# The probe + in-section flock timeouts are consumed only by acquire/wait;
# --release uses neither, so a misconfigured knob must NOT make --release fail.
# Releasing our own recorded sessionId succeeds even with FLOCK <= PROBE set.

echo "Test: --release unaffected by a misconfigured timeout knob"
lock_setup
export CLAUDE_CODE_SESSION_ID="sess-5f-mine"
printf '%s\n' "sess-5f-mine" > "$DISPATCH_LOCK_FILE"
export DISPATCH_LOCK_PROBE_TIMEOUT=10 DISPATCH_LOCK_FLOCK_TIMEOUT=5
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" --release 2>/dev/null); rc=$?
assert_eq "release with bad knobs: exit 0" "0" "$rc"
assert_eq "release with bad knobs: prints released" "released" "$out"
lock_teardown

# --- Test 6a: misconfiguration — non-git dir, no DISPATCH_LOCK_FILE ----------

echo "Test: non-git dir with no DISPATCH_LOCK_FILE exits 2"
lock_setup
export CLAUDE_CODE_SESSION_ID="sess-600"
lock_fake_claude_sessions "sess-600"
nongit=$(mktemp -d)
# `set -e` is in effect: capture the exit code with an if/else. env -u strips
# the lock-file override for just this invocation.
if ( cd "$nongit" && env -u DISPATCH_LOCK_FILE \
       "$TMPDIR_TEST/scripts/dispatch-acquire-lock" ) 2>"$STUB_DIR/err6"; then
  rc=0
else
  rc=$?
fi
assert_eq "misconfiguration (non-git) exits 2" "2" "$rc"
err6=$(cat "$STUB_DIR/err6" 2>/dev/null || true)
# Assert the specific git-error message, not just non-empty stderr — this keeps
# the test's intent ("the git-lookup guard fired") robust to guard reordering:
# if Step 2 ever moved before Step 1, this assertion would fail rather than
# silently passing for the wrong reason.
TOTAL=$((TOTAL + 1))
if [[ "$err6" == *"not in a git repo"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-git misconfiguration writes the git-error to stderr"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-git misconfiguration writes the git-error to stderr"
  echo "    stderr: '$err6'"
fi
rm -rf "$nongit"
lock_teardown

# --- Test 6b: misconfiguration — CLAUDE_CODE_SESSION_ID unset → exit 2 -------

echo "Test: unset CLAUDE_CODE_SESSION_ID exits 2"
lock_setup
lock_fake_claude_sessions   # not strictly needed; daemon is never queried
# `set -e` is in effect: capture the exit code with an if/else. env -u strips
# CLAUDE_CODE_SESSION_ID for just this invocation.
if ( env -u CLAUDE_CODE_SESSION_ID \
       "$TMPDIR_TEST/scripts/dispatch-acquire-lock" ) 2>"$STUB_DIR/err6b"; then
  rc=0
else
  rc=$?
fi
assert_eq "missing CLAUDE_CODE_SESSION_ID exits 2" "2" "$rc"
err6b=$(cat "$STUB_DIR/err6b" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$err6b" == *"CLAUDE_CODE_SESSION_ID is unset"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: missing CLAUDE_CODE_SESSION_ID writes the session-id error to stderr"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: missing CLAUDE_CODE_SESSION_ID writes the session-id error to stderr"
  echo "    stderr: '$err6b'"
fi
lock_teardown

# --- Test 8: --wait with an own-session record acquires immediately ----------
#
# Our sessionId is recorded. --wait must NOT poll — try_acquire claims it on
# iteration 1. WAIT_TIMEOUT=0 proves no wait happened: a real wait would have
# to time out, which 0 cannot survive.

echo "Test: --wait with an own-session record acquires immediately"
lock_setup
printf '%s\n' "sess-800" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-800"
lock_fake_claude_sessions "sess-800"
export DISPATCH_LOCK_WAIT_TIMEOUT=0
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" --wait 2>/dev/null); rc=$?
assert_eq "--wait own-session exits 0" "0" "$rc"
assert_eq "--wait own-session prints acquired" "acquired" "$out"
lock_teardown

# --- Test 9: --wait against a live foreign holder times out → busy -----------
#
# The recorded sessionId is a live foreign session that never leaves the
# registry. The --wait loop polls until WAIT_TIMEOUT elapses, then prints busy
# and exits 0.

echo "Test: --wait against a live foreign holder times out and prints busy"
lock_setup
printf '%s\n' "sess-900-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-900-self"
lock_fake_claude_sessions "sess-900-foreign" "sess-900-self"
export DISPATCH_LOCK_WAIT_TIMEOUT=1
export DISPATCH_LOCK_WAIT_INTERVAL=0.2
# `set -e` is in effect: capture the exit code with an if/else.
if out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" --wait 2>/dev/null); then
  rc=0
else
  rc=$?
fi
assert_eq "--wait timeout exits 0" "0" "$rc"
assert_eq "--wait timeout prints busy" "busy" "$out"
lock_teardown

# --- Test 10: --wait acquires once a contended holder goes stale -------------
#
# The recorded sessionId is live when --wait starts. Mid-wait we regenerate
# the fake `claude` to omit that sessionId, so the next poll's liveness check
# fails and the waiter reclaims the lock — recording its own sessionId.

echo "Test: --wait acquires once a contended holder goes stale"
lock_setup
printf '%s\n' "sess-1010-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-1010-self"
lock_fake_claude_sessions "sess-1010-foreign" "sess-1010-self"
export DISPATCH_LOCK_WAIT_INTERVAL=0.1
export DISPATCH_LOCK_WAIT_TIMEOUT=10
( "$TMPDIR_TEST/scripts/dispatch-acquire-lock" --wait ) >"$STUB_DIR/out10" 2>&1 &
wait_pid=$!
sleep 0.5
# Holder goes away — regenerate the registry without its sessionId. The
# waiter has already exported CLAUDE_AGENTS_CMD; the fake script reads its
# payload file at run time, so rewriting the payload (and overwriting the
# script) is picked up by the next poll.
lock_fake_claude_sessions "sess-1010-self"
wait "$wait_pid"
out=$(cat "$STUB_DIR/out10" 2>/dev/null || true)
assert_eq "--wait reclaim prints acquired" "acquired" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "--wait reclaim records our sessionId" "sess-1010-self" "$lock_contents"
lock_teardown

# --- Test 11: --release with an own-session record → released, file emptied --

echo "Test: --release with an own-session record clears the lock file"
lock_setup
printf '%s\n' "sess-1111" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-1111"
lock_fake_claude_sessions "sess-1111"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" --release 2>/dev/null); rc=$?
assert_eq "--release own-session exits 0" "0" "$rc"
assert_eq "--release own-session prints released" "released" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ -z "$lock_contents" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: --release empties the lock file"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: --release empties the lock file"
  echo "    lock file: '$lock_contents'"
fi
lock_teardown

# --- Test 12: --release with a foreign sessionId recorded → noop -------------

echo "Test: --release with a foreign sessionId recorded is a no-op"
lock_setup
printf '%s\n' "sess-1212-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-1212-self"
lock_fake_claude_sessions "sess-1212-foreign" "sess-1212-self"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" --release 2>/dev/null); rc=$?
assert_eq "--release foreign exits 0" "0" "$rc"
assert_eq "--release foreign prints noop" "noop" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "--release foreign leaves the lock file unchanged" \
  "sess-1212-foreign" "$lock_contents"
lock_teardown

# --- Test 13: unknown argument exits 2 ---------------------------------------

echo "Test: an unknown argument exits 2"
lock_setup
# Set CLAUDE_CODE_SESSION_ID so the test exercises the arg-parse guard
# specifically. Without this, the script also exits 2 on the session-id guard
# (Step 2) — if Step 0 (arg parse) were ever moved after Step 2, this test
# would silently keep passing for the wrong reason.
export CLAUDE_CODE_SESSION_ID="sess-1300"
# `set -e` is in effect: capture the exit code with an if/else.
if ( "$TMPDIR_TEST/scripts/dispatch-acquire-lock" --bogus ) 2>"$STUB_DIR/err13"; then
  rc=0
else
  rc=$?
fi
assert_eq "unknown argument exits 2" "2" "$rc"
err13=$(cat "$STUB_DIR/err13" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$err13" == *"unknown argument"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: unknown argument writes the arg-parse error to stderr"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: unknown argument writes the arg-parse error to stderr"
  echo "    stderr: '$err13'"
fi
lock_teardown

# --- Test 14: a recorded sessionId absent from a non-empty registry is reclaimable

echo "Test: a recorded sessionId absent from a non-empty registry is reclaimable"
lock_setup
printf '%s\n' "sess-1414-gone" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-1414-self"
# Registry has live sessions, but not the recorded holder — its session ended.
lock_fake_claude_sessions "sess-1414-other" "sess-1414-self"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "absent-from-registry exits 0" "0" "$rc"
assert_eq "absent-from-registry prints acquired" "acquired" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "absent-from-registry lock file rewritten to caller's sessionId" \
  "sess-1414-self" "$lock_contents"
lock_teardown

# --- Test 15: daemon-unreachable → foreign holder treated as live → busy -----
#
# `claude agents --json` exits non-zero (binary missing, daemon down, etc.).
# The fail-safe contract says treat the recorded foreign holder as live — the
# lock must NOT be stolen. The caller prints busy.

echo "Test: daemon-unreachable treats a foreign holder as live (lock not stolen)"
lock_setup
printf '%s\n' "sess-1515-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-1515-self"
lock_fake_claude_failure 1
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "daemon-unreachable exits 0" "0" "$rc"
assert_eq "daemon-unreachable prints busy" "busy" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "daemon-unreachable lock file is unchanged" \
  "sess-1515-foreign" "$lock_contents"
lock_teardown

# --- Test 16: --release with no lock file → noop, no error -------------------
#
# Tests 11/12 always pre-write a sessionId before --release; this exercises the
# absent-file branch that the script must treat as `noop` (nothing recorded to
# clear).

echo "Test: --release with no lock file prints noop"
lock_setup
export CLAUDE_CODE_SESSION_ID="sess-1616"
lock_fake_claude_sessions "sess-1616"
# Lock file deliberately not created.
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" --release 2>/dev/null); rc=$?
assert_eq "--release absent-file exits 0" "0" "$rc"
assert_eq "--release absent-file prints noop" "noop" "$out"
lock_teardown

# --- Test 17: opaque-failure stdout (whitespace-only) → foreign holder live --
#
# `claude agents --json` exits 0 but prints only whitespace. is_live_session
# must treat this as opaque/live (return 0) — the lock must not be stolen.

echo "Test: whitespace-only daemon stdout treats a foreign holder as live"
lock_setup
printf '%s\n' "sess-1717-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-1717-self"
lock_fake_claude_payload $'   \n\t  \n'
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "whitespace-stdout exits 0" "0" "$rc"
assert_eq "whitespace-stdout prints busy" "busy" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "whitespace-stdout lock file is unchanged" \
  "sess-1717-foreign" "$lock_contents"
lock_teardown

# --- Test 18: non-array JSON stdout (object) → foreign holder live -----------
#
# `claude agents --json` exits 0 but prints a JSON object instead of an array
# (a daemon bug or API change). is_live_session's jq guard hits `error("not a
# JSON array")` and the function returns 0 (live). The lock must not be stolen.

echo "Test: non-array JSON daemon stdout treats a foreign holder as live"
lock_setup
printf '%s\n' "sess-1818-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-1818-self"
lock_fake_claude_payload '{"error":"unexpected shape"}'
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "non-array-json exits 0" "0" "$rc"
assert_eq "non-array-json prints busy" "busy" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "non-array-json lock file is unchanged" \
  "sess-1818-foreign" "$lock_contents"
lock_teardown

# --- Test 19: malformed-JSON daemon stdout → foreign holder treated as live ---
#
# `claude agents --json` exits 0 but prints truncated/malformed JSON (a partial
# array like `[{"sessionId":`). jq cannot parse this — it exits non-zero — and
# is_live_session must treat the jq parse failure as opaque/live (return 0).
# The lock must NOT be stolen.

echo "Test: malformed-JSON daemon stdout treats a foreign holder as live"
lock_setup
printf '%s\n' "sess-1919-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-1919-self"
lock_fake_claude_payload '[{"sessionId":'
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "malformed-json exits 0" "0" "$rc"
assert_eq "malformed-json prints busy" "busy" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "malformed-json lock file is unchanged" \
  "sess-1919-foreign" "$lock_contents"
lock_teardown

# --- Test 6c: --release with CLAUDE_CODE_SESSION_ID unset → exit 2 ----------
#
# The Step 2 CLAUDE_CODE_SESSION_ID guard runs before the `case "$MODE"` dispatch
# so `--release` fails the same way as a plain acquire when the session-id is
# unset. The foreign lock holder must be left untouched.

echo "Test: --release with unset CLAUDE_CODE_SESSION_ID exits 2, lock unchanged"
lock_setup
printf '%s\n' "sess-6c-foreign" > "$DISPATCH_LOCK_FILE"
lock_fake_claude_sessions   # not queried; guard fires before the mode dispatch
if ( env -u CLAUDE_CODE_SESSION_ID \
       "$TMPDIR_TEST/scripts/dispatch-acquire-lock" --release ) 2>"$STUB_DIR/err6c"; then
  rc=0
else
  rc=$?
fi
assert_eq "--release missing CLAUDE_CODE_SESSION_ID exits 2" "2" "$rc"
err6c=$(cat "$STUB_DIR/err6c" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$err6c" == *"CLAUDE_CODE_SESSION_ID is unset"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: --release missing-session-id writes the session-id error to stderr"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: --release missing-session-id writes the session-id error to stderr"
  echo "    stderr: '$err6c'"
fi
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "--release missing-session-id leaves the foreign lock intact" \
  "sess-6c-foreign" "$lock_contents"
lock_teardown

# --- Test 20: live foreign holder with marker → busy (#945) ------------------
#
# After #945 the lock extends through Step 6 (spawn). A foreign holder's session
# is still live AND its cwd carries the tmp/dispatch-worktree marker — this now
# means it is mid-spawn (Steps 5–6), NOT that it has released the lock. acquire
# must block (busy), not reclaim. The marker no longer implies lock-released for
# a live holder.

echo "Test: live foreign holder with marker → busy (#945, mid-spawn)"
lock_setup
printf '%s\n' "sess-2020-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-2020-self"
# Build the foreign holder's marker-bearing cwd inside the test tmp tree.
foreign_cwd="$TMPDIR_TEST/foreign-worktree"
mkdir -p "$foreign_cwd/tmp"
# The marker names the recorded holder (sess-2020-foreign) — but since the holder
# is still live (mid-spawn), the lock must NOT be reclaimed (#945).
printf '%s\n' "sess-2020-foreign" > "$foreign_cwd/tmp/dispatch-worktree"
lock_fake_claude_sessions "sess-2020-foreign=$foreign_cwd" "sess-2020-self=$TMPDIR_TEST"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "mid-spawn holder busy exits 0" "0" "$rc"
assert_eq "mid-spawn holder busy prints busy" "busy" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "mid-spawn holder busy: lock file unchanged (still the foreign holder)" \
  "sess-2020-foreign" "$lock_contents"
lock_teardown

# --- Test 21: live foreign holder WITHOUT marker → busy (regression) ---------
#
# A live foreign holder with no marker is still in-flight (Steps 0–5) and the
# lock must hold it.

echo "Test: live foreign holder without marker → busy (in-flight)"
lock_setup
printf '%s\n' "sess-2121-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-2121-self"
foreign_cwd="$TMPDIR_TEST/foreign-worktree-no-marker"
mkdir -p "$foreign_cwd"   # cwd exists but marker file does NOT
lock_fake_claude_sessions "sess-2121-foreign=$foreign_cwd" "sess-2121-self=$TMPDIR_TEST"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "in-flight holder blocks: exits 0" "0" "$rc"
assert_eq "in-flight holder blocks: prints busy" "busy" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "in-flight holder blocks: lock file unchanged" \
  "sess-2121-foreign" "$lock_contents"
lock_teardown

# --- Test 22: --release with live foreign holder and marker → noop (#945) ----
#
# A caller whose CLAUDE_CODE_SESSION_ID differs from the recorded holder can
# no longer --release a live foreign holder — the lock extends through Step 6 (#945).
# Live foreign holders are always noop for --release.

echo "Test: --release with live foreign holder and marker → noop (#945, mid-spawn)"
lock_setup
printf '%s\n' "sess-2222-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-2222-self"
foreign_cwd="$TMPDIR_TEST/foreign-worktree-with-marker"
mkdir -p "$foreign_cwd/tmp"
# The marker names the recorded holder (sess-2222-foreign) — but the holder is
# live (mid-spawn), so --release must not release (#945).
printf '%s\n' "sess-2222-foreign" > "$foreign_cwd/tmp/dispatch-worktree"
lock_fake_claude_sessions "sess-2222-foreign=$foreign_cwd" "sess-2222-self=$TMPDIR_TEST"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" --release 2>/dev/null); rc=$?
assert_eq "live-foreign --release exits 0" "0" "$rc"
assert_eq "live-foreign --release prints noop" "noop" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "live-foreign --release leaves lock file unchanged" "sess-2222-foreign" "$lock_contents"
lock_teardown

# --- Test 23: --release with NO marker → noop (strict pre-marker) -----------
#
# Refinement of Test 12: without a marker, a different-sessionId caller stays noop.
# A live foreign holder — regardless of marker — is always noop for --release (#945).
# This test confirms the no-marker path.

echo "Test: --release with foreign holder and NO marker → noop (pre-marker stop path)"
lock_setup
printf '%s\n' "sess-2323-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-2323-self"
foreign_cwd="$TMPDIR_TEST/foreign-worktree-no-marker-release"
mkdir -p "$foreign_cwd"   # no marker
lock_fake_claude_sessions "sess-2323-foreign=$foreign_cwd" "sess-2323-self=$TMPDIR_TEST"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" --release 2>/dev/null); rc=$?
assert_eq "pre-marker --release exits 0" "0" "$rc"
assert_eq "pre-marker --release prints noop" "noop" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "pre-marker --release leaves the lock file unchanged" \
  "sess-2323-foreign" "$lock_contents"
lock_teardown

# --- Test 24: live foreign holder with MISMATCHED marker → busy (#928) -------
#
# The marker exists but names a DIFFERENT (older, since-finalized) session, not
# the recorded holder. A live foreign holder is unconditionally BUSY as of #945:
# the BUSY short-circuit fires before any marker is read, so the mismatched
# marker content is never inspected. The test confirms the live holder is not
# reclaimed regardless of what the marker contains.

echo "Test: live foreign holder with mismatched marker → busy (#928)"
lock_setup
printf '%s\n' "sess-2424-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-2424-self"
foreign_cwd="$TMPDIR_TEST/foreign-worktree-stale-marker"
mkdir -p "$foreign_cwd/tmp"
# Marker names an unrelated, older session — not the recorded holder.
printf '%s\n' "sess-2424-some-older-session" > "$foreign_cwd/tmp/dispatch-worktree"
lock_fake_claude_sessions "sess-2424-foreign=$foreign_cwd" "sess-2424-self=$TMPDIR_TEST"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "mismatched-marker holder blocks: exits 0" "0" "$rc"
assert_eq "mismatched-marker holder blocks: prints busy" "busy" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "mismatched-marker holder blocks: lock file unchanged" \
  "sess-2424-foreign" "$lock_contents"
lock_teardown

# --- Test 25: live foreign holder with EMPTY marker → busy (#928) ------------
#
# An empty marker is the shape stamped by .claude/hooks/worktree-create.sh's
# `touch` on every worktree creation. As of #945 a live foreign holder is
# unconditionally BUSY: the BUSY short-circuit fires before any marker is read,
# so the empty marker's content is never inspected. This is now a regression
# guard, not a behavioral test of an empty-marker special case — the empty
# content no longer drives the decision; the live-holder short-circuit does.

echo "Test: live foreign holder with empty (touch) marker → busy (#928)"
lock_setup
printf '%s\n' "sess-2525-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-2525-self"
foreign_cwd="$TMPDIR_TEST/foreign-worktree-empty-marker"
mkdir -p "$foreign_cwd/tmp"
# The hook's shape: a content-less marker.
touch "$foreign_cwd/tmp/dispatch-worktree"
lock_fake_claude_sessions "sess-2525-foreign=$foreign_cwd" "sess-2525-self=$TMPDIR_TEST"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "empty-marker holder blocks: exits 0" "0" "$rc"
assert_eq "empty-marker holder blocks: prints busy" "busy" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "empty-marker holder blocks: lock file unchanged" \
  "sess-2525-foreign" "$lock_contents"
lock_teardown

# --- Test 25b: live foreign holder with FIFO marker → busy (no deadlock) -----
#
# Because a live foreign holder is unconditionally BUSY as of #945, the marker
# is never opened — a FIFO at that path cannot deadlock routing. This test is a
# regression guard: if a future change reintroduced a marker read for live
# holders, opening the FIFO would block indefinitely, the `timeout 10` below
# would fire, and the test would fail as a hang rather than pass silently.

echo "Test: live foreign holder with FIFO marker → busy (no deadlock)"
lock_setup
printf '%s\n' "sess-25b-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-25b-self"
foreign_cwd="$TMPDIR_TEST/foreign-worktree-fifo-marker"
mkdir -p "$foreign_cwd/tmp"
mkfifo "$foreign_cwd/tmp/dispatch-worktree"
lock_fake_claude_sessions "sess-25b-foreign=$foreign_cwd" "sess-25b-self=$TMPDIR_TEST"
out=$(timeout 10 "$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "fifo-marker holder blocks: exits 0 (no timeout/hang)" "0" "$rc"
assert_eq "fifo-marker holder blocks: prints busy" "busy" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "fifo-marker holder blocks: lock file unchanged" \
  "sess-25b-foreign" "$lock_contents"
rm -f "$foreign_cwd/tmp/dispatch-worktree"
lock_teardown

# --- Test 26: --release with MISMATCHED marker → noop (#928) -----------------
#
# After #945 all foreign --release calls are noop; this test still passes because
# the assertion (noop) now matches the unconditional foreign-holder policy.

echo "Test: --release with mismatched marker → noop (#928)"
lock_setup
printf '%s\n' "sess-2626-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-2626-self"
foreign_cwd="$TMPDIR_TEST/foreign-worktree-mismatch-release"
mkdir -p "$foreign_cwd/tmp"
printf '%s\n' "sess-2626-some-older-session" > "$foreign_cwd/tmp/dispatch-worktree"
lock_fake_claude_sessions "sess-2626-foreign=$foreign_cwd" "sess-2626-self=$TMPDIR_TEST"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" --release 2>/dev/null); rc=$?
assert_eq "mismatched --release exits 0" "0" "$rc"
assert_eq "mismatched --release prints noop" "noop" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "mismatched --release leaves the lock file unchanged" \
  "sess-2626-foreign" "$lock_contents"
lock_teardown

# --- Test 27: mid-spawn-died holder (marker present, holder dead) → reclaim (#945)
#
# Crash-safety AC for #945: dispatch-materialize-spawn now holds the lock
# through the spawn, so a router that dies mid-spawn leaves the lock recorded to
# a now-dead session — with the tmp/dispatch-worktree marker already written by
# dispatch-finalize-selection. The next tick's --wait must NOT wedge: the
# dead-holder reclaim (recorded sessionId absent from `claude agents --json`)
# frees the lock regardless of the marker. This is the load-bearing recovery
# path; the marker-reclaim is belt-and-suspenders.
echo "Test: mid-spawn-died holder (marker present, holder absent from registry) → reclaim (#945)"
lock_setup
printf '%s\n' "sess-2727-dead" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-2727-self"
# The dead holder's marker is present and names it (finalize-selection ran
# before the crash) — but the holder is gone from the registry.
foreign_cwd="$TMPDIR_TEST/dead-holder-worktree"
mkdir -p "$foreign_cwd/tmp"
printf '%s\n' "sess-2727-dead" > "$foreign_cwd/tmp/dispatch-worktree"
# Registry omits the dead holder; only the waiter's own session is live.
lock_fake_claude_sessions "sess-2727-self=$TMPDIR_TEST"
export DISPATCH_LOCK_WAIT_TIMEOUT=1
export DISPATCH_LOCK_WAIT_INTERVAL=0.2
if out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" --wait 2>/dev/null); then
  rc=0
else
  rc=$?
fi
assert_eq "mid-spawn-died reclaim exits 0" "0" "$rc"
assert_eq "mid-spawn-died reclaim prints acquired (not busy)" "acquired" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "mid-spawn-died reclaim rewrites lock to caller's sessionId" \
  "sess-2727-self" "$lock_contents"
lock_teardown

# --- Test 28: live-but-stale holder (heartbeat older than max_hold) → reclaim (#2104)
#
# Criterion 2: the max-hold/heartbeat staleness cap. The recorded foreign holder
# IS live in the registry, but its heartbeat — the lock-file mtime — is far older
# than DISPATCH_LOCK_MAX_HOLD_SECONDS, so it is wedged and must be reclaimed even
# though its session is still live. No clock injection is needed: age = real_now
# - old_mtime dominates.
echo "Test: a live foreign holder whose heartbeat is stale (mtime > max_hold) is reclaimed (#2104)"
lock_setup
export CLAUDE_CODE_SESSION_ID="sess-stale-self"
printf '%s\n' "sess-stale-live" > "$DISPATCH_LOCK_FILE"
# The foreign holder IS live in the registry (alongside our own session)...
lock_fake_claude_sessions "sess-stale-live" "sess-stale-self"
# ...but its heartbeat (lock-file mtime) is far in the past.
touch -d "@$(( $(date +%s) - 10000 ))" "$DISPATCH_LOCK_FILE"
export DISPATCH_LOCK_MAX_HOLD_SECONDS=1
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "28 stale-reclaim exits 0" "0" "$rc"
assert_eq "28 stale-reclaim prints acquired (live but wedged holder)" "acquired" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "28 stale-reclaim rewrites lock to caller's sessionId" "sess-stale-self" "$lock_contents"
lock_teardown

# --- Test 29: live holder with a FRESH heartbeat → busy (#1068 regression guard, #2104)
#
# Criterion 3: no-reclaim-when-fresh. The same live foreign holder, but its
# heartbeat is fresh (within the cap), so the staleness path must NOT fire — the
# acquirer stays busy and the lock is left untouched. This is the #1068
# duplicate-spawn regression guard: a holder refreshing within budget is never
# reclaimed.
echo "Test: a live foreign holder with a fresh heartbeat is NOT reclaimed → busy (#1068 guard, #2104)"
lock_setup
export CLAUDE_CODE_SESSION_ID="sess-fresh-self"
printf '%s\n' "sess-fresh-live" > "$DISPATCH_LOCK_FILE"
lock_fake_claude_sessions "sess-fresh-live" "sess-fresh-self"
# Fresh mtime (the printf above already wrote it now; touch makes it explicit).
touch "$DISPATCH_LOCK_FILE"
export DISPATCH_LOCK_MAX_HOLD_SECONDS=300
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "29 no-reclaim-when-fresh exits 0" "0" "$rc"
assert_eq "29 no-reclaim-when-fresh prints busy" "busy" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "29 no-reclaim-when-fresh leaves the foreign holder in place" "sess-fresh-live" "$lock_contents"
lock_teardown

# --- Test 30: --heartbeat bumps the owner's mtime, noops for a non-owner (#2104)
#
# The strict-owner heartbeat. As the recorded holder, --heartbeat bumps the
# lock-file mtime (the heartbeat carrier) and prints "refreshed", preserving the
# recorded sessionId. As a non-owner it is a noop: mtime unchanged, content
# unchanged. --heartbeat issues NO `claude agents --json` probe, so no fake
# registry is needed.
echo "Test: --heartbeat bumps the owner's mtime and is a noop for a non-owner (#2104)"
lock_setup
export CLAUDE_CODE_SESSION_ID="sess-hb-owner"
printf '%s\n' "sess-hb-owner" > "$DISPATCH_LOCK_FILE"
old_epoch=$(( $(date +%s) - 5000 ))
touch -d "@$old_epoch" "$DISPATCH_LOCK_FILE"
before=$(stat -c %Y "$DISPATCH_LOCK_FILE")
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" --heartbeat 2>/dev/null); rc=$?
after=$(stat -c %Y "$DISPATCH_LOCK_FILE")
assert_eq "30 heartbeat owner exits 0" "0" "$rc"
assert_eq "30 heartbeat owner prints refreshed" "refreshed" "$out"
TOTAL=$((TOTAL + 1))
if (( after > before )); then
  PASS=$((PASS + 1)); echo "  PASS: 30 heartbeat owner bumped the mtime"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: 30 heartbeat owner bumped the mtime (before=$before after=$after)"
fi
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "30 heartbeat owner preserves the recorded sessionId" "sess-hb-owner" "$lock_contents"
# Non-owner: re-age the file and run as a different session.
touch -d "@$old_epoch" "$DISPATCH_LOCK_FILE"
before=$(stat -c %Y "$DISPATCH_LOCK_FILE")
export CLAUDE_CODE_SESSION_ID="sess-hb-other"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" --heartbeat 2>/dev/null); rc=$?
after=$(stat -c %Y "$DISPATCH_LOCK_FILE")
assert_eq "30 heartbeat non-owner exits 0" "0" "$rc"
assert_eq "30 heartbeat non-owner prints noop" "noop" "$out"
assert_eq "30 heartbeat non-owner leaves the mtime unchanged" "$before" "$after"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "30 heartbeat non-owner preserves the recorded sessionId" "sess-hb-owner" "$lock_contents"
lock_teardown

# --- Test 31: selection-lock.json max_hold_seconds drives the reclaim, not env (#2104)
#
# Criterion 5, end-to-end: the config value (not the env var) drives the stale
# reclaim, and config takes precedence over the env override. lock_setup copies
# only dispatch-acquire-lock + lib.sh, so copy dispatch-config-load alongside and
# point DISPATCH_CONFIG_DIR at a synthetic selection-lock.json. The env var is set
# HIGH (would NOT reclaim a 10000s-old holder); the config is set LOW (max_hold=1,
# WOULD reclaim). A reclaim proves the config value wins.
echo "Test: selection-lock.json max_hold_seconds drives the stale reclaim, overriding env (#2104)"
lock_setup
cp "$SCRIPT_DIR/dispatch-config-load" "$TMPDIR_TEST/scripts/dispatch-config-load"
chmod +x "$TMPDIR_TEST/scripts/dispatch-config-load"
export DISPATCH_CONFIG_DIR="$TMPDIR_TEST/config"
mkdir -p "$DISPATCH_CONFIG_DIR"
printf '{"max_hold_seconds":1}\n' > "$DISPATCH_CONFIG_DIR/selection-lock.json"
export DISPATCH_LOCK_MAX_HOLD_SECONDS=99999   # env alone would keep it busy
export CLAUDE_CODE_SESSION_ID="sess-cfg-self"
printf '%s\n' "sess-cfg-live" > "$DISPATCH_LOCK_FILE"
lock_fake_claude_sessions "sess-cfg-live" "sess-cfg-self"
touch -d "@$(( $(date +%s) - 10000 ))" "$DISPATCH_LOCK_FILE"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "31 config-driven reclaim exits 0" "0" "$rc"
assert_eq "31 config-driven reclaim prints acquired (config max_hold=1 wins over env 99999)" "acquired" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "31 config-driven reclaim rewrites lock to caller's sessionId" "sess-cfg-self" "$lock_contents"
lock_teardown

# <<< END MOVED <<<

report_results
