#!/usr/bin/env bash
# Tests for dispatch-emit-outcome — the terminated_reason cross-validation contract (#1907).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
source "$SCRIPT_DIR/test-helpers.sh"
SUT="$SCRIPT_DIR/dispatch-emit-outcome"

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

report_results
