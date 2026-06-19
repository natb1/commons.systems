#!/usr/bin/env bash
# Self-contained unit test for dispatch-emit-outcome's validator logic (#1902).
#
# Verifies that _require_pos_int (regex ^[1-9][0-9]*$) rejects 0 and
# leading-zero forms for --issue and --pr, while _require_nonneg_int still
# accepts 0 for the five count fields (findings-surfaced, findings-actionable,
# fixes-applied, followups-filed, subagents-launched).
#
# Usage: bash test-emit-outcome.sh
# Exit 0 = all passed; non-zero = one or more failures.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# --- test helpers -----------------------------------------------------------

PASS=0
FAIL=0
TOTAL=0

assert_eq() {
  local label="$1" expected="$2" actual="$3"
  TOTAL=$((TOTAL + 1))
  if [[ "$expected" == "$actual" ]]; then
    PASS=$((PASS + 1))
    echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $label"
    echo "    expected: '$expected'"
    echo "    actual:   '$actual'"
  fi
}

report_results() {
  echo ""
  echo "================================"
  echo "Results: $PASS/$TOTAL passed, $FAIL failed"
  echo "================================"
}

# --- helper -----------------------------------------------------------------

# run_emit: runs dispatch-emit-outcome with a baseline valid argument set and
# any extra flags appended via "$@". Echoes only the exit code; discards
# stdout/stderr. The "; echo $?" idiom captures the exit code without letting
# a non-zero exit abort this script (which runs under set -e).
#
# The baseline seeds every count field with a non-zero value (1) so that a test
# overriding one of them with 0 (via a later "$@" flag, which wins) genuinely
# exercises _require_nonneg_int's acceptance of 0 — rather than the override
# being indistinguishable from the baseline.
run_emit() {  # echoes the exit code; discards stdout/stderr
  "$SCRIPT_DIR/dispatch-emit-outcome" \
    --phase review --repo natb1/commons.systems \
    --findings-surfaced 1 --findings-actionable 1 --fixes-applied 1 \
    --followups-filed 1 --subagents-launched 1 --disposition completed \
    "$@" >/dev/null 2>&1; echo $?
}

# --- assertions -------------------------------------------------------------

echo "Testing dispatch-emit-outcome validator (#1902)..."
echo ""
echo "--- _require_pos_int on --issue and --pr ---"

assert_eq "issue 0 rejected"              2 "$(run_emit --issue 0)"
assert_eq "pr 0 rejected"                 2 "$(run_emit --issue 1 --pr 0)"
assert_eq "issue 1 accepted"              0 "$(run_emit --issue 1)"
assert_eq "issue 1 pr 1 accepted"         0 "$(run_emit --issue 1 --pr 1)"
assert_eq "issue 01 (leading zero) rejected" 2 "$(run_emit --issue 01)"
assert_eq "pr 01 (leading zero) rejected" 2 "$(run_emit --issue 1 --pr 01)"

echo ""
echo "--- _require_nonneg_int count fields still accept 0 ---"

# The baseline seeds --findings-surfaced 1; appending --findings-surfaced 0
# overrides it (last flag wins), so a pass here proves _require_nonneg_int
# accepts 0 independently of the baseline value.
assert_eq "count field 0 accepted"        0 "$(run_emit --issue 1 --findings-surfaced 0)"

report_results
exit $FAIL
