#!/usr/bin/env bash
# Tests for lib-marker-comment-id -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 28968-29051.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch_marker_comment_id: error propagation (#2138)
# ============================================================================
echo ""
echo "=== dispatch_marker_comment_id: error propagation (#2138) ==="

# Criterion 1: gh_retry failure propagates as non-zero (bug regression).
# The old single-pipeline code returned 0 on gh_retry failure; the fix must not.
# The gh_retry override and DISPATCH_PLAN_AUTHOR_ID are scoped to a subshell so
# they do not leak. lib.sh defines gh_retry, so the override must come AFTER the
# source. The exit status is captured in the parent scope where the counters live.
dmci_rc1=0
dmci_out1=$(
  export DISPATCH_PLAN_AUTHOR_ID=12345
  source "$SCRIPT_DIR/lib.sh"
  gh_retry() { return 1; }
  dispatch_marker_comment_id 7 '<!-- dispatch:phase-log -->' 2>/dev/null
) || dmci_rc1=$?
TOTAL=$((TOTAL + 1))
if [[ "$dmci_rc1" -ne 0 ]]; then
  PASS=$((PASS + 1))
  echo "  PASS: dispatch_marker_comment_id returns non-zero when gh_retry fails"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL: dispatch_marker_comment_id returned 0 on gh_retry failure (output='$dmci_out1') — bug not fixed"
fi

# Criterion 2a: success/match-found path — gh_retry returns a single-element JSON
# array whose entry's body starts with the marker and whose user.id equals
# DISPATCH_PLAN_AUTHOR_ID. dispatch_marker_comment_id must return 0 and print the
# comment id. This exercises the jq selector + final printf that all callers
# depend on, which Criteria 1 and 3 never reach.
dmci_rc2a=0
dmci_out2a=$(
  export DISPATCH_PLAN_AUTHOR_ID=12345
  source "$SCRIPT_DIR/lib.sh"
  gh_retry() { printf '[{"id":555,"body":"<!-- dispatch:phase-log --> log","user":{"id":12345}}]'; }
  dispatch_marker_comment_id 7 '<!-- dispatch:phase-log -->'
) || dmci_rc2a=$?
TOTAL=$((TOTAL + 1))
if [[ "$dmci_rc2a" -eq 0 && "$dmci_out2a" == "555" ]]; then
  PASS=$((PASS + 1))
  echo "  PASS: dispatch_marker_comment_id returns 0 and prints the matching comment id"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL: dispatch_marker_comment_id match case: rc=$dmci_rc2a, output='$dmci_out2a' (expected rc=0, output='555')"
fi

# Criterion 2b: jq pipeline failure propagates as non-zero. gh_retry returns 0 but
# emits invalid JSON, so the jq cid= assignment fails and the `|| return 1` guard
# must propagate non-zero. Guards against a future edit dropping that `|| return 1`.
dmci_rc2b=0
dmci_out2b=$(
  export DISPATCH_PLAN_AUTHOR_ID=12345
  source "$SCRIPT_DIR/lib.sh"
  gh_retry() { printf 'not json'; }
  dispatch_marker_comment_id 7 '<!-- dispatch:phase-log -->' 2>/dev/null
) || dmci_rc2b=$?
TOTAL=$((TOTAL + 1))
if [[ "$dmci_rc2b" -ne 0 ]]; then
  PASS=$((PASS + 1))
  echo "  PASS: dispatch_marker_comment_id returns non-zero when jq fails on invalid JSON"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL: dispatch_marker_comment_id returned 0 on jq failure (output='$dmci_out2b') — jq || return 1 guard missing"
fi

# Criterion 3: genuine absent case (valid JSON, no match) returns 0 with empty output.
dmci_rc3=0
dmci_out3=$(
  export DISPATCH_PLAN_AUTHOR_ID=12345
  source "$SCRIPT_DIR/lib.sh"
  gh_retry() { printf '[]'; }
  dispatch_marker_comment_id 7 '<!-- dispatch:phase-log -->'
) || dmci_rc3=$?
TOTAL=$((TOTAL + 1))
if [[ "$dmci_rc3" -eq 0 && -z "$dmci_out3" ]]; then
  PASS=$((PASS + 1))
  echo "  PASS: dispatch_marker_comment_id returns 0 with empty output when no comment matches"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL: dispatch_marker_comment_id absent case: rc=$dmci_rc3, output='$dmci_out3' (expected rc=0, empty output)"
fi

# <<< END MOVED <<<

report_results
