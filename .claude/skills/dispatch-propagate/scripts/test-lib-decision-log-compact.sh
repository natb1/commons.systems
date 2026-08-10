#!/usr/bin/env bash
# Tests for lib-decision-log.sh's compact-output guarantee
# (tactic-decision-log-append-noncompact-corruption): decision_log_append must
# write single-line, valid-JSON output on disk regardless of whether the
# caller handed it pretty-printed (`jq -n`) or already-compact (`jq -nc`)
# JSON, and must silently drop non-JSON input rather than corrupt the log.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# lib-decision-log.sh resolves DECISION_LOG_FILE ONCE, at source time, inside
# its load guard — so a per-test DISPATCH_DECISION_LOG_DIR set after sourcing
# would not be read. Set DISPATCH_DECISION_LOG_DIR before sourcing (for
# documentation/parity), and after sourcing also re-point the already-resolved
# DECISION_LOG_FILE at the same scratch path per test.
DLC_DIR=$(mktemp -d)
export DISPATCH_DECISION_LOG_DIR="$DLC_DIR/decisions"

# shellcheck source=/dev/null
source "$SCRIPT_DIR/lib-decision-log.sh"

echo "=== lib-decision-log.sh compact-output guarantee ==="

DLC_RC=0

dlc_setup() {
  rm -rf "$DISPATCH_DECISION_LOG_DIR"
  mkdir -p "$DISPATCH_DECISION_LOG_DIR"
  DECISION_LOG_FILE="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"
}

dlc_line_count() {
  [[ -f "$DECISION_LOG_FILE" ]] || { printf '0'; return; }
  wc -l < "$DECISION_LOG_FILE" | tr -d ' '
}

# --- Test 1: pretty-printed JSON collapses to one physical line --------------

echo "Test: appending pretty-printed JSON (jq -n, no -c) writes exactly one physical line"
dlc_setup
PRETTY_JSON=$(jq -n '{site: "test", disposition: "parked", node: "tactic-x", nested: {a: 1, b: [1,2,3]}}')
# Sanity-check the input really is multi-line, or the test proves nothing.
PRETTY_LINE_COUNT=$(printf '%s' "$PRETTY_JSON" | wc -l | tr -d ' ')
assert_eq "pretty: fixture input itself is multi-line" "yes" \
  "$([[ "$PRETTY_LINE_COUNT" -gt 1 ]] && printf 'yes' || printf 'no')"
if decision_log_append "$PRETTY_JSON"; then DLC_RC=0; else DLC_RC=$?; fi
assert_eq "pretty: decision_log_append returns 0" "0" "$DLC_RC"
assert_eq "pretty: log file has exactly one physical line" "1" "$(dlc_line_count)"
assert_eq "pretty: the line round-trips through jq to the same data" \
  "$(printf '%s' "$PRETTY_JSON" | jq -c -S .)" \
  "$(jq -c -S . < "$DECISION_LOG_FILE" | head -n1)"

# --- Test 2: already-compact JSON stays one line, no double-processing bug --

echo "Test: appending already-compact JSON still writes exactly one line with the same data"
dlc_setup
COMPACT_JSON=$(jq -nc '{site: "test", disposition: "observed", node: "tactic-y", nested: {a: 2, b: [4,5]}}')
if decision_log_append "$COMPACT_JSON"; then DLC_RC=0; else DLC_RC=$?; fi
assert_eq "compact: decision_log_append returns 0" "0" "$DLC_RC"
assert_eq "compact: log file has exactly one physical line" "1" "$(dlc_line_count)"
assert_eq "compact: the line round-trips through jq to the same data" \
  "$(printf '%s' "$COMPACT_JSON" | jq -c -S .)" \
  "$(jq -c -S . < "$DECISION_LOG_FILE" | head -n1)"

# --- Test 3: invalid/non-JSON input does not corrupt the log -----------------

echo "Test: appending invalid non-JSON input does not corrupt the log file"
dlc_setup
if decision_log_append "this is not json {{{"; then DLC_RC=0; else DLC_RC=$?; fi
assert_eq "invalid: decision_log_append still returns 0" "0" "$DLC_RC"
if [[ -f "$DECISION_LOG_FILE" ]]; then
  assert_eq "invalid: log file has no lines appended" "0" "$(dlc_line_count)"
else
  assert_eq "invalid: log file was never created" "yes" "yes"
fi

# --- Test 3a: empty / whitespace-only / no-argument input appends nothing ----
#
# `jq -c .` on empty input exits 0 and emits nothing, so an unguarded `&&`
# chain would append a bare newline — a blank, non-JSON line that blinds
# `tail -n 1` readers (dispatch-fleet-watch reports "decision log is empty").

echo "Test: empty, whitespace-only, and no-argument calls append no line at all"
for DLC_EMPTY_LABEL in empty whitespace no-arg; do
  dlc_setup
  case "$DLC_EMPTY_LABEL" in
    empty)      if decision_log_append ""; then DLC_RC=0; else DLC_RC=$?; fi ;;
    whitespace) if decision_log_append "   "; then DLC_RC=0; else DLC_RC=$?; fi ;;
    no-arg)     if decision_log_append; then DLC_RC=0; else DLC_RC=$?; fi ;;
  esac
  assert_eq "$DLC_EMPTY_LABEL: decision_log_append still returns 0" "0" "$DLC_RC"
  assert_eq "$DLC_EMPTY_LABEL: log file has no lines appended" "0" "$(dlc_line_count)"
  # A bare newline is one physical line but zero bytes of JSON — assert on raw
  # size too, so a blank-line append cannot hide behind a line-count of 0.
  DLC_SIZE=0
  [[ -f "$DECISION_LOG_FILE" ]] && DLC_SIZE=$(wc -c < "$DECISION_LOG_FILE" | tr -d ' ')
  assert_eq "$DLC_EMPTY_LABEL: log file has zero bytes" "0" "$DLC_SIZE"
done

# --- Test 3b: a valid append after a rejected invalid append is unaffected ---

echo "Test: a valid append following a rejected invalid append still lands cleanly"
dlc_setup
if decision_log_append "not json at all"; then DLC_RC=0; else DLC_RC=$?; fi
assert_eq "invalid-then-valid: the invalid append returns 0" "0" "$DLC_RC"
VALID_JSON=$(jq -nc '{site: "test", disposition: "cleared", node: "tactic-z"}')
if decision_log_append "$VALID_JSON"; then DLC_RC=0; else DLC_RC=$?; fi
assert_eq "invalid-then-valid: the valid append returns 0" "0" "$DLC_RC"
assert_eq "invalid-then-valid: log file has exactly one physical line" "1" "$(dlc_line_count)"
assert_eq "invalid-then-valid: the surviving line is the valid append" \
  "$(printf '%s' "$VALID_JSON" | jq -c -S .)" \
  "$(jq -c -S . < "$DECISION_LOG_FILE" | head -n1)"

rm -rf "$DLC_DIR"

report_results
