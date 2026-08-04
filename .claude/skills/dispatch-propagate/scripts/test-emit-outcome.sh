#!/usr/bin/env bash
# Tests for dispatch-emit-outcome. Two suites share the sourced helpers from
# test-helpers.sh (assert_eq, assert_contains, report_results, PASS/FAIL/TOTAL):
#   1. the terminated_reason cross-validation contract (#1907)
#   2. the integer validators _require_pos_int / _require_nonneg_int (#1902)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
source "$SCRIPT_DIR/test-helpers.sh"
SUT="$SCRIPT_DIR/dispatch-emit-outcome"

# ============================================================================
# Suite 1: terminated_reason cross-validation contract (#1907)
# ============================================================================

COMMON=(--phase review --repo natb1/commons.systems --issue 1907
  --findings-surfaced 0 --findings-actionable 0 --fixes-applied 0
  --followups-filed 0 --subagents-launched 0)

# Run the SUT, capturing stdout+stderr in OUT and exit code in RC.
RC=0
OUT=""
run_sut() {
  set +e
  OUT=$("$SUT" "${COMMON[@]}" "$@" 2>&1)
  RC=$?
  set -e
}

# --- Case 1: the fix — completed + empty reason → exit 2 ---
echo "Case 1: completed + empty reason -> exit 2"
run_sut --disposition completed --terminated-reason ''
assert_eq "AC1: exit code is 2" "2" "$RC"
assert_contains "AC1: message mentions must not be provided" "must not be provided" "$OUT"

# --- Case 2: preserved — escalated + empty reason → exit 2 ---
echo "Case 2: escalated + empty reason -> exit 2"
run_sut --disposition escalated --terminated-reason ''
assert_eq "AC2: exit code is 2" "2" "$RC"
assert_contains "AC2: message mentions is required when" "is required when" "$OUT"

# --- Case 3: no regression — escalated + non-empty reason → exit 0, reason serialized ---
echo "Case 3: escalated + non-empty reason -> exit 0, reason in JSON"
run_sut --disposition escalated --terminated-reason 'some reason'
assert_eq "AC3: exit code is 0" "0" "$RC"
REASON=$(printf '%s\n' "$OUT" | sed -n '/^```json$/,/^```$/p' | sed '1d;$d' | jq -r '.terminated_reason')
assert_eq "AC3: terminated_reason serialized" "some reason" "$REASON"

# --- Case 4: regression — completed, no --terminated-reason → exit 0, null in JSON ---
echo "Case 4: completed + reason omitted -> exit 0, terminated_reason null"
run_sut --disposition completed
assert_eq "REGRESSION: exit code is 0" "0" "$RC"
NULLVAL=$(printf '%s\n' "$OUT" | sed -n '/^```json$/,/^```$/p' | sed '1d;$d' | jq -r '.terminated_reason')
assert_eq "REGRESSION: terminated_reason null" "null" "$NULLVAL"

# ============================================================================
# Suite 2: integer validators _require_pos_int / _require_nonneg_int (#1902)
#
# Verifies that _require_pos_int (regex ^[1-9][0-9]*$) rejects 0 and
# leading-zero forms for --issue and --pr, while _require_nonneg_int still
# accepts 0 for the five count fields (findings-surfaced, findings-actionable,
# fixes-applied, followups-filed, subagents-launched).
# ============================================================================

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

echo ""
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

# ============================================================================
# Suite 3: enum validation — bash-array _in_set (#1903)
#
# Verifies that:
#   a) every current enum value still validates (exit 0)
#   b) unknown values are rejected (exit 2) with the full set listed in stderr
#   c) multi-word elements match correctly via the quoted-"$@" spread form
# ============================================================================

echo ""
echo "Testing dispatch-emit-outcome enum validation (#1903)..."
echo ""
echo "--- every valid phase exits 0 ---"

# run_sut / COMMON / RC / OUT are defined above (Suite 1) and reused here.

run_sut --disposition completed --phase review
assert_eq "phase review exits 0" "0" "$RC"

run_sut --disposition completed --phase qa
assert_eq "phase qa exits 0" "0" "$RC"

echo ""
echo "--- every valid disposition exits 0 ---"

run_sut --phase review --disposition completed
assert_eq "disposition completed exits 0" "0" "$RC"

run_sut --phase review --disposition completed_with_fixes
assert_eq "disposition completed_with_fixes exits 0" "0" "$RC"

run_sut --phase review --disposition escalated --terminated-reason 'some reason'
assert_eq "disposition escalated exits 0" "0" "$RC"

