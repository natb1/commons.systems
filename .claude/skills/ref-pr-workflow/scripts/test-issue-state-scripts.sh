#!/usr/bin/env bash
# Test suite for issue-state-read and issue-state-write scripts.
# Usage: FIRESTORE_EMULATOR_HOST=localhost:8080 ./test-issue-state-scripts.sh
# Requires: Firestore emulator running, npx tsx available
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
READ_SCRIPT="$SCRIPT_DIR/issue-state-read"
WRITE_SCRIPT="$SCRIPT_DIR/issue-state-write"

PASS=0
FAIL=0
TOTAL=0

# Verify emulator is running
if [ -z "${FIRESTORE_EMULATOR_HOST:-}" ]; then
  echo "error: FIRESTORE_EMULATOR_HOST must be set (e.g. localhost:8080)" >&2
  exit 1
fi

if ! curl -sf "http://${FIRESTORE_EMULATOR_HOST}/" > /dev/null 2>&1; then
  echo "error: Firestore emulator not reachable at ${FIRESTORE_EMULATOR_HOST}" >&2
  echo "Start it with: npx firebase emulators:start --only firestore" >&2
  exit 1
fi

assert_eq() {
  local label="$1" expected="$2" actual="$3"
  TOTAL=$((TOTAL + 1))
  if [ "$expected" = "$actual" ]; then
    PASS=$((PASS + 1))
    echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $label"
    echo "    expected: $expected"
    echo "    actual:   $actual"
  fi
}

assert_contains() {
  local label="$1" needle="$2" haystack="$3"
  TOTAL=$((TOTAL + 1))
  if echo "$haystack" | grep -qF -- "$needle"; then
    PASS=$((PASS + 1))
    echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $label"
    echo "    expected to contain: $needle"
    echo "    actual: $haystack"
  fi
}

# Use unique issue numbers per test to avoid interference (90000+ range)
ISSUE_BASE=90000

echo "Test 1: read non-existent issue state"
exit_code=0
stderr=$("$READ_SCRIPT" $((ISSUE_BASE + 1)) 2>&1 >/dev/null) || exit_code=$?
assert_eq "exits 1 on missing state" "1" "$exit_code"
assert_contains "error mentions no state" "no state found" "$stderr"

echo "Test 2: write then read round-trip"
STATE='{"version":1,"step":6,"step_label":"Acceptance Test Loop","phase":"verify"}'
exit_code=0
"$WRITE_SCRIPT" $((ISSUE_BASE + 2)) "$STATE" 2>&1 || exit_code=$?
assert_eq "write exits 0" "0" "$exit_code"
exit_code=0
output=$("$READ_SCRIPT" $((ISSUE_BASE + 2))) || exit_code=$?
assert_eq "read exits 0" "0" "$exit_code"
step=$(echo "$output" | jq -r '.step')
assert_eq "reads step correctly" "6" "$step"
phase=$(echo "$output" | jq -r '.phase')
assert_eq "reads phase correctly" "verify" "$phase"

echo "Test 3: write invalid JSON"
exit_code=0
stderr=$("$WRITE_SCRIPT" $((ISSUE_BASE + 3)) '{not json}' 2>&1 >/dev/null) || exit_code=$?
assert_eq "exits 1 on invalid JSON" "1" "$exit_code"

echo "Test 4: invalid issue number"
exit_code=0
stderr=$("$READ_SCRIPT" 0 2>&1 >/dev/null) || exit_code=$?
assert_eq "read exits 1 on zero" "1" "$exit_code"
assert_contains "error mentions positive integer" "positive integer" "$stderr"
exit_code=0
stderr=$("$WRITE_SCRIPT" abc '{"version":1}' 2>&1 >/dev/null) || exit_code=$?
assert_eq "write exits 1 on non-numeric" "1" "$exit_code"

echo "Test 5: write is idempotent"
STATE='{"version":1,"step":4,"phase":"unit"}'
"$WRITE_SCRIPT" $((ISSUE_BASE + 5)) "$STATE" 2>/dev/null
output1=$("$READ_SCRIPT" $((ISSUE_BASE + 5)))
"$WRITE_SCRIPT" $((ISSUE_BASE + 5)) "$STATE" 2>/dev/null
output2=$("$READ_SCRIPT" $((ISSUE_BASE + 5)))
assert_eq "idempotent: same output after two writes" "$output1" "$output2"

echo "Test 6: write overwrites previous state"
"$WRITE_SCRIPT" $((ISSUE_BASE + 6)) '{"version":1,"step":3,"phase":"core"}' 2>/dev/null
"$WRITE_SCRIPT" $((ISSUE_BASE + 6)) '{"version":1,"step":9,"phase":"review"}' 2>/dev/null
output=$("$READ_SCRIPT" $((ISSUE_BASE + 6)))
step=$(echo "$output" | jq -r '.step')
assert_eq "overwrite: reads latest step" "9" "$step"
phase=$(echo "$output" | jq -r '.phase')
assert_eq "overwrite: reads latest phase" "review" "$phase"

echo "Test 7: write reads from stdin"
exit_code=0
echo '{"version":1,"step":5,"phase":"core"}' | "$WRITE_SCRIPT" $((ISSUE_BASE + 7)) 2>&1 || exit_code=$?
assert_eq "stdin write exits 0" "0" "$exit_code"
output=$("$READ_SCRIPT" $((ISSUE_BASE + 7)))
step=$(echo "$output" | jq -r '.step')
assert_eq "stdin: reads step correctly" "5" "$step"

echo "Test 8: complex state with arrays and nested fields"
STATE='{"version":1,"step":8,"step_label":"QA Review Loop","phase":"qa","active_skills":["ref-memory-management","ref-pr-workflow","ref-qa"],"wiggum_step":2,"wiggum_step_label":"Evaluate"}'
"$WRITE_SCRIPT" $((ISSUE_BASE + 8)) "$STATE" 2>/dev/null
output=$("$READ_SCRIPT" $((ISSUE_BASE + 8)))
skills=$(echo "$output" | jq -r '.active_skills | length')
assert_eq "complex: array has 3 elements" "3" "$skills"
wiggum=$(echo "$output" | jq -r '.wiggum_step')
assert_eq "complex: wiggum_step preserved" "2" "$wiggum"

echo ""
echo "================================"
echo "Results: $PASS/$TOTAL passed, $FAIL failed"
echo "================================"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
