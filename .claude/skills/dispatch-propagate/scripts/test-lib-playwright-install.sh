#!/usr/bin/env bash
# Tests for lib-playwright-install -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 3789-4103.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# playwright_install_with_deps tests
# ============================================================================
echo ""
echo "=== playwright_install_with_deps ==="

# Group-local stub writers (not hoisted into setup() — other groups rely on
# real timeout/sleep for hang protection). Each writes to $TMPDIR_TEST/bin,
# already first on PATH.
write_playwright_npx_stub() {
  cat > "$TMPDIR_TEST/bin/npx" <<'FAKE'
#!/usr/bin/env bash
cf="$NPX_COUNT_FILE"
c=0; [[ -f "$cf" ]] && c=$(cat "$cf"); c=$((c+1)); echo "$c" > "$cf"
exit "${NPX_EXIT:-0}"
FAKE
  chmod +x "$TMPDIR_TEST/bin/npx"
}
write_playwright_hang_stubs() {
  cat > "$TMPDIR_TEST/bin/timeout" <<'FAKE'
#!/usr/bin/env bash
while [[ "$1" == -* ]]; do shift; done
shift
exec "$@"
FAKE
  chmod +x "$TMPDIR_TEST/bin/timeout"
  cat > "$TMPDIR_TEST/bin/sleep" <<'FAKE'
#!/usr/bin/env bash
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/bin/sleep"
}

# 1. Skip-guard: PLAYWRIGHT_BROWSERS_PATH set → return 0, 0 npx calls.
echo "Test: playwright_install_with_deps skip-guard → rc 0, 0 npx calls"
setup
write_playwright_npx_stub
NPX_COUNT_FILE="$TMPDIR_TEST/npx-1"
(
  source "$TMPDIR_TEST/lib.sh"
  export PLAYWRIGHT_BROWSERS_PATH=/nix/some/path
  export NPX_COUNT_FILE="$TMPDIR_TEST/npx-1"
  playwright_install_with_deps
)
rc=$?
count=$( [[ -f "$NPX_COUNT_FILE" ]] && cat "$NPX_COUNT_FILE" || echo 0 )
assert_eq "skip-guard → rc 0" "0" "$rc"
assert_eq "skip-guard → 0 npx calls" "0" "$count"
teardown

# 2. First-attempt success: npx exits 0 → rc 0, exactly 1 npx call.
echo "Test: playwright_install_with_deps first-attempt success → rc 0, 1 npx call"
setup
cat > "$TMPDIR_TEST/bin/npx" <<'FAKE'
#!/usr/bin/env bash
cf="$NPX_COUNT_FILE"
c=0; [[ -f "$cf" ]] && c=$(cat "$cf"); c=$((c+1)); echo "$c" > "$cf"
[[ -n "${NPX_ARGS_FILE:-}" ]] && echo "$@" >> "$NPX_ARGS_FILE"
exit "${NPX_EXIT:-0}"
FAKE
chmod +x "$TMPDIR_TEST/bin/npx"
cat > "$TMPDIR_TEST/bin/timeout" <<'FAKE'
#!/usr/bin/env bash
[[ -n "${TIMEOUT_LOG_FILE:-}" ]] && echo "$@" >> "$TIMEOUT_LOG_FILE"
while [[ "$1" == -* ]]; do shift; done
shift
exec "$@"
FAKE
chmod +x "$TMPDIR_TEST/bin/timeout"
cat > "$TMPDIR_TEST/bin/sleep" <<'FAKE'
#!/usr/bin/env bash
exit 0
FAKE
chmod +x "$TMPDIR_TEST/bin/sleep"
NPX_COUNT_FILE="$TMPDIR_TEST/npx-2"
TIMEOUT_LOG_FILE="$TMPDIR_TEST/timeout-calls-2.log"
NPX_ARGS_FILE="$TMPDIR_TEST/npx-args-2"
rc=0
(
  source "$TMPDIR_TEST/lib.sh"
  unset PLAYWRIGHT_BROWSERS_PATH
  export NPX_EXIT=0
  export NPX_COUNT_FILE="$TMPDIR_TEST/npx-2"
  export TIMEOUT_LOG_FILE="$TMPDIR_TEST/timeout-calls-2.log"
  export NPX_ARGS_FILE="$TMPDIR_TEST/npx-args-2"
  playwright_install_with_deps
) || rc=$?
assert_eq "first-attempt success → rc 0" "0" "$rc"
assert_eq "first-attempt success → 1 npx call" "1" "$(cat "$NPX_COUNT_FILE")"
timeout_calls=$( [[ -s "$TIMEOUT_LOG_FILE" ]] && echo nonempty || echo empty )
assert_eq "first-attempt success → timeout invoked" "nonempty" "$timeout_calls"
assert_eq "first-attempt success → npx args" \
  "playwright install --with-deps chromium" \
  "$( [[ -f "$NPX_ARGS_FILE" ]] && cat "$NPX_ARGS_FILE" || echo '<file missing>' )"
