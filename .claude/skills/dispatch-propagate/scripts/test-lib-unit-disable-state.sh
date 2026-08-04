#!/usr/bin/env bash
# Tests for lib-unit-disable-state.sh — the tri-state
# (disabled/not-disabled/unknown) instrument read of a per-unit manual-disable
# sentinel, plus its sentinel-path helper.
#
# Every case points DISPATCH_UNIT_DISABLE_DIR at a scratch mktemp -d sandbox
# so the suite never touches the real
# ~/.local/share/commons-dispatch/disabled.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# shellcheck source=/dev/null
source "$SCRIPT_DIR/lib-unit-disable-state.sh"

echo "=== lib-unit-disable-state.sh ==="

UDS_DIR=""

uds_setup() {
  UDS_DIR=$(mktemp -d)
}

uds_teardown() {
  # Restore search permission before rm -rf: an unsearchable dir would make
  # the recursive removal itself unpredictable.
  [[ -n "$UDS_DIR" ]] && chmod -R u+rwx "$UDS_DIR" 2>/dev/null || true
  rm -rf "$UDS_DIR"
  UDS_DIR=""
  unset DISPATCH_UNIT_DISABLE_DIR || true
}

# --- Test 1: marker present ---------------------------------------------------

echo "Test: marker present reports disabled"
uds_setup
mkdir -p "$UDS_DIR/state"
: > "$UDS_DIR/state/dispatch-fleet-watch.timer"
DISPATCH_UNIT_DISABLE_DIR="$UDS_DIR/state"
assert_eq "present: reports disabled" "disabled" \
  "$(dispatch_unit_disable_state dispatch-fleet-watch.timer)"
assert_eq "present: always returns 0" "0" \
  "$(dispatch_unit_disable_state dispatch-fleet-watch.timer >/dev/null; echo $?)"
uds_teardown

# --- Test 2: dir present, marker absent ---------------------------------------

echo "Test: state dir present but marker absent reports not-disabled"
uds_setup
mkdir -p "$UDS_DIR/state"
DISPATCH_UNIT_DISABLE_DIR="$UDS_DIR/state"
assert_eq "dir-only: reports not-disabled" "not-disabled" \
  "$(dispatch_unit_disable_state dispatch-fleet-watch.timer)"
uds_teardown

# --- Test 3: state dir absent entirely ----------------------------------------

echo "Test: state dir absent entirely reports not-disabled"
uds_setup
DISPATCH_UNIT_DISABLE_DIR="$UDS_DIR/no-such-dir"
assert_eq "no-dir: reports not-disabled" "not-disabled" \
  "$(dispatch_unit_disable_state dispatch-fleet-watch.timer)"
uds_teardown

# --- Test 4: state dir present but unsearchable (mode 000) -------------------
# chmod 000 does not deny root, so root would see this case as searchable
# (spuriously observing disabled/not-disabled instead of unknown). Skip-but-
# count as PASS in that case, matching how other suites in this directory
# handle root-invariant permission tests.

echo "Test: state dir present but unsearchable reports unknown"
if [[ "$(id -u)" == "0" ]]; then
  echo "  (running as root — mode bits do not deny search; skipping, counted as pass)"
  TOTAL=$((TOTAL + 1))
  PASS=$((PASS + 1))
else
  uds_setup
  mkdir -p "$UDS_DIR/state"
  : > "$UDS_DIR/state/dispatch-fleet-watch.timer"
  chmod 000 "$UDS_DIR/state"
  DISPATCH_UNIT_DISABLE_DIR="$UDS_DIR/state"
  assert_eq "unsearchable: reports unknown" "unknown" \
    "$(dispatch_unit_disable_state dispatch-fleet-watch.timer)"
  uds_teardown
fi

# --- Test 5: marker for a DIFFERENT unit present ------------------------------

echo "Test: marker for a different unit does not affect the target unit"
uds_setup
mkdir -p "$UDS_DIR/state"
: > "$UDS_DIR/state/dispatch-heal.timer"
DISPATCH_UNIT_DISABLE_DIR="$UDS_DIR/state"
assert_eq "per-unit granularity: target unit reports not-disabled" "not-disabled" \
  "$(dispatch_unit_disable_state dispatch-fleet-watch.timer)"
uds_teardown

# --- Test 6: invalid argument --------------------------------------------------

echo "Test: invalid unit arguments report unknown"
uds_setup
mkdir -p "$UDS_DIR/state"
DISPATCH_UNIT_DISABLE_DIR="$UDS_DIR/state"
assert_eq "empty argument: reports unknown" "unknown" \
  "$(dispatch_unit_disable_state "" 2>/dev/null)"
assert_eq "slash-bearing argument: reports unknown" "unknown" \
  "$(dispatch_unit_disable_state "a/b" 2>/dev/null)"
assert_eq "dotdot argument: reports unknown" "unknown" \
  "$(dispatch_unit_disable_state ".." 2>/dev/null)"
uds_teardown

# --- Test 7: sentinel path helper ---------------------------------------------

echo "Test: dispatch_unit_disable_sentinel_path prints the expected path"
uds_setup
DISPATCH_UNIT_DISABLE_DIR="$UDS_DIR/state"
assert_eq "sentinel path: dir/unit" "$UDS_DIR/state/dispatch-heal.timer" \
  "$(dispatch_unit_disable_sentinel_path dispatch-heal.timer)"
uds_teardown

report_results
