#!/usr/bin/env bash
# Tests for dispatch-finalize-selection -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 18289-18500.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-finalize-selection tests (#896)
# ============================================================================
# Pin the cd-first contract introduced for #896. The wrapper takes one
# required <worktree-path> argument, cds into it, and writes the
# tmp/dispatch-worktree marker. Since #945 it does NOT release the lock — the
# caller (dispatch-materialize-spawn) holds it through the spawn and releases
# after the worker registers. The cd-first contract is what keeps the marker
# out of the router's cwd (worktrees/main); the previous implementation wrote
# into PWD and leaked the marker into the router's cwd, defeating the selection
# lock.
echo ""
echo "=== dispatch-finalize-selection ==="

FINALIZE_SCRIPT="$SCRIPT_DIR/dispatch-finalize-selection"

# ----- Test A (happy path / #896 regression) ---------------------------------
echo "Test: dispatch-finalize-selection writes the marker into target worktree, not caller's cwd, and does NOT release the lock (#945)"
lock_setup
# Set up two distinct dirs: A (caller's cwd) and B (target worktree).
ROUTER_CWD="$TMPDIR_TEST/A"
TARGET_WT="$TMPDIR_TEST/B"
mkdir -p "$ROUTER_CWD" "$TARGET_WT"
export CLAUDE_CODE_SESSION_ID="finalize-self-session"
# Pre-fill the lock with our own sessionId; since #945 the wrapper must leave
# the lock untouched (no release).
echo "$CLAUDE_CODE_SESSION_ID" > "$DISPATCH_LOCK_FILE"

FIN_ORIG_PWD="$PWD"
cd "$ROUTER_CWD"
# Capture the exit code via `if` so the test file's `set -e` does not abort
# the whole suite before `finalize_exit` is set on a (regression) non-zero
# exit — same pattern as the error-path tests B/C/D below.
if "$FINALIZE_SCRIPT" "$TARGET_WT" > "$TMPDIR_TEST/finalize.out" 2>&1; then
  finalize_exit=0
else
  finalize_exit=$?
fi
cd "$FIN_ORIG_PWD"

assert_eq "happy path: exit 0" "0" "$finalize_exit"
assert_eq "happy path: marker in target worktree" "1" \
  "$([ -f "$TARGET_WT/tmp/dispatch-worktree" ] && echo 1 || echo 0)"
# #928: the marker is session-scoped — it carries the finalizing holder's
# CLAUDE_CODE_SESSION_ID, not an empty flag.
assert_eq "happy path: marker content names the finalizing session" \
  "$CLAUDE_CODE_SESSION_ID" \
  "$(cat "$TARGET_WT/tmp/dispatch-worktree")"
# Regression for #896: the wrapper must not write the marker into the
# caller's cwd. This is the load-bearing assertion.
assert_eq "happy path: no marker in caller cwd" "0" \
  "$([ -f "$ROUTER_CWD/tmp/dispatch-worktree" ] && echo 1 || echo 0)"
# Since #945 the wrapper no longer releases the lock — it must remain held.
assert_eq "happy path: lock still held (#945)" "$CLAUDE_CODE_SESSION_ID" \
  "$(cat "$DISPATCH_LOCK_FILE")"
# And it emits no `released` output (it no longer execs --release).
assert_eq "happy path: stdout empty (no release output)" "" \
  "$(cat "$TMPDIR_TEST/finalize.out")"
lock_teardown

# ----- Test B (missing argument) ---------------------------------------------
echo "Test: dispatch-finalize-selection with no args exits 2 with diagnostic"
lock_setup
if "$FINALIZE_SCRIPT" > "$TMPDIR_TEST/missing.out" 2> "$TMPDIR_TEST/missing.err"; then
  missing_exit=0
else
  missing_exit=$?
fi
assert_eq "missing arg: exit 2" "2" "$missing_exit"
assert_eq "missing arg: stderr names script and 'missing'" "1" \
  "$(grep -c 'dispatch-finalize-selection.*missing' "$TMPDIR_TEST/missing.err")"
lock_teardown