echo ""
echo "--- unknown phase rejected with full set listed ---"

run_sut --disposition completed --phase bogus
assert_eq "unknown phase exits 2" "2" "$RC"
assert_contains "unknown phase stderr lists review qa" "review qa" "$OUT"

echo ""
echo "--- unknown disposition rejected with full set listed ---"

run_sut --phase review --disposition bogus
assert_eq "unknown disposition exits 2" "2" "$RC"
assert_contains "unknown disposition stderr lists all values" "completed completed_with_fixes escalated" "$OUT"

echo ""
echo "--- multi-word match guarantee (_in_set mirrors SUT) ---"

# Define a local array with a multi-word element.
_test_arr=("completed with fixes" "escalated")
# Local copy of _in_set identical to the SUT's — mirrors the SUT's idiom.
_in_set_local() {
  local val="$1"; shift
  local item
  for item in "$@"; do
    [[ "$item" == "$val" ]] && return 0
  done
  return 1
}
_in_set_local "completed with fixes" "${_test_arr[@]}" \
  && assert_eq "multi-word element matches" "0" "0" \
  || assert_eq "multi-word element matches" "0" "1"
_in_set_local "completed" "${_test_arr[@]}" \
  && assert_eq "partial word does not match multi-word element" "1" "0" \
  || assert_eq "partial word does not match multi-word element" "1" "1"

# ============================================================================
# Suite 4: --node-id node-lane parity (tactic-outcome-envelope-node-lane-parity)
#
# Verifies the --issue / --node-id exactly-one-of contract: --node-id is the
# graph-native lane's alternative to --issue, mirroring the session sidecar's
# dual issue/node_id nullable shape (dispatch-stamp-session:15-19).
# ============================================================================

echo ""
echo "Testing dispatch-emit-outcome --node-id node-lane parity..."
echo ""

# COMMON_NO_ISSUE mirrors COMMON but omits --issue, so the node-id tests
# below can supply --issue / --node-id themselves.
COMMON_NO_ISSUE=(--phase review --repo natb1/commons.systems
  --findings-surfaced 0 --findings-actionable 0 --fixes-applied 0
  --followups-filed 0 --subagents-launched 0 --disposition completed)

run_sut_no_issue() {
  set +e
  OUT=$("$SUT" "${COMMON_NO_ISSUE[@]}" "$@" 2>&1)
  RC=$?
  set -e
}

echo "--- (a) --node-id tactic-foo, no --issue ---"
run_sut_no_issue --node-id tactic-foo
assert_eq "node-id only: exit 0" "0" "$RC"
ISSUE_VAL=$(printf '%s\n' "$OUT" | sed -n '/^```json$/,/^```$/p' | sed '1d;$d' | jq -r '.issue')
NODE_ID_VAL=$(printf '%s\n' "$OUT" | sed -n '/^```json$/,/^```$/p' | sed '1d;$d' | jq -r '.node_id')
assert_eq "node-id only: issue is null" "null" "$ISSUE_VAL"
assert_eq "node-id only: node_id serialized" "tactic-foo" "$NODE_ID_VAL"

echo "--- (b) --issue 42, no --node-id ---"
run_sut_no_issue --issue 42
assert_eq "issue only: exit 0" "0" "$RC"
ISSUE_VAL=$(printf '%s\n' "$OUT" | sed -n '/^```json$/,/^```$/p' | sed '1d;$d' | jq -r '.issue')
NODE_ID_VAL=$(printf '%s\n' "$OUT" | sed -n '/^```json$/,/^```$/p' | sed '1d;$d' | jq -r '.node_id')
assert_eq "issue only: issue serialized" "42" "$ISSUE_VAL"
assert_eq "issue only: node_id is null" "null" "$NODE_ID_VAL"

echo "--- (c) neither --issue nor --node-id ---"
run_sut_no_issue
assert_eq "neither given: exit 2" "2" "$RC"
assert_contains "neither given: message mentions exactly one" "exactly one of" "$OUT"

echo "--- (d) both --issue and --node-id ---"
run_sut_no_issue --issue 42 --node-id tactic-foo
assert_eq "both given: exit 2" "2" "$RC"
assert_contains "both given: message mentions exactly one" "exactly one of" "$OUT"

echo "--- (e) numeric --node-id rejected (slug reject) ---"
run_sut_no_issue --node-id 42
assert_eq "numeric node-id: exit 2" "2" "$RC"
assert_contains "numeric node-id: message mentions node-id slug" "node-id slug" "$OUT"

report_results
