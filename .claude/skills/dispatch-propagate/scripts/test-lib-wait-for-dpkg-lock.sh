#!/usr/bin/env bash
# Tests for lib-wait-for-dpkg-lock -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 4104-4179.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# wait_for_dpkg_lock tests
# ============================================================================
echo ""
echo "=== wait_for_dpkg_lock ==="

# 1. Lock file present but free → rc 0, returns fast (real flock/sleep).
echo "Test: wait_for_dpkg_lock free lock → rc 0"
setup
: > "$TMPDIR_TEST/free.lock"
rc=0
(
  source "$TMPDIR_TEST/lib.sh"
  export DPKG_LOCK_FILE="$TMPDIR_TEST/free.lock"
  export DPKG_LOCK_WAIT_TIMEOUT=5
  wait_for_dpkg_lock
) || rc=$?
[[ "$rc" -eq 0 ]] && rc_state="zero" || rc_state="nonzero"
assert_eq "free lock → rc 0" "zero" "$rc_state"
teardown

# 2. Lock file absent → rc 0 via the -e guard (no wait, no flock needed).
echo "Test: wait_for_dpkg_lock absent lock file → rc 0"
setup
rc=0
(
  source "$TMPDIR_TEST/lib.sh"
  export DPKG_LOCK_FILE="$TMPDIR_TEST/does-not-exist"
  export DPKG_LOCK_WAIT_TIMEOUT=5
  wait_for_dpkg_lock
) || rc=$?
[[ "$rc" -eq 0 ]] && rc_state="zero" || rc_state="nonzero"
assert_eq "absent lock file → rc 0" "zero" "$rc_state"
teardown

# 3. flock unavailable → degrades to no-op, rc 0.
echo "Test: wait_for_dpkg_lock flock unavailable → rc 0, no-op"
setup
: > "$TMPDIR_TEST/present.lock"
mkdir -p "$TMPDIR_TEST/bin-noflock"
rc=0
(
  source "$TMPDIR_TEST/lib.sh"
  export DPKG_LOCK_FILE="$TMPDIR_TEST/present.lock"
  export DPKG_LOCK_WAIT_TIMEOUT=5
  export PATH="$TMPDIR_TEST/bin-noflock"
  wait_for_dpkg_lock
) || rc=$?
[[ "$rc" -eq 0 ]] && rc_state="zero" || rc_state="nonzero"
assert_eq "flock unavailable → rc 0" "zero" "$rc_state"
teardown

# 4. Lock held → bounded real wait, then rc 0 with the "still held" warning.
echo "Test: wait_for_dpkg_lock held lock → bounded wait, rc 0, warns"
setup
: > "$TMPDIR_TEST/held.lock"
flock -x "$TMPDIR_TEST/held.lock" -c 'sleep 2' &
holder_pid=$!
# Give the background holder a moment to actually acquire the lock before probing.
sleep 0.2
rc=0
stderr_out=$(
  (
    source "$TMPDIR_TEST/lib.sh"
    export DPKG_LOCK_FILE="$TMPDIR_TEST/held.lock"
    export DPKG_LOCK_WAIT_TIMEOUT=1
    wait_for_dpkg_lock
  ) 2>&1 1>/dev/null
) || rc=$?
[[ "$rc" -eq 0 ]] && rc_state="zero" || rc_state="nonzero"
assert_eq "held lock → rc 0" "zero" "$rc_state"
assert_eq "held lock → still-held warning emitted" "warned" \
  "$( [[ "$stderr_out" == *"still held after 1s"* ]] && echo warned || echo silent )"
wait "$holder_pid" 2>/dev/null || true
teardown

# <<< END MOVED <<<

report_results