# ----- Test C (invalid worktree path) ----------------------------------------
echo "Test: dispatch-finalize-selection with nonexistent path exits 2 with diagnostic"
lock_setup
BAD_PATH="$TMPDIR_TEST/does-not-exist"
if "$FINALIZE_SCRIPT" "$BAD_PATH" > "$TMPDIR_TEST/invalid.out" 2> "$TMPDIR_TEST/invalid.err"; then
  invalid_exit=0
else
  invalid_exit=$?
fi
assert_eq "invalid path: exit 2" "2" "$invalid_exit"
assert_eq "invalid path: stderr names script and 'cannot cd'" "1" \
  "$(grep -c "dispatch-finalize-selection.*cannot cd.*$BAD_PATH" "$TMPDIR_TEST/invalid.err")"
# The marker must not have been written anywhere on this failure path.
assert_eq "invalid path: no marker created in $TMPDIR_TEST" "" \
  "$(find "$TMPDIR_TEST" -name dispatch-worktree -print 2>/dev/null)"
lock_teardown

# ----- Test D (extra argument) -----------------------------------------------
echo "Test: dispatch-finalize-selection with extra positional arg exits 2"
lock_setup
EXTRA_A="$TMPDIR_TEST/wt-a"
EXTRA_B="$TMPDIR_TEST/wt-b"
mkdir -p "$EXTRA_A" "$EXTRA_B"
if "$FINALIZE_SCRIPT" "$EXTRA_A" "$EXTRA_B" > "$TMPDIR_TEST/extra.out" 2> "$TMPDIR_TEST/extra.err"; then
  extra_exit=0
else
  extra_exit=$?
fi
assert_eq "extra arg: exit 2" "2" "$extra_exit"
assert_eq "extra arg: stderr names script and 'extra'" "1" \
  "$(grep -c 'dispatch-finalize-selection.*extra' "$TMPDIR_TEST/extra.err")"
# No marker landed in either dir on the rejected call.
assert_eq "extra arg: no marker in first arg path" "0" \
  "$([ -f "$EXTRA_A/tmp/dispatch-worktree" ] && echo 1 || echo 0)"
assert_eq "extra arg: no marker in second arg path" "0" \
  "$([ -f "$EXTRA_B/tmp/dispatch-worktree" ] && echo 1 || echo 0)"
lock_teardown

# ----- Test E (flag-shaped argument) -----------------------------------------
# A flag-shaped first arg (e.g. someone confusing this wrapper with
# dispatch-acquire-lock --release) is rejected before any cd/marker side effect.
echo "Test: dispatch-finalize-selection with flag-shaped arg exits 2"
lock_setup
if "$FINALIZE_SCRIPT" --release > "$TMPDIR_TEST/flag.out" 2> "$TMPDIR_TEST/flag.err"; then
  flag_exit=0
else
  flag_exit=$?
fi
assert_eq "flag arg: exit 2" "2" "$flag_exit"
assert_eq "flag arg: stderr names script and 'flag-shaped'" "1" \
  "$(grep -c 'dispatch-finalize-selection.*flag-shaped' "$TMPDIR_TEST/flag.err")"
# No marker created anywhere on the rejected call.
assert_eq "flag arg: no marker created in $TMPDIR_TEST" "" \
  "$(find "$TMPDIR_TEST" -name dispatch-worktree -print 2>/dev/null)"
lock_teardown

# ----- Test F (unset CLAUDE_CODE_SESSION_ID) ---------------------------------
# #928: the marker is session-scoped, so an unset CLAUDE_CODE_SESSION_ID is a
# misconfigured environment — the wrapper must fail clear (exit 2) rather than
# write an inert empty marker that could never reclaim a live holder. Mirrors
# dispatch-acquire-lock's Test 6b guard.
echo "Test: dispatch-finalize-selection with unset CLAUDE_CODE_SESSION_ID exits 2"
lock_setup
UNSET_WT="$TMPDIR_TEST/unset-wt"
mkdir -p "$UNSET_WT"
# `set -e` is in effect: capture the exit code with an if/else. env -u strips
# CLAUDE_CODE_SESSION_ID for just this invocation.
if ( env -u CLAUDE_CODE_SESSION_ID \
       "$FINALIZE_SCRIPT" "$UNSET_WT" ) > "$TMPDIR_TEST/unset.out" 2> "$TMPDIR_TEST/unset.err"; then
  unset_exit=0
