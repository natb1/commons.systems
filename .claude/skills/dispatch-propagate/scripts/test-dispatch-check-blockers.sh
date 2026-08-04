#!/usr/bin/env bash
# Tests for dispatch-check-blockers -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 18559-18631.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-check-blockers tests
# ============================================================================
echo ""
echo "=== dispatch-check-blockers ==="

# No open blockers (no fixture → stub returns []) → exit 0, no output.
echo "Test: no blockers → exit 0, silent"
setup
stdout=$("$TMPDIR_TEST/dispatch-check-blockers" 100 2>/dev/null) && rc=0 || rc=$?
assert_eq "no blockers → exit 0" "0" "$rc"
assert_eq "no blockers → no output" "" "$stdout"
teardown

# Only closed blockers do not gate → exit 0, no output.
echo "Test: closed-only blockers → exit 0, silent"
setup
printf '[{"number":888,"state":"closed"}]\n' > "$STUB_DIR/blockers-100.json"
stdout=$("$TMPDIR_TEST/dispatch-check-blockers" 100 2>/dev/null) && rc=0 || rc=$?
assert_eq "closed-only blockers → exit 0" "0" "$rc"
assert_eq "closed-only blockers → no output" "" "$stdout"
teardown

# One open blocker → exit 2, prints blocked:<num>.
echo "Test: one open blocker → exit 2, blocked:<num>"
setup
printf '[{"number":999,"state":"open"}]\n' > "$STUB_DIR/blockers-100.json"
stdout=$("$TMPDIR_TEST/dispatch-check-blockers" 100 2>/dev/null) && rc=0 || rc=$?
assert_eq "one open blocker → exit 2" "2" "$rc"
assert_eq "one open blocker → blocked:999" "blocked:999" "$stdout"
teardown

# Multiple open blockers → exit 2, comma-joined numbers; closed ones excluded.
echo "Test: mixed blockers → exit 2, only open numbers"
setup
printf '[{"number":999,"state":"open"},{"number":888,"state":"closed"},{"number":777,"state":"OPEN"}]\n' \
  > "$STUB_DIR/blockers-100.json"
stdout=$("$TMPDIR_TEST/dispatch-check-blockers" 100 2>/dev/null) && rc=0 || rc=$?
assert_eq "mixed blockers → exit 2" "2" "$rc"
assert_eq "mixed blockers → blocked:999,777" "blocked:999,777" "$stdout"
teardown

# Missing arg → usage error on stderr, exit 1.
echo "Test: missing arg → usage error, exit 1"
setup
err_out=$("$TMPDIR_TEST/dispatch-check-blockers" 2>&1 1>/dev/null && echo "EXIT=0" || echo "EXIT=$?")
case "$err_out" in
  *"usage:"*"EXIT=1") status="ok" ;;
  *) status="bad: $err_out" ;;
esac
assert_eq "missing arg → usage error, exit 1" "ok" "$status"
teardown

# Non-numeric arg → usage error, exit 1.
echo "Test: non-numeric arg → usage error, exit 1"
setup
err_out=$("$TMPDIR_TEST/dispatch-check-blockers" abc 2>&1 1>/dev/null && echo "EXIT=0" || echo "EXIT=$?")
case "$err_out" in
  *"usage:"*"EXIT=1") status="ok" ;;
  *) status="bad: $err_out" ;;
esac
assert_eq "non-numeric arg → usage error, exit 1" "ok" "$status"
teardown

# gh failure on the blocked_by lookup → hard error (exit 1), never a false "clear".
echo "Test: gh blocked_by failure → exit 1"
setup
: > "$STUB_DIR/gh-fail-blocked_by-100"
stdout=$("$TMPDIR_TEST/dispatch-check-blockers" 100 2>/dev/null) && rc=0 || rc=$?
assert_eq "gh blocked_by failure → exit 1" "1" "$rc"
assert_eq "gh blocked_by failure → no output" "" "$stdout"
teardown

# <<< END MOVED <<<

report_results
