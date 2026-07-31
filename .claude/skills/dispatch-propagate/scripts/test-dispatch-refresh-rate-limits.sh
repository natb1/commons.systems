#!/usr/bin/env bash
# Tests for dispatch-refresh-rate-limits -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 24576-24764.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
echo ""
echo "=== dispatch-refresh-rate-limits ==="

# Headless telemetry probe for #1127. The network fetch is replaced by the
# DISPATCH_REFRESH_RATE_LIMITS_HEADERS_FILE seam — tests NEVER make a real
# request. update-rate-limits.sh's writer-path override
# (DISPATCH_RATE_LIMITS_STATE_FILE) points the atomic write at a temp file.

rr_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/state" "$TMPDIR_TEST/fix" "$TMPDIR_TEST/config"
  cp "$SCRIPT_DIR/dispatch-refresh-rate-limits" "$TMPDIR_TEST/scripts/"
  cp "$SCRIPT_DIR/update-rate-limits.sh" "$TMPDIR_TEST/scripts/"
  cp "$SCRIPT_DIR/dispatch-target-workers" "$TMPDIR_TEST/scripts/"
  cp "$SCRIPT_DIR/dispatch-config-load" "$TMPDIR_TEST/scripts/"
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/scripts/"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-refresh-rate-limits" \
           "$TMPDIR_TEST/scripts/update-rate-limits.sh" \
           "$TMPDIR_TEST/scripts/dispatch-target-workers" \
           "$TMPDIR_TEST/scripts/dispatch-config-load"
  export DISPATCH_RATE_LIMITS_STATE_FILE="$TMPDIR_TEST/state/rate_limits.json"
  export DISPATCH_CONFIG_DIR="$TMPDIR_TEST/config"
}
rr_teardown() {
  rm -rf "$TMPDIR_TEST"; TMPDIR_TEST=""
  unset DISPATCH_RATE_LIMITS_STATE_FILE DISPATCH_REFRESH_RATE_LIMITS_CREDS \
    DISPATCH_REFRESH_RATE_LIMITS_HEADERS_FILE
  unset DISPATCH_CONFIG_DIR
}
write_creds() {  # $1=file $2=expiresAt-ms
  printf '{"claudeAiOauth":{"accessToken":"test-token","expiresAt":%s}}\n' "$2" > "$1"
}
write_headers() {  # $1=file ; remaining args are literal header lines
  local f="$1"; : > "$f"; shift; for line in "$@"; do printf '%s\n' "$line" >> "$f"; done
}

# Canonical valid headers reused across cases.
RR_H_5UTIL="anthropic-ratelimit-unified-5h-utilization: 0.22"
RR_H_5RESET="anthropic-ratelimit-unified-5h-reset: 1780611000"
RR_H_7UTIL="anthropic-ratelimit-unified-7d-utilization: 0.54"
RR_H_7RESET="anthropic-ratelimit-unified-7d-reset: 1780880400"

# CASE 1 — success: valid creds + valid headers → exit 0, canonical telemetry.
rr_setup
write_creds "$TMPDIR_TEST/fix/creds.json" 9999999999000
write_headers "$TMPDIR_TEST/fix/headers.txt" \
  "$RR_H_5UTIL" "$RR_H_5RESET" "$RR_H_7UTIL" "$RR_H_7RESET"