else
  unset_exit=$?
fi
assert_eq "unset session: exit 2" "2" "$unset_exit"
assert_eq "unset session: stderr names script and 'is unset'" "1" \
  "$(grep -c 'dispatch-finalize-selection.*CLAUDE_CODE_SESSION_ID is unset' "$TMPDIR_TEST/unset.err")"
# The guard fires after the cd but before the marker write — no inert empty
# marker must land in the target worktree.
assert_eq "unset session: no marker created in target worktree" "0" \
  "$([ -f "$UNSET_WT/tmp/dispatch-worktree" ] && echo 1 || echo 0)"
lock_teardown

# ----- Headless-holder sentinel reclaim (#1068) ------------------------------
# A synthetic `headless:<token>` holder never appears in `claude agents --json`,
# so resolve_holder_state resolves its liveness through the PID sentinel the tick
# writes alongside the lock file: live iff the sentinel exists AND its PID is
# alive. These tests drive the real dispatch-acquire-lock against a lock file
# recording a headless holder, with a different caller sessionId. No
# CLAUDE_AGENTS_CMD fake is needed — the headless branch returns before the
# daemon query. Sentinel path: <dirname $DISPATCH_LOCK_FILE>/dispatch-tick-<slug>.live
# (slug for a simple token like `tok123` is unchanged).

# --- Headless A: live PID in the sentinel → caller stays busy (no reclaim) ----
echo "Test: headless holder with a live-PID sentinel is busy (not reclaimed)"
lock_setup
printf '%s\n' "headless:tok123" > "$DISPATCH_LOCK_FILE"
headless_sentinel=$(source "$SCRIPT_DIR/lib.sh" 2>/dev/null; headless_sentinel_path "headless:tok123" "$DISPATCH_LOCK_FILE")
printf '%s\n' "$$" > "$headless_sentinel"   # this test process is alive
export CLAUDE_CODE_SESSION_ID="sess-headless-A"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "headless-live exits 0" "0" "$rc"
assert_eq "headless-live prints busy" "busy" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "headless-live lock file still holds the headless holder" \
  "headless:tok123" "$lock_contents"
rm -f "$headless_sentinel"
lock_teardown

# --- Headless B: no sentinel → caller reclaims (acquired) ---------------------
echo "Test: headless holder with no sentinel is reclaimed (acquired)"
lock_setup
printf '%s\n' "headless:tok123" > "$DISPATCH_LOCK_FILE"
# No sentinel file written → the headless holder reads dead.
export CLAUDE_CODE_SESSION_ID="sess-headless-B"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "headless-absent exits 0" "0" "$rc"
assert_eq "headless-absent prints acquired" "acquired" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "headless-absent lock file rewritten to caller" \
  "sess-headless-B" "$lock_contents"
lock_teardown

# --- Headless C: dead PID in the sentinel → caller reclaims (stale-after-kill) -
echo "Test: headless holder with a dead-PID sentinel is reclaimed (acquired)"
lock_setup
printf '%s\n' "headless:tok123" > "$DISPATCH_LOCK_FILE"
headless_sentinel=$(source "$SCRIPT_DIR/lib.sh" 2>/dev/null; headless_sentinel_path "headless:tok123" "$DISPATCH_LOCK_FILE")
# A PID that is not running — a SIGKILL'd tick leaves this stale sentinel.
printf '%s\n' "2147483647" > "$headless_sentinel"
export CLAUDE_CODE_SESSION_ID="sess-headless-C"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "headless-dead exits 0" "0" "$rc"
assert_eq "headless-dead prints acquired" "acquired" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "headless-dead lock file rewritten to caller" \
  "sess-headless-C" "$lock_contents"
rm -f "$headless_sentinel"
lock_teardown

# <<< END MOVED <<<

report_results
