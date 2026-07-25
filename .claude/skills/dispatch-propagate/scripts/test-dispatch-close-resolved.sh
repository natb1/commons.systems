#!/usr/bin/env bash
# Tests for dispatch-close-resolved -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 2181-2280.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-close-resolved tests
# ============================================================================
echo ""
echo "=== dispatch-close-resolved ==="

# dispatch-close-resolved <N> --reason "<text>" (#1456): reads state via
# `gh issue view <N> --json state --jq .state`; if not closed, runs
# `gh_issue_close_rest <N> --reason completed --comment "$REASON"` (#2256;
# REST-backed: POST .../issues/<N>/comments then PATCH .../issues/<N>
# state=closed&state_reason=completed); if already CLOSED,
# skips the close (idempotent, no dup comment). ALWAYS writes the resolved-closed
# sentinel under $CLAUDE_JOB_DIR (atomic), UNLESS CLAUDE_JOB_DIR is unset/not-a-dir
# (then a no-op exit 0). Arg violations → exit 2 before any gh call.
# CRITICAL: any case that exports CLAUDE_JOB_DIR must unset it before the next
# case — the main teardown() does NOT unset it, so a leak would corrupt every
# downstream suite. Case (c) also unsets defensively at the start.

# (a) OPEN issue + JOB_DIR set → closes the issue and writes the sentinel.
echo "Test: close-resolved — OPEN issue + JOB_DIR → close + sentinel"
setup
echo '{"state":"open"}' > "$STUB_DIR/arg-issue-700.json"
export CLAUDE_JOB_DIR="$TMPDIR_TEST/job"
mkdir -p "$CLAUDE_JOB_DIR"
"$TMPDIR_TEST/dispatch-close-resolved" 700 --reason "epic done"
TOTAL=$((TOTAL + 1))
# REST close (#2256): the PATCH carries issues/700 + state=closed + the --reason
# as state_reason=completed; the --comment fires a prior POST .../comments.
if [[ -f "$STUB_DIR/gh-issue-close-rest-calls.log" ]] \
   && grep -q "PATCH" "$STUB_DIR/gh-issue-close-rest-calls.log" \
   && grep -q "issues/700" "$STUB_DIR/gh-issue-close-rest-calls.log" \
   && grep -q "state=closed" "$STUB_DIR/gh-issue-close-rest-calls.log" \
   && grep -q "state_reason=completed" "$STUB_DIR/gh-issue-close-rest-calls.log" \
   && [[ -f "$STUB_DIR/gh-issue-comment-rest-calls.log" ]] \
   && grep -q "issues/700/comments" "$STUB_DIR/gh-issue-comment-rest-calls.log"; then
  PASS=$((PASS + 1)); echo "  PASS: close-resolved OPEN: REST close (PATCH state_reason=completed) + comment invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: close-resolved OPEN: REST close (PATCH state_reason=completed) + comment invoked"
fi
TOTAL=$((TOTAL + 1))
if [[ -f "$CLAUDE_JOB_DIR/resolved-closed" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: close-resolved OPEN: resolved-closed sentinel written"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: close-resolved OPEN: resolved-closed sentinel written"
fi
unset CLAUDE_JOB_DIR
teardown

# (b) already-CLOSED issue + JOB_DIR set → skips the close (no dup comment) but
# still writes the sentinel (re-entry idempotency).
echo "Test: close-resolved — already-CLOSED issue + JOB_DIR → no re-close, sentinel still written"
setup
echo '{"state":"closed"}' > "$STUB_DIR/arg-issue-701.json"
export CLAUDE_JOB_DIR="$TMPDIR_TEST/job"
mkdir -p "$CLAUDE_JOB_DIR"
"$TMPDIR_TEST/dispatch-close-resolved" 701 --reason "epic done"
TOTAL=$((TOTAL + 1))
# REST close (#2256): neither the PATCH close log nor the comment log should exist.
if [[ ! -e "$STUB_DIR/gh-issue-close-rest-calls.log" \
   && ! -e "$STUB_DIR/gh-issue-comment-rest-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: close-resolved CLOSED: REST close NOT invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: close-resolved CLOSED: REST close NOT invoked"
fi
TOTAL=$((TOTAL + 1))
if [[ -f "$CLAUDE_JOB_DIR/resolved-closed" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: close-resolved CLOSED: resolved-closed sentinel still written"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: close-resolved CLOSED: resolved-closed sentinel still written"
fi
unset CLAUDE_JOB_DIR
teardown

# (c) JOB_DIR unset + OPEN issue → still closes, no-ops the sentinel write, exit 0.
echo "Test: close-resolved — JOB_DIR unset + OPEN issue → no sentinel, exit 0"
setup
unset CLAUDE_JOB_DIR
echo '{"state":"open"}' > "$STUB_DIR/arg-issue-702.json"
if "$TMPDIR_TEST/dispatch-close-resolved" 702 --reason "epic done" >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "close-resolved no-JOB_DIR: exit 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
# Assert no resolved-closed sentinel exists ANYWHERE under the tmp tree: the
# $TMPDIR_TEST/job/ dir is never created in this case, so a path-specific check
# trivially passes. A scan catches a regression that writes to a fallback path.
if ! find "$TMPDIR_TEST" -name 'resolved-closed' | grep -q .; then
  PASS=$((PASS + 1)); echo "  PASS: close-resolved no-JOB_DIR: no resolved-closed sentinel"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: close-resolved no-JOB_DIR: no resolved-closed sentinel"
fi
teardown

# (d) Arg validation: no args → exit 2; issue number only (missing --reason) → exit 2.
echo "Test: close-resolved — arg validation → exit 2"
setup
if "$TMPDIR_TEST/dispatch-close-resolved" >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "close-resolved: no args → exit 2" "2" "$rc"
if "$TMPDIR_TEST/dispatch-close-resolved" 703 >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "close-resolved: missing --reason → exit 2" "2" "$rc"
teardown

# <<< END MOVED <<<

report_results