teardown

# 3. Both attempts fail: npx exits 1 twice → rc non-zero, exactly 2 npx calls.
echo "Test: playwright_install_with_deps both-attempts fail → rc non-zero, 2 npx calls"
setup
cat > "$TMPDIR_TEST/bin/npx" <<'FAKE'
#!/usr/bin/env bash
cf="$NPX_COUNT_FILE"
c=0; [[ -f "$cf" ]] && c=$(cat "$cf"); c=$((c+1)); echo "$c" > "$cf"
[[ -n "${NPX_ARGS_FILE:-}" ]] && echo "$@" >> "$NPX_ARGS_FILE"
exit "${NPX_EXIT:-0}"
FAKE
chmod +x "$TMPDIR_TEST/bin/npx"
cat > "$TMPDIR_TEST/bin/timeout" <<'FAKE'
#!/usr/bin/env bash
[[ -n "${TIMEOUT_LOG_FILE:-}" ]] && echo "$@" >> "$TIMEOUT_LOG_FILE"
while [[ "$1" == -* ]]; do shift; done
shift
exec "$@"
FAKE
chmod +x "$TMPDIR_TEST/bin/timeout"
cat > "$TMPDIR_TEST/bin/sleep" <<'FAKE'
#!/usr/bin/env bash
exit 0
FAKE
chmod +x "$TMPDIR_TEST/bin/sleep"
NPX_COUNT_FILE="$TMPDIR_TEST/npx-3"
TIMEOUT_LOG_FILE="$TMPDIR_TEST/timeout-calls-3.log"
NPX_ARGS_FILE="$TMPDIR_TEST/npx-args-3"
rc=0
(
  source "$TMPDIR_TEST/lib.sh"
  unset PLAYWRIGHT_BROWSERS_PATH
  export NPX_EXIT=1
  export PLAYWRIGHT_INSTALL_ATTEMPTS=2
  export DPKG_LOCK_FILE="$TMPDIR_TEST/no-dpkg-lock"
  export NPX_COUNT_FILE="$TMPDIR_TEST/npx-3"
  export TIMEOUT_LOG_FILE="$TMPDIR_TEST/timeout-calls-3.log"
  export NPX_ARGS_FILE="$TMPDIR_TEST/npx-args-3"
  playwright_install_with_deps 2>/dev/null
) || rc=$?
[[ "$rc" -ne 0 ]] && rc_state="nonzero" || rc_state="zero"
assert_eq "both-attempts fail → rc non-zero" "nonzero" "$rc_state"
assert_eq "both-attempts fail → 2 npx calls" "2" "$(cat "$NPX_COUNT_FILE")"
timeout_calls=$( [[ -s "$TIMEOUT_LOG_FILE" ]] && echo nonempty || echo empty )
assert_eq "both attempts fail → timeout invoked" "nonempty" "$timeout_calls"
assert_eq "both-attempts fail → npx args (retry path)" \
  $'playwright install --with-deps chromium\nplaywright install --with-deps chromium' \
  "$( [[ -f "$NPX_ARGS_FILE" ]] && cat "$NPX_ARGS_FILE" || echo '<file missing>' )"
teardown

