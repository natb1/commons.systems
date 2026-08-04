#!/usr/bin/env bash
# Tests for lib-gh-retry -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 3662-3788.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# gh_retry tests
# ============================================================================
echo ""
echo "=== gh_retry ==="

# A file-counter fake: increments a counter file and emits a transient or
# deterministic stderr depending on whether the hit count is within FAIL_N.
# Each test writes a fresh fake into TMPDIR_TEST and drives gh_retry against it.

# a. transient-then-succeed: HTTP 504 twice, then success → rc 0, 3 attempts.
echo "Test: gh_retry transient-then-succeed → rc 0, correct stdout, 3 attempts"
setup
cat > "$TMPDIR_TEST/fake-transient-succeed" <<'FAKE'
#!/usr/bin/env bash
cf="$FAKE_COUNT_FILE"
c=0; [[ -f "$cf" ]] && c=$(cat "$cf"); c=$((c+1)); echo "$c" > "$cf"
if [[ "$c" -le 2 ]]; then
  echo "gh: HTTP 504: Gateway Timeout" >&2
  exit 1
fi
echo "OK-PAYLOAD"
FAKE
chmod +x "$TMPDIR_TEST/fake-transient-succeed"
out=$(
  source "$TMPDIR_TEST/lib.sh"
  export GH_RETRY_ATTEMPTS=4 FAKE_COUNT_FILE="$TMPDIR_TEST/c-a"
  gh_retry "$TMPDIR_TEST/fake-transient-succeed" 2>/dev/null
)
rc=$?
assert_eq "transient-then-succeed → rc 0" "0" "$rc"
assert_eq "transient-then-succeed → stdout payload" "OK-PAYLOAD" "$out"
assert_eq "transient-then-succeed → 3 attempts" "3" "$(cat "$TMPDIR_TEST/c-a")"
teardown

# b. always-transient (HTTP 503): exhausts retries → rc non-zero, 4 attempts.
echo "Test: gh_retry always-transient (503) → rc non-zero, 4 attempts (exhausted)"
setup
cat > "$TMPDIR_TEST/fake-always-503" <<'FAKE'
#!/usr/bin/env bash
cf="$FAKE_COUNT_FILE"
c=0; [[ -f "$cf" ]] && c=$(cat "$cf"); c=$((c+1)); echo "$c" > "$cf"
echo "gh: HTTP 503: Service Unavailable" >&2
exit 1
FAKE
chmod +x "$TMPDIR_TEST/fake-always-503"
rc=0
(
  source "$TMPDIR_TEST/lib.sh"
  export GH_RETRY_ATTEMPTS=4 FAKE_COUNT_FILE="$TMPDIR_TEST/c-b"
  gh_retry "$TMPDIR_TEST/fake-always-503" >/dev/null 2>&1
) || rc=$?
[[ "$rc" -ne 0 ]] && rc_state="nonzero" || rc_state="zero"
assert_eq "always-503 → rc non-zero (exhausted)" "nonzero" "$rc_state"
assert_eq "always-503 → 4 attempts" "4" "$(cat "$TMPDIR_TEST/c-b")"
teardown

# c. deterministic HTTP 404 → rc non-zero, 1 attempt (fail fast).
echo "Test: gh_retry deterministic 404 → rc non-zero, 1 attempt"
setup
cat > "$TMPDIR_TEST/fake-404" <<'FAKE'
#!/usr/bin/env bash
cf="$FAKE_COUNT_FILE"
c=0; [[ -f "$cf" ]] && c=$(cat "$cf"); c=$((c+1)); echo "$c" > "$cf"
echo "gh: Not Found (HTTP 404)" >&2
exit 1
FAKE
chmod +x "$TMPDIR_TEST/fake-404"
rc=0
(
  source "$TMPDIR_TEST/lib.sh"
  export GH_RETRY_ATTEMPTS=4 FAKE_COUNT_FILE="$TMPDIR_TEST/c-c"
  gh_retry "$TMPDIR_TEST/fake-404" >/dev/null 2>&1
) || rc=$?
[[ "$rc" -ne 0 ]] && rc_state="nonzero" || rc_state="zero"
assert_eq "404 → rc non-zero" "nonzero" "$rc_state"
assert_eq "404 → 1 attempt (fail fast)" "1" "$(cat "$TMPDIR_TEST/c-c")"
teardown

# d. secondary rate limit → transient (fail twice, then succeed → 3 attempts).
echo "Test: gh_retry secondary rate limit → transient, 3 attempts"
setup
cat > "$TMPDIR_TEST/fake-secondary" <<'FAKE'
#!/usr/bin/env bash
cf="$FAKE_COUNT_FILE"
c=0; [[ -f "$cf" ]] && c=$(cat "$cf"); c=$((c+1)); echo "$c" > "$cf"
if [[ "$c" -le 2 ]]; then
  echo "gh: You have exceeded a secondary rate limit. Please wait and retry your request again later." >&2
  exit 1
fi
echo "RATE-OK"
FAKE
chmod +x "$TMPDIR_TEST/fake-secondary"
out=$(
  source "$TMPDIR_TEST/lib.sh"
  export GH_RETRY_ATTEMPTS=4 FAKE_COUNT_FILE="$TMPDIR_TEST/c-d"
  gh_retry "$TMPDIR_TEST/fake-secondary" 2>/dev/null
)
rc=$?
assert_eq "secondary rate limit → rc 0" "0" "$rc"
assert_eq "secondary rate limit → stdout payload" "RATE-OK" "$out"
assert_eq "secondary rate limit → 3 attempts" "3" "$(cat "$TMPDIR_TEST/c-d")"
teardown

# e. deterministic auth (HTTP 403: Bad credentials) → rc non-zero, 1 attempt.
#    A bare "rate limit" / 403 must NOT be treated as transient.
echo "Test: gh_retry deterministic auth (403 Bad credentials) → 1 attempt"
setup
cat > "$TMPDIR_TEST/fake-auth" <<'FAKE'
#!/usr/bin/env bash
cf="$FAKE_COUNT_FILE"
c=0; [[ -f "$cf" ]] && c=$(cat "$cf"); c=$((c+1)); echo "$c" > "$cf"
echo "gh: HTTP 403: Bad credentials (https://api.github.com/repos/owner/repo)" >&2
exit 1
FAKE
chmod +x "$TMPDIR_TEST/fake-auth"
rc=0
(
  source "$TMPDIR_TEST/lib.sh"
  export GH_RETRY_ATTEMPTS=4 FAKE_COUNT_FILE="$TMPDIR_TEST/c-e"
  gh_retry "$TMPDIR_TEST/fake-auth" >/dev/null 2>&1
) || rc=$?
[[ "$rc" -ne 0 ]] && rc_state="nonzero" || rc_state="zero"
assert_eq "403 auth → rc non-zero" "nonzero" "$rc_state"
assert_eq "403 auth → 1 attempt (fail fast)" "1" "$(cat "$TMPDIR_TEST/c-e")"
teardown

# <<< END MOVED <<<

report_results
