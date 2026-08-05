#!/usr/bin/env bash
# Shared test helpers for PR workflow test suites.
# Source this file and call report_results at the end of each test suite.

PASS=0
FAIL=0
TOTAL=0

# Routing-decision-log leak guard: redirects DISPATCH_DECISION_LOG_DIR into a
# per-run tmp sandbox at source time and defines
# dispatch_decision_log_guard_check (called from report_results below). Resolve
# this file's own directory — consumers have their own cwd and SCRIPT_DIR.
# shellcheck source=lib-test-decision-log-guard.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib-test-decision-log-guard.sh"

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

assert_exit_nonzero() {
  local label="$1"
  shift
  TOTAL=$((TOTAL + 1))
  if "$@" 2>/dev/null; then
    echo "  FAIL: $label — expected non-zero exit"
    FAIL=$((FAIL + 1))
  else
    echo "  PASS: $label"
    PASS=$((PASS + 1))
  fi
}

assert_file_contains() {
  local label="$1" file="$2" pattern="$3"
  TOTAL=$((TOTAL + 1))
  if grep -qF "$pattern" "$file"; then
    echo "  PASS: $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $label — pattern not found: $pattern"
    echo "    file contents:"
    head -10 "$file" | sed 's/^/      /'
    FAIL=$((FAIL + 1))
  fi
}

assert_file_exists() {
  local label="$1" file="$2"
  TOTAL=$((TOTAL + 1))
  if [[ -f "$file" ]]; then
    echo "  PASS: $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $label — file not found: $file"
    FAIL=$((FAIL + 1))
  fi
}

report_results() {
  # Count the routing-decision-log leak guard as a real assertion of THIS suite,
  # BEFORE the tally, so a leak shows up in the printed counts and in the
  # non-zero exit below. There is no EXIT trap here (consumers install their
  # own), so this is the guard's only call site.
  dispatch_decision_log_guard_check || true
  echo ""
  echo "================================"
  echo "Results: $PASS/$TOTAL passed, $FAIL failed"
  echo "================================"

  # Clean up the guard's scratch dir here rather than from an EXIT trap, matching
  # this file family's per-test `mktemp -d` cleanup convention. An early abort
  # leaves one small empty tmp dir behind; that is acceptable.
  rm -rf "$DISPATCH_TEST_DECISION_LOG_DIR"

  if [ "$FAIL" -gt 0 ]; then
    exit 1
  fi
}