# 4. First attempt fails, second succeeds: npx exits 1 then 0 → rc 0, 2 npx calls.
#    Exercises the retry loop's core recovery behavior (the #1899 motivation).
echo "Test: playwright_install_with_deps first fails then succeeds → rc 0, 2 npx calls"
setup
cat > "$TMPDIR_TEST/bin/npx" <<'FAKE'
#!/usr/bin/env bash
cf="$NPX_COUNT_FILE"
c=0; [[ -f "$cf" ]] && c=$(cat "$cf"); c=$((c+1)); echo "$c" > "$cf"
[[ -n "${NPX_ARGS_FILE:-}" ]] && echo "$@" >> "$NPX_ARGS_FILE"
if [[ "$c" -le 1 ]]; then exit 1; else exit 0; fi
FAKE
chmod +x "$TMPDIR_TEST/bin/npx"
cat > "$TMPDIR_TEST/bin/timeout" <<'FAKE'
#!/usr/bin/env bash
[[ -n "${TIMEOUT_LOG_FILE:-}" ]] && echo "$@" >> "$TIMEOUT_LOG_FILE"
while [[ "$1" == -* ]]; do shift; done
shift
exec "$@"
FAKE
chmod +x "$TMPDIR_TEST/bin/timeout"
cat > "$TMPDIR_TEST/bin/sleep" <<'FAKE'
#!/usr/bin/env bash
exit 0
FAKE
chmod +x "$TMPDIR_TEST/bin/sleep"
NPX_COUNT_FILE="$TMPDIR_TEST/npx-4"
TIMEOUT_LOG_FILE="$TMPDIR_TEST/timeout-calls-4.log"
NPX_ARGS_FILE="$TMPDIR_TEST/npx-args-4"
rc=0
(
  source "$TMPDIR_TEST/lib.sh"
  unset PLAYWRIGHT_BROWSERS_PATH
  export PLAYWRIGHT_INSTALL_ATTEMPTS=2
  export DPKG_LOCK_FILE="$TMPDIR_TEST/no-dpkg-lock"
  export NPX_COUNT_FILE="$TMPDIR_TEST/npx-4"
  export TIMEOUT_LOG_FILE="$TMPDIR_TEST/timeout-calls-4.log"
  export NPX_ARGS_FILE="$TMPDIR_TEST/npx-args-4"
  playwright_install_with_deps 2>/dev/null
) || rc=$?
assert_eq "first-fails-then-succeeds → rc 0" "0" "$rc"
assert_eq "first-fails-then-succeeds → 2 npx calls" "2" "$(cat "$NPX_COUNT_FILE")"
timeout_calls=$( [[ -s "$TIMEOUT_LOG_FILE" ]] && echo nonempty || echo empty )
assert_eq "first fails then succeeds → timeout invoked" "nonempty" "$timeout_calls"
assert_eq "first-fails-then-succeeds → npx args (retry path)" \
  $'playwright install --with-deps chromium\nplaywright install --with-deps chromium' \
  "$( [[ -f "$NPX_ARGS_FILE" ]] && cat "$NPX_ARGS_FILE" || echo '<file missing>' )"
teardown

# 5. Timeout expiry (exit 124, stall) → retry exhausted → rc non-zero, 2 npx calls.
#    Proves the timeout-expiry path works: timeout starts npx (counter increments)
#    then returns 124 (simulating the child stalling past the deadline).  With
#    PLAYWRIGHT_INSTALL_ATTEMPTS=2 both attempts time out and the wrapper fails.
echo "Test: playwright_install_with_deps timeout-stall → rc non-zero, 2 npx calls"
setup
cat > "$TMPDIR_TEST/bin/npx" <<'FAKE'
#!/usr/bin/env bash
cf="$NPX_COUNT_FILE"
c=0; [[ -f "$cf" ]] && c=$(cat "$cf"); c=$((c+1)); echo "$c" > "$cf"
[[ -n "${NPX_ARGS_FILE:-}" ]] && echo "$@" >> "$NPX_ARGS_FILE"
exit "${NPX_EXIT:-0}"
FAKE
chmod +x "$TMPDIR_TEST/bin/npx"
cat > "$TMPDIR_TEST/bin/timeout" <<'FAKE'
#!/usr/bin/env bash
[[ -n "${TIMEOUT_LOG_FILE:-}" ]] && echo "$@" >> "$TIMEOUT_LOG_FILE"
while [[ "$1" == -* ]]; do shift; done
shift                     # drop the <timeout_s> duration arg
"$@"                      # run npx (increments NPX_COUNT_FILE); not exec
exit 124                  # simulate timeout killing the stalled child
FAKE
chmod +x "$TMPDIR_TEST/bin/timeout"
cat > "$TMPDIR_TEST/bin/sleep" <<'FAKE'
#!/usr/bin/env bash
exit 0
FAKE
chmod +x "$TMPDIR_TEST/bin/sleep"
NPX_COUNT_FILE="$TMPDIR_TEST/npx-5"
TIMEOUT_LOG_FILE="$TMPDIR_TEST/timeout-calls-5.log"
NPX_ARGS_FILE="$TMPDIR_TEST/npx-args-5"
rc=0
(
  source "$TMPDIR_TEST/lib.sh"
  unset PLAYWRIGHT_BROWSERS_PATH
  export PLAYWRIGHT_INSTALL_ATTEMPTS=2
  export DPKG_LOCK_FILE="$TMPDIR_TEST/no-dpkg-lock"
  export NPX_COUNT_FILE="$TMPDIR_TEST/npx-5"
  export TIMEOUT_LOG_FILE="$TMPDIR_TEST/timeout-calls-5.log"
  export NPX_ARGS_FILE="$TMPDIR_TEST/npx-args-5"
  playwright_install_with_deps 2>/dev/null
) || rc=$?
[[ "$rc" -ne 0 ]] && rc_state="nonzero" || rc_state="zero"
timeout_calls=$( [[ -s "$TIMEOUT_LOG_FILE" ]] && echo nonempty || echo empty )
assert_eq "timeout-stall → 2 npx calls" "2" "$(cat "$NPX_COUNT_FILE")"
assert_eq "timeout-stall → timeout invoked" "nonempty" "$timeout_calls"
assert_eq "timeout-stall → rc non-zero" "nonzero" "$rc_state"
assert_eq "timeout-stall → npx args (timeout path)" \
  $'playwright install --with-deps chromium\nplaywright install --with-deps chromium' \
  "$( [[ -f "$NPX_ARGS_FILE" ]] && cat "$NPX_ARGS_FILE" || echo '<file missing>' )"
