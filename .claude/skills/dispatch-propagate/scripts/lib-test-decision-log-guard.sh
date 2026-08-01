#!/usr/bin/env bash
# Routing-decision-log leak guard for the dispatch test suites.
#
# lib-decision-log.sh resolves its log path ONCE, at source time, inside its own
# load guard (lib-decision-log.sh:68):
#
#   DECISION_LOG_FILE="${DISPATCH_DECISION_LOG_FILE:-${DISPATCH_DECISION_LOG_DIR:-$HOME/.local/share/commons-dispatch}/routing-decisions.jsonl}"
#
# A suite that sets neither override therefore appends to the developer's REAL
# routing-decision log. This file is sourced by the shared test harnesses
# (dispatch-test-fixture.sh, test-helpers.sh) so every suite inherits both
# halves of the fix:
#
#   1. an unconditional redirect of DISPATCH_DECISION_LOG_DIR into a per-run
#      mktemp -d sandbox (mirroring the DISPATCH_GUARD_BIN_DIR / PATH prior art
#      in dispatch-test-fixture.sh:135-148), and
#   2. dispatch_decision_log_guard_check, an assertion that the redirect is
#      still in force at the end of the run.
#
# The check asserts the SEAM — which env var lib-decision-log.sh would resolve
# from — not the production file's contents. The live dispatch fleet appends to
# that file concurrently, so any before/after content comparison would flake.
# Named lib-* (not test-*) so run-unit-tests.sh's test-*.sh glob does not
# execute it as a suite.
#
# Safe to source multiple times (idempotent load guard). Sourced, not executed.

if [[ -z "${_LIB_TEST_DECISION_LOG_GUARD_LOADED:-}" ]]; then
  _LIB_TEST_DECISION_LOG_GUARD_LOADED=1

  # Capture the production path BEFORE overriding anything — resolved exactly
  # the way lib-decision-log.sh resolves its default.
  DISPATCH_TEST_PROD_DECISION_LOG_DIR="$HOME/.local/share/commons-dispatch"
  DISPATCH_TEST_PROD_DECISION_LOG_FILE="$DISPATCH_TEST_PROD_DECISION_LOG_DIR/routing-decisions.jsonl"

  # Redirect UNCONDITIONALLY. No ${VAR:-...} fallback: a suite that thinks it
  # already pointed the log somewhere safe but got the variable name wrong would
  # otherwise keep writing to production. Kept under its own
  # DISPATCH_TEST_DECISION_LOG_DIR name so per-test teardown has a stable handle
  # to restore the redirect from.
  DISPATCH_TEST_DECISION_LOG_DIR=$(mktemp -d)
  export DISPATCH_DECISION_LOG_DIR="$DISPATCH_TEST_DECISION_LOG_DIR"

  _DISPATCH_DECISION_LOG_GUARD_DONE=0

  # dispatch_decision_log_guard_check — assert the routing-decision log seam
  # still points away from the production log. Counts one assertion; idempotent
  # (later calls are no-ops). Returns non-zero on a leak.
  dispatch_decision_log_guard_check() {
    [[ "$_DISPATCH_DECISION_LOG_GUARD_DONE" == "1" ]] && return 0
    _DISPATCH_DECISION_LOG_GUARD_DONE=1

    local file_override="${DISPATCH_DECISION_LOG_FILE:-}"
    local dir_override="${DISPATCH_DECISION_LOG_DIR:-}"
    # Some suites source lib-decision-log.sh into their own shell and reassign
    # the resolved path directly; that is a legitimate redirect too.
    local resolved="${DECISION_LOG_FILE:-}"

    TOTAL=$((TOTAL + 1))
    if [[ -n "$file_override" && "$file_override" != "$DISPATCH_TEST_PROD_DECISION_LOG_FILE" ]] \
      || [[ -n "$dir_override" && "$dir_override" != "$DISPATCH_TEST_PROD_DECISION_LOG_DIR" ]] \
      || [[ -n "$resolved" && "$resolved" != "$DISPATCH_TEST_PROD_DECISION_LOG_FILE" ]]; then
      PASS=$((PASS + 1))
      echo "  PASS: routing-decision log redirected away from the production log"
      return 0
    fi

    FAIL=$((FAIL + 1))
    echo "  FAIL: routing-decision log redirected away from the production log"
    {
      echo "FAIL: a harness in this suite would write the PRODUCTION routing-decision log."
      echo "  production log: $DISPATCH_TEST_PROD_DECISION_LOG_FILE"
      echo "  DISPATCH_DECISION_LOG_FILE='$file_override'"
      echo "  DISPATCH_DECISION_LOG_DIR='$dir_override'"
      echo "  DECISION_LOG_FILE='$resolved'"
      echo "  Fix: export DISPATCH_DECISION_LOG_DIR into the suite's tmp sandbox,"
      echo "  or source dispatch-test-fixture.sh / test-helpers.sh."
    } >&2
    return 1
  }
fi
