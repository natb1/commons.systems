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
#      in dispatch-test-fixture.sh:135-148), preceded by clearing the
#      HIGHER-precedence DISPATCH_DECISION_LOG_FILE seam, and
#   2. dispatch_decision_log_guard_check, an assertion that the redirect is
#      still in force at the end of the run.
#
# Clearing DISPATCH_DECISION_LOG_FILE is load-bearing, not hygiene. It outranks
# DISPATCH_DECISION_LOG_DIR in the resolution above, so an ambient value —
# exported by a developer shell, a systemd unit, or a wrapper — would silently
# beat the sandbox DIR and re-enable the exact leak this file exists to stop.
# The guard clears the FILE seam rather than pointing it at the sandbox: suites
# legitimately redirect per-test via DISPATCH_DECISION_LOG_DIR
# (test-dispatch-tick.sh:124, test-dispatch-select-tick.sh:263), and a
# guard-owned FILE would outrank — and break — those.
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

  # Clear the higher-precedence full-path seam FIRST. lib-decision-log.sh:68
  # resolves DISPATCH_DECISION_LOG_FILE before DISPATCH_DECISION_LOG_DIR, so an
  # inherited value would win over the redirect below and the suite would write
  # production anyway. Same unconditional-redirect rationale as the DIR export.
  unset DISPATCH_DECISION_LOG_FILE

  export DISPATCH_DECISION_LOG_DIR="$DISPATCH_TEST_DECISION_LOG_DIR"

  # If lib-decision-log.sh was already sourced before this file, it resolved
  # DECISION_LOG_FILE once inside its own load guard — from the PRE-redirect
  # environment — and re-sourcing will not re-resolve it. Repoint that stale
  # value at the sandbox. Repoint, not unset: decision_log_append dereferences
  # DECISION_LOG_FILE under `set -u`, so unsetting would turn a leak into a
  # crash. Left alone when unset, so the end-of-run check can still distinguish
  # "a suite redirected it" from "nothing redirected anything". Deliberately not
  # exported: children resolve from DISPATCH_DECISION_LOG_DIR, which per-test
  # setups legitimately override.
  if [[ -n "${DECISION_LOG_FILE:-}" ]]; then
    DECISION_LOG_FILE="$DISPATCH_TEST_DECISION_LOG_DIR/routing-decisions.jsonl"
  fi

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

    # What a child process would actually resolve — computed with the SAME
    # precedence as lib-decision-log.sh:68 (FILE beats DIR beats the default
    # state dir), not as three independent OR'd clauses. OR-ing them is
    # unsound: a DISPATCH_DECISION_LOG_FILE aimed at production outranks a
    # sandboxed DISPATCH_DECISION_LOG_DIR, yet the DIR clause alone would
    # report PASS while every write landed in the production log.
    local effective="${DISPATCH_DECISION_LOG_FILE:-${DISPATCH_DECISION_LOG_DIR:-$DISPATCH_TEST_PROD_DECISION_LOG_DIR}/routing-decisions.jsonl}"

    TOTAL=$((TOTAL + 1))

    if [[ "$file_override" == "$DISPATCH_TEST_PROD_DECISION_LOG_FILE" \
      || "$resolved" == "$DISPATCH_TEST_PROD_DECISION_LOG_FILE" ]]; then
      # Fail closed. A seam aimed AT production is a leak no other seam can
      # redeem: DISPATCH_DECISION_LOG_FILE outranks every subprocess redirect,
      # and a DECISION_LOG_FILE holding the production path means this shell's
      # own decision_log_append writes it. Tested first, so neither can be
      # excused by the other seams looking clean.
      :
    elif [[ "$effective" != "$DISPATCH_TEST_PROD_DECISION_LOG_FILE" ]] \
      || [[ -n "$resolved" ]]; then
      # Clean when what a child would resolve points away from production, or —
      # for the same-shell idiom, where a suite reassigns DECISION_LOG_FILE
      # after sourcing lib-decision-log.sh and may unset the env seams — when
      # that in-process path is set and (per the branch above) is not
      # production. An entirely unset environment resolves to production, so
      # "no override anywhere" falls through to FAIL.
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
      echo "  resolves to: $effective"
      echo "  Fix: export DISPATCH_DECISION_LOG_DIR into the suite's tmp sandbox,"
      echo "  or source dispatch-test-fixture.sh / test-helpers.sh."
      echo "  If DISPATCH_DECISION_LOG_FILE is set above, that is the culprit: it"
      echo "  outranks DISPATCH_DECISION_LOG_DIR. Unset it or aim it at the sandbox."
    } >&2
    return 1
  }
fi