teardown

# 6. Stall → whole tree killed before retry (PR #2946 root-cause fix).
#    The npx stub backgrounds a REAL grandchild (/bin/sleep 30) and `wait`s on
#    it, so the process tree stays alive until something kills it — mirroring
#    the real apt-get/dpkg grandchildren that `timeout` alone leaves running.
#    With PLAYWRIGHT_INSTALL_TIMEOUT=1 the watchdog's REAL 1s deadline fires,
#    kill_tree kills the whole tree (npx + grandchild), attempt 1 is treated as
#    failed, and attempt 2 runs — proving the retry is real AND the
#    grandchildren actually die. The `sleep` stub is selective: real only for
#    the 1s watchdog deadline, instant otherwise (kill_tree's 2s grace, the 5s
#    retry backoff), keeping the test ~2s. Uses the REAL kill_tree (not stubbed).
echo "Test: playwright_install_with_deps stall → tree killed before retry"
setup
# Capture the real `sleep` binary BEFORE the stub shadows it on PATH — its path
# is system-specific (a nix-store path here, /bin/sleep elsewhere), so resolve
# it dynamically and hand it to the stubs via $REAL_SLEEP.
REAL_SLEEP="$(command -v sleep)"
cat > "$TMPDIR_TEST/bin/npx" <<'FAKE'
#!/usr/bin/env bash
cf="$NPX_COUNT_FILE"
c=0; [[ -f "$cf" ]] && c=$(cat "$cf"); c=$((c+1)); echo "$c" > "$cf"
"$REAL_SLEEP" 30 &                     # real grandchild: keeps the tree alive
gc=$!
[[ -n "${GRANDCHILD_PIDS:-}" ]] && echo "$gc" >> "$GRANDCHILD_PIDS"
wait                                   # block until the tree is killed
FAKE
chmod +x "$TMPDIR_TEST/bin/npx"
cat > "$TMPDIR_TEST/bin/timeout" <<'FAKE'
#!/usr/bin/env bash
[[ -n "${TIMEOUT_LOG_FILE:-}" ]] && echo "$@" >> "$TIMEOUT_LOG_FILE"
while [[ "$1" == -* ]]; do shift; done
shift                                  # drop the <timeout_s> duration arg
exec "$@"                              # transparent passthrough → npx keeps PID
FAKE
chmod +x "$TMPDIR_TEST/bin/timeout"
cat > "$TMPDIR_TEST/bin/sleep" <<'FAKE'
#!/usr/bin/env bash
# Selective: real-sleep only the 1s watchdog deadline; instant otherwise.
if [[ "$1" == "1" ]]; then exec "$REAL_SLEEP" 1; fi
exit 0
FAKE
chmod +x "$TMPDIR_TEST/bin/sleep"
NPX_COUNT_FILE="$TMPDIR_TEST/npx-6"
GRANDCHILD_PIDS="$TMPDIR_TEST/grandchildren-6"
: > "$GRANDCHILD_PIDS"
rc=0
(
  source "$TMPDIR_TEST/lib.sh"
  unset PLAYWRIGHT_BROWSERS_PATH
  export PLAYWRIGHT_INSTALL_TIMEOUT=1
  export PLAYWRIGHT_INSTALL_ATTEMPTS=2
  export DPKG_LOCK_FILE="$TMPDIR_TEST/no-dpkg-lock"
  export NPX_COUNT_FILE="$TMPDIR_TEST/npx-6"
  export GRANDCHILD_PIDS="$TMPDIR_TEST/grandchildren-6"
  export REAL_SLEEP
  playwright_install_with_deps 2>/dev/null
) || rc=$?
[[ "$rc" -ne 0 ]] && rc_state="nonzero" || rc_state="zero"
assert_eq "stall → 2 npx calls (attempt 1 killed → retry is real)" "2" "$(cat "$NPX_COUNT_FILE")"
assert_eq "stall → rc non-zero" "nonzero" "$rc_state"
# Give the SIGKILL a beat to land, then assert every grandchild is dead — the
# tree was actually killed, not just the npx/node child.
"$REAL_SLEEP" 1
gc_alive=0
while IFS= read -r gcpid; do
  [[ -z "$gcpid" ]] && continue
  if kill -0 "$gcpid" 2>/dev/null; then gc_alive=$((gc_alive + 1)); fi
done < "$GRANDCHILD_PIDS"
assert_eq "stall → all grandchildren killed (whole tree died)" "0" "$gc_alive"
teardown

# <<< END MOVED <<<

report_results