export DISPATCH_REFRESH_RATE_LIMITS_CREDS="$TMPDIR_TEST/fix/creds.json"
export DISPATCH_REFRESH_RATE_LIMITS_HEADERS_FILE="$TMPDIR_TEST/fix/headers.txt"
if out=$("$TMPDIR_TEST/scripts/dispatch-refresh-rate-limits" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "refresh success → exit 0" "0" "$rc"
got=$(jq -S . "$DISPATCH_RATE_LIMITS_STATE_FILE")
want=$(printf '%s' '{"five_hour":{"used_percentage":22,"resets_at":1780611000},"seven_day":{"used_percentage":54,"resets_at":1780880400}}' | jq -S .)
assert_eq "refresh success → canonical telemetry" "$want" "$got"
rr_teardown

# CASE 2 — expired token: past expiresAt → non-zero exit, no write.
rr_setup
write_creds "$TMPDIR_TEST/fix/creds.json" 1
write_headers "$TMPDIR_TEST/fix/headers.txt" \
  "$RR_H_5UTIL" "$RR_H_5RESET" "$RR_H_7UTIL" "$RR_H_7RESET"
export DISPATCH_REFRESH_RATE_LIMITS_CREDS="$TMPDIR_TEST/fix/creds.json"
export DISPATCH_REFRESH_RATE_LIMITS_HEADERS_FILE="$TMPDIR_TEST/fix/headers.txt"
if out=$("$TMPDIR_TEST/scripts/dispatch-refresh-rate-limits" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "expired token → non-zero exit" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
assert_eq "expired token → no state file written" "1" "$([[ ! -e "$DISPATCH_RATE_LIMITS_STATE_FILE" ]] && echo 1 || echo 0)"
rr_teardown

# CASE 3 — missing creds: nonexistent path → non-zero exit, no write.
rr_setup
write_headers "$TMPDIR_TEST/fix/headers.txt" \
  "$RR_H_5UTIL" "$RR_H_5RESET" "$RR_H_7UTIL" "$RR_H_7RESET"
export DISPATCH_REFRESH_RATE_LIMITS_CREDS="/nonexistent/creds.json"
export DISPATCH_REFRESH_RATE_LIMITS_HEADERS_FILE="$TMPDIR_TEST/fix/headers.txt"
if out=$("$TMPDIR_TEST/scripts/dispatch-refresh-rate-limits" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "missing creds → non-zero exit" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
assert_eq "missing creds → no state file written" "1" "$([[ ! -e "$DISPATCH_RATE_LIMITS_STATE_FILE" ]] && echo 1 || echo 0)"
rr_teardown

# CASE 4 — missing headers: rate-limit headers absent → non-zero exit, no write.
rr_setup
write_creds "$TMPDIR_TEST/fix/creds.json" 9999999999000
write_headers "$TMPDIR_TEST/fix/headers.txt" \
  "HTTP/2 401" "content-type: application/json"
export DISPATCH_REFRESH_RATE_LIMITS_CREDS="$TMPDIR_TEST/fix/creds.json"
export DISPATCH_REFRESH_RATE_LIMITS_HEADERS_FILE="$TMPDIR_TEST/fix/headers.txt"
if out=$("$TMPDIR_TEST/scripts/dispatch-refresh-rate-limits" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "missing headers → non-zero exit" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
assert_eq "missing headers → no state file written" "1" "$([[ ! -e "$DISPATCH_RATE_LIMITS_STATE_FILE" ]] && echo 1 || echo 0)"
rr_teardown

# CASE 5a — malformed utilization: 5h-utilization "abc" → non-zero exit, no write.
rr_setup
write_creds "$TMPDIR_TEST/fix/creds.json" 9999999999000
write_headers "$TMPDIR_TEST/fix/headers.txt" \
  "anthropic-ratelimit-unified-5h-utilization: abc" \
  "$RR_H_5RESET" "$RR_H_7UTIL" "$RR_H_7RESET"
export DISPATCH_REFRESH_RATE_LIMITS_CREDS="$TMPDIR_TEST/fix/creds.json"
export DISPATCH_REFRESH_RATE_LIMITS_HEADERS_FILE="$TMPDIR_TEST/fix/headers.txt"
if out=$("$TMPDIR_TEST/scripts/dispatch-refresh-rate-limits" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "malformed utilization → non-zero exit" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
assert_eq "malformed utilization → no state file written" "1" "$([[ ! -e "$DISPATCH_RATE_LIMITS_STATE_FILE" ]] && echo 1 || echo 0)"
rr_teardown

# CASE 5b — malformed reset: 5h-reset "12.5" (non-integer) → non-zero exit, no write.
rr_setup
write_creds "$TMPDIR_TEST/fix/creds.json" 9999999999000
write_headers "$TMPDIR_TEST/fix/headers.txt" \
  "$RR_H_5UTIL" \
  "anthropic-ratelimit-unified-5h-reset: 12.5" \
  "$RR_H_7UTIL" "$RR_H_7RESET"
export DISPATCH_REFRESH_RATE_LIMITS_CREDS="$TMPDIR_TEST/fix/creds.json"
export DISPATCH_REFRESH_RATE_LIMITS_HEADERS_FILE="$TMPDIR_TEST/fix/headers.txt"
if out=$("$TMPDIR_TEST/scripts/dispatch-refresh-rate-limits" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "malformed reset → non-zero exit" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
assert_eq "malformed reset → no state file written" "1" "$([[ ! -e "$DISPATCH_RATE_LIMITS_STATE_FILE" ]] && echo 1 || echo 0)"
rr_teardown

# CASE 5c — tampered token: a token with characters outside the OAuth set
# (a space) fails the charset guard before any header is placed → no write.
rr_setup
printf '{"claudeAiOauth":{"accessToken":"bad token","expiresAt":9999999999000}}\n' > "$TMPDIR_TEST/fix/creds.json"
write_headers "$TMPDIR_TEST/fix/headers.txt" \
  "$RR_H_5UTIL" "$RR_H_5RESET" "$RR_H_7UTIL" "$RR_H_7RESET"
export DISPATCH_REFRESH_RATE_LIMITS_CREDS="$TMPDIR_TEST/fix/creds.json"
export DISPATCH_REFRESH_RATE_LIMITS_HEADERS_FILE="$TMPDIR_TEST/fix/headers.txt"
if out=$("$TMPDIR_TEST/scripts/dispatch-refresh-rate-limits" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "tampered token → non-zero exit" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
assert_eq "tampered token → no state file written" "1" "$([[ ! -e "$DISPATCH_RATE_LIMITS_STATE_FILE" ]] && echo 1 || echo 0)"
rr_teardown

# CASE 5d — bad model override: a model name with a quote fails the charset
# guard before the JSON body is built → no write.
rr_setup
write_creds "$TMPDIR_TEST/fix/creds.json" 9999999999000
write_headers "$TMPDIR_TEST/fix/headers.txt" \
  "$RR_H_5UTIL" "$RR_H_5RESET" "$RR_H_7UTIL" "$RR_H_7RESET"
export DISPATCH_REFRESH_RATE_LIMITS_CREDS="$TMPDIR_TEST/fix/creds.json"
export DISPATCH_REFRESH_RATE_LIMITS_HEADERS_FILE="$TMPDIR_TEST/fix/headers.txt"
export DISPATCH_REFRESH_RATE_LIMITS_MODEL='haiku","injected":"x'
if out=$("$TMPDIR_TEST/scripts/dispatch-refresh-rate-limits" 2>/dev/null); then rc=0; else rc=$?; fi
unset DISPATCH_REFRESH_RATE_LIMITS_MODEL
assert_eq "bad model override → non-zero exit" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
assert_eq "bad model override → no state file written" "1" "$([[ ! -e "$DISPATCH_RATE_LIMITS_STATE_FILE" ]] && echo 1 || echo 0)"
rr_teardown

# CASE 5e — non-https endpoint: with the network branch taken (no headers seam),
# a non-https ENDPOINT trips the TLS guard and exits before curl runs — the
# bearer token is never sent in cleartext, and no state file is written.
rr_setup
write_creds "$TMPDIR_TEST/fix/creds.json" 9999999999000
export DISPATCH_REFRESH_RATE_LIMITS_CREDS="$TMPDIR_TEST/fix/creds.json"
export DISPATCH_REFRESH_RATE_LIMITS_ENDPOINT="http://127.0.0.1:9/never"
if out=$("$TMPDIR_TEST/scripts/dispatch-refresh-rate-limits" 2>/dev/null); then rc=0; else rc=$?; fi
unset DISPATCH_REFRESH_RATE_LIMITS_ENDPOINT
assert_eq "non-https endpoint → non-zero exit" "1" "$([[ "$rc" -ne 0 ]] && echo 1 || echo 0)"
assert_eq "non-https endpoint → no state file written" "1" "$([[ ! -e "$DISPATCH_RATE_LIMITS_STATE_FILE" ]] && echo 1 || echo 0)"
rr_teardown

# CASE 6 — refresh→budget regression for #1127. Seed a FROZEN pre-reset file
# (used 95%, resets_at in the past); the probe overwrites it with reopened-window
# telemetry; the REAL dispatch-target-workers then computes a positive target
# from the refreshed file — the end-to-end self-resume the issue requires.
rr_setup
printf '{"five_hour":{"used_percentage":95,"resets_at":1},"seven_day":{"used_percentage":95,"resets_at":1}}\n' > "$DISPATCH_RATE_LIMITS_STATE_FILE"
write_creds "$TMPDIR_TEST/fix/creds.json" 9999999999000
RR_R7=$(tw_resets_for_x 0.5)         # mid-week 7d reset
RR_R5=$((TW_NOW + 18000))            # 5h reset comfortably in the future
write_headers "$TMPDIR_TEST/fix/headers.txt" \
  "anthropic-ratelimit-unified-5h-utilization: 0.05" \
  "anthropic-ratelimit-unified-5h-reset: $RR_R5" \
  "anthropic-ratelimit-unified-7d-utilization: 0.10" \
  "anthropic-ratelimit-unified-7d-reset: $RR_R7"
export DISPATCH_REFRESH_RATE_LIMITS_CREDS="$TMPDIR_TEST/fix/creds.json"
export DISPATCH_REFRESH_RATE_LIMITS_HEADERS_FILE="$TMPDIR_TEST/fix/headers.txt"
if out=$("$TMPDIR_TEST/scripts/dispatch-refresh-rate-limits" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "regression: probe refreshed reopened window → exit 0" "0" "$rc"
export DISPATCH_TARGET_WORKERS_RATE_LIMITS_PATH="$DISPATCH_RATE_LIMITS_STATE_FILE"
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
target=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
TOTAL=$((TOTAL + 1))
if [[ "$target" =~ ^[0-9]+$ && "$target" -ge 1 ]]; then
  PASS=$((PASS + 1)); echo "  PASS: regression: reopened window → target >= 1 (got $target)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: regression: reopened window → target >= 1 (got '$target')"
fi
unset DISPATCH_TARGET_WORKERS_RATE_LIMITS_PATH DISPATCH_TARGET_WORKERS_NOW
rr_teardown

# <<< END MOVED <<<

report_results
