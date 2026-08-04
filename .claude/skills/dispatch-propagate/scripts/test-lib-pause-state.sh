#!/usr/bin/env bash
# Tests for lib-pause-state.sh — the tri-state (paused/not-paused/unknown)
# instrument read of dispatch's pause sentinel, shared by every out-of-band
# caller that reports pause state without itself gating scheduling.
#
# Every case points DISPATCH_PAUSE_FLAG at a scratch mktemp -d sandbox so the
# suite never touches the real ~/.local/share/commons-dispatch/paused.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# shellcheck source=/dev/null
source "$SCRIPT_DIR/lib-pause-state.sh"

echo "=== lib-pause-state.sh ==="

PS_DIR=""

ps_setup() {
  PS_DIR=$(mktemp -d)
}

ps_teardown() {
  # Restore search permission before rm -rf: an unsearchable dir would make
  # the recursive removal itself unpredictable.
  [[ -n "$PS_DIR" ]] && chmod -R u+rwx "$PS_DIR" 2>/dev/null || true
  rm -rf "$PS_DIR"
  PS_DIR=""
  unset DISPATCH_PAUSE_FLAG || true
}

# --- Test 1: sentinel present -------------------------------------------------

echo "Test: sentinel file present reports paused"
ps_setup
mkdir -p "$PS_DIR/state"
: > "$PS_DIR/state/paused"
DISPATCH_PAUSE_FLAG="$PS_DIR/state/paused"
assert_eq "present: reports paused" "paused" "$(dispatch_pause_state)"
assert_eq "present: always returns 0" "0" "$(dispatch_pause_state >/dev/null; echo $?)"
ps_teardown

# --- Test 2: state dir present, sentinel absent -------------------------------

echo "Test: state dir present but sentinel absent reports not-paused"
ps_setup
mkdir -p "$PS_DIR/state"
DISPATCH_PAUSE_FLAG="$PS_DIR/state/paused"
assert_eq "dir-only: reports not-paused" "not-paused" "$(dispatch_pause_state)"
ps_teardown

# --- Test 3: state dir absent entirely ----------------------------------------

echo "Test: state dir absent entirely reports not-paused"
ps_setup
DISPATCH_PAUSE_FLAG="$PS_DIR/no-such-dir/paused"
assert_eq "no-dir: reports not-paused" "not-paused" "$(dispatch_pause_state)"
ps_teardown

# --- Test 4: state dir present but unsearchable (mode 000) -------------------
# chmod 000 does not deny root, so root would see this case as searchable
# (spuriously observing paused/not-paused instead of unknown). Skip-but-count
# as PASS in that case, matching how other suites in this directory handle
# root-invariant permission tests.

echo "Test: state dir present but unsearchable reports unknown"
if [[ "$(id -u)" == "0" ]]; then
  echo "  (running as root — mode bits do not deny search; skipping, counted as pass)"
  TOTAL=$((TOTAL + 1))
  PASS=$((PASS + 1))
else
  ps_setup
  mkdir -p "$PS_DIR/state"
  : > "$PS_DIR/state/paused"
  chmod 000 "$PS_DIR/state"
  DISPATCH_PAUSE_FLAG="$PS_DIR/state/paused"
  assert_eq "unsearchable: reports unknown" "unknown" "$(dispatch_pause_state)"
  ps_teardown
fi

report_results
